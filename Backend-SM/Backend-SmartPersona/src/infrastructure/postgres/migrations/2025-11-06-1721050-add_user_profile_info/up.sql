-- Your SQL goes here
-- ============================================
-- 1. สร้างตาราง user_profiles
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_profiles'
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE user_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(50),
            first_name_th VARCHAR(255),
            last_name_th VARCHAR(255),
            first_name_en VARCHAR(255),
            last_name_en VARCHAR(255),
            gender VARCHAR(20),
            birth_date DATE,
            religion VARCHAR(100),
            nationality VARCHAR(100),
            phone VARCHAR(50),
            line_id VARCHAR(100),
            military_status VARCHAR(100),
            is_disabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created user_profiles table';
    ELSE
        RAISE NOTICE 'user_profiles table already exists';
    END IF;
END
$$;

-- trigger สำหรับอัปเดต updated_at บน user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_timestamp'
        AND event_object_table = 'user_profiles'
    ) THEN
        CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON user_profiles
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
        RAISE NOTICE 'Created set_timestamp trigger on user_profiles table';
    ELSE
        RAISE NOTICE 'set_timestamp trigger on user_profiles table already exists';
    END IF;
END
$$;

-- ============================================
-- 2. สร้างตาราง user_addresses
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_addresses'
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE user_addresses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            province VARCHAR(100),
            district VARCHAR(100),
            subdistrict VARCHAR(100),
            postal_code VARCHAR(10),
            address_detail TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created user_addresses table';
    ELSE
        RAISE NOTICE 'user_addresses table already exists';
    END IF;
END
$$;

-- trigger สำหรับอัปเดต updated_at บน user_addresses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_timestamp'
        AND event_object_table = 'user_addresses'
    ) THEN
        CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON user_addresses
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
        RAISE NOTICE 'Created set_timestamp trigger on user_addresses table';
    ELSE
        RAISE NOTICE 'set_timestamp trigger on user_addresses table already exists';
    END IF;
END
$$;

-- ============================================
-- 3. สร้างตาราง user_job_preferences
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_job_preferences'
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE user_job_preferences (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            position VARCHAR(255) NOT NULL,
            work_time VARCHAR(100),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created user_job_preferences table';
    ELSE
        RAISE NOTICE 'user_job_preferences table already exists';
    END IF;
END
$$;
