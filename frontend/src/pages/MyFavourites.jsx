import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { getFavourites, removeFavourite } from "../api/favourites";
import Header from "../components/Header";

export default function MyFavourites() {
  const { user, accessToken } = useAuth(); //get user and token
  const [movies, setMovies] = useState([]); //get list of favourites
  const [loading, setLoading] = useState(true); //loading


  useEffect(() => {
    if (!accessToken) { //if user is not signed in-nothin to load
      setLoading(false);
      return;
    }
    async function loadFavourites() { //function for loadin data from server
      const data = await getFavourites(accessToken);
      setMovies(data);
      setLoading(false);
    }
    loadFavourites(); }, [accessToken]);

    //function for deleting movie from favourites
    async function handleRemove(movieId) {
        await removeFavourite(movieId, accessToken);

    //update list(create new), all movies remain but not deleted
    const updatedMovies = movies.filter((movie) => movie.id !== movieId);/////----
    setMovies(updatedMovies);
  }

  //if user is not logged in->this message
  if (!user) {
    return (
      <>
        <Header />
        <div className="favourites-page">
          <p>
            You need to <Link to="/login">log in</Link> to see your favourite movies.
          </p>
        </div>
      </>
    );
  }
  //when data is loading->this message
  if (loading) {
    return <p>Loading...</p>;
  }

  //working page:
  return (
    <>
      <Header />
      <div className="favourites-page">
        <h1>MY FAVOURITE MOVIES:</h1>
        
        <div className="movie-grid">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onRemove={handleRemove}/>
          ))}
        </div>
      </div>
    </>
  );
}
//one movie is a component
function MovieCard({ movie, onRemove }) {
  return (
    <div className="movie-card">
      <Link to={`/movies/${movie.id}`}>
        <div className="movie-poster">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={movie.title} />
          ) : (
            <div className="poster-placeholder" />
          )}
        </div>
      </Link>

      <Link to={`/movies/${movie.id}`} className="movie-title">
        {movie.title}
      </Link>

      <button className="remove-favourite-button" onClick={() => onRemove(movie.id)}>
        DELETE
      </button>
    </div>
  );
}