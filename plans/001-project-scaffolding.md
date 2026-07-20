# 001 — Project scaffolding (local dev foundation)

- **Status:** complete — all tasks done, verified end-to-end (2026-07-20)
- **Author:** Opus (planner role — custom agent pending session reload)
- **Date:** 2026-07-20

## Goal

Stand up a minimal but real GrooveTracker app — React frontend, Node API, Postgres —
runnable locally with `docker compose up`. This is the substrate the Kubernetes,
observability, and CI/CD work will run on. Keep the app lean; invest the care in making it
**container- and K8s-ready** (Dockerfiles, health endpoint, env-only config).

## Context

Greenfield repo. No app code yet. Per `CLAUDE.md` "Learning focus", the app is a means to
an end — the infra is the point. So we build the smallest thing that gives us three real
services to containerize and orchestrate later.

## Design

### Layout

```
frontend/          # React (Vite)
  src/
    App.jsx
    api.js         # fetch client, base URL from env
    components/
  Dockerfile
  .dockerignore
  .env.example     # VITE_API_URL
backend/
  src/
    index.js       # Express bootstrap, starts server
    config.js      # reads env, no hardcoded values
    db.js          # pg Pool
    migrate.js     # applies db/migrations/*.sql on demand
    routes/albums.js
  Dockerfile
  .dockerignore
  .env.example     # PORT, DATABASE_URL
db/
  migrations/
    001_create_albums.sql
  seed.sql         # a few sample albums (optional)
docker-compose.yml
.env.example       # top-level compose vars (POSTGRES_*)
README.md
```

### Database (`db/`)

Single table. Migration is plain SQL applied by a tiny runner (portable to K8s — no reliance
on the postgres image's init-scripts, which only run on first boot and won't survive the way
we'll deploy later).

```sql
-- db/migrations/001_create_albums.sql
CREATE TABLE IF NOT EXISTS albums (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  artist       TEXT NOT NULL,
  format       TEXT NOT NULL CHECK (format IN ('vinyl', 'cd')),
  year         INTEGER,
  cover_art_url TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`backend/src/migrate.js`: connects with `DATABASE_URL`, reads `db/migrations/*.sql` in
sorted order, tracks applied files in a `schema_migrations` table, applies the rest. Run via
`npm run migrate`. (Simple hand-rolled runner — we can swap for `node-pg-migrate` later if we
want; not worth the dependency yet.)

### Backend (`backend/`) — Node + Express + `pg`

Config comes entirely from env (`backend/src/config.js`): `PORT` (default 3000),
`DATABASE_URL`. No secrets in code.

API shape (JSON):

| Method | Path                | Body / notes                        | Returns              |
|--------|---------------------|-------------------------------------|----------------------|
| GET    | `/healthz`          | —                                   | `200 {status:"ok"}`  |
| GET    | `/api/albums`       | —                                   | `200 [album, ...]`   |
| POST   | `/api/albums`       | `{title, artist, format, year?, cover_art_url?}` | `201 album` |
| GET    | `/api/albums/:id`   | —                                   | `200 album` / `404`  |
| PUT    | `/api/albums/:id`   | same fields as POST                 | `200 album` / `404`  |
| DELETE | `/api/albums/:id`   | —                                   | `204` / `404`        |

`/healthz` is deliberately dependency-light (just returns ok) so it can back a Kubernetes
**liveness** probe later; we'll add a `/readyz` that checks the DB when we get to probes.
Validation: `title`, `artist`, `format` required; `format ∈ {vinyl, cd}`; return `400` with a
message otherwise.

### Frontend (`frontend/`) — React + Vite

Minimal single view: a list of albums (card/table) with a delete button per row, and a small
form to add one. API base URL from `VITE_API_URL` (env). No router, no state library — local
component state + fetch is enough. Plain CSS.

### Infra (this plan)

- **Dockerfiles** for frontend (multi-stage: build → static serve) and backend (node
  runtime). Postgres uses the official `postgres:16` image.
- **`docker-compose.yml`** wires `db` (with a named volume), `backend` (depends_on db,
  runs migrate then starts), and `frontend`. All connection info via env from a root `.env`
  (with `.env.example` committed). This compose file is throwaway relative to K8s, but it
  proves the services talk to each other and gives us a fast local loop.

Kubernetes manifests, Prometheus, and CI/CD are **out of scope for 001** — they get their
own plans (002+), where we'll slow down and go deep.

## Open questions / trade-offs

- **Frontend serving in the container:** multi-stage build to static files served by
  `nginx`, vs. `vite preview`. Leaning `nginx` (closer to production, and gives us an ingress
  target to reason about later). Flag if you'd rather keep it pure-Node.
- **Migration runner:** hand-rolled vs. `node-pg-migrate`. Going hand-rolled for zero deps
  and transparency; revisit if migrations get complex.

## Out of scope

Auth, pagination/filtering, cover-art uploads (URL only for now), tests beyond a smoke check,
and all Kubernetes/observability/CI-CD work (later plans).

## Task breakdown

- [x] 001.1 — Repo skeleton: create `frontend/ backend/ db/` dirs, root `docker-compose.yml` shell, root `.env.example`, `.dockerignore`s.
- [x] 001.2 — DB migration: `db/migrations/001_create_albums.sql` + optional `db/seed.sql`.
- [x] 001.3 — Backend bootstrap: `package.json`, Express server, `config.js` (env), `db.js` (pg Pool), `GET /healthz`.
- [x] 001.4 — Migration runner: `backend/src/migrate.js` + `npm run migrate` with a `schema_migrations` table.
- [x] 001.5 — Albums API: `routes/albums.js` implementing the CRUD table above with validation.
- [x] 001.6 — Backend Dockerfile + `.dockerignore`; container runs migrate then starts server.
- [x] 001.7 — Frontend bootstrap: Vite React app, `api.js` reading `VITE_API_URL`.
- [x] 001.8 — Frontend UI: album list + add form + delete, wired to the API.
- [x] 001.9 — Frontend Dockerfile (multi-stage build → nginx static serve) + `.dockerignore`.
- [x] 001.10 — `docker-compose.yml`: db + backend + frontend wired via env; verify end-to-end (`docker compose up`, add/list/delete an album).
- [x] 001.11 — Root `README.md`: how to run locally.
