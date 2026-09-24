import { Link } from "react-router-dom";
import groupIcon from "../assets/groupIcon.png";
import favouritesIcon from "../assets/favouritesIcon.png";
import profileIcon from "../assets/profileIcon.png";
import searchIcon from "../assets/searchIcon.png";
import mainIcon from "../assets/mainIcon.png";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Header() {
  const { user } = useAuth();


  return (
    <header className="header">
      <Link to="/" className="logo">
        <img src={mainIcon} alt="Main" />
      </Link>

      <nav className="header-nav">
        <Link to="/search" className="header-icon">
          <img src={searchIcon} alt="Search" />
        </Link>
        <span className="header-icon">
          <img src={groupIcon} alt="Group" />
        </span>
        <Link to={user ? "/favourites" : "/login"} className="header-icon">
          <img src={favouritesIcon} alt="Favourites" />
        </Link>
        <Link to={user ? "/account" : "/login"} className="header-icon">
          <img src={profileIcon} alt="Profile" />
        </Link>
      </nav>
    </header>
  );
}