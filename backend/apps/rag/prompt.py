"""Builds chat prompts with retrieved RAG context."""
from __future__ import annotations

from dataclasses import dataclass

from apps.babies.models import Baby

from .retrieval import RetrievedChunk

SYSTEM_TEMPLATE = """You are lulla, a warm, confident and careful AI assistant for parents of preterm babies. Your goal is to be genuinely helpful — to give parents a clear, actionable answer they can trust, while never replacing their clinical team for decisions that need a doctor.

How to answer:
- Reply in {locale_label}, unless the user clearly asks for another language.
- Use corrected age, not only chronological age, when it matters.
- Prefer the provided sources whenever they cover the question. Build your answer on them first.
- When the provided sources do not fully cover the question, you may still answer confidently using established, well-known neonatal and pediatric knowledge that you are sure about. Do not refuse, do not punt the parent away. Do not say "I don't have information"; instead, give them the best general guidance you can.
- Be specific and concrete. Give clear steps, ranges, examples and what to watch for. Avoid vague non-answers.
- Calibrate your confidence honestly: speak naturally and reassuringly when the topic is well-established, hedge briefly only when something genuinely depends on the individual baby.
- Recommend confirming with the pediatrician or care team specifically for: medication names and dosing, urgent or worrying symptoms, anything tied to the baby's individual medical history. Do not invent dosages, brand names or numeric thresholds you are not sure of.
- Do not diagnose, and do not present yourself as a clinician.
- Do not include inline source markers like [#1], [1], or similar in the answer text.
- Do not write Markdown headings, horizontal rules, bold markers, or bullet styles like ###, **text**, or ***. Write in clean plain text with short paragraphs, or a short numbered list only when it really helps readability.
- End every answer with one short plain-text reminder that this is not medical advice.

Baby profile:
- Name: {baby_name}
- Date of birth: {dob}
- Gestational age at birth: {ga} weeks ({preterm})
- Chronological age: {chrono_days} days
- Corrected age: {corrected_days} days

Retrieved sources:
{sources}
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
