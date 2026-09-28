import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useState } from "react";

export default function MyAccount() {
  const { logout, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleDelete = async () => {
    try {
      await deleteAccount();
      navigate("/");
    } catch (err) {
      setError(err.message);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Header />

      <div className="account-page">
        <h1>MY ACCOUNT</h1>

        {error && <p className="account-error">{error}</p>}

        <button className="logout-button" onClick={handleLogout}>
          LOGOUT
        </button>

        <button className="delete-account-button" onClick={() => setShowConfirm(true)}>
          DELETE MY ACCOUNT
        </button>
        
        {showConfirm && (
          <div className="modal-overlay">
            <div className="delete-modal">
              <p className="delete-modal-title">
                Are you sure you want to delete your account?
              </p>
              <p className="delete-modal-subtitle">
                All your data will be removed.
              </p>
              <div className="delete-modal-actions">
                <button className="modal-yes" onClick={handleDelete}>
                  YES
                </button>
                <button className="modal-no" onClick={() => setShowConfirm(false)}>
                  NO
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}