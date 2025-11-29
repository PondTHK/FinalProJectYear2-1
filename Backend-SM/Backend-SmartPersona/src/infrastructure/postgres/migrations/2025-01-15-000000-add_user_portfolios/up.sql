-- Create user_portfolios table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_portfolios'
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE user_portfolios (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            image_url TEXT,
            link TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created user_portfolios table';
    ELSE
        RAISE NOTICE 'user_portfolios table already exists';
    END IF;
END
$$;

-- Create trigger for updated_at column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_user_portfolios_timestamp'
        AND event_object_table = 'user_portfolios'
    ) THEN
        CREATE TRIGGER set_user_portfolios_timestamp
        BEFORE UPDATE ON user_portfolios
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
        RAISE NOTICE 'Created set_user_portfolios_timestamp trigger';
    ELSE
        RAISE NOTICE 'set_user_portfolios_timestamp trigger already exists';
    END IF;
END
$$;

-- Add index for better performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_portfolios_user_id'
    ) THEN
        CREATE INDEX idx_user_portfolios_user_id ON user_portfolios(user_id);
        RAISE NOTICE 'Created idx_user_portfolios_user_id index';
    ELSE
        RAISE NOTICE 'idx_user_portfolios_user_id index already exists';
    END IF;
END
$$;

