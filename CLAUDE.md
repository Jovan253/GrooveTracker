# GrooveTracker

A web app for tracking physical music collections (vinyl records and CDs). Built as a
vehicle for learning Kubernetes, so the infrastructure and deployment story matter as
much as the app itself.

## Tech stack

| Layer      | Choice                                    |
|------------|-------------------------------------------|
| Frontend   | React                                     |
| Backend    | Node.js (REST API)                        |
| Database   | PostgreSQL                                |
| Infra      | Kubernetes (learning target), Docker      |

Intended repo layout once scaffolding begins:

```
frontend/        # React app
backend/         # Node API
db/              # migrations, seed data
k8s/             # Kubernetes manifests (deployments, services, ingress, configmaps)
plans/           # design docs and implementation plans (see plans/README.md)
tasks/           # task tracking (see tasks/TASKS.md)
.claude/         # agents, commands, settings
```

## Learning focus (read this first)

The owner already knows full-stack development. **The point of this project is to learn
the infrastructure and operations side, not the app.** Pace work accordingly:

- **Move fast on app code** (React frontend, Node API, Postgres schema, CRUD). Scaffold it,
  keep it minimal-but-clean, don't belabor it or over-explain it. It exists to give the
  infra something real to run.
- **Slow down and teach on the infra.** When we reach Kubernetes, Prometheus/Grafana,
  CI/CD pipelines, Docker internals, ingress, autoscaling, secrets, or anything
  ops/observability-related: stop, explain the concepts and the *why*, show the trade-offs,
  and walk through what each piece does before and after applying it.

Topics of interest (deep-dive when we hit them): Kubernetes core objects, Helm (v2+),
Prometheus + Grafana, CI/CD (GitHub Actions → build/test/deploy), container/image best
practices, health checks & probes, horizontal autoscaling, secrets/config management,
logging & tracing.

## Product scope (v1)

- Users can add albums they own with: title, artist, format (vinyl/CD), year, cover art.
- Users can view, edit, and delete albums in their collection.
- Collection is filterable/sortable by artist, format, and year.
- Auth is out of scope for the first milestone unless noted in a plan.

## How we work in this repo

This project uses a plan → task → implement → review loop, delegated across agents.

1. **Plan** with the `planner` agent (Opus). Produces a design doc in `plans/`.
2. **Break down** the plan into tasks tracked in `tasks/TASKS.md`.
3. **Implement** with the `implementer` agent (Sonnet), one task at a time.
4. **Review** with the `reviewer` agent before marking a task done.

See `.claude/agents/` for the agent definitions and `.claude/commands/` for slash
commands (`/plan-feature`, `/next-task`).

## Conventions

- Keep the app runnable locally with `docker compose` before worrying about K8s.
- Every Kubernetes manifest lives in `k8s/` and is plain YAML (no Helm until v2).
- Write plans before non-trivial features; keep `tasks/TASKS.md` current.
- Prefer small, reviewable commits scoped to a single task.

## Current status

Greenfield. No application code yet — scaffolding and AI setup in progress.
