import express from 'express';
import { config } from './config.js';
import { pool } from './db.js';
import albumsRouter from './routes/albums.js';

const app = express();

// CORS: browsers enforce same-origin by default, and the frontend is
// served from a different origin than this API (different port at minimum
// — e.g. http://localhost:5173 vs http://localhost:3000 in docker
// compose). That makes every fetch() the app makes into this API
// cross-origin; without an Access-Control-Allow-Origin response header the
// browser discards the response before app code ever sees it (curl/tools
// like Postman still "work" since only browsers enforce CORS — that's why
// this is easy to miss when testing with curl alone). We only send these
// headers when CORS_ORIGIN is configured (see config.js), and only echo
// back that one configured origin rather than '*', so this stays opt-in
// and scoped to a known frontend rather than open to any site.
if (config.corsOrigin) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Preflight: browsers send an OPTIONS request ahead of "non-simple"
    // requests (here, anything with a JSON Content-Type) to ask permission
    // before sending the real one. It carries no body for us to handle, so
    // we answer it directly instead of passing it into the route table.
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });
}

app.use(express.json());

// Deliberately dependency-light: no DB access here. This backs the
// Kubernetes liveness probe later; a DB-checking /readyz comes separately.
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/albums', albumsRouter);

// Centralised error handler. Route handlers forward errors here via next(err)
// (see routes/albums.js) instead of letting a rejected promise crash the
// process or hang the request. express.json() also forwards malformed-JSON
// parse errors here with a 400 status already set — we honor that if
// present, otherwise treat it as an unexpected server error.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status && err.status < 500 ? err.status : 500;
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json({ error: status === 500 ? 'internal server error' : err.message });
});

const server = app.listen(config.port, () => {
  console.log(`GrooveTracker backend listening on port ${config.port}`);
});

// In the container this process runs as PID 1 (see backend/Dockerfile —
// the entrypoint script `exec`s into `node src/index.js`). Linux only
// applies a signal's *default* disposition (e.g. "terminate" for SIGTERM)
// to PID 1 if the process has registered a handler for it; with none
// registered, PID 1 simply ignores the signal. Without this, `docker stop`
// (and later, a Kubernetes pod deletion, which sends SIGTERM before
// SIGKILL) would do nothing until the grace period expires and SIGKILL
// forces an unclean exit. Handling it explicitly lets in-flight requests
// finish and the pg pool close before we exit.
// How long to wait for in-flight requests to drain before forcing exit. Must
// stay under the orchestrator's grace period (docker stop's ~10s, Kubernetes'
// terminationGracePeriodSeconds default 30s) so we exit cleanly on our own
// terms rather than being SIGKILLed mid-shutdown.
const SHUTDOWN_TIMEOUT_MS = 8000;

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return; // ignore a second signal while already draining
  shuttingDown = true;
  console.log(`${signal} received, shutting down...`);

  // If server.close()'s callback never fires (e.g. a hung request keeps a
  // connection open), don't hang forever — force a non-zero exit.
  const forceExit = setTimeout(() => {
    console.error('Shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close(async (err) => {
    clearTimeout(forceExit);
    if (err) console.error('Error closing server:', err);
    let poolFailed = false;
    try {
      await pool.end();
    } catch (poolErr) {
      poolFailed = true;
      console.error('Error closing db pool:', poolErr);
    }
    process.exit(err || poolFailed ? 1 : 0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
