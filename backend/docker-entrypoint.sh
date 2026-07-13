#!/bin/sh
# Colossus boot contract (A4): migrate + idempotent seed BEFORE serving.
# The seed prints SEED_CRED lines on stdout EVERY boot - the platform's
# credential capture (sync_seed_credentials) reads them from this pod's logs.
# Fail-open: a migrate/seed hiccup logs loudly but never blocks serving;
# the deploy readiness probe + login smoke gate catch a genuinely dead app.
if [ -f prisma/schema.prisma ]; then
  npx prisma migrate deploy || echo "[entrypoint] WARN: prisma migrate deploy failed"
fi
if [ -f prisma/seed/seed.js ]; then
  node prisma/seed/seed.js || echo "[entrypoint] WARN: seed failed"
fi
exec node dist/main
