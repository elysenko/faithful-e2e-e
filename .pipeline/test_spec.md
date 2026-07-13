# Test Specification

> ⚠️ **Warning:** `.pipeline/surface.json` was not found. The API surface below was
> derived from the "Surface contract" section of `.pipeline/tasks.md` and the approved
> spec. If a machine-readable `surface.json` is produced later, re-reconcile this file
> against it. Endpoint-count denominators marked `(derived)` reflect this fallback.

## Coverage summary
- Total cases: 41
- API endpoints covered: 9 / 9 (derived) — plus 1 negative case for the removed `POST /api/auth/register`
- User journeys covered: 5

Global preconditions for all API/UI tests:
- App booted via `docker-entrypoint.sh` (`prisma migrate deploy` → seed → `node dist/main`) on port **8080**, global prefix **`/api`**.
- Seed produced two users: `admin@faithful-e.test` (role `admin`) and `user@faithful-e.test` (role `user`), with deterministic passwords echoed as `SEED_CRED <role> <email> <password>` lines captured from boot logs.
- Public routes only: `/login`, `POST /api/auth/login`, `GET /api/health`, `GET /api/health/deep`. Everything under `/api/notes*` and `POST /api/auth/refresh-token` requires a valid JWT.

---

## API tests

### `POST /api/auth/login`
- **Happy path**: body `{ email: "admin@faithful-e.test", password: <seeded admin password> }` → `200` with body shape `{ user: { id, email: "admin@faithful-e.test", role: "admin" }, token: <non-empty JWT string> }`. Repeat with `user@faithful-e.test` → `role: "user"`.
- **Validation failures**: missing `email`, missing `password`, or malformed email → `400` (class-validator). Empty body `{}` → `400`.
- **Auth failures**: correct email + wrong password → `400`/`401`; unknown email `nobody@faithful-e.test` → `400`/`401`. Response must not leak whether the email exists.
- **Idempotency / edge cases**: two sequential logins with the same valid credential each return a usable token (no lockout); backend `role` is returned lowercase (frontend is responsible for uppercasing).

### `POST /api/auth/refresh-token`
- **Happy path**: with a valid token/refresh credential obtained from login → `200` returning a fresh token payload.
- **Validation failures**: missing/empty refresh payload → `400`.
- **Auth failures**: absent or invalid/expired token → `401`.
- **Idempotency / edge cases**: endpoint still exists after the register removal (was not deleted alongside `register`).

### `POST /api/auth/register` (must NOT exist)
- **Negative case (route removed)**: `POST /api/auth/register` with any body → `404` (route no longer registered). Confirms public signup was removed per login-only rule. This case also guards against the endpoint being served as the SPA fallback (must be `404`, not `200`/`index.html`).

### `GET /api/health`
- **Happy path**: no auth header → `200` liveness response. Public (`@Public()`), no token required.
- **Validation failures**: n/a (no inputs).
- **Auth failures**: n/a — must succeed WITHOUT a token; sending a token must not break it.
- **Idempotency / edge cases**: responds `200` even if the DB is unreachable (liveness ≠ readiness).

### `GET /api/health/deep`
- **Happy path**: no auth header → `200` with DB-ok JSON (Prisma ping succeeded), e.g. body indicating database/readiness `up`/`ok`.
- **Validation failures**: n/a.
- **Auth failures**: n/a — public, no token required.
- **Idempotency / edge cases**: when Prisma cannot reach PostgreSQL, returns a non-2xx readiness failure (e.g. `503`) rather than `200` — distinguishes it from `/api/health`.

### `GET /api/notes`
- **Happy path**: valid `user` token → `200` with an array of that user's notes; each item shape `{ id, title, body, done, userId, createdAt, updatedAt }`. Fresh user with no notes → `200` with `[]`.
- **Validation failures**: n/a (no request body).
- **Auth failures**: no token → `401`; malformed/expired token → `401`.
- **Idempotency / edge cases**: **per-user isolation** — notes created by `user` are absent from the list returned to `admin`, and vice versa.

### `POST /api/notes`
- **Happy path**: valid token + `{ title: "First note", body: "hello", done: false }` → `201` (or `200`) with created note echoing fields, `id` assigned, `userId` = caller's id, `done: false`, `createdAt`/`updatedAt` set. Omitting `done` defaults it to `false`.
- **Validation failures**: missing `title` → `400`; missing `body` → `400`; `title` longer than 120 chars → `400`; `done` not a boolean (e.g. `"yes"`) → `400`; unknown/extra properties rejected or stripped per validation pipe.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: `userId` is taken from the JWT `sub`/`id`, NOT from any client-supplied `userId` in the body (attempting to set `userId` to another user must be ignored/rejected).

### `GET /api/notes/:id`
- **Happy path**: owner's valid token + own note id → `200` with the full note.
- **Validation failures**: non-existent id → `404`; non-numeric/malformed id (if ids are numeric) → `400`/`404`.
- **Auth failures**: no token → `401`; **cross-user access** — `admin` requesting a note owned by `user` → `404`/`403` (owner-scoped; must not leak another user's note).
- **Idempotency / edge cases**: repeated GET returns identical payload.

### `PATCH /api/notes/:id`
- **Happy path**: owner + `{ done: true }` → `200`, `done` now `true`, `updatedAt` advanced. Partial update `{ title: "renamed" }` changes only `title`, leaves `body`/`done` intact (PartialType semantics).
- **Validation failures**: `title` > 120 chars → `400`; `done` non-boolean → `400`; empty body `{}` → accepted no-op OR `400` per validation config (assert whichever the DTO enforces, and that no fields change on no-op).
- **Auth failures**: no token → `401`; **cross-user** — `admin` patching `user`'s note → `404`/`403`, and the target note is unchanged afterward.
- **Idempotency / edge cases**: toggling `done` true→false→true persists each time; patching a non-existent id → `404`.

### `DELETE /api/notes/:id`
- **Happy path**: owner + own note id → `200`/`204`; subsequent `GET /api/notes/:id` → `404` and the note is absent from `GET /api/notes`.
- **Validation failures**: non-existent id → `404`.
- **Auth failures**: no token → `401`; **cross-user** — `admin` deleting `user`'s note → `404`/`403`, and the note still exists for `user` afterward.
- **Idempotency / edge cases**: deleting an already-deleted id → `404` (no crash).

---

## UI / journey tests

### Journey: Login
- **Steps**: Navigate to `/login`; assert page renders "FaithfulE" branding; type `admin@faithful-e.test` and the seeded admin password; submit.
- **Expected outcomes**: `POST /api/auth/login` fires against relative `/api`; on success the app navigates away from `/login` (to `/notes` or the default shell route); token + user persisted (localStorage/signals); the frontend `role` is stored uppercased (`ADMIN`) so admin nav/guard works. `data-testid="app-ready"` is present after load.
- **Negative path**: submit wrong password → an inline error is shown, user remains on `/login`, no token persisted, no navigation.

### Journey: Notes list (view / toggle / delete)
- **Steps**: Logged in as `user`, navigate to `/notes`; observe loading state resolve; assert list is populated from `GET /api/notes` (not the removed mock array). Toggle a note's "done" checkbox; then delete a note.
- **Expected outcomes**: List reflects server data. Toggling issues `PATCH /api/notes/:id` and the done state persists across a page reload. Deleting issues `DELETE /api/notes/:id` and the row disappears; reload confirms removal. Empty state renders when the user has zero notes.
- **Negative path**: if `GET /api/notes` returns an error, the component's error state renders (not a blank/"Loading..." stuck screen); a `401` clears the session and redirects to `/login`.

### Journey: Note editor (create / edit / delete)
- **Steps**: From `/notes`, open new-note (`/notes/new`); enter title + body; save. Then open an existing note (`/notes/:id`), edit fields, save. Then remove the note from the editor.
- **Expected outcomes**: New-note save calls `POST /api/notes`; on success navigates back to `/notes` and the new note appears in the list. Opening `/notes/:id` loads via `GET /api/notes/:id` and pre-fills the form. Edit save calls `PATCH /api/notes/:id` and persists. Remove calls `DELETE` and returns to the list without the note.
- **Negative path**: saving with an empty title surfaces a validation/error state and does not persist; server error on save keeps the user on the editor with an error message.

### Journey: Auth guard & session lifecycle
- **Steps**: While logged out, directly navigate to a guarded app route (e.g. `/notes`, `/notes/new`). Then log in, then simulate a `401` (expired token) on a subsequent API call.
- **Expected outcomes**: Unauthenticated access to guarded routes redirects to `/login` (via `authGuard`). After login, the HTTP interceptor attaches the JWT to `/api/*` requests. A `401` response clears the persisted session and redirects back to `/login`.
- **Negative path**: `/login` itself remains reachable while logged out (not redirect-looped); there is no signup screen/link (login-only).

### Journey: Single-container serving & branding
- **Steps**: Run the built Docker image; hit `GET /` and deep-link `GET /notes/new` directly; inspect the served HTML and the running SPA header/tab.
- **Expected outcomes**: Container listens on **8080**. `GET /` serves the Angular `index.html` (`<title>FaithfulE</title>`). Deep link `/notes/new` is served via SPA fallback to `index.html` (not `404`). `/api/*` is excluded from static serving and still routes to the API. Header renders "FaithfulE"; `data-testid="app-ready"` present. No reject signatures in served output: no `"Cannot GET /"`, no permanently stuck `"Loading..."`.
- **Negative path**: `GET /api/does-not-exist` returns a JSON `404` from the API, NOT the SPA `index.html` (confirms `exclude: ['/api/{*path}']`).

---

## Data integrity tests
- After `POST /api/notes`, exactly one `Note` row exists with `userId` = the authenticated caller's id, `done` defaulting to `false` when omitted, and `createdAt`/`updatedAt` populated.
- `Note.userId` is always a valid FK to an existing `User`; deleting/creating notes never orphans rows or attributes a note to a different user than the JWT subject.
- After `PATCH`, `updatedAt` is strictly newer than `createdAt`; unchanged fields retain prior values (partial update does not null-out omitted columns).
- After `DELETE`, the `Note` row is gone and no longer counted in the owner's `GET /api/notes` result.
- Per-user scoping invariant: no API operation lets user A read, modify, or delete user B's notes; the DB never reflects a cross-user mutation.
- Seed invariant: after boot, exactly the two seeded users exist with emails on the `@faithful-e.test` domain and roles `admin`/`user` (lowercase in DB).

## Out of scope
- `/admin` and `/admin/settings` behaviour beyond route existence — spec explicitly keeps admin/settings as a scaffolded mock (no `SystemSetting` model, no settings API). Only assert the route stays intact/non-breaking.
- MinIO / object-storage wiring — spec declares "No third-party external services" and does not wire MinIO; nothing to test (flagged as an open question in tasks.md).
- `demoLogin` path — optional/retained but not part of the required real-auth flow.
- Exact password values and hashing internals — verified indirectly via successful login; `derivePassword` internals are not asserted directly.
- `colossus` `data.flow` flow-graph metadata correctness — platform infra preserved by implementers, not behaviourally testable here (assert only that routes still function).
- Prisma driver-adapter / `DATABASE_URL` provisioning mechanics — an environment/boot concern covered implicitly by the boot + `/api/health/deep` checks, not a standalone functional test.

Wrote .pipeline/test_spec.md (41 cases across 9 endpoints / 5 journeys).
