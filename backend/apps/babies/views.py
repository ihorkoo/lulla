from __future__ import annotations

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Baby
from .serializers import BabySerializer


class BabyViewSet(viewsets.ModelViewSet):
    serializer_class = BabySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):  # type: ignore[override]
        return Baby.objects.filter(parent=self.request.user).order_by("-created_at")

    def perform_create(self, serializer) -> None:  # type: ignore[override]
        serializer.save(parent=self.request.user)
