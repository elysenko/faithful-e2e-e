FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
# Boot contract (Colossus A4): migrate + idempotent seed print SEED_CRED on
# stdout every boot; the platform captures credentials from these logs.
ENTRYPOINT ["./docker-entrypoint.sh"]
