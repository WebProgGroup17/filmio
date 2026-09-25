import { Link } from "react-router-dom";

export default function MovieCard({
  id,
  title,
  posterUrl,
  releaseDate,
  genres,
  showYear = false,
}) {
  return (
    <div className="movie-card">
      <Link to={`/movies/${id}`}>
        <div className="movie-poster">
          {posterUrl ? (
            <img src={posterUrl} alt={title} />
          ) : (
            <div className="poster-placeholder" />
          )}
        </div>
      </Link>

      <div className="movie-info">
        <Link to={`/movies/${id}`} className="movie-title">
          {title}
        </Link>

        {showYear && releaseDate && (
          <p className="movie-year">
            Year: {releaseDate.slice(0, 4)}
          </p>
        )}
        {genres?.length > 0 && ( /*protection for empty list */
          <p className="movie-genres">
          {genres.join(", ")}
          </p>
        )}
        
      </div>
    </div>
  );
}