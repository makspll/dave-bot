-- Migration number: 0003 	 2024-08-15T19:08:32.722Z

-- remove game_submissions.bot_entry BOOLEAN NOT NULL DEFAULT FALSE column
-- add users.bot BOOLEAN NOT NULL DEFAULT FALSE column


-- save all users which have game submissions with bot_entry = TRUE
-- use temp table to store all users which are bots

CREATE TABLE temp_users AS
SELECT DISTINCT user_id
FROM game_submissions
WHERE bot_entry = TRUE;

ALTER TABLE game_submissions
DROP COLUMN bot_entry;

ALTER TABLE users
ADD COLUMN bot BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET bot = TRUE
WHERE user_id IN (SELECT user_id FROM temp_users);


DROP TABLE temp_users;
