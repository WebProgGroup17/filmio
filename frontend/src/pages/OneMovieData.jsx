import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getMovieDetails } from "../api/movies";
import Header from "../components/Header";

export default function OneMovieData() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMovie() {
      const data = await getMovieDetails(id);
      setMovie(data);
      setLoading(false);
    }
    loadMovie();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!movie) return <p>Movie not found.</p>;

  return (
    <>
      <Header />
      <div className="movie-page">
        <div className="movie-top">
            <div className="movie-details-poster">
                {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} />
                ) : (
                    <div className="poster-placeholder" />
                )}
            </div>

        <div className="movie-details-info">
          <h1>{movie.title}</h1>
          <p className="movie-year">{movie.releaseYear}</p>
          <p className="movie-genres">{movie.genres.join(", ")}</p>

          <button className="add-to-favorites">ADD TO FAVORITES</button>
        </div>
      </div>
        <div className="movie-down">
          <h2>Description:</h2>
          <p className="movie-description">{movie.description}</p>

          <h2>Reviews:</h2>
          <p className="movie-reviews"></p>
          <button className="add-review">ADD REVIEW</button>
        </div>
      </div>
    </>
  );
}