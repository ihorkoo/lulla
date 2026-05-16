"""Builds chat prompts with retrieved RAG context."""
from __future__ import annotations

from dataclasses import dataclass

from apps.babies.models import Baby

from .retrieval import RetrievedChunk

SYSTEM_TEMPLATE = """You are lulla, a warm and careful AI assistant for parents of preterm babies. You must stay grounded in the provided source material.

Always follow these rules:
- Reply in {locale_label}, unless the user clearly asks for another language.
- Use corrected age, not only chronological age, when it matters.
- Use the provided sources for clinical or medical claims.
- Do not include inline source markers like [#1], [1], or similar in the answer text.
- Do not write Markdown headings, horizontal rules, bold markers, or bullet styles like ###, **text**, or ***.
- Write in clean plain text with short paragraphs or a short numbered list only when it helps readability.
- Do not diagnose and do not replace a pediatrician or other clinician.
- End every answer with one short plain-text reminder that this is not medical advice.

Baby profile:
- Name: {baby_name}
- Date of birth: {dob}
- Gestational age at birth: {ga} weeks ({preterm})
- Chronological age: {chrono_days} days
- Corrected age: {corrected_days} days

Retrieved sources:
{sources}

If the provided sources do not cover the question well enough, say that clearly, do not invent facts, and advise the parent to contact their pediatrician or care team.
"""


@dataclass(slots=True)
class BuiltPrompt:
    system: str
    citations: list[RetrievedChunk]


def _format_sources(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return "(no sources retrieved)"
    lines = []
    for i, c in enumerate(chunks, start=1):
        head = f"[#{i}] {c.document_title}"
        if c.source_url:
            head += f" — {c.source_url}"
        lines.append(f"{head}\n{c.text.strip()}")
    return "\n\n".join(lines)


_LOCALE_LABELS = {"uk": "Ukrainian", "en": "English"}


def build_chat_prompt(baby: Baby, user_query: str, locale: str = "uk") -> BuiltPrompt:
    from .retrieval import retrieve_top_k  # noqa: PLC0415

    chunks = retrieve_top_k(user_query, k=6, locale=locale)
    chronological = baby.chronological_age_days()
    corrected = baby.corrected_age_days()
    preterm = "preterm" if baby.is_preterm else "term"

    system = SYSTEM_TEMPLATE.format(
        locale_label=_LOCALE_LABELS.get(locale, "the user's language"),
        baby_name=baby.name,
        dob=baby.dob.isoformat(),
        ga=baby.gestational_age_weeks,
        preterm=preterm,
        chrono_days=chronological,
        corrected_days=corrected,
        sources=_format_sources(chunks),
    )
    return BuiltPrompt(system=system, citations=chunks)
