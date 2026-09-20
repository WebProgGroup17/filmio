import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function MyAccount() {
const { logout } = useAuth();
const navigate = useNavigate();

const handleLogout = async () => {
  await logout();
  navigate("/");
};

  return (
    <>
      <Header />

      <div className="account-page">
        <h1>MY ACCOUNT</h1>

        <button className="logout-button" onClick={handleLogout}>
          LOGOUT
        </button>

        <button className="delete-account-button">
          DELETE MY ACCOUNT
        </button>
      </div>
    </>
  );
}