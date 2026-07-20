// Albums CRUD API (see plans/001-project-scaffolding.md, "Backend" section).
// All queries are parameterised — no string-interpolated SQL.

import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const VALID_FORMATS = ['vinyl', 'cd'];

// Shared validation for POST and PUT bodies. Returns an array of human-readable
// error messages; an empty array means the body is valid. title, artist, and
// format are required per the plan; year and cover_art_url are optional but
// type-checked when present.
function validateAlbumInput(body) {
  const errors = [];
  const { title, artist, format, year, cover_art_url } = body ?? {};

  if (typeof title !== 'string' || !title.trim()) {
    errors.push('title is required and must be a non-empty string');
  }
  if (typeof artist !== 'string' || !artist.trim()) {
    errors.push('artist is required and must be a non-empty string');
  }
  if (!VALID_FORMATS.includes(format)) {
    errors.push(`format is required and must be one of: ${VALID_FORMATS.join(', ')}`);
  }
  if (year !== undefined && year !== null && !Number.isInteger(year)) {
    errors.push('year must be an integer when provided');
  }
  if (
    cover_art_url !== undefined &&
    cover_art_url !== null &&
    typeof cover_art_url !== 'string'
  ) {
    errors.push('cover_art_url must be a string when provided');
  }

  return errors;
}

// :id is the SERIAL primary key, so it must be a positive integer. Postgres
// throws a type error on non-numeric input to an integer column — feeding
// that straight to the DB would surface as a confusing 500. We validate it
// ourselves first and return 400 (the request itself is malformed, distinct
// from a well-formed id that simply doesn't match a row, which is a 404).
function parseAlbumId(rawId) {
  // SERIAL ids start at 1, so reject 0 too — matches the "positive integer" message.
  if (!/^[1-9]\d*$/.test(rawId)) {
    return null;
  }
  return parseInt(rawId, 10);
}

// GET /api/albums — list all albums. Ordered by artist then year for a
// stable, browsable default (matches the plan's "filterable/sortable by
// artist, format, and year" without implementing query-param sorting yet).
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM albums ORDER BY artist ASC, year ASC NULLS LAST'
    );
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/albums
router.post('/', async (req, res, next) => {
  const errors = validateAlbumInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  const { title, artist, format, year = null, cover_art_url = null } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO albums (title, artist, format, year, cover_art_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, artist, format, year, cover_art_url]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/albums/:id
router.get('/:id', async (req, res, next) => {
  const id = parseAlbumId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM albums WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'album not found' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/albums/:id
router.put('/:id', async (req, res, next) => {
  const id = parseAlbumId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  const errors = validateAlbumInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  const { title, artist, format, year = null, cover_art_url = null } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE albums
       SET title = $1, artist = $2, format = $3, year = $4, cover_art_url = $5
       WHERE id = $6
       RETURNING *`,
      [title, artist, format, year, cover_art_url, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'album not found' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/albums/:id
router.delete('/:id', async (req, res, next) => {
  const id = parseAlbumId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const { rowCount } = await pool.query('DELETE FROM albums WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'album not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
