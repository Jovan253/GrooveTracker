// Single-view album collection UI: list + add form + delete, wired to the
// backend via src/api.js. No router, no state library — local component
// state + fetch, per the plan.
import { useEffect, useState } from 'react';
import { listAlbums, createAlbum, deleteAlbum } from './api.js';
import AlbumList from './components/AlbumList.jsx';
import AlbumForm from './components/AlbumForm.jsx';
import './App.css';

function App() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadAlbums();
  }, []);

  async function loadAlbums() {
    setLoading(true);
    setError(null);
    try {
      const data = await listAlbums();
      setAlbums(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Refetch after mutations rather than patching state optimistically —
  // simplest way to stay consistent with the server (e.g. created_at,
  // ordering by artist/year), and this app is small enough that the extra
  // round trip is a non-issue.
  //
  // createAlbum's rejection is left to propagate to the form (it catches and
  // displays it inline, next to the fields the error refers to); the
  // post-create refetch is handled separately so a refresh failure surfaces
  // as a page-level error instead of being misread as a form validation error.
  async function handleAdd(album) {
    setSubmitting(true);
    try {
      await createAlbum(album);
    } finally {
      setSubmitting(false);
    }
    try {
      await loadAlbums();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteAlbum(id);
      await loadAlbums();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>GrooveTracker</h1>
        <p className="subtitle">Your vinyl &amp; CD collection</p>
      </header>

      {error && (
        <p className="app-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="loading">Loading albums…</p>
      ) : (
        <AlbumList albums={albums} onDelete={handleDelete} deletingId={deletingId} />
      )}

      <AlbumForm onSubmit={handleAdd} submitting={submitting} />
    </div>
  );
}

export default App;
