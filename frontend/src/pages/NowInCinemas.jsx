import { useState, useEffect } from "react";
import { getNowInCinemas } from "../api/movies";
import MovieCard from "../components/MovieCard";
import Header from "../components/Header";

export default function NowInCinemas() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMovies() {
      const data = await getNowInCinemas();
      setMovies(data);
      setLoading(false);
    }
    loadMovies();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <Header />
    <div className="now-in-cinemas">
      <h1>NOW IN CINEMAS</h1>
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} title={movie.title} posterUrl={movie.posterUrl} />
        ))}
      </div>
    </div>
    </>
  );
}