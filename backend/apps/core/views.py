from __future__ import annotations

from django.db import connection
from django.http import HttpRequest, JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(["GET"])
@permission_classes([AllowAny])
def healthz(_request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "ok"})


@api_view(["GET"])
@permission_classes([AllowAny])
def readyz(_request: HttpRequest) -> JsonResponse:
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
    except Exception:  # noqa: BLE001
        return JsonResponse({"status": "db_unavailable"}, status=503)
    return JsonResponse({"status": "ready"})
