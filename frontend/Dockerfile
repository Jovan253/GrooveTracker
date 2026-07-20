# syntax=docker/dockerfile:1
#
# Build context is ./frontend (see docker-compose.yml `build: {context: ./frontend}`).
# Unlike backend/Dockerfile, the frontend build needs nothing outside this
# directory — Vite bundles frontend/src into static files, there's no
# repo-root db/ dependency — so a plain `./frontend` context (and the
# ordinary root-relative frontend/.dockerignore) is fine here.

# ---------------------------------------------------------------------------
# Stage 1: build the static bundle
# ---------------------------------------------------------------------------
FROM node:20.18.0-alpine3.20 AS build

# Same pin as backend/Dockerfile, for the same reasons (small image, no
# native-addon/glibc need, reproducible builds — see that file's comment).
WORKDIR /app

# --- VITE_API_URL: baked in at BUILD time, not runtime -----------------
#
# Vite replaces `import.meta.env.VITE_API_URL` with a literal string
# wherever it appears in the source, *while `vite build` runs* (it reads
# VITE_-prefixed vars from `process.env` / `.env` files at that moment).
# The output in dist/ is plain static JS with that value already inlined —
# there is no code left at runtime that reads an environment variable.
#
# That means, unlike the Node backend, setting `environment: VITE_API_URL=...`
# on a *running* container (e.g. in docker-compose) does nothing: the bundle
# was already built before the container ever started. The value has to be
# supplied as a Docker build ARG instead, and promoted to ENV so the `vite
# build` process below can see it.
#
# Trade-off: the backend URL is now frozen into this image at build time.
# The same image can't be repointed at a different backend (e.g. staging vs.
# prod) without rebuilding — there's no "run this image, just pass a
# different env var" escape hatch. That's acceptable for docker-compose
# (one image, one backend, rebuilt locally whenever needed) but will matter
# once we're promoting a single built image across Kubernetes environments.
# Two common fixes there, neither implemented here: (a) rebuild per
# environment, passing a different --build-arg VITE_API_URL in CI for each
# target, or (b) don't bake it in at all — serve a small runtime-generated
# config.js (or an nginx-templated file, populated from real container env
# via envsubst at container start) that the page fetches alongside
# index.html, and read the API URL from that instead of import.meta.env.
# Revisit when we get to the Kubernetes plan.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Manifests first so `npm ci` is cached unless dependencies actually change,
# independent of application source edits.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: serve the bundle with nginx
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS serve

# Only the build stage's dist/ output crosses into this image — no
# node_modules, no source, no npm/node runtime at all. The final image is
# just nginx + static files.
COPY --from=build /app/dist /usr/share/nginx/html

# SPA-friendly config: serve files as-is, and fall back to index.html for
# paths that don't match a real file/directory, so client-side routing
# (whenever we add a router) doesn't 404 on refresh or a direct link. We
# have no router yet, so this is currently a no-op beyond the default
# `index index.html`, but it's cheap and standard, and saves a revisit
# later.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# No custom entrypoint/signal handling needed here, unlike backend/Dockerfile.
# The stock nginx:alpine image's own ENTRYPOINT already execs
# `nginx -g "daemon off;"` as PID 1, and nginx's master process natively
# handles SIGTERM/SIGQUIT (graceful) — there's no shell wrapper swallowing
# signals the way there would be without backend's `exec` in
# docker-entrypoint.sh. So we just accept the base image's ENTRYPOINT/CMD.
