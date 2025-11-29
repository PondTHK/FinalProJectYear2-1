-- This file should undo anything in `up.sql`

-- ตรวจสอบและลบ trigger ก่อนลบตาราง
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_timestamp'
        AND event_object_table = 'users'
    ) THEN
        DROP TRIGGER IF EXISTS set_timestamp ON users;
        RAISE NOTICE 'Dropped set_timestamp trigger from users table';
    ELSE
        RAISE NOTICE 'set_timestamp trigger on users table does not exist';
    END IF;
END
$$;

-- ลบตาราง users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'users'
        AND table_schema = 'public'
    ) THEN
        DROP TABLE IF EXISTS users;
        RAISE NOTICE 'Dropped users table';
    ELSE
        RAISE NOTICE 'users table does not exist';
    END IF;
END
$$;

-- ลบฟังก์ชัน trigger_set_timestamp
DROP FUNCTION IF EXISTS trigger_set_timestamp() CASCADE;

-- ลบ ENUM types
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        DROP TYPE IF EXISTS user_role CASCADE;
        RAISE NOTICE 'Dropped user_role type';
    ELSE
        RAISE NOTICE 'user_role type does not exist';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        DROP TYPE IF EXISTS user_status CASCADE;
        RAISE NOTICE 'Dropped user_status type';
    ELSE
        RAISE NOTICE 'user_status type does not exist';
    END IF;
END
$$;
