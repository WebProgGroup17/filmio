import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";


export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer">
      
      <nav className="footer-links">
        <Link to="/">Home</Link>
        <Link to="/search">Search</Link>
        <Link to={user ? "/favourites" : "/login"}>Favourites</Link>
        <Link to="/groups">Groups</Link>
        <Link to={user ? "/account" : "/login"}>My account</Link>
      </nav>

      <p className="footer-text">© 2026 Filmio</p>
      <p className="footer-text">Made by Group 17</p>

      <p className="footer-mandatory">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </footer>
  );
}