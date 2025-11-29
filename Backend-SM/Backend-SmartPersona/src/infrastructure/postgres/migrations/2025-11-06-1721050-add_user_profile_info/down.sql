-- This file should undo anything in `up.sql`

-- ตรวจสอบและลบ trigger จาก user_profiles
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_timestamp'
        AND event_object_table = 'user_profiles'
    ) THEN
        DROP TRIGGER IF EXISTS set_timestamp ON user_profiles;
        RAISE NOTICE 'Dropped set_timestamp trigger from user_profiles table';
    ELSE
        RAISE NOTICE 'set_timestamp trigger on user_profiles table does not exist';
    END IF;
END
$$;

-- ตรวจสอบและลบ trigger จาก user_addresses
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_timestamp'
        AND event_object_table = 'user_addresses'
    ) THEN
        DROP TRIGGER IF EXISTS set_timestamp ON user_addresses;
        RAISE NOTICE 'Dropped set_timestamp trigger from user_addresses table';
    ELSE
        RAISE NOTICE 'set_timestamp trigger on user_addresses table does not exist';
    END IF;
END
$$;

-- ลบตาราง user_job_preferences
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_job_preferences'
        AND table_schema = 'public'
    ) THEN
        DROP TABLE IF EXISTS user_job_preferences;
        RAISE NOTICE 'Dropped user_job_preferences table';
    ELSE
        RAISE NOTICE 'user_job_preferences table does not exist';
    END IF;
END
$$;

-- ลบตาราง user_addresses
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_addresses'
        AND table_schema = 'public'
    ) THEN
        DROP TABLE IF EXISTS user_addresses;
        RAISE NOTICE 'Dropped user_addresses table';
    ELSE
        RAISE NOTICE 'user_addresses table does not exist';
    END IF;
END
$$;

-- ลบตาราง user_profiles
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_profiles'
        AND table_schema = 'public'
    ) THEN
        DROP TABLE IF EXISTS user_profiles;
        RAISE NOTICE 'Dropped user_profiles table';
    ELSE
        RAISE NOTICE 'user_profiles table does not exist';
    END IF;
END
$$;
