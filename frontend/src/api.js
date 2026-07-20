// Fetch client for the backend albums API (see plans/001-project-scaffolding.md,
// "Backend" section, for the endpoint table).
//
// Base URL comes from VITE_API_URL, which Vite inlines at build time from the
// environment. For local dev outside docker compose, copy frontend/.env.example
// to frontend/.env (`npm run dev` picks it up automatically). Inside the
// container (001.9), it's supplied as a build-arg baked into the static build,
// since Vite env vars aren't readable at runtime once the app is just static
// files served by nginx.
// Strip any trailing slash so `${BASE_URL}/api/albums` never doubles up.
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

if (!BASE_URL) {
  // Better a loud console warning at startup than a confusing "undefined/api/..."
  // network error on the first request.
  console.warn('VITE_API_URL is not set — backend API requests will fail.');
}

// Shared request helper. Throws an Error carrying the server's message (from
// the backend's `{ error: "..." }` body — see backend/src/routes/albums.js)
// on non-2xx responses, so callers can catch() and show it directly.
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // DELETE returns 204 No Content — no body to parse.
  if (res.status === 204) {
    return null;
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(body?.error || `Request failed with status ${res.status}`);
  }

  return body;
}

export function listAlbums() {
  return request('/api/albums');
}

export function getAlbum(id) {
  return request(`/api/albums/${id}`);
}

export function createAlbum(album) {
  return request('/api/albums', {
    method: 'POST',
    body: JSON.stringify(album),
  });
}

export function updateAlbum(id, album) {
  return request(`/api/albums/${id}`, {
    method: 'PUT',
    body: JSON.stringify(album),
  });
}

export function deleteAlbum(id) {
  return request(`/api/albums/${id}`, { method: 'DELETE' });
}
