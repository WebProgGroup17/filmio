# Filmio Backend REST API Documentation

## Overview
Filmio is a collaborative full-stack web application designed for movie reviews, tracking favorites, and managing social movie-watching groups. This backend service provides a robust RESTful API built with Node.js, Express, and PostgreSQL, integrated with the TMDB (The Movie Database) API for movie metadata (titles, genres, descriptions, and posters). Ratings and reviews are written by Filmio users and stored in the Filmio database.

## Base URL
* **Development:** `http://localhost:3001` (routes are mounted at the root, e.g. `/users`, `/movies`, `/groups`, `/favourites`)
* **Port:** `3001` by default, configurable with the `PORT` environment variable.
* **Health check:** `GET /` returns `{ "message": "Filmio backend is running" }`.
* **Authentication Scheme:** Bearer Token (JWT passed in headers: `Authorization: Bearer <token>`)

---

## 1. Authentication & User Management (`/users`)

| Endpoint | Method | Description | Parameters | Request Body | Status Codes | Auth Required | Error Statuses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/users/signup` | `POST` | Register a new user account | None | `{ "user": { "email": "string", "password": "string" } }` | `201 Created`, `400 Bad Request`, `409 Conflict` | None | `400` (Missing fields or password too weak: min 8 chars, 1 uppercase, 1 number), `409` (Email already registered) |
| `/users/login` | `POST` | Authenticate user, return a short-lived access token (5 min) and set a `refreshToken` HttpOnly cookie (10 min) | None | `{ "user": { "email": "string", "password": "string" } }` | `200 OK`, `400 Bad Request`, `401 Unauthorized` | None | `400` (Email or password missing), `401` (Invalid email or password) |
| `/users/refresh` | `POST` | Exchange a valid `refreshToken` cookie for a new access token and a rotated refresh cookie | None | None (token is read from the `refreshToken` cookie) | `200 OK`, `401 Unauthorized`, `403 Forbidden` | Refresh cookie | `401` (`No refresh token`), `403` (`Invalid or expired refresh token`, or `Refresh token not found` when it does not match the one stored in the database) |
| `/users/logout` | `POST` | Terminate user session: clears the stored refresh token and the `refreshToken` cookie | None | None | `200 OK` | None (uses the refresh cookie if present) | None. Always returns `200`, even without a cookie |
| `/users/me` | `DELETE` | Permanently delete user account | None | None | `200 OK`, `401 Unauthorized` | Bearer Token | `401` |

### Authentication Example

Protected endpoints require an access token obtained from `POST /users/login`. The access token is valid for **5 minutes**. Login also sets a `refreshToken` cookie (HttpOnly, `SameSite=Strict`, `Secure` in production, valid for **10 minutes**). When the access token expires, call `POST /users/refresh` (send requests with credentials so the cookie is included) to get a new access token. Each refresh rotates the refresh token.

**1. Sign up**
```json
{ "user_id": 1, "email": "user@example.com" }
```

**2. Log in**
```json
{ "id": 1, "email": "user@example.com", "token": "eyJhbGciOiJIUzI1NiIs..." }
```

**Authentication errors** (`401 Unauthorized`)
```json
{ "error": { "message": "Authentication required", "status": 401 } }
```
```json
{ "error": { "message": "Invalid or expired token", "status": 401 } }
```
The first is returned when the `Authorization` header is missing or is not in the form `Bearer <token>`. The second is returned when the token is invalid or has expired.

**Refresh errors** (`POST /users/refresh`)
```json
{ "error": { "message": "No refresh token" } }
```
```json
{ "error": { "message": "Invalid or expired refresh token" } }
```
```json
{ "error": { "message": "Refresh token not found" } }
```
The first is returned with `401`, the other two with `403`. These responses have no `status` field.

> **Note:** `POST /users/logout` invalidates only the refresh token (removed from the database and the cookie). The access token already issued stays valid until it expires (max 5 minutes), so the client should discard it.

Most errors use the format `{ "error": { "message": "string", "status": 400 } }`. There are two exceptions:
* `/movies` routes return the error as a plain string: `{ "error": "Failed to fetch movies" }`.
* The `409` response from `POST /users/signup` has no `status` field: `{ "error": { "message": "You already have an account. Please sign in." } }`.
* The `401`/`403` responses from `POST /users/refresh` also have no `status` field.

---

## 2. Movies & Reviews (`/movies`)

| Endpoint | Method | Description | Parameters | Request Body | Status Codes | Auth Required | Error Statuses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/movies/now-playing` | `GET` | Get the first 5 movies currently playing in Finland (region `FI`) | None | None | `200 OK`, `500 Internal Error` | None | `500` (TMDB fetch failure) |
| `/movies/search` | `GET` | Search or filter movies by title, genre, or year. With `title`, all matching TMDB pages are fetched and filtered by `genre`/`year`. Without `title`, TMDB discover is used (first page only). Returns `[]` if nothing matches | `title` (Query, string), `genre` (Query, TMDB genre ID, e.g. `28` for Action), `year` (Query, e.g. `2024`) | None | `200 OK`, `500 Internal Error` | None | `500` |
| `/movies/:id` | `GET` | Get detailed information for a specific movie | `id` (Path, integer) | None | `200 OK`, `500 Internal Error` | None | `500` (TMDB failure, including an unknown movie id) |
| `/movies/:id/reviews` | `GET` | Get all reviews for a specific movie | `id` (Path, integer) | None | `200 OK`, `500 Internal Error` | None | `500` |
| `/movies/:id/reviews` | `POST` | Add a star rating and review text to a movie | `id` (Path, integer) | `{ "review_text": "string", "stars": 5 }` | `201 Created`, `400 Bad Request`, `401 Unauthorized`, `500 Internal Error` | Bearer Token | `400` (`review_text` empty, or `stars` not an integer from 1 to 5), `401`, `500` |

---

## 3. Favourites (`/favourites`)

| Endpoint | Method | Description | Parameters | Request Body | Status Codes | Auth Required | Error Statuses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/favourites` | `GET` | Get user's favorite movies with details (movies that TMDB fails to return are skipped) | None | None | `200 OK`, `401 Unauthorized` | Bearer Token | `401` |
| `/favourites` | `POST` | Add a movie to favorites | None | `{ "tmdbMovieId": 101 }` | `201 Created`, `200 OK`, `400 Bad Request` | Bearer Token | `400` (`tmdbMovieId` is missing), `401` |
| `/favourites/:movieId` | `DELETE` | Remove a movie from favorites | `movieId` (Path, integer) | None | `200 OK`, `401 Unauthorized`, `404 Not Found` | Bearer Token | `401`, `404` (Favourite not found) |
| `/favourites/share` | `POST` | Generate or fetch a shareable token link for favorites | None | None | `201 Created`, `200 OK`, `401 Unauthorized` | Bearer Token | `401` |
| `/favourites/share/:shareToken` | `GET` | View a user's favorite movies via share token | `shareToken` (Path, string) | None | `200 OK`, `404 Not Found` | None | `404` (Share link not found) |

---

## 4. Groups (`/groups`)

| Endpoint | Method | Description | Parameters | Request Body | Status Codes | Auth Required | Access | Error Statuses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/groups` | `GET` | List all community groups | None | None | `200 OK` | None | Public | `500` |
| `/groups` | `POST` | Create a new community group | None | `{ "name": "string" }` | `201 Created`, `400 Bad Request` | Bearer Token | Any user | `400` (Name is required), `401` |
| `/groups/my` | `GET` | List groups the current user belongs to | None | None | `200 OK`, `401 Unauthorized` | Bearer Token | Any user | `401` |
| `/groups/my/join-requests` | `GET` | View current user's outgoing join requests (all statuses: pending, accepted, rejected) | None | None | `200 OK`, `401 Unauthorized` | Bearer Token | Any user | `401` |
| `/groups/my/received-join-requests` | `GET` | View pending requests for groups owned by user (currently also includes pending invites sent from those groups) | None | None | `200 OK`, `401 Unauthorized` | Bearer Token | Any user | `401` |
| `/groups/my/invites` | `GET` | List invitations received by current user | None | None | `200 OK`, `401 Unauthorized` | Bearer Token | Any user | `401` |
| `/groups/:groupId` | `GET` | Get details of a single group | `groupId` (Path, integer) | None | `200 OK`, `403 Forbidden`, `404 Not Found` | Bearer Token | Member | `403` (Not a member), `404` |
| `/groups/:groupId` | `DELETE` | Delete a group | `groupId` (Path, integer) | None | `200 OK`, `403 Forbidden`, `404 Not Found` | Bearer Token | Owner | `403` (Not owner), `404` |
| `/groups/:groupId/members` | `GET` | List members of a group | `groupId` (Path, integer) | None | `200 OK`, `403 Forbidden`, `404 Not Found` | Bearer Token | Member | `403`, `404` |
| `/groups/:groupId/members` | `POST` | Invite a user to a group by email (any member can invite) | `groupId` (Path, integer) | `{ "email": "string" }` | `201 Created`, `400 Bad Request`, `403 Forbidden`, `404 Not Found` | Bearer Token | Member | `400` (Email missing, user already a member, or already has a pending request/invite), `403` (Caller not a member), `404` (Group or user not found) |
| `/groups/:groupId/members/:userId` | `DELETE` | Remove a member from group | `groupId`, `userId` (Path) | None | `200 OK`, `400 Bad Request`, `403 Forbidden`, `404 Not Found` | Bearer Token | Owner | `400` (Cannot remove owner), `403` (Not owner), `404` (Group not found) |
| `/groups/:groupId/leave` | `DELETE` | Leave a group (Non-owner members) | `groupId` (Path, integer) | None | `200 OK`, `403 Forbidden`, `404 Not Found` | Bearer Token | Member (non-owner) | `403` (Owner cannot leave, or caller is not a member), `404` (Group not found) |
| `/groups/:groupId/join` | `POST` | Request to join a group | `groupId` (Path, integer) | None | `201 Created`, `400 Bad Request`, `500 Internal Error` | Bearer Token | Any user | `400` (Already a member, or a request/invite is already pending), `500` (Group does not exist; no 404 check is done) |
| `/groups/:groupId/join-requests` | `GET` | View pending join requests for a group | `groupId` (Path, integer) | None | `200 OK`, `403 Forbidden`, `404 Not Found` | Bearer Token | Owner | `403` (Not owner), `404` (Group not found) |
| `/groups/:groupId/movies` | `GET` | List group movies (TMDB IDs added by members) | `groupId` (Path, integer) | None | `200 OK`, `403 Forbidden`, `404 Not Found` | Bearer Token | Member | `403` (Not a member), `404` (Group not found) |
| `/groups/:groupId/movies` | `POST` | Add a movie to the group list | `groupId` (Path, integer) | `{ "tmdbMovieId": 101 }` | `201 Created`, `400 Bad Request`, `403 Forbidden`, `404 Not Found` | Bearer Token | Member | `400` (Missing `tmdbMovieId` or movie already in group), `403` (Not a member), `404` (Group not found) |
| `/groups/:groupId/movies/:tmdbMovieId` | `DELETE` | Remove a movie from group list. Returns `200` even if the movie was not in the list | `groupId`, `tmdbMovieId` (Path) | None | `200 OK`, `403 Forbidden`, `404 Not Found` | Bearer Token | Member | `403` (Not a member), `404` (Group not found) |
| `/groups/join-requests/:requestId/accept` | `PATCH` | Accept a user's join request | `requestId` (Path, integer) | None | `200 OK`, `404 Not Found` | Bearer Token | Owner | `404` (Request not found or unauthorized) |
| `/groups/join-requests/:requestId/reject` | `PATCH` | Reject a user's join request | `requestId` (Path, integer) | None | `200 OK`, `404 Not Found` | Bearer Token | Owner | `404` |
| `/groups/invites/:inviteId/accept` | `PATCH` | User accepts an invitation to join a group | `inviteId` (Path, integer) | None | `200 OK`, `404 Not Found` | Bearer Token | Invitee | `404` (Invitation not found) |
| `/groups/invites/:inviteId/reject` | `PATCH` | User declines an invitation to join a group | `inviteId` (Path, integer) | None | `200 OK`, `404 Not Found` | Bearer Token | Invitee | `404` |
| `/groups/:groupId/chat` | `POST` | Post a chat message in group | `groupId` (Path, integer) | `{ "text": "string" }` | `201 Created`, `400 Bad Request`, `403 Forbidden` | Bearer Token | Member | `400` (Empty message), `403` (Not a member) |
| `/groups/:groupId/chat` | `GET` | Retrieve chat messages for a group | `groupId` (Path, integer) | None | `200 OK`, `403 Forbidden` | Bearer Token | Member | `403` (Not a member) |

### Response Examples (Groups)

**`GET /groups/:groupId`** — `200 OK`
```json
{ "group_id": 1, "name": "Friday Movie Night", "owner_id": 1 }
```

**`POST /groups/:groupId/join`** — `201 Created`
```json
{ "request_id": 5, "group_id": 1, "user_id": 2, "status": "pending" }
```

**`PATCH /groups/join-requests/:requestId/accept`** — `200 OK`
```json
{ "message": "Join request accepted", "request_id": 5, "group_id": 1, "user_id": 2 }
```

**`PATCH /groups/join-requests/:requestId/reject`** — `200 OK`
```json
{
  "message": "Join request rejected",
  "request": { "request_id": 5, "group_id": 1, "user_id": 2, "status": "rejected" }
}
```

**`POST /groups/:groupId/chat`** — `201 Created`
```json
{
  "message_id": 10,
  "group_id": 1,
  "text": "Hello!",
  "created_at": "2026-10-07T12:00:00.000Z",
  "user_id": 1,
  "email": "user@example.com"
}
```

---

## 5. Real-Time Group Chat (Socket.IO)

Real-time group chat uses Socket.IO on the same host and port as the REST API. Messages are created with `POST /groups/:groupId/chat` (Section 4); the server then broadcasts them to the group room `group-<groupId>`. Clients cannot send messages through the socket itself.

| Endpoint | Method | Description | Parameters | Request Body | Status Codes | Auth Required | Error Statuses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` (Socket.IO handshake) | `CONNECT` | Open an authenticated socket connection | `auth.token` (Handshake) | `io(API_URL, { auth: { token: "jwt_token_string" } })` (raw JWT, without the `Bearer ` prefix; allowed origin is `http://localhost:${FRONTEND_PORT}`, default `3000`) | Connected, `connect_error` | Bearer Token (JWT in handshake) | `connect_error` (`Invalid or expired token`) |
| `joinGroup` | `EMIT` (Client → Server) | Join a group chat room to receive its messages (Members only) | `groupId` (integer) | `socket.emit("joinGroup", groupId, ack)` | `ok: true`, `ok: false` | JWT in handshake | `{ "ok": false, "error": "You are not a member of this group" }`, `{ "ok": false, "error": "Failed to join group" }` |
| `leaveGroup` | `EMIT` (Client → Server) | Leave a group chat room | `groupId` (integer) | `socket.emit("leaveGroup", groupId)` | None | JWT in handshake | None |
| `newMessage` | `ON` (Server → Client) | Receive a new message posted to the group (broadcast after `POST /groups/:groupId/chat` succeeds) | None | None | Sent only to sockets in room `group-<groupId>` | JWT in handshake | None |

---

### Common Error Responses
* **`400 Bad Request`**: Sent when validation fails (e.g., missing email, password requirements not met, duplicate entries, or a non-numeric `:groupId` such as `/groups/abc`, which returns `Invalid group id`).
* **`401 Unauthorized`**: Sent when missing or invalid authentication tokens block access.
* **`403 Forbidden`**: Sent when an authenticated user lacks administrative roles or group membership required for the action.
* **`404 Not Found`**: Sent when requested resources (users, groups, requests, or shares) do not exist.
* **`409 Conflict`**: Sent only by `POST /users/signup` when the email is already registered.
* **`500 Internal Server Error`**: Sent on unexpected server or external API exceptions.