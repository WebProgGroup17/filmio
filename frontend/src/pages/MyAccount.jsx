import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useEffect, useState } from "react";

export default function MyAccount() {

  const { logout, accessToken, deleteAccount } = useAuth();
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

const handleAcceptRequest = async (requestId) => {
  try {
    const response = await fetch(
      `http://localhost:3001/groups/join-requests/${requestId}/accept`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to accept join request");
    }

    setJoinRequests((previousRequests) =>
      previousRequests.filter(
        (request) => request.request_id !== requestId
      )
    );

  } catch (error) {
    console.error(error);
  }
};

const handleDeclineRequest = async (requestId) => {
  try {
    const response = await fetch(
      `http://localhost:3001/groups/join-requests/${requestId}/reject`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to decline join request");
    }

    setJoinRequests((previousRequests) =>
      previousRequests.filter(
        (request) => request.request_id !== requestId
      )
    );

  } catch (error) {
    console.error(error);
  }
};

  const [joinRequests, setJoinRequests] = useState([]);
    useEffect(() => {
  const fetchJoinRequests = async () => {
    try {
      const response = await fetch(
        "http://localhost:3001/groups/my/received-join-requests",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch received join requests");
      }

      const data = await response.json();
      setJoinRequests(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (accessToken) {
    fetchJoinRequests();
  }
}, [accessToken]);

  return (
    <>
      <Header />

      <div className="account-page">
        <h1>MY ACCOUNT</h1>

        <div className="account-join-requests">
  {joinRequests.map((request) => (
    <div
      key={request.request_id}
      className="account-join-request"
    >
      <span>
        {request.email} wants to join {request.group_name}
      </span>

      <div className="join-request-actions">
        <button 
          className="accept-request-button"
          onClick={() => handleAcceptRequest(request.request_id)}
          >
          ACCEPT
        </button>

        <button 
          className="decline-request-button"
          onClick={() => handleDeclineRequest(request.request_id)}
          >
          DECLINE
        </button>
      </div>
    </div>
  ))}
</div>

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