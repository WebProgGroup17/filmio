# Filmio Backend REST API Documentation

## Overview
Filmio is a collaborative full-stack web application designed for movie reviews, tracking favorites, and managing social movie-watching groups. This backend service provides a robust RESTful API built with Node.js, Express, and PostgreSQL, integrated with the TMDB (The Movie Database) API for comprehensive movie metadata, ratings, and recommendations.

## Base URL
* **Development:** `http://localhost:3001` (routes are mounted at the root, e.g. `/users`, `/movies`, `/groups`, `/favourites`)
* **Authentication Scheme:** Bearer Token (JWT passed in headers: `Authorization: Bearer <token>`)

---

## 1. Authentication & User Management (`/users`)

| Endpoint | Method | Description | Parameters | Request Body | Response Body | Status Codes | Auth Required | Error Statuses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/users/signup` | `POST` | Register a new user account | None | `{ "user": { "email": "string", "password": "string" } }` | `{ "user_id": 1, "email": "string" }` | `201 Created`, `400 Bad Request` | None | `400` (Missing fields, invalid password regex, or email taken) |
| `/users/login` | `POST` | Authenticate user and issue JWT token | None | `{ "user": { "email": "string", "password": "string" } }` | `{ "id": 1, "email": "string", "token": "jwt_token_string" }` | `200 OK`, `401 Unauthorized` | None | `401` (Invalid email or password) |
| `/users/logout` | `POST` | Terminate user session | None | None | `{ "message": "Logged out successfully" }` | `200 OK`, `401 Unauthorized` | Bearer Token | `401` |
| `/users/me` | `DELETE` | Permanently delete user account | None | None | `{ "message": "Account deleted successfully" }` | `200 OK`, `401 Unauthorized` | Bearer Token | `401` |

---

## 2. Movies & Reviews (`/movies`)

| Endpoint | Method | Description | Parameters | Request Body | Response Body | Status Codes | Auth Required | Error Statuses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/movies/now-playing` | `GET` | Get currently playing movies in Finland (Finland region) | None | None | `[ { "id": 101, "title": "string", "posterUrl": "string" } ]` | `200 OK`, `500 Internal Error` | None | `500` (TMDB fetch failure) |
| `/movies/search` | `GET` | Search or filter movies by title, genre, or year | `title`, `genre`, `year` (Query) | None | `[ { "id": 101, "title": "string", "releaseDate": "string", "genres": [], "posterUrl": "string" } ]` | `200 OK`, `500 Internal Error` | None | `500` |
| `/movies/:id` | `GET` | Get detailed information for a specific movie | `id` (Path, integer) | None | `{ "id": 101, "title": "string", "releaseYear": "string", "genres": [], "description": "string", "posterUrl": "string" }` | `200 OK`, `500 Internal Error` | None | `500` |
| `/movies/:id/reviews` | `GET` | Get all reviews for a specific movie | `id` (Path, integer) | None | `[ { "review_id": 1, "review_text": "string", "stars": 5, "created_at": "timestamp", "username": "string" } ]` | `200 OK`, `500 Internal Error` | None | `500` |
| `/movies/:id/reviews` | `POST` | Add a star rating and review text to a movie | `id` (Path, integer) | `{ "review_text": "string", "stars": 5 }` | `{ "review_id": 1, "user_id": 1, "tmdb_movie_id": 101, "review_text": "string", "stars": 5, "created_at": "timestamp", "username": "string" }` | `201 Created`, `400 Bad Request` | Bearer Token | `400` (Missing text or star rating out of bounds 1-5), `401` |

---

## 3. Favourites (`/favourites`)

| Endpoint | Method | Description | Parameters | Request Body | Response Body | Status Codes | Auth Required | Error Statuses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/favourites` | `GET` | Get user's favorite movies with details | None | None | `[ { "id": 101, "title": "string", "posterUrl": "string" } ]` | `200 OK`, `401 Unauthorized` | Bearer Token | `401` |
| `/favourites` | `POST` | Add a movie to favorites | None | `{ "tmdbMovieId": 101 }` | `{ "message": "Movie added to favorites" }` (or status 200 if already exists) | `201 Created`, `200 OK`, `400 Bad Request` | Bearer Token | `400` (`tmdbMovieId` is missing), `401` |
| `/favourites/:movieId` | `DELETE` | Remove a movie from favorites | `movieId` (Path, integer) | None | `{ "message": "Movie removed from favourites" }` | `200 OK`, `404 Not Found` | Bearer Token | `401`, `404` (Favorite not found) |
| `/favourites/share` | `POST` | Generate or fetch a shareable token link for favorites | None | None | `{ "shareToken": "uuid_string" }` | `201 Created`, `200 OK`, `401 Unauthorized` | Bearer Token | `401` |
| `/favourites/share/:shareToken` | `GET` | View a user's favorite movies via share token | `shareToken` (Path, string) | None | `[ { "id": 101, "title": "string", "posterUrl": "string" } ]` | `200 OK`, `404 Not Found` | None | `404` (Share link not found) |

---

## 4. Groups (`/groups`)

| Endpoint | Method | Description | Parameters | Request Body | Response Body | Status Codes | Auth Required | Error Statuses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/groups` | `GET` | List all community groups | None | None | `[ { "group_id": 1, "name": "string", "owner_id": 1 } ]` | `200 OK` | None | `500` |
| `/groups` | `POST` | Create a new community group | None | `{ "name": "string" }` | `{ "group_id": 1, "name": "string", "owner_id": 1 }` | `201 Created`, `400 Bad Request` | Bearer Token | `400` (Name is required), `401` |
| `/groups/my` | `GET` | List groups the current user belongs to | None | None | `[ { "group_id": 1, "name": "string", "owner_id": 1 } ]` | `200 OK`, `401 Unauthorized` | Bearer Token | `401` |
| `/groups/my/join-requests` | `GET` | View current user's outgoing join requests | None | None | `[ { "request_id": 1, "group_id": 1, "status": "pending" } ]` | `200 OK`, `401 Unauthorized` | Bearer Token | `401` |
| `/groups/my/received-join-requests` | `GET` | View pending join requests for groups owned by user | None | None | `[ { "request_id": 1, "group_id": 1, "user_id": 2, "status": "pending", "email": "string", "group_name": "string" } ]` | `200 OK`, `401 Unauthorized` | Bearer Token | `401` |
| `/groups/my/invites` | `GET` | List invitations received by current user | None | None | `[ { "invite_id": 1, "group_id": 1, "group_name": "string" } ]` | `200 OK`, `401 Unauthorized` | Bearer Token | `401` |
| `/groups/:groupId` | `GET` | Get details of a single group | `groupId` (Path, integer) | None | Group details object | `200 OK`, `403 Forbidden`, `404 Not Found` | Bearer Token | `403` (Not a member), `404` |
| `/groups/:groupId` | `DELETE` | Delete a group (Owner only) | `groupId` (Path, integer) | None | `{ "message": "Group deleted successfully" }` | `200 OK`, `403 Forbidden`, `404 Not Found` | Bearer Token | `403` (Not owner), `404` |
| `/groups/:groupId/members` | `GET` | List members of a group | `groupId` (Path, integer) | None | `[ { "user_id": 1, "email": "string" } ]` | `200 OK`, `403 Forbidden`, `404 Not Found` | Bearer Token | `403`, `404` |
| `/groups/:groupId/members` | `POST` | Invite a user to a group by email | `groupId` (Path, integer) | `{ "email": "string" }` | `{ "message": "Invitation sent" }` | `201 Created`, `400 Bad Request`, `404 Not Found` | Bearer Token | `400` (Already member/pending), `404` (User not found) |
| `/groups/:groupId/members/:userId` | `DELETE` | Remove a member from group (Owner only) | `groupId`, `userId` (Path) | None | `{ "message": "Member removed" }` | `200 OK`, `400 Bad Request`, `403 Forbidden` | Bearer Token | `400` (Cannot remove owner), `403` (Not owner) |
| `/groups/:groupId/leave` | `DELETE` | Leave a group (Non-owner members) | `groupId` (Path, integer) | None | `{ "message": "Successfully left the group" }` | `200 OK`, `403 Forbidden` | Bearer Token | `403` (Owner cannot leave via this route) |
| `/groups/:groupId/join` | `POST` | Request to join a group | `groupId` (Path, integer) | None | Request object | `201 Created`, `400 Bad Request` | Bearer Token | `400` (Already member or pending) |
| `/groups/:groupId/join-requests` | `GET` | View pending join requests for a group (Owner only) | `groupId` (Path, integer) | None | `[ { "request_id": 1, "user_id": 2, "email": "string" } ]` | `200 OK`, `403 Forbidden` | Bearer Token | `403` (Not owner) |
| `/groups/:groupId/movies` | `GET` | List group movies (TMDB IDs added by members) | `groupId` (Path, integer) | None | `[ { "tmdb_movie_id": 101, "added_by": 1 } ]` | `200 OK`, `403 Forbidden` | Bearer Token | `403` (Not a member) |
| `/groups/:groupId/movies` | `POST` | Add a movie to the group list (Members only) | `groupId` (Path, integer) | `{ "tmdbMovieId": 101 }` | `{ "group_movie_id": 1, "group_id": 1, "tmdb_movie_id": 101, "added_by": 1 }` | `201 Created`, `400 Bad Request`, `403 Forbidden` | Bearer Token | `400` (Missing `tmdbMovieId` or movie already in group), `403` (Not a member) |
| `/groups/:groupId/movies/:tmdbMovieId` | `DELETE` | Remove a movie from group list (Members only) | `groupId`, `tmdbMovieId` (Path) | None | `{ "message": "Movie removed from group" }` | `200 OK`, `403 Forbidden` | Bearer Token | `403` (Not a member) |
| `/groups/join-requests/:requestId/accept` | `PATCH` | Accept a user's join request (Owner only) | `requestId` (Path, integer) | None | Acceptance confirmation object | `200 OK`, `404 Not Found` | Bearer Token | `404` (Request not found or unauthorized) |
| `/groups/join-requests/:requestId/reject` | `PATCH` | Reject a user's join request (Owner only) | `requestId` (Path, integer) | None | Rejection confirmation object | `200 OK`, `404 Not Found` | Bearer Token | `404` |
| `/groups/invites/:inviteId/accept` | `PATCH` | User accepts an invitation to join a group | `inviteId` (Path, integer) | None | `{ "message": "Invitation accepted" }` | `200 OK`, `404 Not Found` | Bearer Token | `404` (Invitation not found) |
| `/groups/invites/:inviteId/reject` | `PATCH` | User declines an invitation to join a group | `inviteId` (Path, integer) | None | `{ "message": "Invitation declined" }` | `200 OK`, `404 Not Found` | Bearer Token | `404` |
| `/groups/:groupId/chat` | `POST` | Post a chat message in group (Members only) | `groupId` (Path, integer) | `{ "text": "string" }` | Created message object | `201 Created`, `400 Bad Request`, `403 Forbidden` | Bearer Token | `400` (Empty message), `403` (Not a member) |
| `/groups/:groupId/chat` | `GET` | Retrieve chat messages for a group (Members only) | `groupId` (Path, integer) | None | `[ { "message_id": 1, "text": "string", "created_at": "timestamp", "user_id": 1, "email": "string" } ]` | `200 OK`, `403 Forbidden` | Bearer Token | `403` (Not a member) |

---

### Common Error Responses
* **`400 Bad Request`**: Sent when validation fails (e.g., missing email, password requirements not met, or duplicate entries).
* **`401 Unauthorized`**: Sent when missing or invalid authentication tokens block access.
* **`403 Forbidden`**: Sent when an authenticated user lacks administrative roles or group membership required for the action.
* **`404 Not Found`**: Sent when requested resources (users, groups, requests, or shares) do not exist.
* **`500 Internal Server Error`**: Sent on unexpected server or external API exceptions.