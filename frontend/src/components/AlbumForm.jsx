// Add-album form. Mirrors the backend's required-field rules (title, artist,
// format) for immediate feedback, but the backend stays the source of truth —
// server-side validation errors are surfaced by the caller via onSubmit's
// rejected promise.
import { useState } from 'react';

const EMPTY_FORM = {
  title: '',
  artist: '',
  format: 'vinyl',
  year: '',
  cover_art_url: '',
};

function AlbumForm({ onSubmit, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [clientError, setClientError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setClientError(null);

    if (!form.title.trim() || !form.artist.trim() || !form.format) {
      setClientError('Title, artist, and format are required.');
      return;
    }

    const album = {
      title: form.title.trim(),
      artist: form.artist.trim(),
      format: form.format,
      year: form.year.trim() ? Number(form.year) : null,
      cover_art_url: form.cover_art_url.trim() || null,
    };

    try {
      await onSubmit(album);
      setForm(EMPTY_FORM);
    } catch (err) {
      // Server-side validation / network errors land here (api.js throws an
      // Error carrying the backend's message).
      setClientError(err.message);
    }
  }

  return (
    <form className="album-form" onSubmit={handleSubmit}>
      <h2>Add an album</h2>

      <div className="form-row">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="artist">Artist</label>
        <input
          id="artist"
          name="artist"
          type="text"
          value={form.artist}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="format">Format</label>
        <select id="format" name="format" value={form.format} onChange={handleChange} required>
          <option value="vinyl">Vinyl</option>
          <option value="cd">CD</option>
        </select>
      </div>

      <div className="form-row">
        <label htmlFor="year">Year (optional)</label>
        <input
          id="year"
          name="year"
          type="number"
          value={form.year}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <label htmlFor="cover_art_url">Cover art URL (optional)</label>
        <input
          id="cover_art_url"
          name="cover_art_url"
          type="text"
          value={form.cover_art_url}
          onChange={handleChange}
        />
      </div>

      {clientError && <p className="form-error">{clientError}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Adding…' : 'Add album'}
      </button>
    </form>
  );
}

export default AlbumForm;
