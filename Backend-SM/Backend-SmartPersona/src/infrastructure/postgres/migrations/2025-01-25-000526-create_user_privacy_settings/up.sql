-- Create user_privacy_settings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_privacy_settings'
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE user_privacy_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            show_profile BOOLEAN NOT NULL DEFAULT true,
            show_profile_image BOOLEAN NOT NULL DEFAULT true,
            show_cover_image BOOLEAN NOT NULL DEFAULT true,
            show_name BOOLEAN NOT NULL DEFAULT true,
            show_title BOOLEAN NOT NULL DEFAULT true,
            show_phone BOOLEAN NOT NULL DEFAULT false,
            show_line_id BOOLEAN NOT NULL DEFAULT false,
            show_email BOOLEAN NOT NULL DEFAULT false,
            show_gender BOOLEAN NOT NULL DEFAULT false,
            show_birth_date BOOLEAN NOT NULL DEFAULT false,
            show_nationality BOOLEAN NOT NULL DEFAULT true,
            show_religion BOOLEAN NOT NULL DEFAULT false,
            show_military_status BOOLEAN NOT NULL DEFAULT false,
            show_address BOOLEAN NOT NULL DEFAULT true,
            show_experiences BOOLEAN NOT NULL DEFAULT true,
            show_educations BOOLEAN NOT NULL DEFAULT true,
            show_job_preference BOOLEAN NOT NULL DEFAULT true,
            show_portfolios BOOLEAN NOT NULL DEFAULT true,
            show_skills BOOLEAN NOT NULL DEFAULT true,
            show_about_me BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        RAISE NOTICE 'Created user_privacy_settings table';
    ELSE
        RAISE NOTICE 'user_privacy_settings table already exists';
    END IF;
END
$$;

-- Create index for user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_privacy_settings_user_id'
    ) THEN
        CREATE INDEX idx_user_privacy_settings_user_id ON user_privacy_settings(user_id);
        RAISE NOTICE 'Created index idx_user_privacy_settings_user_id';
    ELSE
        RAISE NOTICE 'Index idx_user_privacy_settings_user_id already exists';
    END IF;
END
$$;

-- Create trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_timestamp_user_privacy_settings'
        AND event_object_table = 'user_privacy_settings'
    ) THEN
        CREATE TRIGGER set_timestamp_user_privacy_settings
        BEFORE UPDATE ON user_privacy_settings
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
        RAISE NOTICE 'Created set_timestamp trigger on user_privacy_settings table';
    ELSE
        RAISE NOTICE 'set_timestamp trigger on user_privacy_settings table already exists';
    END IF;
END
$$;


