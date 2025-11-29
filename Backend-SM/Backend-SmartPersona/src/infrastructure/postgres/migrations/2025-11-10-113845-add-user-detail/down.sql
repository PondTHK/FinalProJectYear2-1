-- This file should undo anything in `up.sql`

-- ตรวจสอบและลบ indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_educations_user_id'
    ) THEN
        DROP INDEX IF EXISTS idx_user_educations_user_id;
        RAISE NOTICE 'Dropped idx_user_educations_user_id index';
    ELSE
        RAISE NOTICE 'idx_user_educations_user_id index does not exist';
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_experiences_user_id'
    ) THEN
        DROP INDEX IF EXISTS idx_user_experiences_user_id;
        RAISE NOTICE 'Dropped idx_user_experiences_user_id index';
    ELSE
        RAISE NOTICE 'idx_user_experiences_user_id index does not exist';
    END IF;
END
$$;

-- ตรวจสอบและลบ triggers
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_user_educations_timestamp'
        AND event_object_table = 'user_educations'
    ) THEN
        DROP TRIGGER IF EXISTS set_user_educations_timestamp ON user_educations;
        RAISE NOTICE 'Dropped set_user_educations_timestamp trigger from user_educations table';
    ELSE
        RAISE NOTICE 'set_user_educations_timestamp trigger on user_educations table does not exist';
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_user_experiences_timestamp'
        AND event_object_table = 'user_experiences'
    ) THEN
        DROP TRIGGER IF EXISTS set_user_experiences_timestamp ON user_experiences;
        RAISE NOTICE 'Dropped set_user_experiences_timestamp trigger from user_experiences table';
    ELSE
        RAISE NOTICE 'set_user_experiences_timestamp trigger on user_experiences table does not exist';
    END IF;
END
$$;

-- ตรวจสอบและลบ tables
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_educations'
        AND table_schema = 'public'
    ) THEN
        DROP TABLE IF EXISTS user_educations;
        RAISE NOTICE 'Dropped user_educations table';
    ELSE
        RAISE NOTICE 'user_educations table does not exist';
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_experiences'
        AND table_schema = 'public'
    ) THEN
        DROP TABLE IF EXISTS user_experiences;
        RAISE NOTICE 'Dropped user_experiences table';
    ELSE
        RAISE NOTICE 'user_experiences table does not exist';
    END IF;
END
$$;
```

## 3. แก้ไข `2025-12-08-add_profile_shares`
<tool_call>read_file
<arg_key>path</arg_key>
<arg_value>E:/Github/SMPJ/Backend-SM/Backend-SmartPersona/src/infrastructure/postgres/migrations/2025-12-08-add_profile_shares/up.sql</arg_value>
</tool_call>
