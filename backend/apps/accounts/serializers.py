from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer as BaseTokenObtainPairSerializer,
)

from .models import User


class TokenObtainPairSerializer(BaseTokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):  # type: ignore[no-untyped-def]
        token = super().get_token(user)
        token["email"] = user.email
        token["locale"] = user.locale
        return token


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10, max_length=128)

    class Meta:
        model = User
        fields = ("email", "password", "display_name", "locale")

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data: dict) -> User:
        return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            display_name=validated_data.get("display_name", ""),
            locale=validated_data.get("locale", "uk"),
        )


class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "display_name", "locale", "created_at")
        read_only_fields = fields
