# Post-Deploy Report — FaithfulE

**Deployed URL:** https://ubuntu.desmana-truck.ts.net/faithful-e2e-e
**Date:** 2026-07-14

## Liveness ✅
| Endpoint | Status | Response time | TLS |
|----------|--------|---------------|-----|
| `/api/health` (liveness) | 200 `{"status":"ok"}` | ~0.13s | valid (HTTPS, cert verified) |
| `/api/health/deep` (readiness) | 200 `{"status":"ok","info":{"database":{"status":"up"}}}` | ~0.75s | valid |
| `/` (SPA) | 200 — `<title>FaithfulE</title>` served | ~0.10s | valid |

Deployment is live and healthy; database readiness confirmed via `/api/health/deep`.

## Phase 0 — Demo credentials
Handled automatically by the pipeline's `sync_seed_credentials` activity (seeds
`admin@faithful-e.test` / `user@faithful-e.test`). Not touched by this stage.

## Phase 1 — Deferred secrets
**None.** No project secrets store present and no secrets carry
`obtain_timing == "post_deploy"` / `obtain_by == "defer"`. The technical plan
declares **no third-party external services**. Nothing to resolve; nothing pending.

## Phase 2 — Webhook registration
**Skipped — not applicable.** No `.pipeline/integrations.json` present and no
integrations require webhooks. No webhook URLs were built or registered.

## Phase 3 — Liveness check
Completed successfully (see table above).

## Manual follow-ups for the human
**None.** No missing credentials, no unregistered webhooks, no pending deferred secrets.
