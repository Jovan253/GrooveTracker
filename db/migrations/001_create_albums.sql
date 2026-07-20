-- db/migrations/001_create_albums.sql
CREATE TABLE IF NOT EXISTS albums (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  artist       TEXT NOT NULL,
  format       TEXT NOT NULL CHECK (format IN ('vinyl', 'cd')),
  year         INTEGER,
  cover_art_url TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
