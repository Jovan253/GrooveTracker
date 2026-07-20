# syntax=docker/dockerfile:1
#
# Build context is the REPO ROOT, not backend/ — see docker-compose.yml
# (`build: {context: ., dockerfile: backend/Dockerfile}`). That's required
# so this Dockerfile can COPY the repo-root db/ directory (migrations) into
# the image: backend/src/migrate.js resolves migrations at
# `path.resolve(__dirname, '../../db/migrations')`, which is *outside*
# backend/ and therefore invisible to a `docker build ./backend`.
#
# Rather than change that resolution logic (and diverge local vs. containerized
# behavior) or reach for a compose bind-mount (which only works because
# compose runs on a host with the repo checked out — there's no host to
# mount from in Kubernetes), we widen the build context and reproduce the
# repo's relative layout inside the image: /app/backend + /app/db, mirroring
# backend/ + db/ at the repo root. migrate.js's relative path resolution
# then works unmodified, and the resulting image is self-contained — it
# carries its own migrations and needs nothing bind-mounted at runtime,
# which is exactly the shape we need later for a Kubernetes initContainer/Job
# built `FROM` this same image. Trade-off accepted: the backend build now
# depends on repo-root context (and backend/Dockerfile.dockerignore trims
# that context back down — see that file), rather than being buildable from
# `./backend` in isolation.

FROM node:20.18.0-alpine3.20

# Alpine keeps the base small (~50MB vs. ~180MB+ for the Debian-based
# node:20 image) and we have no native addons here that would need glibc,
# so there's no downside for this app. Pinning the exact Node version *and*
# Alpine release (not just `node:20-alpine`) makes builds reproducible —
# `node:20-alpine` is a moving target that can pick up a new Node patch or a
# new Alpine base (and its libc/openssl) on any rebuild.
ENV NODE_ENV=production

# The official image already ships a non-root `node` user/group (uid/gid
# 1000) — reuse it instead of running as root or inventing a new one.
# Pre-create and hand over both directories the app needs (its own code,
# plus the copied-in db/ migrations) before switching users, so every
# instruction below — including `npm ci` — runs unprivileged.
RUN mkdir -p /app/backend /app/db && chown -R node:node /app
WORKDIR /app/backend
USER node

# Manifests first so `npm ci` is cached unless dependencies actually change,
# independent of application source edits.
COPY --chown=node:node backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node backend/src ./src
COPY --chown=node:node --chmod=755 backend/docker-entrypoint.sh ./
COPY --chown=node:node db /app/db

EXPOSE 3000

# Exec form (JSON array): docker runs this binary directly as PID 1 rather
# than wrapping it in `/bin/sh -c "..."`, so PID 1 is our entrypoint script
# from the start. The script itself `exec`s into `node` for the same reason
# — see docker-entrypoint.sh for the full signal-handling rationale.
ENTRYPOINT ["/app/backend/docker-entrypoint.sh"]
