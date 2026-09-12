import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">
        🎥 Filmio
      </Link>

      <nav className="header-nav">
        <Link to="/search" className="header-icon">
          🔎
        </Link>
      </nav>
    </header>
  );
}