# GrooveTracker

GrooveTracker is a small web app for tracking a physical music collection — vinyl
records and CDs. Add an album with its title, artist, format, and year; list, edit, and
delete what you own.

It's also a vehicle for learning Kubernetes and the surrounding infra/ops stack (see
`CLAUDE.md`), so the app itself is deliberately minimal — the interesting work is in
how it's built, containerized, and (eventually) deployed and operated.

## Tech stack

| Layer      | Choice                                          |
|------------|--------------------------------------------------|
| Frontend   | React + Vite, served by nginx in production/containers |
| Backend    | Node.js + Express (REST API)                    |
| Database   | PostgreSQL                                      |
| Local dev  | Docker Compose                                  |
| Infra      | Kubernetes (learning target, not built yet)     |

## Prerequisites

- Docker with Docker Compose v2 (`docker compose ...`, not the standalone `docker-compose`)
- Node.js (only needed if you want to run the frontend or backend outside containers)

## Quick start (Docker Compose)

1. Copy the root env file and review it:

   ```sh
   cp .env.example .env
   ```

   The defaults in `.env.example` work out of the box for local dev. They're throwaway
   dev credentials (`POSTGRES_PASSWORD=changeme`, etc.) — fine for your laptop, don't
   reuse them anywhere real.

2. Build and start everything:

   ```sh
   docker compose up --build
   ```

   This brings up three services:

   | Service  | URL                          | Notes                                   |
   |----------|-------------------------------|------------------------------------------|
   | frontend | http://localhost:5173         | nginx serving the built React app (`FRONTEND_PORT`) |
   | backend  | http://localhost:3000         | Express API (`BACKEND_PORT`)             |
   | db       | localhost:5432                | Postgres, not usually accessed directly (`POSTGRES_PORT`) |

   Ports above are the `.env.example` defaults; they're configurable via the env vars
   in parentheses. The backend runs its migrations automatically on startup (see
   `backend/docker-entrypoint.sh`), so the `albums` table exists as soon as the
   container reports healthy — no manual step needed for schema.

3. Check the backend is up:

   ```sh
   curl http://localhost:3000/healthz
   # {"status":"ok"}
   ```

4. (Optional) Seed some sample albums. Unlike migrations, seeding is **not** run
   automatically — it's a manual dev convenience, not part of the schema, so it won't
   silently reseed data on every container start:

   ```sh
   docker compose exec backend npm run seed
   ```

5. Open http://localhost:5173, add an album via the form, see it appear in the list,
   and delete it. That's the whole app.

To stop everything: `docker compose down` (add `-v` to also drop the `db_data` volume
and lose all data).

## API

All endpoints are JSON. Base path for albums is `/api/albums`.

| Method | Path              | Body                                              | Returns             |
|--------|-------------------|----------------------------------------------------|----------------------|
| GET    | `/healthz`        | —                                                    | `200 {"status":"ok"}` |
| GET    | `/api/albums`     | —                                                    | `200 [album, ...]`    |
| POST   | `/api/albums`     | `{title, artist, format, year?, cover_art_url?}`     | `201 album` / `400`   |
| GET    | `/api/albums/:id` | —                                                    | `200 album` / `400` / `404` |
| PUT    | `/api/albums/:id` | `{title, artist, format, year?, cover_art_url?}`     | `200 album` / `400` / `404` |
| DELETE | `/api/albums/:id` | —                                                    | `204` / `400` / `404`       |

`title`, `artist`, and `format` are required; `format` must be `vinyl` or `cd`. `year`
and `cover_art_url` are optional. Invalid input returns `400 {"error": "..."}` — this
includes a non-numeric or non-positive `:id`, which is rejected as `400` before it
reaches the database.

## Configuration

**Root `.env`** (consumed by `docker-compose.yml`):

| Var                 | Purpose                                      |
|----------------------|------------------------------------------------|
| `POSTGRES_USER`      | Postgres user (also used to build `DATABASE_URL`) |
| `POSTGRES_PASSWORD`  | Postgres password                              |
| `POSTGRES_DB`        | Postgres database name                         |
| `POSTGRES_PORT`      | Host port mapped to the db container's 5432    |
| `BACKEND_PORT`       | Host port mapped to the backend's 3000         |
| `FRONTEND_PORT`      | Host port mapped to nginx's 80 in the frontend container |

**Backend** (`backend/.env.example`, only used when running the backend outside
Compose — inside Compose these come from `docker-compose.yml`):

- `PORT` — port Express listens on (default 3000)
- `DATABASE_URL` — Postgres connection string
- `CORS_ORIGIN` — optional; the one browser origin allowed to call this API (e.g.
  `http://localhost:5173`). Needed for the frontend to be able to call the backend
  from a browser; not needed for curl/Postman, which don't enforce CORS.

**Frontend** (`frontend/.env.example`):

- `VITE_API_URL` — the backend's URL as seen by the browser.

  **Gotcha:** Vite bakes `VITE_API_URL` into the static JS bundle at *build* time, not
  read at container runtime. In `docker-compose.yml` it's passed as a Docker build
  arg, not a runtime `environment:` var. That means changing it requires rebuilding
  the frontend image (`docker compose up --build frontend`) — restarting the
  container alone won't pick up a new value. This is different from the backend,
  where env vars are read fresh at process start.

## Running outside Docker (optional)

Useful for faster iteration on one service at a time. You still need a reachable
Postgres (e.g. leave `docker compose up db` running).

**Backend:**

```sh
cd backend
npm install
npm run migrate   # applies db/migrations/*.sql, needs DATABASE_URL
npm run dev        # starts the API with --watch
```

Set `DATABASE_URL` (and optionally `CORS_ORIGIN` if you're also running the frontend
outside Docker) via `backend/.env` — see `backend/.env.example`.

**Frontend:**

```sh
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` via `frontend/.env` — see `frontend/.env.example`.

## Project layout

```
frontend/        # React app (Vite), Dockerfile, nginx.conf
backend/          # Node/Express API, Dockerfile, migration runner
db/                # migrations/ (schema) and seed.sql (sample data)
k8s/               # Kubernetes manifests — not started yet, upcoming work
plans/             # design docs (see plans/001-project-scaffolding.md for this stack)
tasks/             # task tracking (tasks/TASKS.md)
docker-compose.yml
.env.example
```

## Project status

The local Docker Compose stack (frontend, backend, db, CRUD, health checks) is done
and verified end-to-end — see `plans/001-project-scaffolding.md`. Kubernetes,
observability (Prometheus/Grafana), and CI/CD are the next milestones; that
infrastructure work is the actual point of this project (see `CLAUDE.md`).
