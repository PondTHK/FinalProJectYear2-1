-- ตรวจสอบและลบ triggers
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'trigger_profile_shares_updated_at'
        AND event_object_table = 'profile_shares'
    ) THEN
        DROP TRIGGER IF EXISTS trigger_profile_shares_updated_at ON profile_shares;
        RAISE NOTICE 'Dropped trigger_profile_shares_updated_at trigger from profile_shares table';
    ELSE
        RAISE NOTICE 'trigger_profile_shares_updated_at trigger on profile_shares table does not exist';
    END IF;
END
$$;

-- ตรวจสอบและลบ function
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'update_profile_shares_updated_at'
    ) THEN
        DROP FUNCTION IF EXISTS update_profile_shares_updated_at();
        RAISE NOTICE 'Dropped update_profile_shares_updated_at function';
    ELSE
        RAISE NOTICE 'update_profile_shares_updated_at function does not exist';
    END IF;
END
$$;

-- ตรวจสอบและลบ indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_profile_shares_user_id'
    ) THEN
        DROP INDEX IF EXISTS idx_profile_shares_user_id;
        RAISE NOTICE 'Dropped idx_profile_shares_user_id index';
    ELSE
        RAISE NOTICE 'idx_profile_shares_user_id index does not exist';
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_profile_shares_token'
    ) THEN
        DROP INDEX IF EXISTS idx_profile_shares_token;
        RAISE NOTICE 'Dropped idx_profile_shares_token index';
    ELSE
        RAISE NOTICE 'idx_profile_shares_token index does not exist';
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_profile_shares_expires_at'
    ) THEN
        DROP INDEX IF EXISTS idx_profile_shares_expires_at;
        RAISE NOTICE 'Dropped idx_profile_shares_expires_at index';
    ELSE
        RAISE NOTICE 'idx_profile_shares_expires_at index does not exist';
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_profile_shares_is_active'
    ) THEN
        DROP INDEX IF EXISTS idx_profile_shares_is_active;
        RAISE NOTICE 'Dropped idx_profile_shares_is_active index';
    ELSE
        RAISE NOTICE 'idx_profile_shares_is_active index does not exist';
    END IF;
END
$$;

-- ตรวจสอบและลบตาราง
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'profile_shares'
        AND table_schema = 'public'
    ) THEN
        DROP TABLE IF EXISTS profile_shares;
        RAISE NOTICE 'Dropped profile_shares table';
    ELSE
        RAISE NOTICE 'profile_shares table does not exist';
    END IF;
END
$$;
