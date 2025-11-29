-- Drop social_analysis table
DROP TABLE IF EXISTS social_analysis;

-- Drop social_posts table
DROP TABLE IF EXISTS social_posts;

-- Remove columns from social_connections
ALTER TABLE social_connections
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS profile_image;
