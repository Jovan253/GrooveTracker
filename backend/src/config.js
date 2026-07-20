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
};
