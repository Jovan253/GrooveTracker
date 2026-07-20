#!/bin/sh
# Container entrypoint: run pending migrations, then start the server —
# but only if migrations succeeded.
#
# `set -e` makes the script exit immediately (non-zero) if `node
# src/migrate.js` fails, so `node src/index.js` is never reached and the
# container exits instead of serving traffic against an unmigrated schema.
#
# The final line uses `exec` to replace this shell process with the node
# process instead of running it as a child. That matters because this
# script is ENTRYPOINT and therefore PID 1 in the container: without `exec`,
# signals like SIGTERM (sent by `docker stop` / a Kubernetes pod
# termination) would hit the shell, not node, and node would only die when
# the shell did — often after a slow, ungraceful timeout kill. With `exec`,
# node itself becomes PID 1 and receives SIGTERM directly, so it can shut
# down cleanly (e.g. Express finishing in-flight requests before exit).
#
# Kubernetes note: this bake-migrate-then-serve script is a convenience for
# docker-compose, which has no init-container concept. In Kubernetes we'll
# run the *same image* with the entrypoint/command overridden per phase
# instead: an initContainer with `command: ["node", "src/migrate.js"]` runs
# to completion first, then the app container runs with
# `command: ["node", "src/index.js"]`, bypassing this script entirely. K8s
# already blocks the app container from starting until every initContainer
# exits 0, so the "migrate must succeed before serving" guarantee this
# script provides via `set -e` is instead provided natively by the
# initContainer ordering there.
set -e

echo "Running database migrations..."
node src/migrate.js

echo "Starting server..."
exec node src/index.js
