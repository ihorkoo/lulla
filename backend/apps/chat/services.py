"""Chat orchestration: RAG retrieval, Gemma streaming via Gemini API, citation persistence.

Gemma is served through the Gemini API (https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api).
We call it server-side from Django so the API key never reaches the browser.
"""
from __future__ import annotations

import json
import logging
import time
from collections.abc import Iterator
from dataclasses import dataclass

from django.conf import settings
from django.db import transaction
from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types

from apps.babies.models import Baby
from apps.core.exceptions import LLMUnavailable
from apps.rag.prompt import build_chat_prompt
from apps.rag.retrieval import RetrievedChunk

from .models import Conversation, Message, MessageCitation, MessageRole

logger = logging.getLogger(__name__)
STREAM_RETRY_DELAYS_SECONDS = (0.5, 1.5)
MAX_CONVERSATION_TITLE_LENGTH = 80


@dataclass(slots=True)
class StreamEvent:
    kind: str  # "citations" | "delta" | "done" | "error"
    payload: dict


def _suggest_conversation_title(content: str, max_length: int = MAX_CONVERSATION_TITLE_LENGTH) -> str:
    normalized = " ".join(content.split())
    if not normalized:
        return ""
    if len(normalized) <= max_length:
        return normalized
    truncated = normalized[: max_length - 3].rstrip(" ,.;:!?-")
    return f"{truncated}..."


def _persist_user_message(conversation: Conversation, content: str) -> Message:
    message = Message.objects.create(
        conversation=conversation,
        role=MessageRole.USER,
        content=content,
        token_count=len(content) // 4,
    )
    if not conversation.title.strip():
        conversation.title = _suggest_conversation_title(content)
        conversation.save(update_fields=["title", "updated_at"])
    return message


def _persist_assistant_message(
    conversation: Conversation,
    content: str,
    citations: list[RetrievedChunk],
) -> Message:
    with transaction.atomic():
        msg = Message.objects.create(
            conversation=conversation,
            role=MessageRole.ASSISTANT,
            content=content,
            token_count=len(content) // 4,
        )
        from apps.rag.models import VectorChunk  # noqa: PLC0415

        chunks = {
            str(c.id): c
            for c in VectorChunk.objects.filter(id__in=[c.chunk_id for c in citations])
        }
        MessageCitation.objects.bulk_create(
            [
                MessageCitation(
                    message=msg,
                    chunk=chunks[c.chunk_id],
                    similarity=c.similarity,
                    rank=i + 1,
                )
                for i, c in enumerate(citations)
                if c.chunk_id in chunks
            ]
        )
        conversation.save(update_fields=["updated_at"])
        return msg


def _history_for_gemini(conversation: Conversation, limit: int = 20) -> list[dict]:
    """Convert DB messages → Gemini SDK `contents` list.

    Roles map: USER → "user", ASSISTANT → "model". SYSTEM is excluded
    (system prompt is passed separately via GenerateContentConfig).
    """
    msgs = list(
        conversation.messages.exclude(role=MessageRole.SYSTEM).order_by("-created_at")[:limit]
    )
    msgs.reverse()
    out: list[dict] = []
    for m in msgs:
        role = "model" if m.role == MessageRole.ASSISTANT else "user"
        out.append({"role": role, "parts": [{"text": m.content}]})
    return out


def stream_chat(
    conversation: Conversation,
    baby: Baby | None,
    user_content: str,
    locale: str = "uk",
) -> Iterator[str]:
    """Yields SSE-formatted lines: `event: <kind>\\ndata: <json>\\n\\n`."""
    user_msg = _persist_user_message(conversation, user_content)

    def sse(kind: str, payload: dict) -> str:
        return f"event: {kind}\ndata: {json.dumps(payload)}\n\n"

    yield sse("user_message", {"id": str(user_msg.id), "content": user_msg.content})

    if baby is None:
        baby = conversation.baby

    if baby is None:
        yield sse(
            "error",
            {"code": "BABY_REQUIRED", "message": "Conversation must be linked to a baby profile."},
        )
        return

    prompt = build_chat_prompt(baby, user_content, locale=locale)

    yield sse(
        "citations",
        {
            "items": [
                {
                    "rank": i + 1,
                    "chunk_id": c.chunk_id,
                    "document_id": c.document_id,
                    "document_title": c.document_title,
                    "source_url": c.source_url,
                    "similarity": round(c.similarity, 4),
                }
                for i, c in enumerate(prompt.citations)
            ]
        },
    )

    if not settings.GOOGLE_API_KEY:
        yield sse(
            "error",
            {"code": "LLM_UNCONFIGURED", "message": "GOOGLE_API_KEY is not set."},
        )
        return

    client = genai.Client(api_key=settings.GOOGLE_API_KEY)
    history = _history_for_gemini(conversation)
    if not history:
        history = [{"role": "user", "parts": [{"text": user_content}]}]

    config = genai_types.GenerateContentConfig(
        system_instruction=prompt.system,
        max_output_tokens=settings.LLM_MAX_OUTPUT_TOKENS,
    )

    collected: list[str] = []
    try:
        last_api_error: genai_errors.APIError | None = None
        for attempt, delay in enumerate((0.0, *STREAM_RETRY_DELAYS_SECONDS), start=1):
            if delay:
                time.sleep(delay)
            try:
                stream = client.models.generate_content_stream(
                    model=settings.GEMMA_MODEL,
                    contents=history,
                    config=config,
                )
                for chunk in stream:
                    text = getattr(chunk, "text", None)
                    if not text:
                        continue
                    collected.append(text)
                    yield sse("delta", {"text": text})
                last_api_error = None
                break
            except genai_errors.APIError as exc:
                last_api_error = exc
                status_code = getattr(exc, "status_code", None)
                logger.warning(
                    "Gemini API error during streaming",
                    extra={"attempt": attempt, "status_code": status_code},
                    exc_info=True,
                )
                if status_code and status_code < 500:
                    break
        if last_api_error is not None:
            yield sse(
                "error",
                {
                    "code": "LLM_UPSTREAM",
                    "message": "The AI service is temporarily unavailable. Please try again in a minute.",
                },
            )
            raise LLMUnavailable() from last_api_error
    except LLMUnavailable:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error during LLM streaming")
        yield sse(
            "error",
            {
                "code": "LLM_UPSTREAM",
                "message": "A temporary error occurred while generating the response. Please try again.",
            },
        )
        raise LLMUnavailable() from exc

    final_text = "".join(collected)
    assistant_msg = _persist_assistant_message(conversation, final_text, prompt.citations)

    yield sse(
        "done",
        {"message_id": str(assistant_msg.id), "conversation_id": str(conversation.id)},
    )
