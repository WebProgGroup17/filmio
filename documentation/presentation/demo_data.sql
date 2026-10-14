-- Filmio demo data. 
-- Run the WHOLE script at once in pgAdmin.
-- Passwords for ALL users: Test1234

-- 1. Delete ALL data and restart id counters from 1
TRUNCATE TABLE chat, group_movies, favorite_shares, favorites, reviews,
               join_requests, group_members, groups, users
RESTART IDENTITY CASCADE;

-- 2. The special "deleted user"
INSERT INTO users (email, password_hash)
VALUES ('deleted user', '!')
ON CONFLICT (email) DO NOTHING;

-- 3. Demo users (password Test1234) + helper users
INSERT INTO users (email, password_hash) VALUES
 ('test@email.com',  '$2b$10$PsoeTTXSHoGQn65lNzFrjuvFHKMt/TUvVtQwP9bvSsHgdrGv5scba'),
 ('test2@email.com', '$2b$10$PsoeTTXSHoGQn65lNzFrjuvFHKMt/TUvVtQwP9bvSsHgdrGv5scba'),
 ('anna@email.com',  '$2b$10$PsoeTTXSHoGQn65lNzFrjuvFHKMt/TUvVtQwP9bvSsHgdrGv5scba'),
 ('mikko@email.com', '$2b$10$PsoeTTXSHoGQn65lNzFrjuvFHKMt/TUvVtQwP9bvSsHgdrGv5scba'),
 ('pekka@email.com', '$2b$10$PsoeTTXSHoGQn65lNzFrjuvFHKMt/TUvVtQwP9bvSsHgdrGv5scba'),
 ('laura@email.com', '$2b$10$PsoeTTXSHoGQn65lNzFrjuvFHKMt/TUvVtQwP9bvSsHgdrGv5scba');

-- 4. Groups
-- Group 1: owner deleted his account -> owner is "deleted user"
INSERT INTO groups (name, owner_id) VALUES
 ('Elokuvaklubi', (SELECT user_id FROM users WHERE email = 'deleted user'));
-- Group 2: remove member, accept request, chat (owner test)
INSERT INTO groups (name, owner_id) VALUES
 ('Sci-Fi Club', (SELECT user_id FROM users WHERE email = 'test@email.com'));
-- Groups 3 and 4: owned by test2, only needed to send invitations to test
INSERT INTO groups (name, owner_id) VALUES
 ('Horror Fans',      (SELECT user_id FROM users WHERE email = 'test2@email.com')),
 ('Animation Lovers', (SELECT user_id FROM users WHERE email = 'test2@email.com'));

-- 5. Group members (owners are members too, like the app does it)
INSERT INTO group_members (group_id, user_id)
SELECT g.group_id, u.user_id
FROM (VALUES
  ('Elokuvaklubi',        'test@email.com'),
  ('Elokuvaklubi',        'test2@email.com'),
  ('Elokuvaklubi',        'anna@email.com'),
  ('Sci-Fi Club',         'test@email.com'),
  ('Sci-Fi Club',         'test2@email.com'),
  ('Sci-Fi Club',         'anna@email.com'),
  ('Sci-Fi Club',         'mikko@email.com'),
  ('Horror Fans',         'test2@email.com'),
  ('Animation Lovers',    'test2@email.com')
) AS v(group_name, email)
JOIN groups g ON g.name = v.group_name
JOIN users  u ON u.email = v.email;

-- 6. Invitations to test@email.com (shown on My Account) + a join request
INSERT INTO join_requests (group_id, user_id, status, type)
SELECT g.group_id, u.user_id, 'pending', v.type
FROM (VALUES
  ('Horror Fans',      'test@email.com',  'invite'),
  ('Animation Lovers', 'test@email.com',  'invite'),
  ('Sci-Fi Club',      'pekka@email.com', 'request')
) AS v(group_name, email, type)
JOIN groups g ON g.name = v.group_name
JOIN users  u ON u.email = v.email;

-- 7. Group movies (TMDB ids)
INSERT INTO group_movies (group_id, tmdb_movie_id, added_by)
SELECT g.group_id, v.movie_id, u.user_id
FROM (VALUES
  ('Elokuvaklubi', 27205, 'deleted user'),     -- Inception
  ('Elokuvaklubi', 157336, 'deleted user'),    -- Interstellar
  ('Elokuvaklubi', 155, 'test@email.com'),     -- The Dark Knight
  ('Elokuvaklubi', 129, 'anna@email.com'),     -- Spirited Away
  ('Sci-Fi Club',  157336, 'test@email.com'),   -- Interstellar
  ('Sci-Fi Club',  27205, 'mikko@email.com')    -- Inception
) AS v(group_name, movie_id, email)
JOIN groups g ON g.name = v.group_name
JOIN users  u ON u.email = v.email;

-- 8. Chat messages
INSERT INTO chat (group_id, user_id, text, created_at)
SELECT g.group_id, u.user_id, v.text, v.created_at::timestamp
FROM (VALUES
  ('Elokuvaklubi', 'deleted user',   'Welcome to Elokuvaklubi! Let''s pick a movie for Friday.', '2026-09-20 18:05:00'),
  ('Elokuvaklubi', 'anna@email.com', 'I vote for Inception, it is great.',                       '2026-09-20 18:12:00'),
  ('Elokuvaklubi', 'deleted user',   'Good idea, I will add it to our list.',                    '2026-09-20 18:15:00'),
  ('Elokuvaklubi', 'test@email.com', 'Interstellar is also a good choice.',                      '2026-09-21 09:30:00'),
  ('Elokuvaklubi', 'test2@email.com','See you all on Friday!',                                   '2026-09-21 10:02:00'),
  ('Sci-Fi Club',  'test@email.com', 'Hi everyone, welcome to the Sci-Fi Club!',                 '2026-10-05 17:00:00'),
  ('Sci-Fi Club',  'mikko@email.com','Thanks! I just added Inception to the list.',              '2026-10-05 17:04:00')
) AS v(group_name, email, text, created_at)
JOIN groups g ON g.name = v.group_name
JOIN users  u ON u.email = v.email;

-- 9. Reviews for Harry Potter and the Prisoner of Azkaban (TMDB id 673)
INSERT INTO reviews (user_id, tmdb_movie_id, review_text, stars, created_at)
SELECT u.user_id, 673, v.review_text, v.stars, v.created_at::timestamp
FROM (VALUES
  ('anna@email.com',  'My favourite Harry Potter film! The time-turner scenes are brilliant.', 5, '2026-01-14 19:20:00'),
  ('mikko@email.com', 'Darker and more mature than the first two movies. Great atmosphere.',  4, '2026-03-02 21:45:00'),
  ('pekka@email.com', 'Good, but the book has much more detail. Some parts felt rushed.',     3, '2026-04-18 14:10:00'),
  ('laura@email.com', 'Beautiful music and Sirius Black is a great character.',               5, '2026-06-07 20:05:00'),
  ('test2@email.com', 'Fun to watch again, but not the best one in the series for me.',       3, '2026-08-23 16:40:00'),
  ('anna@email.com',  'Watched it again with my family. Still amazing after many years.',     5, '2026-09-30 18:30:00'),
  ('mikko@email.com', 'The Dementors are scary! Not so good for small children.',             2, '2026-10-09 22:15:00')
) AS v(email, review_text, stars, created_at)
JOIN users u ON u.email = v.email;

-- 10. Favourites for test@email.com (no share link: it is created live in the demo)
INSERT INTO favorites (user_id, tmdb_movie_id)
SELECT u.user_id, v.movie_id
FROM (VALUES
  ('test@email.com', 673),      -- Harry Potter and the Prisoner of Azkaban
  ('test@email.com', 27205),    -- Inception
  ('test@email.com', 157336),   -- Interstellar
  ('test@email.com', 129),      -- Spirited Away
  ('test@email.com', 155),      -- The Dark Knight
  ('test@email.com', 808)       -- Shrek
) AS v(email, movie_id)
JOIN users u ON u.email = v.email;