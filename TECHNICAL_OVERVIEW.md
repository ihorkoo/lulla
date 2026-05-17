# lulla — Technical Overview

**lulla AI** turns trusted medical knowledge into a clear, compassionate, and
accessible AI assistant available 24/7. With **Gemma 3** as the core reasoning
layer and a **Retrieval-Augmented Generation** architecture on top of a
curated neonatal knowledge base, every answer is grounded in verified
clinical material — never in the model's free-form imagination.

Responses are adapted to the full context of each family:

- the baby's **gestational age**, **corrected age** and current developmental
  stage;
- the **medical context** captured in the profile (preterm status, follow-up
  needs, oxygen support after discharge, feeding plan);
- the **family's real-life environment** — living conditions, geography,
  healthcare access, regional resources and the practical constraints that
  shape what advice is actually actionable in different parts of the world.

The goal is a single, always-on companion that meets parents where they are —
at 3 AM, in a region without a 24/7 neonatologist nearby, in their own
language — and gives them an answer they can trust and act on, while always
pointing back to the care team for clinical decisions.

---

## 1. What's already built (MVP)

The current release is a fully working minimum viable product, ready for a
closed pilot with real families.

### 1.1 User experience

- **Sign-up and login** with email + password, with httpOnly JWT tokens
  managed on the Next.js side (XSS-safe).
- **Baby profile**: name, date of birth, gestational age (22–41 weeks), with
  automatic computation of corrected and chronological age.
- **AI chat** with streaming responses over Server-Sent Events. The LLM is
  aware of the corrected age, full conversation history, and the relevant
  retrieved knowledge-base passages.
- **Dashboard** summarizing the baby's status, recent conversations and quick
  actions.
- **Multi-conversation chat**: all dialogues are persisted, the parent can
  resume at any time.
- **Ready-made starter scenarios**: feeding, warning signs, vitamins, what
  to ask the pediatrician.
- **Medical disclaimer** at every interaction point — the product never
  replaces a clinician.

### 1.2 RAG (Retrieval-Augmented Generation)

- **Vector database** on pgvector (PostgreSQL extension) — no external vector
  service required.
- **Embeddings** via the Gemini Embeddings API (`gemini-embedding-001`,
  768 dimensions). The architecture is swappable to Voyage AI or OpenAI in
  one config line.
- **Semantic retrieval** of top-K=6 chunks per query.
- **Knowledge base** built from curated clinical sources (NeoPedia and others).
- **Source-grounded answers**: the model only sees retrieved chunks; every
  answer is anchored to the provided material.

### 1.3 LLM integration

- **Gemma 3 27B** served via the Gemini API (`gemma-4-26b-a4b-it`).
- Token-by-token streaming, rendered in real time on the frontend.
- Retry logic with exponential backoff for transient 5xx errors upstream.
- A dedicated system prompt enforces safety rules: no diagnoses, no invented
  dosages, mandatory pediatrician-consultation reminder.

### 1.4 Architecture

```
┌──────────────────┐     HTTPS      ┌────────────────────────┐
│  Browser (React) │ ◀────────────▶ │ Next.js 15 (Frontend)  │
└──────────────────┘                └──────────┬─────────────┘
                                               │ private call
                                               ▼
                            ┌────────────────────────────────┐
                            │     Django REST API + DRF      │
                            │  (gthread gunicorn, SSE-ready) │
                            └──────┬──────────────┬──────────┘
                                   │              │
                          ┌────────▼─────┐   ┌────▼─────────┐
                          │  Postgres +  │   │  Gemini API  │
                          │   pgvector   │   │  (Gemma 3)   │
                          └──────────────┘   └──────────────┘
```

| Layer         | Technologies                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| Frontend      | Next.js 15 (App Router, RSC), TypeScript, Tailwind CSS v4, TanStack Query, react-hook-form + Zod, next-intl |
| Backend       | Django 5.1, Django REST Framework, drf-spectacular (OpenAPI 3), SimpleJWT, gunicorn (gthread workers)       |
| Database      | PostgreSQL 17 + pgvector                                                                                    |
| LLM           | Google Gemini API (Gemma 3 27B)                                                                             |
| Auth          | JWT (access + refresh), httpOnly cookies, token blacklist on logout                                         |
| Static assets | WhiteNoise (gzip + immutable cache headers)                                                                 |
| Infra         | Docker / Docker Compose (dev), Railway (prod), GitHub CI-ready                                              |
| Observability | Structured JSON logging, request-id middleware, /healthz, /readyz                                           |

### 1.5 Security

- httpOnly + Secure + SameSite=Lax cookies for JWTs.
- DRF throttling (60 req/min anonymous, 240/min authenticated, 10/min on
  auth endpoints).
- CSRF, CORS, HSTS, Content-Type nosniff, X-Frame-Options DENY.
- SSL redirect, secure-proxy-ssl-header for the Railway edge.
- Password validators: ≥10 characters, common-password rejection,
  similarity check.
- All AI provider keys live exclusively on the backend — the browser never
  sees them.

### 1.6 DevX and code quality

- **Docker-only workflow** — `make up` brings up the full stack locally.
- TypeScript strict + ESLint + Prettier on the frontend.
- Ruff + Pyright + pytest on the backend.
- `make lint` / `make test` as the single uniform commands.
- OpenAPI schema generated automatically (`make gen-api`) — frontend types
  stay in sync with the API by construction.

---

## 2. Roadmap

The items below are what we plan to add in the next release cycles. Priorities
will be adjusted as feedback from pilot users comes in.

### 2.1 Answer quality — target ≥ 99.9 %

Accuracy is the most critical direction for a medical-adjacent product.

- **Multi-stage answer validation**
  1. **Generation** of the first draft by the primary LLM.
  2. **Verifier model** (a second, independent LLM or a rules-based checker)
     compares the draft against retrieved chunks and computes a
     groundedness score.
  3. **Fact checking** via a second RAG pass: is every claim in the answer
     supported by a citation?
  4. **Safety classifier**: detects when the answer crosses the line into
     medical advice that should be deferred to a clinician and rewrites
     it accordingly.
- **Human-in-the-loop**: a clinician review panel where answers are sampled,
  scored and fed back into the evaluation set.
- **Eval framework**: a curated set of 300+ "golden" Q&A authored by
  neonatology pediatricians. Every release is regression-tested against it.
  Metrics: accuracy, factual grounding, hallucination rate, safety violation
  rate.
- **A/B testing** of alternative models and prompts against real chats
  (opt-in).

### 2.2 Language coverage — 80+ languages

- Today: full pipeline (UI + AI answers) in Ukrainian and English.
- Wave 1: 10 priority languages (Polish, Romanian, Bulgarian, Serbian,
  Kazakh, Georgian, Lithuanian, Latvian, Estonian, Hebrew) — covering
  Eastern Europe and the Caucasus.
- Wave 2: automatic language detection on the user message + matching
  response locale.
- Wave 3: knowledge-base translation through certified medical translators
  with back-translation QA.
- Technically: i18n already on next-intl (frontend) and Django i18n (backend);
  Gemini natively supports 100+ languages; embeddings are natively multilingual.

### 2.3 Performance and scalability

- **Streaming cache** for common opening tokens of frequent queries.
- **Edge cache** for stable RAG responses with a short TTL.
- **Connection pooling** for Postgres (PgBouncer).
- **Embedding cache** — never re-embed identical chunks.
- **Cold vs hot path** for the LLM: a smaller, faster model (Gemma 3 4B) for
  simple queries, escalation to 27B only for hard ones.
- **Pre-warmed** Gemini clients to amortize handshake latency across requests.
- Target SLAs: TTFT (time-to-first-token) ≤ 1.5 s, full response ≤ 8 s at the
  p95.

### 2.4 On-premises deployment

For hospitals, clinics and government customers where regulation forbids
sending data to third-party AI services:

- **Self-hosted LLM runtime** (vLLM / TGI) with locally deployed Gemma or
  Llama 3.
- **Self-hosted embeddings** (sentence-transformers or BGE-M3).
- **Air-gapped mode**: zero outbound traffic, knowledge-base updates pushed
  through an offline pipeline.
- **Single-tenant Postgres + pgvector** on the customer's own hardware.
- **Helm chart** for Kubernetes deployment, single-VM variant for smaller
  clinics.
- Hospital SSO support (SAML, OIDC, Active Directory).
- Full audit log of every interaction touching a child's personal data.

### 2.5 Compliance and quality system

- **HIPAA / GDPR / PCI-DSS** readiness: data residency, right to erasure,
  encryption at rest + in transit.
- **DPAs** (Data Processing Agreements) with every external provider.
- **ISO 27001 / SOC 2 Type II** certification.
- **Medical-device classification**: MDR certification (EU) / FDA SaMD class
  (US) for the parts of the product that qualify as decision support.
- **CE-mark path** for the EU market.
- PII and chat history split at the database level with per-family
  encryption keys.

### 2.6 Product expansion

- **Voice input and voice replies** (Web Speech API + ElevenLabs / Google
  TTS) — parents often ask questions at 3 AM with a baby in their arms.
- **Native mobile apps** (React Native or Flutter) with push reminders for
  immunizations and follow-up visits.
- **Development calendar** — milestone tracker based on corrected age.
- **Immunization map** — personalized vaccination schedule for preterm
  babies.
- **Growth and nutrition** — weight, length and head-circumference charts
  with corrected-age-aware norms.
- **Clinician integration**: shared question history, in-chat advice from
  the family pediatrician, embedded telehealth sessions.
- **Community**: moderated peer-to-peer support for parents with similar
  journeys.
- **Care programs** — structured 12-week curricula for the first months at
  home after discharge.

### 2.7 Analytics and research

- Anonymized analytics on the most frequent questions → surfaces gaps in the
  knowledge base and parent-education priorities.
- Partnerships with university hospitals to study the impact of an AI
  assistant on care quality and child outcomes.
- Peer-reviewed publications.

---

## 3. Technical debt and known limitations

In the spirit of honesty — what we haven't done yet in the MVP:

- ESLint fails because of an incompatibility between `@rushstack/eslint-patch`
  and ESLint 9.39 — linting is temporarily disabled in CI. Fixed by bumping
  `eslint-config-next` to the next minor version.
- Test coverage is targeted, not exhaustive (domain logic + critical API
  endpoints). Target coverage ≥ 75 % backend and ≥ 60 % frontend by GA.
- No Sentry / OpenTelemetry integration yet — only structured JSON logs.
  Added in the next sprint.
- One baby profile per user. Multi-baby support is in the backlog.
- Chat history grows unboundedly — old-message summarization is needed.
- No offline mode in the frontend.

---

## 4. 12-month vision

Grow lulla from an MVP chat into a **reference AI-support platform for
families of preterm babies** for the Ukrainian and Eastern-European market —
with medical-device certification, an on-premises variant for clinics, and
clinically validated answer accuracy.
