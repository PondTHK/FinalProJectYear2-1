-- Add level column to user_ai_scores
ALTER TABLE user_ai_scores 
ADD COLUMN level VARCHAR(50);

-- Add index on level for filtering
CREATE INDEX idx_user_ai_scores_level ON user_ai_scores(level);
