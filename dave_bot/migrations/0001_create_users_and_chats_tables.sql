-- Migration number: 0001 	 2024-08-03T11:25:34.735Z
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,
    alias VARCHAR(255),
    consent_date DATE NOT NULL
);

CREATE TABLE chats (
    chat_id BIGINT PRIMARY KEY,
    alias VARCHAR(255)
);

CREATE TABLE chat_users (
    chat_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (chat_id, user_id)
);