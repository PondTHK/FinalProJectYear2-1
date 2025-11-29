DROP TRIGGER IF EXISTS set_timestamp ON company_posts;
DROP TABLE IF EXISTS company_posts;
DROP TABLE IF EXISTS company_galleries;
ALTER TABLE companies DROP COLUMN IF EXISTS is_verified;
ALTER TABLE companies DROP COLUMN IF EXISTS vision;
ALTER TABLE companies DROP COLUMN IF EXISTS mission;
ALTER TABLE companies DROP COLUMN IF EXISTS founded_year;
ALTER TABLE companies DROP COLUMN IF EXISTS logo_url;
