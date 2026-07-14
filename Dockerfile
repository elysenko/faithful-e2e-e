# syntax=docker/dockerfile:1
#
# Single-container image (Colossus): NestJS API + compiled Angular SPA served
# together on port 8080. Build context = repo root.
#
#   /api/*  -> NestJS route handlers
#   *       -> Angular index.html (SPA fallback via ServeStaticModule)
#
# APP_BASE_HREF controls the Angular <base href>. The Colossus ingress mounts
# this app under the sub-path /faithful-e2e-e/ and rewrites it away before the
# request reaches the pod (see k8s/ingress.yaml: rewrite-target /$2). The base
# href therefore MUST match that sub-path so the browser requests assets at
# /faithful-e2e-e/main.js (routable by the ingress) instead of /main.js (404 at
# the domain root). apiUrl is relative ('api') so it resolves under the same
# base href. Override with --build-arg APP_BASE_HREF=/<prefix>/ if remounted.

# ---------- Stage 1: build the Angular SPA ----------
FROM node:22-alpine AS frontend
WORKDIR /web
ARG APP_BASE_HREF=/faithful-e2e-e/
COPY web/frontend/package*.json ./
RUN npm ci
COPY web/frontend/ ./
RUN npm run build -- --base-href "${APP_BASE_HREF}"

# ---------- Stage 2: build the NestJS backend ----------
FROM node:22-alpine AS backend
WORKDIR /app
# Dummy URL satisfies prisma generate at build time — no real DB needed.
ENV DATABASE_URL="postgresql://x:x@localhost/x"
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
# Generate the Prisma client (src/generated/prisma) BEFORE building so nest
# compiles it into dist/generated/prisma.
RUN npx prisma generate && npm run build \
    && test -f dist/main.js \
    || (echo 'ERROR: dist/main.js missing after build' && exit 1)

# ---------- Stage 3: runtime ----------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Full node_modules (incl. prisma CLI) so `prisma migrate deploy` runs at boot.
COPY --from=backend /app/node_modules ./node_modules
COPY --from=backend /app/dist ./dist
COPY --from=backend /app/prisma ./prisma
COPY --from=backend /app/prisma.config.ts ./prisma.config.ts
COPY --from=backend /app/package*.json ./
COPY --from=backend /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Angular build -> /app/client (ServeStaticModule rootPath = <dist>/../client).
COPY --from=frontend /web/dist/frontend ./client

EXPOSE 8080
# Boot contract (Colossus A4): migrate + idempotent seed print SEED_CRED on
# stdout every boot; the platform captures credentials from these logs, then
# serves NestJS (which also serves the Angular SPA) on PORT 8080.
ENTRYPOINT ["./docker-entrypoint.sh"]
