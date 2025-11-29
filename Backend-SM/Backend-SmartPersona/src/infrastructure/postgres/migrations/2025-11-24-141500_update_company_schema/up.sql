-- Add columns to companies
DO $$
BEGIN
    -- logo_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='logo_url') THEN
        ALTER TABLE companies ADD COLUMN logo_url TEXT;
    END IF;
    -- founded_year
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='founded_year') THEN
        ALTER TABLE companies ADD COLUMN founded_year VARCHAR(4);
    END IF;
    -- mission
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='mission') THEN
        ALTER TABLE companies ADD COLUMN mission TEXT;
    END IF;
    -- vision
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='vision') THEN
        ALTER TABLE companies ADD COLUMN vision TEXT;
    END IF;
    -- is_verified
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='is_verified') THEN
        ALTER TABLE companies ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create company_galleries table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_galleries') THEN
        CREATE TABLE company_galleries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    END IF;
END $$;

-- Create company_posts table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_posts') THEN
        CREATE TABLE company_posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            job_type VARCHAR(50) NOT NULL,
            salary_range VARCHAR(100),
            tags TEXT[],
            status VARCHAR(50) NOT NULL DEFAULT 'Active',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    END IF;
END $$;

-- Trigger for company_posts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'set_timestamp' AND event_object_table = 'company_posts') THEN
        CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON company_posts
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
    END IF;
END $$;
