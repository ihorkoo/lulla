from __future__ import annotations

from django.http import StreamingHttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.babies.models import Baby
from apps.core.exceptions import BabyNotFound, BabyProfileRequired, ConversationNotFound

from .models import Conversation
from .serializers import (
    ConversationDetailSerializer,
    ConversationSerializer,
    SendMessageSerializer,
)
from .services import stream_chat


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):  # type: ignore[override]
        return Conversation.objects.filter(user=self.request.user).order_by("-updated_at")

    def get_serializer_class(self):  # type: ignore[override]
        if self.action == "retrieve":
            return ConversationDetailSerializer
        return ConversationSerializer

    def retrieve(self, request: Request, *args, **kwargs) -> Response:  # type: ignore[override]
        instance = self.get_object()
        return Response(
            ConversationDetailSerializer(
                Conversation.objects.prefetch_related(
                    "messages__citations__chunk__document"
                ).get(pk=instance.pk)
            ).data
        )

    def perform_create(self, serializer) -> None:  # type: ignore[override]
        baby = Baby.objects.filter(parent=self.request.user).order_by("-created_at").first()
        if baby is None:
            raise BabyProfileRequired()
        serializer.save(user=self.request.user, baby=baby)

    @action(detail=True, methods=["post"], url_path="send")
    def send(self, request: Request, pk: str | None = None) -> StreamingHttpResponse:
        try:
            conv = Conversation.objects.get(pk=pk, user=request.user)
        except Conversation.DoesNotExist as exc:
            raise ConversationNotFound() from exc

        ser = SendMessageSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        baby: Baby | None = conv.baby
        if ser.validated_data.get("baby_id"):
            try:
                baby = Baby.objects.get(pk=ser.validated_data["baby_id"], parent=request.user)
            except Baby.DoesNotExist as exc:
                raise BabyNotFound() from exc
            if conv.baby_id is None:
                conv.baby = baby
                conv.save(update_fields=["baby"])

        response = StreamingHttpResponse(
            streaming_content=stream_chat(
                conv,
                baby,
                ser.validated_data["content"],
                locale=ser.validated_data.get("locale", "uk"),
            ),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response
