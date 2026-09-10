CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);


CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner_id INTEGER NOT NULL,

    FOREIGN KEY (owner_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


CREATE TABLE group_members (
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    PRIMARY KEY (group_id, user_id),

    FOREIGN KEY (group_id)
        REFERENCES groups(group_id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


CREATE TABLE join_requests (
    request_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',

    FOREIGN KEY (group_id)
        REFERENCES groups(group_id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CHECK (status IN ('pending', 'accepted', 'rejected'))
);


CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    tmdb_movie_id INTEGER NOT NULL,
    review_text TEXT NOT NULL,
    stars INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CHECK (stars BETWEEN 1 AND 5)
);


CREATE TABLE favorites (
    favorite_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    tmdb_movie_id INTEGER NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    UNIQUE (user_id, tmdb_movie_id)
);


CREATE TABLE group_movies (
    group_movie_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    tmdb_movie_id INTEGER NOT NULL,
    added_by INTEGER NOT NULL,

    FOREIGN KEY (group_id)
        REFERENCES groups(group_id)
        ON DELETE CASCADE,

    FOREIGN KEY (added_by)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    UNIQUE (group_id, tmdb_movie_id)
);


CREATE TABLE chat (
    message_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (group_id)
        REFERENCES groups(group_id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);