-- Drop index
DROP INDEX IF EXISTS idx_user_portfolios_user_id;

-- Drop trigger
DROP TRIGGER IF EXISTS set_user_portfolios_timestamp ON user_portfolios;

-- Drop table
DROP TABLE IF EXISTS user_portfolios;

