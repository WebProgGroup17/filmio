import { Link } from "react-router-dom";

export default function MovieCard({ id, title, posterUrl }) {
  return (
    <div className="movie-card">
      <Link to={`/movies/${id}`}> 
        <div className="movie-poster">
          {posterUrl ? (<img src={posterUrl} alt={title} />) : (<div className="poster-placeholder" />)}
        </div>
      </Link>
      <Link to={`/movies/${id}`} className="movie-title">{title}</Link>
    </div>
  );
}