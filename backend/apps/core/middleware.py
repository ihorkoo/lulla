from __future__ import annotations

import uuid
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse


class RequestIdMiddleware:
    """Attach an X-Request-Id to every request/response for log correlation."""

    HEADER = "HTTP_X_REQUEST_ID"

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        rid = request.META.get(self.HEADER) or uuid.uuid4().hex
        request.request_id = rid  # type: ignore[attr-defined]
        response = self.get_response(request)
        response["X-Request-Id"] = rid
        return response
