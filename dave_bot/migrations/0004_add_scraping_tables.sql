-- Migration number: 0004 	 2024-08-29T20:15:45.682Z

CREATE TABLE property_snapshots (
    property_id VARCHAR(255) NOT NULL,
    search_id BIGINT NOT NULL,
    url VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    price_per_month INTEGER NOT NULL,
    longitude FLOAT NOT NULL,
    latitude FLOAT NOT NULL,
    property_type VARCHAR(20) NOT NULL,
    summary_description TEXT NOT NULL,
    published_on DATE,
    available_from DATE,

    PRIMARY KEY (property_id, search_id),
    FOREIGN KEY (search_id) REFERENCES searches(search_id) ON DELETE CASCADE
);

CREATE TABLE searches (
    search_id BIGINT PRIMARY KEY NOT NULL AUTOINCREMENT,
    user_query_id BIGINT NOT NULL,
    search_datetime TIMESTAMP NOT NULL DEFAULT (TIMESTAMP('now')),

    FOREIGN KEY (user_query_id) REFERENCES user_queries(user_query_id) ON DELETE CASCADE
);

CREATE TABLE user_queries (
    user_query_id BIGINT PRIMARY KEY NOT NULL AUTOINCREMENT,
    user_id BIGINT NOT NULL,
    query VARCHAR(255) NOT NULL UNIQUE,
    creation_date DATE NOT NULL DEFAULT (DATE('now')),

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);