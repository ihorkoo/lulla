"""Embedding provider abstraction (Voyage AI primary, OpenAI fallback).

Embeddings are produced server-side in Django so we never expose vendor keys
or the embedding model to the browser.
"""
from __future__ import annotations

import logging
from typing import Protocol

from django.conf import settings
from tenacity import retry, stop_after_attempt, wait_exponential_jitter

logger = logging.getLogger(__name__)


class EmbeddingProvider(Protocol):
    model: str
    dimensions: int

    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...

    def embed_query(self, text: str) -> list[float]: ...


class VoyageEmbeddings:
    def __init__(self, api_key: str, model: str = "voyage-3") -> None:
        import voyageai  # noqa: PLC0415

        if not api_key:
            raise RuntimeError("VOYAGE_API_KEY is not set")
        self._client = voyageai.Client(api_key=api_key)
        self.model = model
        self.dimensions = settings.EMBEDDING_DIMENSIONS

    @retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=1, max=10))
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        result = self._client.embed(texts, model=self.model, input_type="document")
        return result.embeddings  # type: ignore[no-any-return]

    @retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=1, max=10))
    def embed_query(self, text: str) -> list[float]:
        result = self._client.embed([text], model=self.model, input_type="query")
        return result.embeddings[0]  # type: ignore[no-any-return]


class OpenAIEmbeddings:
    def __init__(self, api_key: str, model: str = "text-embedding-3-small") -> None:
        from openai import OpenAI  # noqa: PLC0415

        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        self._client = OpenAI(api_key=api_key)
        self.model = model
        self.dimensions = settings.EMBEDDING_DIMENSIONS

    @retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=1, max=10))
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        resp = self._client.embeddings.create(input=texts, model=self.model)
        return [d.embedding for d in resp.data]

    @retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=1, max=10))
    def embed_query(self, text: str) -> list[float]:
        resp = self._client.embeddings.create(input=text, model=self.model)
        return resp.data[0].embedding


class GeminiEmbeddings:
    """Google Gemini API embeddings. Default model: `gemini-embedding-001` (768d).

    NOTE: EMBEDDING_DIMENSIONS must match the chosen model. If you switch
    provider or dimensions, re-embed the corpus before relying on retrieval.
    """

    def __init__(self, api_key: str, model: str = "gemini-embedding-001") -> None:
        from google import genai  # noqa: PLC0415
        from google.genai import types as genai_types  # noqa: PLC0415

        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY is not set")
        self._client = genai.Client(api_key=api_key)
        self.model = model
        self.dimensions = settings.EMBEDDING_DIMENSIONS
        self._types = genai_types

    @retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=1, max=10))
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        resp = self._client.models.embed_content(
            model=self.model,
            contents=texts,
            config=self._types.EmbedContentConfig(
                taskType="RETRIEVAL_DOCUMENT",
                outputDimensionality=self.dimensions,
            ),
        )
        return [e.values for e in resp.embeddings]

    @retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=1, max=10))
    def embed_query(self, text: str) -> list[float]:
        resp = self._client.models.embed_content(
            model=self.model,
            contents=[text],
            config=self._types.EmbedContentConfig(
                taskType="RETRIEVAL_QUERY",
                outputDimensionality=self.dimensions,
            ),
        )
        return resp.embeddings[0].values


def get_embedding_provider() -> EmbeddingProvider:
    provider = settings.EMBEDDING_PROVIDER
    if provider == "voyage":
        return VoyageEmbeddings(settings.VOYAGE_API_KEY, settings.EMBEDDING_MODEL)
    if provider == "openai":
        return OpenAIEmbeddings(settings.OPENAI_API_KEY, settings.EMBEDDING_MODEL)
    if provider == "gemini":
        model = settings.EMBEDDING_MODEL or "gemini-embedding-001"
        return GeminiEmbeddings(settings.GOOGLE_API_KEY, model)
    raise RuntimeError(f"Unknown embedding provider: {provider}")
