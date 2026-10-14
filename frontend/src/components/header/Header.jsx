import { Link } from "react-router-dom";
import groupIcon from "../../assets/icons/groupIcon.png";
import favouritesIcon from "../../assets/icons/favouritesIcon.png";
import profileIcon from "../../assets/icons/profileIcon.png";
import searchIcon from "../../assets/icons/searchIcon.png";
import mainIcon from "../../assets/icons/mainIcon.png";
import { useAuth } from "../../contexts/AuthContext.jsx";
import "./Header.css";

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
        <Link to="/groups" className="header-icon">
          <img src={groupIcon} alt="Group" />
        </Link>
        <Link to="/favourites" className="header-icon">
          <img src={favouritesIcon} alt="Favourites" />
        </Link>
        <Link to={user ? "/account" : "/login"} className="header-icon">
          <img src={profileIcon} alt="Profile" />
        </Link>
      </nav>
    </header>
  );
}