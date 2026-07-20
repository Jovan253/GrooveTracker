// All config comes from the environment — no hardcoded values or secrets.
// See backend/.env.example for the variables this reads.

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: requireEnv('DATABASE_URL'),
  // Optional. The one browser origin allowed to call this API cross-origin
  // (see index.js for how it's used). Unset means no CORS headers are
  // sent at all, so same-origin/non-browser callers keep working but the
  // deployer must opt a frontend origin in explicitly — we don't default
  // to '*' behind their back.
  corsOrigin: process.env.CORS_ORIGIN || null,
};
