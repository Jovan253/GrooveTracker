# Tasks

Single source of truth for what's being worked on. Tasks come from the "Task breakdown"
section of plans in `plans/`. Keep this current — the `implementer` agent updates status
as it works.

**Status key:** `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## In progress

_(none)_

## Todo

**Plan 001 — Project scaffolding** (`plans/001-project-scaffolding.md`)

- [ ] 001.3 Backend bootstrap — Express, `config.js` (env), `db.js` (pg Pool), `GET /healthz`.
- [ ] 001.4 Migration runner — `backend/src/migrate.js` + `npm run migrate`.
- [ ] 001.5 Albums API — CRUD routes with validation.
- [ ] 001.6 Backend Dockerfile — runs migrate then starts server.
- [ ] 001.7 Frontend bootstrap — Vite React app, `api.js` from `VITE_API_URL`.
- [ ] 001.8 Frontend UI — album list + add form + delete.
- [ ] 001.9 Frontend Dockerfile — multi-stage build → nginx static serve.
- [ ] 001.10 Compose wiring — db + backend + frontend; verify end-to-end.
- [ ] 001.11 Root README — how to run locally.

## Done

- [x] 001.2 DB migration — `db/migrations/001_create_albums.sql` + `db/seed.sql`. — 2026-07-20
- [x] 001.1 Repo skeleton — dirs, root `docker-compose.yml` shell, `.env.example`, `.dockerignore`s. — 2026-07-20
- [x] Set up AI tooling: `.claude/` (agents, commands, settings), `plans/`, `tasks/` — 2026-07-20

---

### Task format

```
- [ ] NNN.1 Short title — one-line description. (plan: plans/NNN-slug.md)
```

Use the plan number as the prefix so tasks trace back to their plan.
