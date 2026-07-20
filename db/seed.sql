-- db/seed.sql
-- Sample albums for local development. Safe to re-run: each insert is guarded by a
-- title+artist existence check, so running this against an already-seeded DB won't
-- create duplicates.

INSERT INTO albums (title, artist, format, year, cover_art_url)
SELECT 'Kind of Blue', 'Miles Davis', 'vinyl', 1959,
       'https://upload.wikimedia.org/wikipedia/en/9/9c/MilesDavisKindofBlue.jpg'
WHERE NOT EXISTS (
  SELECT 1 FROM albums WHERE title = 'Kind of Blue' AND artist = 'Miles Davis'
);

INSERT INTO albums (title, artist, format, year, cover_art_url)
SELECT 'Rumours', 'Fleetwood Mac', 'vinyl', 1977,
       'https://upload.wikimedia.org/wikipedia/en/f/fb/FMacRumours.PNG'
WHERE NOT EXISTS (
  SELECT 1 FROM albums WHERE title = 'Rumours' AND artist = 'Fleetwood Mac'
);

INSERT INTO albums (title, artist, format, year, cover_art_url)
SELECT 'OK Computer', 'Radiohead', 'cd', 1997,
       'https://upload.wikimedia.org/wikipedia/en/2/27/Radioheadokcomputer.png'
WHERE NOT EXISTS (
  SELECT 1 FROM albums WHERE title = 'OK Computer' AND artist = 'Radiohead'
);

INSERT INTO albums (title, artist, format, year, cover_art_url)
SELECT 'Discovery', 'Daft Punk', 'cd', 2001,
       'https://upload.wikimedia.org/wikipedia/en/2/27/Daft_Punk_-_Discovery.png'
WHERE NOT EXISTS (
  SELECT 1 FROM albums WHERE title = 'Discovery' AND artist = 'Daft Punk'
);

INSERT INTO albums (title, artist, format, year, cover_art_url)
SELECT 'To Pimp a Butterfly', 'Kendrick Lamar', 'vinyl', 2015,
       'https://upload.wikimedia.org/wikipedia/en/f/f6/To_Pimp_a_Butterfly.png'
WHERE NOT EXISTS (
  SELECT 1 FROM albums WHERE title = 'To Pimp a Butterfly' AND artist = 'Kendrick Lamar'
);

INSERT INTO albums (title, artist, format, year, cover_art_url)
SELECT 'Blue Train', 'John Coltrane', 'cd', 1957, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM albums WHERE title = 'Blue Train' AND artist = 'John Coltrane'
);
