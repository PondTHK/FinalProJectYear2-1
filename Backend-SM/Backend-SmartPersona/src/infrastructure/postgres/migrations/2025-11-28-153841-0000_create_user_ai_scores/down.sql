-- Drop user_ai_scores table
DROP INDEX IF EXISTS idx_user_ai_scores_score;
DROP INDEX IF EXISTS idx_user_ai_scores_user_id;
DROP TABLE IF EXISTS user_ai_scores;
