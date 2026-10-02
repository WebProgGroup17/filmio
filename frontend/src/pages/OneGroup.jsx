import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import Header from "../components/Header";
import { getMovieDetails } from "../api/movies";
import {
    getGroup, getGroupMembers, addGroupMember, removeGroupMember, getGroupJoinRequests, acceptJoinRequest,
    rejectJoinRequest, getGroupMovies, removeGroupMovie, deleteGroup, leaveGroup
} from "../api/groups";


export default function OneGroup() {
    // groupId is taken from address line
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user, accessToken } = useAuth();

    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [movies, setMovies] = useState([]); //info about movies
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    //add member
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState("");

    //check if a user is an owner of group
    const isOwner = group && user && group.owner_id === user.id;

    //
    useEffect(() => {
        if (!accessToken) return;

        async function loadPage() {
            try {
                // check if a group member
                const groupData = await getGroup(groupId, accessToken);
                setGroup(groupData);

                //members
                const membersData = await getGroupMembers(groupId, accessToken);
                setMembers(membersData);

                // 3)movies, aks by id data from tmbd
                const movieIds = await getGroupMovies(groupId, accessToken);
                const movieDetails = await Promise.all(
                    movieIds.map((item) => getMovieDetails(item.tmdb_movie_id))
                );
                setMovies(movieDetails.filter((movie) => movie !== null));

                // 4)requests to join
                if (groupData.owner_id === user?.id) {
                    const requestsData = await getGroupJoinRequests(groupId, accessToken);
                    setRequests(requestsData);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadPage();
    }, [groupId, accessToken, user?.id]);


    /////GROUP

    async function handleDeleteGroup() {
        if (!window.confirm("Delete this group?")) return;
        try {
            await deleteGroup(groupId, accessToken);
            navigate("/groups");
        } catch (err) {
            alert(err.message);
        }
    }

    async function handleLeaveGroup() {
        if (!window.confirm("Leave this group?")) return;
        try {
            await leaveGroup(groupId, accessToken);
            navigate("/groups");
        } catch (err) {
            alert(err.message);
        }
    }

    /////MEMBERS
    //add
    async function handleAddMember() {
        try {
            const newMember = await addGroupMember(groupId, newMemberEmail, accessToken);
            setMembers([...members, newMember]);
            setNewMemberEmail("");
            setShowAddMember(false);
        } catch (err) {
            alert(err.message);
        }
    }
    //delete
    async function handleRemoveMember(userId) {
        try {
            await removeGroupMember(groupId, userId, accessToken);
            // оставляем всех, кроме удалённого
            setMembers(members.filter((member) => member.user_id !== userId));
        } catch (err) {
            alert(err.message);
        }
    }

    //join requests
    //accept
    async function handleAccept(request) {
        try {
            await acceptJoinRequest(request.request_id, accessToken);
            //a user become a member, delete from requests
            setMembers([...members, { user_id: request.user_id, email: request.email }]);
            setRequests(requests.filter((r) => r.request_id !== request.request_id));
        } catch (err) {
            alert(err.message);
        }
    }
    //decline
    async function handleDecline(requestId) {
        try {
            await rejectJoinRequest(requestId, accessToken);
            setRequests(requests.filter((r) => r.request_id !== requestId));
        } catch (err) {
            alert(err.message);
        }
    }

    /////MOVIES

    async function handleRemoveMovie(movieId) {
        try {
            await removeGroupMovie(groupId, movieId, accessToken);
            setMovies(movies.filter((movie) => movie.id !== movieId));
        } catch (err) {
            alert(err.message);
        }
    }

    //Display

    //if user is not signed in
    if (!user) {
        return (
            <>
                <Header />
                <div className="group-page">
                    <p>
                        You need to <Link to="/login">log in</Link> to see this group.
                    </p>
                </div>
            </>
        );
    }

    if (loading) {
        return <p>Loading...</p>;
    }

    //err (if not a member)
    if (error) {
        return (
            <>
                <Header />
                <div className="group-page">
                    <p>{error}</p>
                    <Link to="/groups">Back to groups</Link>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="group-page">
                {/* group name, delete, leave */}
                <div className="group-top">
                    <h1 className="group-title">{group.name}</h1>
                    {isOwner ? (
                        <button className="group-main-button" onClick={handleDeleteGroup}>
                            DELETE
                        </button>
                    ) : (
                        <button
                            className="group-main-button group-leave-button"
                            onClick={handleLeaveGroup}
                        >
                            LEAVE GROUP
                        </button>
                    )}
                </div>

                <div className="group-columns">
                    {/* members and movies */}
                    <div className="group-left">
                        <h2>Members:</h2>
                        {members.map((member) => (
                            <div key={member.user_id} className="member-row">
                                <span>{member.email}</span>
                                {member.user_id === group.owner_id ? (
                                    <span title="Owner">👑</span>
                                ) : (
                                    isOwner && (
                                        <button
                                            className="small-button"
                                            onClick={() => handleRemoveMember(member.user_id)}>
                                            REMOVE
                                        </button>
                                    )
                                )}
                            </div>
                        ))}

                        {/* ADD MEMBER */}
                        <button
                            className="big-light-button"
                            onClick={() => setShowAddMember(!showAddMember)}
                        >
                            ADD MEMBER
                        </button>

                        {showAddMember && (
                            <div className="group-inline-form">
                                <input
                                    type="email"
                                    placeholder="Email of the user"
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                />
                                <button className="small-button" onClick={handleAddMember}>
                                    ADD
                                </button>
                            </div>
                        )}

                        <h2 className="group-movies-title">Movies:</h2>
                        {/* ADD MOVIE (not done yet) */}
                        <button className="big-light-button" disabled>
                            ADD MOVIE
                        </button>

                        <div className="group-movies">
                            {movies.map((movie) => (
                                <div key={movie.id} className="group-movie">
                                    <Link to={`/movies/${movie.id}`}>
                                        {movie.posterUrl ? (
                                            <img src={movie.posterUrl} alt={movie.title} />
                                        ) : (
                                            <div className="poster-placeholder" />
                                        )}
                                    </Link>
                                    <Link to={`/movies/${movie.id}`} className="movie-title">
                                        {movie.title}
                                    </Link>
                                    <button
                                        className="small-button"
                                        onClick={() => handleRemoveMovie(movie.id)}
                                    >
                                        REMOVE
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* requests to join (owner) */}
                    {isOwner && (
                        <div className="group-right">
                            <h2>Requests:</h2>
                            {requests.length === 0 && <p>No requests</p>}
                            {requests.map((request) => (
                                <div key={request.request_id} className="member-row">
                                    <span>{request.email}</span>
                                    <div>
                                        <button
                                            className="small-button"
                                            onClick={() => handleAccept(request)}
                                        >
                                            ACCEPT
                                        </button>
                                        <button
                                            className="small-button"
                                            onClick={() => handleDecline(request.request_id)}
                                        >
                                            DECLINE
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}