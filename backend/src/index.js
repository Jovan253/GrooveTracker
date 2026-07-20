import express from 'express';
import { config } from './config.js';

const app = express();

app.use(express.json());

// Deliberately dependency-light: no DB access here. This backs the
// Kubernetes liveness probe later; a DB-checking /readyz comes separately.
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(config.port, () => {
  console.log(`GrooveTracker backend listening on port ${config.port}`);
});
