-- Your SQL goes here
-- เปิดใช้งาน UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ฟังก์ชันอัปเดต timestamp อัตโนมัติ
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ENUMs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('persona_user', 'company_user', 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended');
    END IF;
END
$$;

-- ตรวจสอบและสร้างตาราง users ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'users'
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            display_name VARCHAR(255),
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            role user_role NOT NULL DEFAULT 'persona_user',
            status user_status NOT NULL DEFAULT 'pending',
            ai_credits INTEGER NOT NULL DEFAULT 0,
            max_profiles INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        RAISE NOTICE 'Created users table';
    ELSE
        RAISE NOTICE 'users table already exists';
    END IF;
END
$$;

-- ตรวจสอบและสร้าง trigger ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_timestamp'
        AND event_object_table = 'users'
    ) THEN
        CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
        RAISE NOTICE 'Created set_timestamp trigger on users table';
    ELSE
        RAISE NOTICE 'set_timestamp trigger on users table already exists';
    END IF;
END
$$;
