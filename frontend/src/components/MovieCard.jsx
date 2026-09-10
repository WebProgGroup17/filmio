export default function MovieCard({ title, posterUrl }) {
  return (
    <div className="movie-card">
      <div className="movie-poster">
        {posterUrl ? (<img src={posterUrl} alt={title} />) : (<div className="poster-placeholder" />)}
      </div>
      <a href="#" className="movie-title">{title}</a>
    </div>
  );
}