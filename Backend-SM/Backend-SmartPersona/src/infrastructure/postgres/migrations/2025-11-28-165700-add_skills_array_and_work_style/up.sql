-- Add work_style column to social_analysis table
ALTER TABLE social_analysis
ADD COLUMN IF NOT EXISTS work_style TEXT;

-- Modify user_skills table: change skill_name from VARCHAR to TEXT[] array
-- First, add new column for skills array
ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Migrate existing skill_name data to skills array (if any exists)
-- This will convert single skill_name to array format
UPDATE user_skills
SET skills = ARRAY[skill_name]::TEXT[]
WHERE skills = '{}' AND skill_name IS NOT NULL;

-- Drop old skill_name column (after migration)
ALTER TABLE user_skills
DROP COLUMN IF EXISTS skill_name;

-- Drop skill_type column (not needed with array approach)
ALTER TABLE user_skills
DROP COLUMN IF EXISTS skill_type;

-- Create GIN index for faster array queries
CREATE INDEX IF NOT EXISTS idx_user_skills_skills ON user_skills USING GIN(skills);

