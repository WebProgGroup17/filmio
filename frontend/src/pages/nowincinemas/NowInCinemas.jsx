import { useState, useEffect } from "react";
import { getNowInCinemas } from "../../api/movies";
import MovieCard from "../../components/moviecard/MovieCard";
import Header from "../../components/header/Header";
import "./NowInCinemas.css";

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
      <h1>Now in cinemas</h1>
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} id={movie.id} title={movie.title} posterUrl={movie.posterUrl} />
        ))}
      </div>
    </div>
    </>
  );
}