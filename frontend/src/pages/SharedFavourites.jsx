import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getSharedFavourites } from "../api/favourites";
import Header from "../components/Header";

export default function SharedFavourites() {
  const { shareToken } = useParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSharedFavourites() {
      try {
        const data = await getSharedFavourites(shareToken);

        if (!Array.isArray(data)) {
          setError("Could not load shared favourites.");
          return;
        }

        setMovies(data);
      } catch (error) {
        console.error(error);
        setError("Could not load shared favourites.");
      } finally {
        setLoading(false);
      }
    }

    loadSharedFavourites();
  }, [shareToken]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="favourites-page">
          <p>{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="favourites-page">
        <h1>SHARED FAVOURITE MOVIES:</h1>

        <div className="movie-grid">
          {movies.map((movie) => (
            <SharedMovieCard
              key={movie.id}
              movie={movie}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function SharedMovieCard({ movie }) {
  return (
    <div className="movie-card">
      <Link
        to={`/movies/${movie.id}`}
        state={{ fromSharedFavourites: true }}
      >
        <div className="movie-poster">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
            />
          ) : (
            <div className="poster-placeholder" />
          )}
        </div>
      </Link>

      <Link
        to={`/movies/${movie.id}`}
        state={{ fromSharedFavourites: true }}
      >
        {movie.title}
      </Link>
    </div>
  );
}