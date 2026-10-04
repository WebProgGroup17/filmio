import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useEffect, useState } from "react";

export default function MyAccount() {

  const { logout, accessToken, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [invites, setInvites] = useState([]);

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

  //load invintations when a page appears
  useEffect(() => {
    async function loadInvites() {
      const response = await fetch("http://localhost:3001/groups/my/invites", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        console.log("Could not load invitations");
        return;
      }
      const data = await response.json();
      setInvites(data);
    }
    //check token
    if (accessToken) {
      loadInvites();
    }
  }, [accessToken]);

  //intinvation->ACCEPT
  async function handleAcceptInvite(inviteId) {
    const response = await fetch(`http://localhost:3001/groups/invites/${inviteId}/accept`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      alert("Something went wrong. Invitation is not accepted.");
      return;
    }
    //remove this invintation from invintations
    setInvites(invites.filter((invite) => invite.invite_id !== inviteId));
  }

  //intinvation->DECLINE
  async function handleDeclineInvite(inviteId) {
    const response = await fetch(`http://localhost:3001/groups/invites/${inviteId}/reject`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      alert("Something went wrong. Invitation is not declined.");
      return;
    }
    //remove this invintation from invintations
    setInvites(invites.filter((invite) => invite.invite_id !== inviteId));
  }

  return (
    <>
      <Header />

      <div className="account-page">
        <h1>MY ACCOUNT</h1>

        <div className="account-join-requests">
          {invites.map((invite) => (
            <div 
            key={invite.invite_id} 
            className="account-join-request"
            >
              <span>
                You are invited to join {invite.group_name}
              </span>

              <div className="join-request-actions">
                <button
                  className="accept-request-button"
                  onClick={() => handleAcceptInvite(invite.invite_id)}
                >
                  ACCEPT
                </button>

                <button
                  className="decline-request-button"
                  onClick={() => handleDeclineInvite(invite.invite_id)}
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