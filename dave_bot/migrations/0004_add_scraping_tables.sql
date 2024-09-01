-- Migration number: 0004 	 2024-08-29T20:15:45.682Z

CREATE TABLE property_snapshots (
    property_id VARCHAR(255) PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    price_per_month INTEGER NOT NULL,
    longitude FLOAT NOT NULL,
    latitude FLOAT NOT NULL,
    property_type VARCHAR(20) NOT NULL,
    summary_description TEXT NOT NULL,
    published_on DATE,
    available_from DATE,
    shown BOOLEAN NOT NULL DEFAULT FALSE,
    num_bedrooms INTEGER NOT NULL DEFAULT 0,
    comma_separated_images TEXT NOT NULL DEFAULT "";
);

CREATE TABLE user_queries (
    user_query_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id BIGINT NOT NULL,
    location VARCHAR(255) NOT NULL,
    query VARCHAR(255) NOT NULL UNIQUE,
    min_price INTEGER NOT NULL,
    max_price INTEGER NOT NULL,
    min_bedrooms INTEGER NOT NULL,
    max_bedrooms INTEGER NOT NULL,
    available_from DATE NOT NULL,
    creation_date DATE NOT NULL DEFAULT (DATE('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);