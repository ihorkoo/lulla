# lulla

Support app for parents of premature babies. AI chat backed by a curated vector knowledge base, with corrected-age awareness.

## Stack

- **Backend:** Django 5 + DRF, Postgres 17 + pgvector, Redis, JWT (simplejwt), Gemma via Google Gemini API for chat, Gemini / OpenAI / Voyage embeddings.
- **Frontend:** Next.js 15 (App Router, RSC), TypeScript strict, Tailwind v4, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod, next-intl (uk/en).
- **Workflow:** Docker only. `docker compose up` starts the full stack.

## Quick start

```bash
make up           # start postgres, redis, backend, frontend
make migrate      # apply Django migrations
make superuser    # create an admin user
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API schema: http://localhost:8000/api/v1/schema/swagger
- Django admin: http://localhost:8000/admin

## Make targets

Run `make help` for the full list. Highlights:

| target | description |
| --- | --- |
| `up` / `down` | bring the stack up or down |
| `logs` | tail all services |
| `migrate` / `makemigrations` | Django migrations |
| `superuser` | create Django admin |
| `shell-backend` / `shell-db` | open a Django shell or psql |
| `test-backend` / `test-frontend` | run tests |
| `lint-backend` / `lint-frontend` | linters + type-checks |
| `gen-api` | regenerate Next.js OpenAPI types from Django schema |
| `ingest SOURCE=...` | ingest a document into the vector DB |

## Project layout

```
lulla/
├── backend/           # Django + DRF
│   ├── lulla/         # project (settings split, urls, wsgi, asgi)
│   └── apps/
│       ├── core/      # middleware, error handler, healthz
│       ├── accounts/  # User, email tokens, password reset
│       ├── babies/    # Baby profile + corrected-age methods
│       ├── chat/      # Conversation, Message, MessageCitation
│       └── rag/       # VectorDocument, VectorChunk (pgvector)
├── frontend/          # Next.js 15 app
│   └── src/
│       ├── app/       # routes, layouts
│       ├── features/  # auth / setup / chat / dashboard
│       ├── lib/       # env, api client, utils
│       ├── i18n/      # uk + en messages
│       └── styles/    # globals.css (Tailwind v4 tokens)
└── docker-compose.yaml
```

## Configuration

Everything for local dev is baked into `docker-compose.yaml`. There are no `.env` files. For production, secrets come from the deployment environment.

Optional API keys can be exported in your shell before `make up`:

```bash
export GOOGLE_API_KEY=...   # Gemma via Gemini API (chat)
export VOYAGE_API_KEY=...   # optional if you switch embeddings to Voyage
export OPENAI_API_KEY=...   # optional if you switch embeddings to OpenAI
```

They are forwarded into the `backend` container.

By default, embeddings now use Gemini (`gemini-embedding-001`, 768d) via the same
`GOOGLE_API_KEY`. If you switch embedding provider or dimensions after ingesting
documents, re-embed the corpus so stored vectors match the active model.
