"""Base Django settings shared across all environments.

Environment-specific values come from process env vars (set by docker-compose).
"""
from __future__ import annotations

import os
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def env(key: str, default: str | None = None, *, required: bool = False) -> str:
    value = os.environ.get(key, default)
    if required and value is None:
        raise RuntimeError(f"Required env var {key} is not set")
    return value or ""


_env_helper = environ.Env()


SECRET_KEY = env("DJANGO_SECRET_KEY", required=True)
DEBUG = env("DJANGO_DEBUG", "False").lower() in {"1", "true", "yes"}
ALLOWED_HOSTS = [h.strip() for h in env("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "corsheaders",
    "pgvector.django",
    # Local
    "apps.core",
    "apps.accounts",
    "apps.babies",
    "apps.chat",
    "apps.rag",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.core.middleware.RequestIdMiddleware",
]

ROOT_URLCONF = "lulla.urls"
WSGI_APPLICATION = "lulla.wsgi.application"
ASGI_APPLICATION = "lulla.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

_DATABASE_URL = env("DATABASE_URL", "")
if _DATABASE_URL:
    # Single-URL form (Railway, Heroku, Fly, etc.). Force the postgresql engine
    # so we keep psycopg as the driver even if the URL scheme is "postgres://".
    _parsed_db = _env_helper.db_url_config(_DATABASE_URL)
    _parsed_db["ENGINE"] = "django.db.backends.postgresql"
    _parsed_db.setdefault("CONN_MAX_AGE", 60)
    if env("DATABASE_SSL_REQUIRE", "false").lower() in {"1", "true", "yes"}:
        _parsed_db.setdefault("OPTIONS", {})
        _parsed_db["OPTIONS"]["sslmode"] = "require"
    DATABASES = {"default": _parsed_db}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB", "lulla"),
            "USER": env("POSTGRES_USER", "lulla"),
            "PASSWORD": env("POSTGRES_PASSWORD", "lulla"),
            "HOST": env("POSTGRES_HOST", "postgres"),
            "PORT": env("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": 60,
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "mediafiles"

# WhiteNoise serves /static/ in production with hashed + gzipped files.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# CORS / CSRF
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in env("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()
]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# DRF
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.core.error_handler.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",
        "user": "240/min",
        "auth": "10/min",
    },
}

JWT_ACCESS_TOKEN_LIFETIME_MINUTES = int(
    env("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", str(60 * 24 * 7))
)
JWT_REFRESH_TOKEN_LIFETIME_DAYS = int(env("JWT_REFRESH_TOKEN_LIFETIME_DAYS", "30"))

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=JWT_ACCESS_TOKEN_LIFETIME_MINUTES),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=JWT_REFRESH_TOKEN_LIFETIME_DAYS),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "TOKEN_OBTAIN_SERIALIZER": "apps.accounts.serializers.TokenObtainPairSerializer",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "lulla API",
    "DESCRIPTION": "Support API for parents of premature babies (chat + RAG)",
    "VERSION": "0.1.0",
    "COMPONENT_SPLIT_REQUEST": True,
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": "/api/v1",
}

# AI / RAG
# Chat LLM: Gemma served via Google's Gemini API.
GOOGLE_API_KEY = env("GOOGLE_API_KEY", "")
GEMMA_MODEL = env("GEMMA_MODEL", "gemma-4-26b-a4b-it")  # alt: gemma-4-31b-it
LLM_MAX_OUTPUT_TOKENS = int(env("LLM_MAX_OUTPUT_TOKENS", "1024"))

# Embedding provider abstraction: voyage | openai | gemini
EMBEDDING_PROVIDER = env("EMBEDDING_PROVIDER", "gemini")
VOYAGE_API_KEY = env("VOYAGE_API_KEY", "")
OPENAI_API_KEY = env("OPENAI_API_KEY", "")
EMBEDDING_MODEL = env("EMBEDDING_MODEL", "gemini-embedding-001")
EMBEDDING_DIMENSIONS = int(env("EMBEDDING_DIMENSIONS", "768"))
RAG_TOP_K = int(env("RAG_TOP_K", "6"))

# Frontend origin (used for CORS / future link generation)
FRONTEND_URL = env("FRONTEND_URL", "http://localhost:3000")

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        },
        "standard": {
            "format": "[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard" if DEBUG else "json",
        },
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", "INFO")},
    "loggers": {
        "django.db.backends": {"level": "WARNING"},
    },
}
