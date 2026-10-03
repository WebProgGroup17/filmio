import { useAuth } from "../contexts/AuthContext.jsx";
import Header from "../components/Header.jsx";
import { Link } from "react-router-dom";
import {  useEffect, useState } from "react";

export default function Groups () {

const { user, accessToken } = useAuth(); 
const [showCreateGroup, setShowCreateGroup] = useState(false);
const [groupName, setGroupName] = useState("");
const [myGroups, setMyGroups] = useState([]);
const [allGroups, setAllGroups] = useState([]);
const [joinRequests, setJoinRequests] = useState([]);
const handleCancelCreate = () => {
  setGroupName("");
  setShowCreateGroup(false);
};

useEffect(() => {
  const fetchMyGroups = async () => {
    try {
      const response = await fetch("http://localhost:3001/groups/my", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }

      const data = await response.json();
      setMyGroups(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (accessToken) {
    fetchMyGroups();
  }
}, [accessToken]);

useEffect(() => {
  const fetchAllGroups = async () => {
    try {
      const response = await fetch("http://localhost:3001/groups");

      if (!response.ok) {
        throw new Error("Failed to fetch all groups");
      }

      const data = await response.json();
      setAllGroups(data);
    } catch (error) {
      console.error(error);
    }
  };

  fetchAllGroups();
}, []);

useEffect(() => {
  const fetchJoinRequests = async () => {
    try {
      const response = await fetch(
        "http://localhost:3001/groups/my/join-requests",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch join requests");
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

const handleCreateGroup = async () => {
    console.log("Access token:", accessToken);
  try {
    const response = await fetch("http://localhost:3001/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: groupName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create group");
    }

    const newGroup = await response.json();
    console.log("Group created:", newGroup);

    setMyGroups((previousGroups) => [
  newGroup,
  ...previousGroups
]);

    setGroupName("");
    setShowCreateGroup(false);
  } catch (error) {
    console.error(error);
  }
};

const handleJoinGroup = async (groupId) => {
  try {
    const response = await fetch(
      `http://localhost:3001/groups/${groupId}/join`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || "Failed to send join request"
      );
    }

    const data = await response.json();
    console.log("Join request sent:", data);

    setJoinRequests((previousRequests) => [
      ...previousRequests,
      data
    ]);

  } catch (error) {
    console.error(error);
  }
};


//if user is not logged in->this message
  if (!user) {
    return (
      <>
        <Header />
        <div className="groups-page">
          <p>
            You need to <Link to="/login">log in</Link> to see your groups page.
          </p>
        </div>
      </>
    );
  }
  

//working page:
  return (
  <>
    <Header />

    <div className="Groups-page">
      <div className="groups-header">
        <h1>MY GROUPS:</h1>

        <button className="create-group-button"
        onClick={() => setShowCreateGroup(true)}
        >
          CREATE NEW GROUP
        </button>
      </div>

      {showCreateGroup && (
        <div className="create-group-form">
            <div className="group-name-field">
             <label>GROUP NAME:</label>
             <input 
             type="text" 
             value={groupName}
             onChange={(e) => setGroupName(e.target.value)}
             />
            </div>

            <div className="create-group-actions">
            <button className="confirm-create-button"
             onClick={handleCreateGroup}
            >
                CREATE
            </button>

            <button
              className="cancel-create-button"
              onClick={handleCancelCreate}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
      <div className="my-groups">
        {myGroups.map((group) => (
          <div key={group.group_id} className="group-item">
             <Link to={`/groups/${group.group_id}`}>{group.name}</Link>
          </div>
        ))}  
      </div>

      <h2>ALL GROUPS:</h2>

      <div className="all-groups">
        {allGroups.map((group) => {
            const isMember = myGroups.some(
              (myGroup) => myGroup.group_id === group.group_id
            );
            const hasPendingRequest = joinRequests.some(
                (request) =>
                    request.group_id === group.group_id &&
                    request.status === "pending"
                );

            return (
            <div key={group.group_id} className="group-item">
                 <Link to={`/groups/${group.group_id}`}>{group.name}</Link>

                {!isMember && (
                  <>
                    {hasPendingRequest ? (
                        <span className="pending-request">PENDING</span>
        ) : (
          <button
            className="join-group-button"
            onClick={() => handleJoinGroup(group.group_id)}
            >   
              +
            </button>
          )}
        </>
       )}
            </div>
            );
        })}
        </div>
    </div>
  </>
);
}