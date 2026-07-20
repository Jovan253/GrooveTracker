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
