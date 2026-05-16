from __future__ import annotations

from rest_framework import serializers

from .models import Conversation, Message, MessageCitation


class CitationSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source="chunk.document.title", read_only=True)
    source_url = serializers.URLField(source="chunk.document.source_url", read_only=True)
    chunk_id = serializers.UUIDField(source="chunk.id", read_only=True)
    document_id = serializers.UUIDField(source="chunk.document.id", read_only=True)

    class Meta:
        model = MessageCitation
        fields = ("rank", "similarity", "chunk_id", "document_id", "document_title", "source_url")


class MessageSerializer(serializers.ModelSerializer):
    citations = CitationSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ("id", "role", "content", "token_count", "created_at", "citations")
        read_only_fields = fields


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ("id", "title", "baby", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class ConversationDetailSerializer(ConversationSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ("messages",)


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(min_length=1, max_length=4000)
    baby_id = serializers.UUIDField(required=False, allow_null=True)
    locale = serializers.ChoiceField(choices=["uk", "en"], default="uk")
