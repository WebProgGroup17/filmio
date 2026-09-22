import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getMovieDetails } from "../api/movies";
import Header from "../components/Header";
import { useAuth } from "../contexts/AuthContext.jsx";
import ReviewList from "../components/ReviewList";
import ReviewForm from "../components/ReviewForm";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function OneMovieData() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const {accessToken } = useAuth();

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
          <ReviewList reviews={reviews} />
          <div className="review-section">
            {accessToken ? (
              <ReviewForm id={id} onReviewAdded={handleReviewAdded} />
            ) : (
              <p className="login-prompt">Please <Link to="/login">log in</Link> to submit a review.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}