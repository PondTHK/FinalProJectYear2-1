-- Your SQL goes here
-- Create user_educations table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_educations'
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE user_educations (
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            school VARCHAR(100) NOT NULL,
            degree VARCHAR(100) NOT NULL,
            major VARCHAR(100),
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (user_id, school, start_date)
        );
        RAISE NOTICE 'Created user_educations table';
    ELSE
        RAISE NOTICE 'user_educations table already exists';
    END IF;
END
$$;

-- Create user_experiences table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_experiences'
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE user_experiences (
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company VARCHAR(100) NOT NULL,
            position VARCHAR(100) NOT NULL,
            position_type VARCHAR(50),
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (user_id, company, start_date)
        );
        RAISE NOTICE 'Created user_experiences table';
    ELSE
        RAISE NOTICE 'user_experiences table already exists';
    END IF;
END
$$;

-- Create triggers for updated_at columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_user_educations_timestamp'
        AND event_object_table = 'user_educations'
    ) THEN
        CREATE TRIGGER set_user_educations_timestamp
        BEFORE UPDATE ON user_educations
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
        RAISE NOTICE 'Created set_user_educations_timestamp trigger';
    ELSE
        RAISE NOTICE 'set_user_educations_timestamp trigger already exists';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_user_experiences_timestamp'
        AND event_object_table = 'user_experiences'
    ) THEN
        CREATE TRIGGER set_user_experiences_timestamp
        BEFORE UPDATE ON user_experiences
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
        RAISE NOTICE 'Created set_user_experiences_timestamp trigger';
    ELSE
        RAISE NOTICE 'set_user_experiences_timestamp trigger already exists';
    END IF;
END
$$;

-- Add indexes for better performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_educations_user_id'
    ) THEN
        CREATE INDEX idx_user_educations_user_id ON user_educations(user_id);
        RAISE NOTICE 'Created idx_user_educations_user_id index';
    ELSE
        RAISE NOTICE 'idx_user_educations_user_id index already exists';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_experiences_user_id'
    ) THEN
        CREATE INDEX idx_user_experiences_user_id ON user_experiences(user_id);
        RAISE NOTICE 'Created idx_user_experiences_user_id index';
    ELSE
        RAISE NOTICE 'idx_user_experiences_user_id index already exists';
    END IF;
END
$$;
