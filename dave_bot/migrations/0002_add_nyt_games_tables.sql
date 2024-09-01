-- Migration number: 0002 	 2024-08-11T13:33:15.004Z
CREATE TABLE game_submissions (
    game_id BIGINT,
    game_type VARCHAR(20),
    user_id BIGINT,
    submission VARCHAR(255) NOT NULL,
    submission_date DATE NOT NULL DEFAULT (DATE('now')),
    bot_entry BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, game_type, user_id)
);