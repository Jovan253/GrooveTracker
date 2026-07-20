import AlbumCard from './AlbumCard.jsx';

function AlbumList({ albums, onDelete, deletingId }) {
  if (albums.length === 0) {
    return <p className="empty-state">No albums yet — add one below.</p>;
  }

  return (
    <ul className="album-list">
      {albums.map((album) => (
        <AlbumCard
          key={album.id}
          album={album}
          onDelete={onDelete}
          deleting={deletingId === album.id}
        />
      ))}
    </ul>
  );
}

export default AlbumList;
