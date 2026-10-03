const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";


//request to backend
async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options, //delete, add
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Something went wrong");
  }

  return data;
}

//info about a group (name, owner_id)
export function getGroup(groupId, token) {
  return request(`/groups/${groupId}`, token);
}

//memebers of the group
export function getGroupMembers(groupId, token) {
  return request(`/groups/${groupId}/members`, token);
}

//add member
export function addGroupMember(groupId, email, token) {
  return request(`/groups/${groupId}/members`, token, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

//delete member (owner only)
export function removeGroupMember(groupId, userId, token) {
  return request(`/groups/${groupId}/members/${userId}`, token, {
    method: "DELETE",
  });
}

//requests to join the group (only owner)
export function getGroupJoinRequests(groupId, token) {
  return request(`/groups/${groupId}/join-requests`, token);
}
//accept
export function acceptJoinRequest(requestId, token) {
  return request(`/groups/join-requests/${requestId}/accept`, token, {
    method: "PATCH",
  });
}
//reject
export function rejectJoinRequest(requestId, token) {
  return request(`/groups/join-requests/${requestId}/reject`, token, {
    method: "PATCH",
  });
}

//movies of the group (only id)
export function getGroupMovies(groupId, token) {
  return request(`/groups/${groupId}/movies`, token);
}
//delete a movie
export function removeGroupMovie(groupId, tmdbMovieId, token) {
  return request(`/groups/${groupId}/movies/${tmdbMovieId}`, token, {
    method: "DELETE",
  });
}

//delete a group (owner only)
export function deleteGroup(groupId, token) {
  return request(`/groups/${groupId}`, token, { method: "DELETE" });
}

//leave a group (members, not owner)
export function leaveGroup(groupId, token) {
  return request(`/groups/${groupId}/leave`, token, { method: "DELETE" });
}