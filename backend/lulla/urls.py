from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from apps.core.views import healthz, readyz

urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz", healthz, name="healthz"),
    path("readyz", readyz, name="readyz"),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/babies/", include("apps.babies.urls")),
    path("api/v1/chat/", include("apps.chat.urls")),
    path("api/v1/schema", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/schema/swagger", SpectacularSwaggerView.as_view(url_name="schema")),
    path("api/v1/schema/redoc", SpectacularRedocView.as_view(url_name="schema")),
]
