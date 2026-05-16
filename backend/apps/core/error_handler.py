from __future__ import annotations

import logging
from typing import Any

from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    MethodNotAllowed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from .error_codes import ErrorCode
from .exceptions import AppException

logger = logging.getLogger(__name__)


def _flatten_validation_errors(detail: Any, path: str = "") -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    if isinstance(detail, dict):
        for field, value in detail.items():
            sub = f"{path}.{field}" if path else str(field)
            out.extend(_flatten_validation_errors(value, sub))
    elif isinstance(detail, list):
        for v in detail:
            out.extend(_flatten_validation_errors(v, path))
    else:
        message = str(detail)
        code = getattr(detail, "code", None) or "invalid"
        out.append({"field": path or "_", "code": str(code).upper(), "message": message})
    return out


def _default_code_for(exc: Exception) -> ErrorCode:
    if isinstance(exc, AppException):
        return exc.error_code
    if isinstance(exc, ValidationError):
        return ErrorCode.VALIDATION_ERROR
    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        return ErrorCode.NOT_AUTHENTICATED
    if isinstance(exc, PermissionDenied):
        return ErrorCode.PERMISSION_DENIED
    if isinstance(exc, NotFound):
        return ErrorCode.NOT_FOUND
    if isinstance(exc, MethodNotAllowed):
        return ErrorCode.METHOD_NOT_ALLOWED
    if isinstance(exc, Throttled):
        return ErrorCode.THROTTLED
    return ErrorCode.INTERNAL_ERROR


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = drf_exception_handler(exc, context)
    request = context.get("request")
    request_id = getattr(request, "request_id", None) if request else None

    if response is None:
        logger.exception("Unhandled exception", extra={"request_id": request_id})
        return Response(
            {
                "type": "internal_error",
                "title": "Internal server error",
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "detail": "An unexpected error occurred.",
                "code": ErrorCode.INTERNAL_ERROR.value,
                "request_id": request_id,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    code = _default_code_for(exc)
    title = (
        exc.default_detail
        if isinstance(exc, APIException) and isinstance(exc.default_detail, str)
        else "Request failed"
    )

    body: dict[str, Any] = {
        "type": code.value.lower(),
        "title": title,
        "status": response.status_code,
        "code": code.value,
        "request_id": request_id,
    }

    if isinstance(exc, ValidationError):
        body["errors"] = _flatten_validation_errors(exc.detail)
        body["detail"] = "Validation failed"
    else:
        body["detail"] = str(response.data.get("detail") if isinstance(response.data, dict) else exc)

    response.data = body
    return response
