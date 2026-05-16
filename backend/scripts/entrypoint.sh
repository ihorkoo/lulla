#!/usr/bin/env bash
# Production container entrypoint.
# Runs the release step (migrate + collectstatic) once, then execs the CMD.
set -euo pipefail

# Ensure the pgvector extension is present. Safe to run on every boot —
# Django's first migration also tries to create it, but doing it explicitly
# gives a clearer error if the role lacks permission.
echo "→ migrate"
uv run python manage.py migrate --noinput

echo "→ collectstatic"
uv run python manage.py collectstatic --noinput --clear

echo "→ starting: $*"
exec "$@"
