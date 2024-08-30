-- Migration number: 0005 	 2024-08-29T21:21:32.516Z

CREATE TABLE permissions (
    permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id BIGINT NOT NULL,
    permission VARCHAR(255) NOT NULL,
    creation_date DATE NOT NULL DEFAULT (DATE('now')),

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);