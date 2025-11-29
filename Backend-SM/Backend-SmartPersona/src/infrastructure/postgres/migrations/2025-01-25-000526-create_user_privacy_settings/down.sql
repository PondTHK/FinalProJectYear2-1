-- Drop trigger
DROP TRIGGER IF EXISTS set_timestamp_user_privacy_settings ON user_privacy_settings;

-- Drop index
DROP INDEX IF EXISTS idx_user_privacy_settings_user_id;

-- Drop table
DROP TABLE IF EXISTS user_privacy_settings;


