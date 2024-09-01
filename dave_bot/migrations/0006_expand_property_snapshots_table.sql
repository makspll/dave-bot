-- Migration number: 0006 	 2024-09-01T16:44:45.439Z

ALTER TABLE property_snapshots
ADD COLUMN num_bedrooms INTEGER NOT NULL DEFAULT 1;

ALTER TABLE property_snapshots
ADD COLUMN comma_separated_images TEXT NOT NULL DEFAULT "";
