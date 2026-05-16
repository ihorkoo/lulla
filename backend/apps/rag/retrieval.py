"""Retrieve top-k chunks from pgvector by cosine similarity."""
from __future__ import annotations

from dataclasses import dataclass

from django.db.models import F
from pgvector.django import CosineDistance

from .embeddings import get_embedding_provider
from .models import VectorChunk


@dataclass(slots=True)
class RetrievedChunk:
    chunk_id: str
    document_id: str
    document_title: str
    source_url: str
    text: str
    similarity: float


def retrieve_top_k(
    query: str,
    k: int = 6,
    *,
    locale: str | None = None,
    topic: str | None = None,
) -> list[RetrievedChunk]:
    if not query.strip():
        return []
    provider = get_embedding_provider()
    qvec = provider.embed_query(query)

    qs = VectorChunk.objects.exclude(embedding__isnull=True).select_related("document")
    if locale:
        qs = qs.filter(document__locale=locale)
    if topic:
        qs = qs.filter(document__topic=topic)

    qs = qs.annotate(distance=CosineDistance("embedding", qvec)).order_by("distance")[:k]

    out: list[RetrievedChunk] = []
    for row in qs:
        sim = 1.0 - float(row.distance)  # type: ignore[attr-defined]
        out.append(
            RetrievedChunk(
                chunk_id=str(row.id),
                document_id=str(row.document_id),
                document_title=row.document.title,
                source_url=row.document.source_url,
                text=row.text,
                similarity=sim,
            )
        )
    return out
