-- Migration number: 0002 	 2024-08-03T11:44:33.443Z

-- Change the data type of user_id in the users table to BIGINT
ALTER TABLE users
ALTER COLUMN user_id SET DATA TYPE BIGINT;

-- Change the data type of chat_id in the chats table to BIGINT
ALTER TABLE chats
ALTER COLUMN chat_id SET DATA TYPE BIGINT;

-- Change the data type of chat_id and user_id in the chat_users table to BIGINT
ALTER TABLE chat_users
ALTER COLUMN chat_id SET DATA TYPE BIGINT,
ALTER COLUMN user_id SET DATA TYPE BIGINT;