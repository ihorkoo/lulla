# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Dev target — hot reload, full deps
FROM base AS dev
COPY package.json .npmrc ./
RUN pnpm install --prefer-offline --config.confirmModulesPurge=false
ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "dev"]

# Build target
FROM base AS build
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm build

# Production runtime
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
