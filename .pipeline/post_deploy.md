# Post-Deploy Report — FaithfulE

**Deployed URL:** https://faithful-e2e-e-staging-0c9aa257fd758a36.athenconsult.com/
**Date:** 2026-07-14

## Liveness ✅
| Endpoint | Status | Response time | TLS |
|----------|--------|---------------|-----|
| `/api/health` (liveness) | 200 `{"status":"ok"}` | ~0.25s | valid (HTTPS/HTTP2, cert verified) |
| `/api/health/deep` (readiness) | 200 `{"status":"ok","info":{"database":{"status":"up"}}}` | ~0.92s | valid |
| `/` (SPA) | 200 | ~0.24s | valid |

Deployment is live and healthy; database readiness confirmed via `/api/health/deep`.

## Phase 0 — Demo credentials
Handled automatically by the pipeline's `sync_seed_credentials` activity (seeds
`admin@faithful-e.test` / `user@faithful-e.test`). Not touched by this stage.

## Phase 1 — Deferred secrets
**None.** No project secrets carry `obtain_timing == "post_deploy"` / `obtain_by == "defer"`.
The technical plan declares **no third-party external services**. Nothing to resolve; nothing pending.

## Phase 2 — Webhook registration
**Skipped — not applicable.** No `.pipeline/integrations.json` present and no
integrations require webhooks. No canonical webhook URLs were built or registered.

## Phase 3 — Liveness check
Completed successfully (see table above).

## Manual follow-ups for the human
**None.** No missing credentials, no unregistered webhooks, no pending deferred secrets.
