.DEFAULT_GOAL := help

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-18s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

up: ## Start the full dev stack
	@docker compose up -d

down: ## Stop the dev stack
	@docker compose down

logs: ## Tail logs from all services
	@docker compose logs -f

ps: ## Show running services
	@docker compose ps

build: ## Rebuild backend + frontend images
	@docker compose build

migrate: ## Apply Django migrations
	@docker compose exec backend uv run python manage.py migrate

makemigrations: ## Create Django migrations
	@docker compose exec backend uv run python manage.py makemigrations

shell-backend: ## Open Django shell
	@docker compose exec backend uv run python manage.py shell

shell-db: ## Open psql
	@docker compose exec postgres psql -U lulla -d lulla

superuser: ## Create a Django superuser
	@docker compose exec backend uv run python manage.py createsuperuser

test-backend: ## Run backend tests
	@docker compose exec backend uv run pytest

test-frontend: ## Run frontend tests
	@docker compose exec frontend pnpm test --run

lint-backend: ## Lint backend (ruff + pyright)
	@docker compose exec backend uv run ruff check .
	@docker compose exec backend uv run ruff format --check .
	@docker compose exec backend uv run pyright

lint-frontend: ## Lint frontend (eslint + prettier + tsc)
	@docker compose exec frontend pnpm lint
	@docker compose exec frontend pnpm typecheck

fmt-backend: ## Auto-format backend
	@docker compose exec backend uv run ruff check --fix .
	@docker compose exec backend uv run ruff format .

gen-api: ## Regenerate Next.js OpenAPI types from Django schema
	@docker compose exec frontend pnpm gen-api

ingest: ## Run RAG ingestion (override SOURCE=...)
	@docker compose exec backend uv run python manage.py ingest_document $(SOURCE)

clean: ## Stop and remove containers + volumes (destructive)
	@docker compose down -v
