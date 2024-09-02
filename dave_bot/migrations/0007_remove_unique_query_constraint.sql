-- Migration number: 0007 	 2024-09-02T17:53:00.714Z

-- rename old table
ALTER TABLE user_queries RENAME TO user_queries_old;

CREATE TABLE user_queries (
    user_query_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id BIGINT NOT NULL,
    chat_id BIGINT NOT NULL,
    location VARCHAR(255) NOT NULL,
    query VARCHAR(255) NOT NULL UNIQUE,
    min_price INTEGER NOT NULL,
    max_price INTEGER NOT NULL,
    min_bedrooms INTEGER NOT NULL,
    max_bedrooms INTEGER NOT NULL,
    available_from DATE NOT NULL,
    creation_date DATE NOT NULL DEFAULT (DATE('now')),
    search_radius_km FLOAT,
    target_latitude FLOAT,
    target_longitude FLOAT,

    CONSTRAINT unique_user_query
    UNIQUE (user_id, query) ON CONFLICT REPLACE

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE
);

-- copy data from old table to new table
INSERT INTO user_queries (user_id, chat_id, location, query, min_price, max_price, min_bedrooms, max_bedrooms, available_from, creation_date, search_radius_km, target_latitude, target_longitude)
SELECT user_id, chat_id, location, query, min_price, max_price, min_bedrooms, max_bedrooms, available_from, creation_date, search_radius_km, target_latitude, target_longitude
ORDER BY user_query_id;
