# Architecture

## Requested stacks
- `backend` — NestJS 11 + Prisma 7 + PostgreSQL + JWT auth
- `web` — Angular 19 SPA

## Scaffolding status
| Platform | Status | Location |
|---|---|---|
| backend | ✅ newly scaffolded | `backend/` |
| web (Angular frontend) | ✅ newly scaffolded | `web/frontend/` |

## Directory layout
```
/
├── backend/              # NestJS API (port 8080)
│   ├── src/
│   │   ├── auth/         # JWT login (POST /api/auth/login)
│   │   ├── health/       # GET /api/health, GET /api/health/deep
│   │   ├── notes/        # CRUD notes (to be implemented)
│   │   └── user/         # User management
│   ├── prisma/           # schema.prisma + migrations + seed
│   ├── docker-entrypoint.sh
│   └── package.json
├── web/
│   └── frontend/         # Angular 19 SPA
│       ├── src/app/
│       │   ├── core/services/   # auth.service.ts, notes.service.ts
│       │   ├── features/notes/  # notes-list, note-editor components
│       │   └── features/auth/   # login component
│       └── angular.json
├── colossus.yaml         # Build manifest for deploy agents
├── ATLAS_STACK.md        # Stack rules for all agents
└── Dockerfile            # Multi-stage single-container build (to be implemented per plan)
```

## Template sources
- `backend/` ← `/app/scaffold-templates/template-backend/`
- `web/` ← `/app/scaffold-templates/template-web/`

## Next steps for developers
1. **Edit `.env`** — Set `DATABASE_URL` and `JWT_SECRET` in `backend/` (no `.env.template` found; create from `backend/docker-compose.yml` defaults)
2. **Add Note model** — Add `Note` model to `backend/prisma/schema.prisma`; generate migration with `cd backend && npx prisma migrate dev --name init`
3. **Run database** — `cd backend && docker-compose up -d` (requires Docker)
4. **Seed** — `cd backend && npx prisma db seed` (prints SEED_CRED lines for admin@faithful-e.test + user@faithful-e.test)
5. **Build Angular** — `cd web/frontend && npm install && npm run build`
6. **Run backend** — `cd backend && pnpm install && pnpm build && node dist/main`
7. **Docker image** — `docker build -f Dockerfile .` (replace root Dockerfile with multi-stage build per plan Step 8)

## Serving model
Single container: NestJS serves the Angular build via `ServeStaticModule` from `client/` on PORT 8080.
- `GET /api/*` → NestJS handlers
- Everything else → Angular `index.html` (SPA fallback)
