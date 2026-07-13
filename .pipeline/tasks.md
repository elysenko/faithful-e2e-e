# Pipeline Task Decomposition

## Summary
FaithfulE is an already-scaffolded NestJS + Angular + Prisma/PostgreSQL notes app. The remaining work completes it: add a backend Notes CRUD module (per-user scoped), wire the Angular UI (auth + notes) to the real API, standardize routes/port (global prefix `/api`, port 8080), align health and auth endpoints, correct seed emails to the `@faithful-e.test` domain, remove public registration (login-only), and package everything as a single multi-stage container where NestJS serves the Angular SPA and the API on port 8080. Auth model is full_auth with seeded users only (`admin`/`user`).

## Surface contract
Backend routes (global prefix `/api`, all `/api/notes*` behind JWT `@Auth()` guard; owner = JWT `sub`/`id`):
- `POST /api/auth/login` (public) — returns `{ user: {id,email,role}, token }`
- `POST /api/auth/refresh-token` — keep existing
- (removed) `POST /api/auth/register` — public register deleted (login-only)
- `GET /api/health` (public, `@Get()`) — liveness → 200
- `GET /api/health/deep` (public, `@Get('deep')`) — readiness, Prisma ping → DB-ok JSON
- `GET /api/notes` — list current user's notes
- `POST /api/notes` — create note
- `GET /api/notes/:id` — fetch one (owner-scoped)
- `PATCH /api/notes/:id` — update / toggle done
- `DELETE /api/notes/:id` — delete
- Static: NestJS `ServeStaticModule` serves Angular build from `client/`, `exclude: ['/api/{*path}']`, SPA deep-link fallback to `index.html`.

Angular routes/screens (existing shell, guarded by `authGuard`):
- `/login` — real login (public)
- `/notes` — notes list (list/toggle/delete via API)
- `/notes/new` and `/notes/:id` — note editor (create/get/update/delete via API)
- `/admin`, `/admin/settings` — existing scaffolded admin (left intact, see Open questions)

Entities:
- `User` (existing) — `id`, `email`, `role` (Prisma `Role` lowercase `admin|user`), `notes Note[]`
- `Note` — `id`, `title`, `body`, `done` (default false), `userId` FK→User, `createdAt`, `updatedAt`

Seed credentials: `admin@faithful-e.test`, `user@faithful-e.test` (deterministic `derivePassword`, `SEED_CRED <role> <email> <password>` print preserved).

## db_agent tasks
- [ ] In `backend/prisma/schema.prisma`, add `Note` model with fields `id`, `title String`, `body String`, `done Boolean @default(false)`, `userId` FK→`User`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
- [ ] Add back-relation `notes Note[]` on the existing `User` model.
- [ ] Ensure the existing `User` model has a `role` field using the Prisma `Role` enum (backend stays lowercase `admin|user`, full_auth model) — verify enum values `admin` and `user` exist; do not change casing (frontend bridges it).
- [ ] Generate the initial migration `backend/prisma/migrations/<ts>_init/migration.sql` covering **both** `User` and `Note` so `prisma migrate deploy` works on a fresh DB (migrations dir is currently empty).
- [ ] Run `prisma generate` (output `src/generated/prisma`) so the client includes the `Note` model.

## backend_agent tasks
- [ ] Create `backend/src/notes/notes.service.ts` — Prisma CRUD (list/get/create/update/delete) scoped by `userId`; get/update/delete must reject notes not owned by the current user.
- [ ] Create `backend/src/notes/notes.controller.ts` under `@Controller('notes')`, decorated `@Auth()`, using `@GetUser()` for the current user; routes `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`.
- [ ] Create `backend/src/notes/dto/create-note.dto.ts` (class-validator: `title` required maxLength 120, `body` required, `done` boolean) and `update-note.dto.ts` using `PartialType(CreateNoteDto)`.
- [ ] Create `backend/src/notes/notes.module.ts` and register `NotesModule` in `backend/src/app.module.ts`.
- [ ] In `backend/src/main.ts`, change global prefix from `api/v1` to `api`, listen on `process.env.PORT ?? 8080`, keep helmet + validation pipe.
- [ ] In `backend/src/health/health.controller.ts`, expose liveness at `/api/health` (`@Get()`) and readiness at `/api/health/deep` (`@Get('deep')`, Prisma ping); keep `@Public()`.
- [ ] In `backend/src/auth/auth.controller.ts`, remove the public `register` endpoint; keep `login` and `refresh-token` (login-only per ATLAS full_auth-with-seeded-users rule).
- [ ] In `backend/src/app.module.ts`, import `ServeStaticModule.forRoot({ rootPath: <client>, exclude: ['/api/{*path}'] })` to serve the Angular build with SPA fallback.
- [ ] Add `@nestjs/serve-static` to `backend/package.json` dependencies.
- [ ] In `backend/prisma/seed/seed.ts`, set `SEED_USERS` emails to `admin@faithful-e.test` / `user@faithful-e.test`; keep deterministic `derivePassword` and unchanged `SEED_CRED <role> <email> <password>` print format; rebuild `seed.js`.

## ui_agent tasks
- [ ] Set `apiUrl: '/api'` in `web/frontend/src/environments/environment.ts` and `environment.prod.ts` (relative, same-origin + ingress-safe).
- [ ] In `web/frontend/src/app/features/notes/notes-list.component.ts`, remove the mock array; render list from `NotesService` state; preserve existing signals and loading/empty/error states plus routes and `data.flow` flow-meta.
- [ ] In `web/frontend/src/app/features/notes/note-editor.component.ts`, wire create/edit/delete UI to `NotesService` (load on `:id`, save for new/edit, remove); preserve existing signals, loading/error states, and flow-meta.
- [ ] Verify branding is intact (no change expected): login page and header render "FaithfulE", `index.html` `<title>` is "FaithfulE", and `data-testid="app-ready"` present.
- [ ] Leave `/login` as the sole public auth screen (full_auth, seeded users only — no signup screen); confirm `authGuard` on the shell redirects unauthenticated app routes to `/login`.

## service_agent tasks
- [ ] Create `web/frontend/src/app/core/services/notes.service.ts` — typed CRUD (list/get/create/update/delete/toggle) against `environment.apiUrl + '/notes'`.
- [ ] In `web/frontend/src/app/core/services/auth.service.ts`, replace mock `login()` with real `POST /api/auth/login`; map response `{ user:{id,email,role}, token }`; normalize `role` to uppercase (`ADMIN`/`USER`) to match frontend `UserRole`; persist `{token,user}` to signals/localStorage; keep `demoLogin` optional.
- [ ] Ensure the existing HTTP interceptor attaches the JWT token to `/api/*` requests and clears the session on 401 (verify against `apiUrl:'/api'`).

## tester tasks
- [ ] Boot check: `prisma migrate deploy` + seed prints two `SEED_CRED ... @faithful-e.test` lines.
- [ ] Health: `GET /api/health` → 200; `GET /api/health/deep` → DB-ok JSON.
- [ ] Auth: `POST /api/auth/login` with a seeded credential returns `{user,token}`; wrong creds → 400/401; confirm `/api/auth/register` no longer exists.
- [ ] Notes CRUD via UI: create → appears in list; edit and toggle-done persist; delete removes; notes isolated per user (login as user vs admin).
- [ ] Auth flow: unauthenticated access to app routes redirects to `/login`; token attached by interceptor; 401 clears session.
- [ ] Container: Docker image runs on 8080; SPA deep link (`/notes/new`) served via fallback; header + tab title show "FaithfulE"; `data-testid="app-ready"` present; no reject signatures ("Cannot GET /", "Loading...").

## Open questions
- **Dockerfile ownership:** Step 8 replaces the repo-root `Dockerfile` with a multi-stage single image (build Angular → build backend → node:22-alpine runtime, `ENV PORT=8080`, `EXPOSE 8080`, `ENTRYPOINT ["./docker-entrypoint.sh"]`, Angular build copied into the ServeStatic `client/` path). No pipeline agent above owns infra/packaging — confirm which agent (or a dedicated build/infra step) produces this.
- **spec_deployments vs spec scope:** provisioned backing services are `postgresql, minio`, and the settings rules would normally add a `SystemSetting` model + `/api/admin/settings` endpoints + settings UI. The spec explicitly states `admin/settings` "remains scaffolded mock (outside spec scope)" and declares "No third-party external services," and does not wire MinIO anywhere. Tasks above follow the spec (no SystemSetting model, settings left as mock). Confirm whether MinIO/admin-settings wiring is genuinely out of scope or was dropped in error.
- **Prisma v7 driver-adapter:** `@prisma/adapter-pg` reads the DB URL via adapter — ensure `DATABASE_URL` is present for the CLI `migrate deploy` at boot (entrypoint: migrate → seed → `node dist/main`).
- **Angular output path:** confirm `angular.json` outputPath is `dist/frontend` (flat) so the Dockerfile copies the correct directory into ServeStatic `client/`.
