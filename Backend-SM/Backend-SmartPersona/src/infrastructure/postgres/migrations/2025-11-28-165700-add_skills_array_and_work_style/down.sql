-- Drop index
DROP INDEX IF EXISTS idx_user_skills_skills;

-- Restore old columns in user_skills table
ALTER TABLE user_skills
ADD COLUMN IF NOT EXISTS skill_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS skill_type VARCHAR(50);

-- Migrate skills array back to skill_name (take first element)
UPDATE user_skills
SET skill_name = skills[1]
WHERE skills IS NOT NULL AND array_length(skills, 1) > 0;

-- Drop skills array column
ALTER TABLE user_skills
DROP COLUMN IF EXISTS skills;

-- Remove work_style column from social_analysis
ALTER TABLE social_analysis
DROP COLUMN IF EXISTS work_style;

