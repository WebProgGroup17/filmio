import { Link } from "react-router-dom";

import groupIcon from "../assets/groupIcon.png";
import favoritesIcon from "../assets/favoritesIcon.png";
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
        <span className="header-icon">
          <img src={favoritesIcon} alt="Favorites" />
        </span>
        <Link to={user ? "/account" : "/login"} className="header-icon">
          <img src={profileIcon} alt="Profile" />
        </Link>
      </nav>
    </header>
  );
}