# syntax=docker/dockerfile:1.7
FROM python:3.12-slim AS base

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl ca-certificates libpq5 \
    && curl -LsSf https://astral.sh/uv/install.sh | sh \
    && install -m 0755 /root/.local/bin/uv /usr/local/bin/uv \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock* ./

# Dev target — keeps build tools + dev deps for local iteration
FROM base AS dev
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*
RUN --mount=type=cache,id=uv-cache,target=/root/.cache/uv \
    uv sync --no-install-project

ENV DJANGO_SETTINGS_MODULE=lulla.settings.development \
    PATH="/app/.venv/bin:${PATH}"

EXPOSE 8000
CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]

# Production target — slim, non-root, tini as PID 1
FROM base AS prod
RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*
RUN --mount=type=cache,id=uv-cache,target=/root/.cache/uv \
    uv sync --no-dev --no-install-project

RUN useradd -ms /bin/bash app && chown -R app:app /app
COPY --chown=app:app . /app
USER app

ENV DJANGO_SETTINGS_MODULE=lulla.settings.production \
    PATH="/app/.venv/bin:${PATH}"

EXPOSE 8000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["uv", "run", "gunicorn", "lulla.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--access-logfile", "-", "--error-logfile", "-"]
