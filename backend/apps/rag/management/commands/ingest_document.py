"""Ingest a document into the RAG corpus.

Usage:
    docker compose exec backend uv run python manage.py ingest_document \\
        --source ./content/preemie-feeding.md \\
        --title "Preterm infant feeding" \\
        --topic feeding --locale en --evidence guideline
"""
from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

import httpx
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.rag.chunker import chunk_text
from apps.rag.embeddings import get_embedding_provider
from apps.rag.models import EvidenceLevel, VectorChunk, VectorDocument


def _read_source(source: str) -> str:
    if source.startswith("http://") or source.startswith("https://"):
        resp = httpx.get(source, timeout=30.0, follow_redirects=True)
        resp.raise_for_status()
        return resp.text
    p = Path(source)
    if not p.exists():
        raise CommandError(f"Source not found: {source}")
    return p.read_text(encoding="utf-8")


class Command(BaseCommand):
    help = "Ingest a document (file path or URL) into the RAG vector store."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("--source", required=True, help="File path or URL")
        parser.add_argument("--title", required=True)
        parser.add_argument("--topic", required=True, help="Slug, e.g. 'feeding'")
        parser.add_argument("--locale", default="en")
        parser.add_argument(
            "--evidence",
            default=EvidenceLevel.PATIENT_ED,
            choices=[c.value for c in EvidenceLevel],
        )
        parser.add_argument("--publisher", default="")
        parser.add_argument("--last-reviewed", default=None, help="YYYY-MM-DD")
        parser.add_argument(
            "--reembed",
            action="store_true",
            help="Re-embed even if the content hash is unchanged.",
        )

    def handle(self, *args: Any, **opts: Any) -> None:
        raw = _read_source(opts["source"])
        content_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()

        source_url = opts["source"] if opts["source"].startswith("http") else ""
        existing = VectorDocument.objects.filter(content_hash=content_hash).first()

        with transaction.atomic():
            if existing and not opts["reembed"]:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping: document with same hash already ingested ({existing.id})."
                    )
                )
                return

            doc, created = VectorDocument.objects.update_or_create(
                content_hash=content_hash,
                defaults={
                    "title": opts["title"],
                    "source_url": source_url,
                    "publisher": opts["publisher"],
                    "topic": opts["topic"],
                    "locale": opts["locale"],
                    "evidence_level": opts["evidence"],
                    "last_reviewed": opts.get("last_reviewed"),
                    "raw_text": raw,
                },
            )

            if not created:
                doc.chunks.all().delete()

            chunks = chunk_text(raw)
            if not chunks:
                self.stdout.write(self.style.WARNING("No text to chunk."))
                return

            provider = get_embedding_provider()
            vectors = provider.embed_documents([c.text for c in chunks])

            VectorChunk.objects.bulk_create(
                [
                    VectorChunk(
                        document=doc,
                        chunk_index=c.index,
                        text=c.text,
                        token_count=c.token_count,
                        embedding=vec,
                        embedding_model=provider.model,
                    )
                    for c, vec in zip(chunks, vectors, strict=True)
                ]
            )

            verb = "Created" if created else "Re-ingested"
            self.stdout.write(
                self.style.SUCCESS(
                    f"{verb} document '{doc.title}' with {len(chunks)} chunks "
                    f"(model={provider.model}, dim={provider.dimensions})."
                )
            )
