import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { getFavourites, removeFavourite, createFavouriteShare } from "../../api/favourites.js";
import Header from "../../components/header/Header";
import MovieCard from "../../components/moviecard/MovieCard";
import "./MyFavourites.css";

export default function MyFavourites() {
  const { user, accessToken } = useAuth(); //get user and token
  const [movies, setMovies] = useState([]); //get list of favourites
  const [loading, setLoading] = useState(true); //loading
  const [shareModal, setShareModal] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    
    async function loadFavourites() { //function for loadin data from server
      const data = await getFavourites(accessToken);
      setMovies(data);
      setLoading(false);
    }
    loadFavourites();
  }, [accessToken]);
    loadFavourites();
  }, [accessToken]);

  //function for deleting movie from favourites
  async function handleRemove(movieId) {
    await removeFavourite(movieId, accessToken);
  //function for deleting movie from favourites
  async function handleRemove(movieId) {
    await removeFavourite(movieId, accessToken);

    //update list(create new), all movies remain but not deleted
    const updatedMovies = movies.filter((movie) => movie.id !== movieId);
    const updatedMovies = movies.filter((movie) => movie.id !== movieId);
    setMovies(updatedMovies);
  }

  async function handleShare() {
    try {
      const data = await createFavouriteShare(accessToken);
      const shareUrl = `${window.location.origin}/shared-favourites/${data.shareToken}`;
      setCopied(false);
      setShareModal({ text: "Share this link with your friends:", url: shareUrl });
    } catch (error) {
      console.error("Share failed:", error);
      setShareModal({ text: "Sharing failed." });
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareModal.url);
      setCopied(true);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }


  async function handleShare() {
    try {
      const data = await createFavouriteShare(accessToken);
      const shareUrl = `${window.location.origin}/shared-favourites/${data.shareToken}`;
      setCopied(false);
      setShareModal({ text: "Share this link with your friends:", url: shareUrl });
    } catch (error) {
      console.error("Share failed:", error);
      setShareModal({ text: "Sharing failed." });
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareModal.url);
      setCopied(true);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  //if user is not logged in->this message
  if (!user) {
    return (
      <>
        <Header />
        <div className="signin-required">
          <h1>You need to sign in to see this page</h1>
          <Link to="/login" className="signin-required-button">
            Sign in
          </Link>
        </div>
      </>
    );
  }

  //when data is loading->this message
  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Header />
      <div className="favourites-page">
        <div className="favourites-header">
          <h1>My favourite movies:</h1>
          <button className="share-favourites-button" onClick={handleShare}>
            Share
          </button>
        </div>

        <div className="movie-grid">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              posterUrl={movie.posterUrl}
              onRemove={handleRemove}
            />
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              posterUrl={movie.posterUrl}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>
      {shareModal && (
        <div className="fav-modal-overlay">
          <div className="fav-modal">
            <p className="fav-modal-title">{shareModal.text}</p>

            {shareModal.url && (
              <input
                className="fav-modal-link"
                type="text"
                value={shareModal.url}
                readOnly
                onFocus={(e) => e.target.select()}
              />
            )}

            <div className="fav-modal-actions">
              {shareModal.url && (
                <button
                  type="button"
                  className="fav-modal-copy"
                  onClick={handleCopy}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
              <button
                type="button"
                className="fav-modal-close"
                onClick={() => setShareModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}