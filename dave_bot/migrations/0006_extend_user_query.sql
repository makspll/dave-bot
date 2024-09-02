-- Migration number: 0006 	 2024-09-02T11:49:27.505Z

ALTER TABLE user_queries 
ADD COLUMN target_longitude FLOAT;

ALTER TABLE user_queries
ADD COLUMN target_latitude FLOAT;

ALTER TABLE user_queries
ADD COLUMN search_radius_km FLOAT;