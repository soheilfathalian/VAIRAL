# syntax=docker/dockerfile:1.7
# Multi-stage build for Next.js 15 standalone output, deployed to Cloud Run.
# Final image is ~150MB. Secrets are injected at runtime via Cloud Run env vars,
# never baked into the image.

# ─── deps ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts skips the prepare hook that installs the local git pre-commit
# scanner — irrelevant inside a container, and it would fail without a .git dir.
RUN npm ci --ignore-scripts

# ─── builder ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build needs *some* value for the env-var assertions in lib/*/client.ts that
# run at module-load. Real values are injected at runtime by Cloud Run.
ENV PEEC_API_KEY=build-placeholder
ENV GEMINI_API_KEY=build-placeholder

RUN npm run build

# ─── runner ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Next.js telemetry off — no need for a Cloud Run container to phone home.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Standalone server bundle (includes only the deps actually imported at runtime).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Pre-seed data/slate/ so a cold start has something to render before the user
# triggers /api/generate. Cloud Run filesystem is ephemeral, so anything written
# at runtime is lost when the container scales to zero.
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
