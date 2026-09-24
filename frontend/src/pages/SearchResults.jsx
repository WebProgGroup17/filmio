import { useState } from "react";
import { searchMovies } from "../api/movies";
import MovieCard from "../components/MovieCard";
import Header from "../components/Header";

export default function SearchResults() {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");

  const [movies, setMovies] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();

  const years = Array.from(
    { length: currentYear - 1899 },
    (_, index) => currentYear - index
  );

  async function handleSearch(event) {
    event.preventDefault();

    setLoading(true);

    const results = await searchMovies({
      title,
      genre,
      year,
    });

    setMovies(results);
    setSearched(true);
    setLoading(false);
  }

  return (
    <>
      <Header />

      <div className="search-page">
        <form onSubmit={handleSearch} className="search-form">

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search movie"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <button type="submit">FIND</button>
          </div>

          <div className="search-filter">

            <select
              id="year"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            >
              <option value="">YEAR</option>

              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="search-filter">

            <select
              id="genre"
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
            >
              <option value="">GENRE</option>
              <option value="28">Action</option>
              <option value="12">Adventure</option>
              <option value="16">Animation</option>
              <option value="35">Comedy</option>
              <option value="80">Crime</option>
              <option value="99">Documentary</option>
              <option value="18">Drama</option>
              <option value="10751">Family</option>
              <option value="14">Fantasy</option>
              <option value="36">History</option>
              <option value="27">Horror</option>
              <option value="10402">Music</option>
              <option value="9648">Mystery</option>
              <option value="10749">Romance</option>
              <option value="878">Science Fiction</option>
              <option value="53">Thriller</option>
              <option value="10770">TV Movie</option>
              <option value="10752">War</option>
              <option value="37">Western</option>
              
            </select>
          </div>
        </form>

        <h2>RESULTS:</h2>

        {loading && <p>Loading...</p>}

        {!loading && searched && movies.length === 0 && (
          <p>No movies found.</p>
        )}

        {!loading && movies.length > 0 && (
          <div className="movie-grid">
            {movies.map((movie) => (
              <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              posterUrl={movie.posterUrl}
              releaseDate={movie.releaseDate}
              showYear={true}
/>
            ))}
          </div>
        )}
      </div>
    </>
  );
}