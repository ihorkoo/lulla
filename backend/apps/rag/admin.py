from django.contrib import admin

from .models import VectorChunk, VectorDocument


@admin.register(VectorDocument)
class VectorDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "topic", "locale", "evidence_level", "last_reviewed", "created_at")
    list_filter = ("topic", "locale", "evidence_level")
    search_fields = ("title", "source_url", "raw_text")
    readonly_fields = ("id", "content_hash", "created_at", "updated_at")


@admin.register(VectorChunk)
class VectorChunkAdmin(admin.ModelAdmin):
    list_display = ("document", "chunk_index", "token_count", "embedding_model", "created_at")
    list_filter = ("embedding_model", "document__topic", "document__locale")
    search_fields = ("text", "document__title")
    readonly_fields = ("id", "created_at")
    raw_id_fields = ("document",)
