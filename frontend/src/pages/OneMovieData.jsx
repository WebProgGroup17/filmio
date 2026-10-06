import { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { getMovieDetails } from "../api/movies";
import Header from "../components/Header";
import { useAuth } from "../contexts/AuthContext.jsx";
import ReviewList from "../components/ReviewList";
import ReviewForm from "../components/ReviewForm";
import { addFavourite } from "../api/favourites";
import MovieRating from "../components/MovieRating";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function OneMovieData() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromSharedFavourites = location.state?.fromSharedFavourites;
  const [favouriteMessage, setFavouriteMessage] = useState("");

  useEffect(() => {
    async function loadMovie() {
      try{
        const data = await getMovieDetails(id);
        setMovie(data);
        const res = await fetch(`${API_URL}/movies/${id}/reviews`);
        const reviewData =await res.json();
        setReviews(reviewData);
      } catch (err) {
        console.error("Failed to load movie details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMovie();
  }, [id]);

  const handleReviewAdded = (newReview) => {
    setReviews([newReview, ...reviews]);
  };

  //rating logic
  //count reviews
  const reviewCount = reviews.length;
  //sum all review ratings
  let total = 0;
  for (const review of reviews) {
    total = total + review.stars;
  }
  //calc avg
  let avgR = 0;
  if (reviewCount > 0) {
    avgR= total / reviewCount;
  }


  if (loading) return <p>Loading...</p>;
  if (!movie) return <p>Movie not found.</p>;

  //favourites button-logic

  const handleAddToFavourites = async () => {
  if (!user) {
    setFavouriteMessage(
      <>You need to <Link to="/login">sign in</Link> to add movies to favourites.</>
    );
    return;
  }

  const result = await addFavourite(movie.id, accessToken); //send current movie's id, token to backend
  setFavouriteMessage(result.message); //result from backend
};

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
          <MovieRating rating={avgR} />

          {!fromSharedFavourites && (
  <>
    <button
      className="add-to-favourites"
      onClick={handleAddToFavourites}
    >
      ADD TO FAVOURITES
    </button>

    <p className="favourite-message">{favouriteMessage}</p>
  </>
)}
        </div>
      </div>
        <div className="movie-down">
          <h2>Description:</h2>
          <p className="movie-description">{movie.description}</p>

          <h2>Reviews:</h2>
         
          <div className="review-section">
            {fromSharedFavourites ? (
          <p className="login-prompt">
          This is a shared movie. You can only view the movie and reviews.
          </p>
          ) : accessToken ? (
        <ReviewForm id={id} onReviewAdded={handleReviewAdded} />
        ) : (
          <p className="login-prompt">
        Please <Link to="/login">log in</Link> to submit a review.
        </p>
        )}
          </div>
           <ReviewList reviews={reviews} />
        </div>
      </div>
    </>
  );
}