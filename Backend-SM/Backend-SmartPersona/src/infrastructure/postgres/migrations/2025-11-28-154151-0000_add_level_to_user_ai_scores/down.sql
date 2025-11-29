-- Remove level column from user_ai_scores
DROP INDEX IF EXISTS idx_user_ai_scores_level;
ALTER TABLE user_ai_scores DROP COLUMN level;
