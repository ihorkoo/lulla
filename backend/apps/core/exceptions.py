from __future__ import annotations

from rest_framework import status
from rest_framework.exceptions import APIException

from .error_codes import ErrorCode


class AppException(APIException):
    """Base for domain exceptions carrying a stable error code."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Application error"
    default_code = "application_error"
    error_code: ErrorCode = ErrorCode.INTERNAL_ERROR

    def __init__(self, detail: str | None = None, error_code: ErrorCode | None = None):
        super().__init__(detail or self.default_detail)
        if error_code is not None:
            self.error_code = error_code


class InvalidCredentials(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Invalid email or password"
    error_code = ErrorCode.AUTH_INVALID_CREDENTIALS


class EmailTaken(AppException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Email is already registered"
    error_code = ErrorCode.AUTH_EMAIL_TAKEN


class BabyNotFound(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Baby profile not found"
    error_code = ErrorCode.BABY_NOT_FOUND


class BabyProfileRequired(AppException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Create a baby profile before starting a conversation"
    error_code = ErrorCode.BABY_PROFILE_REQUIRED


class ConversationNotFound(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Conversation not found"
    error_code = ErrorCode.CHAT_CONVERSATION_NOT_FOUND


class RagRetrievalFailed(AppException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Could not retrieve relevant context"
    error_code = ErrorCode.RAG_RETRIEVAL_FAILED


class LLMUnavailable(AppException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "AI assistant is temporarily unavailable"
    error_code = ErrorCode.LLM_UNAVAILABLE
