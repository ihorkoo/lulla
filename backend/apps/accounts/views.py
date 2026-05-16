from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import (
    TokenObtainPairView as BaseTokenObtainPairView,
    TokenRefreshView as BaseTokenRefreshView,
)

from apps.core.exceptions import EmailTaken, InvalidCredentials

from .models import User
from .serializers import RegisterSerializer, TokenObtainPairSerializer, UserMeSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request: Request) -> Response:
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        if User.objects.filter(email__iexact=ser.validated_data["email"]).exists():
            raise EmailTaken()
        user = ser.save()
        return Response(UserMeSerializer(user).data, status=status.HTTP_201_CREATED)


class TokenObtainPairView(BaseTokenObtainPairView):
    serializer_class = TokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request: Request, *args, **kwargs) -> Response:  # type: ignore[override]
        try:
            return super().post(request, *args, **kwargs)
        except Exception as exc:
            from rest_framework.exceptions import AuthenticationFailed

            if isinstance(exc, AuthenticationFailed):
                raise InvalidCredentials() from exc
            raise


class TokenRefreshView(BaseTokenRefreshView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = request.data.get("refresh")
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except Exception:  # noqa: BLE001
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(UserMeSerializer(request.user).data)
