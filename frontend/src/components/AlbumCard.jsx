// A single album card: cover art (or a placeholder if cover_art_url is
// missing), title/artist/format/year, and a delete button.
function AlbumCard({ album, onDelete, deleting }) {
  return (
    <li className="album-card">
      {album.cover_art_url ? (
        <img
          className="album-cover"
          src={album.cover_art_url}
          alt={`${album.title} cover art`}
          // If the URL is bad, fall back to the placeholder instead of a
          // broken-image icon.
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className="album-cover album-cover-placeholder"
        style={{ display: album.cover_art_url ? 'none' : 'flex' }}
      >
        No cover
      </div>

      <div className="album-info">
        <p className="album-title">{album.title}</p>
        <p className="album-artist">{album.artist}</p>
        <p className="album-meta">
          {album.format === 'cd' ? 'CD' : 'Vinyl'}
          {album.year ? ` · ${album.year}` : ''}
        </p>
      </div>

      <button
        type="button"
        className="album-delete"
        onClick={() => onDelete(album.id)}
        disabled={deleting}
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </li>
  );
}

export default AlbumCard;
