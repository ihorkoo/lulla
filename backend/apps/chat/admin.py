from django.contrib import admin

from .models import Conversation, Message, MessageCitation


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "baby", "created_at", "updated_at")
    search_fields = ("title", "user__email", "baby__name")
    raw_id_fields = ("user", "baby")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("conversation", "role", "token_count", "created_at")
    list_filter = ("role",)
    search_fields = ("content",)
    raw_id_fields = ("conversation",)


@admin.register(MessageCitation)
class MessageCitationAdmin(admin.ModelAdmin):
    list_display = ("message", "chunk", "rank", "similarity")
    raw_id_fields = ("message", "chunk")
