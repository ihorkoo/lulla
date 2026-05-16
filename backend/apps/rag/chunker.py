"""Simple paragraph-aware chunker with sliding-window overlap.

Target ~500 tokens per chunk (~2000 chars) with ~80 token overlap.
Good enough for MVP; can swap for semantic chunking later.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

PARAGRAPH_SPLIT = re.compile(r"\n\s*\n+")
WORD_SPLIT = re.compile(r"\s+")

DEFAULT_TARGET_CHARS = 2000
DEFAULT_OVERLAP_CHARS = 250


@dataclass(slots=True)
class Chunk:
    index: int
    text: str
    token_count: int  # rough estimate (chars/4)


def chunk_text(
    text: str,
    target_chars: int = DEFAULT_TARGET_CHARS,
    overlap_chars: int = DEFAULT_OVERLAP_CHARS,
) -> list[Chunk]:
    text = text.strip()
    if not text:
        return []

    paragraphs = [p.strip() for p in PARAGRAPH_SPLIT.split(text) if p.strip()]
    chunks: list[Chunk] = []
    buf: list[str] = []
    buf_len = 0
    idx = 0

    for para in paragraphs:
        if buf_len + len(para) + 2 > target_chars and buf:
            joined = "\n\n".join(buf)
            chunks.append(Chunk(index=idx, text=joined, token_count=len(joined) // 4))
            idx += 1
            tail = joined[-overlap_chars:] if overlap_chars > 0 else ""
            buf = [tail, para] if tail else [para]
            buf_len = sum(len(s) for s in buf) + 2 * (len(buf) - 1)
        else:
            buf.append(para)
            buf_len += len(para) + 2

    if buf:
        joined = "\n\n".join(buf)
        chunks.append(Chunk(index=idx, text=joined, token_count=len(joined) // 4))

    return chunks
