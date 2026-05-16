from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from pgvector.django import HnswIndex, VectorField


class EvidenceLevel(models.TextChoices):
    GUIDELINE = "guideline", "Clinical guideline"
    SYSTEMATIC_REVIEW = "systematic_review", "Systematic review"
    RCT = "rct", "Randomised controlled trial"
    OBSERVATIONAL = "observational", "Observational"
    EXPERT = "expert", "Expert opinion"
    PATIENT_ED = "patient_ed", "Patient education"


class VectorDocument(models.Model):
    """A source document ingested into the RAG corpus."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    source_url = models.URLField(max_length=1000, blank=True)
    publisher = models.CharField(max_length=200, blank=True)
    topic = models.SlugField(max_length=64, db_index=True)
    locale = models.CharField(max_length=8, default="en", db_index=True)
    evidence_level = models.CharField(
        max_length=32,
        choices=EvidenceLevel.choices,
        default=EvidenceLevel.PATIENT_ED,
    )
    content_hash = models.CharField(max_length=64, unique=True, db_index=True)
    last_reviewed = models.DateField(null=True, blank=True)
    raw_text = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["topic", "locale"])]

    def __str__(self) -> str:
        return self.title


class VectorChunk(models.Model):
    """A semantic chunk of a `VectorDocument`, with its embedding."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        VectorDocument, on_delete=models.CASCADE, related_name="chunks"
    )
    chunk_index = models.PositiveIntegerField()
    text = models.TextField()
    token_count = models.PositiveIntegerField(default=0)
    embedding = VectorField(dimensions=settings.EMBEDDING_DIMENSIONS, null=True)
    embedding_model = models.CharField(max_length=64, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["document_id", "chunk_index"]
        unique_together = [("document", "chunk_index")]
        indexes = [
            HnswIndex(
                name="rag_chunk_emb_hnsw",
                fields=["embedding"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            ),
        ]

    def __str__(self) -> str:
        return f"{self.document.title} [#{self.chunk_index}]"
