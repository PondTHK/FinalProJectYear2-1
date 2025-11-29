-- This file should undo anything in `up.sql`

-- ตรวจสอบและลบ trigger ก่อนลบตาราง
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_timestamp'
        AND event_object_table = 'companies'
    ) THEN
        DROP TRIGGER IF EXISTS set_timestamp ON companies;
        RAISE NOTICE 'Dropped set_timestamp trigger from companies table';
    ELSE
        RAISE NOTICE 'set_timestamp trigger on companies table does not exist';
    END IF;
END
$$;

-- ลบ index
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_companies_user_id'
    ) THEN
        DROP INDEX IF EXISTS idx_companies_user_id;
        RAISE NOTICE 'Dropped index idx_companies_user_id';
    ELSE
        RAISE NOTICE 'Index idx_companies_user_id does not exist';
    END IF;
END
$$;

-- ลบตาราง companies
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'companies'
        AND table_schema = 'public'
    ) THEN
        DROP TABLE IF EXISTS companies;
        RAISE NOTICE 'Dropped companies table';
    ELSE
        RAISE NOTICE 'companies table does not exist';
    END IF;
END
$$;

