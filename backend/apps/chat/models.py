from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations"
    )
    baby = models.ForeignKey(
        "babies.Baby", on_delete=models.SET_NULL, null=True, related_name="conversations"
    )
    title = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [models.Index(fields=["user", "-updated_at"])]

    def __str__(self) -> str:
        return self.title or f"Conversation {self.id}"


class MessageRole(models.TextChoices):
    USER = "user", "User"
    ASSISTANT = "assistant", "Assistant"
    SYSTEM = "system", "System"


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=12, choices=MessageRole.choices)
    content = models.TextField()
    token_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["conversation", "created_at"])]


class MessageCitation(models.Model):
    """Links an assistant message to the RAG chunks that grounded it."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="citations"
    )
    chunk = models.ForeignKey(
        "rag.VectorChunk", on_delete=models.PROTECT, related_name="citations"
    )
    similarity = models.FloatField()
    rank = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["rank"]
        unique_together = [("message", "rank")]
