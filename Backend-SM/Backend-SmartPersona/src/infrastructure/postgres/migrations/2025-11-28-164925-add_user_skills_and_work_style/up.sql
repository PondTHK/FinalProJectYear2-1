-- Add work_style column to social_analysis table
ALTER TABLE social_analysis
ADD COLUMN IF NOT EXISTS work_style TEXT;

-- Drop old user_skills table if it exists (from previous migration)
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TRIGGER IF EXISTS trigger_update_user_skills_updated_at ON user_skills;
DROP FUNCTION IF EXISTS update_user_skills_updated_at();

-- Add skills array column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Create GIN index for faster array queries (useful for searching skills)
CREATE INDEX IF NOT EXISTS idx_user_profiles_skills ON user_profiles USING GIN(skills);

