-- Your SQL goes here
-- สร้างตาราง companies สำหรับเก็บข้อมูลบริษัท
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'companies'
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE companies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            company_name VARCHAR(255) NOT NULL,
            industry VARCHAR(255),
            website_url VARCHAR(500),
            company_size VARCHAR(100),
            description TEXT,
            phone VARCHAR(50),
            address_detail TEXT,
            province VARCHAR(100),
            district VARCHAR(100),
            subdistrict VARCHAR(100),
            postal_code VARCHAR(10),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        RAISE NOTICE 'Created companies table';
    ELSE
        RAISE NOTICE 'companies table already exists';
    END IF;
END
$$;

-- สร้าง index สำหรับ user_id เพื่อเพิ่มประสิทธิภาพการค้นหา
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_companies_user_id'
    ) THEN
        CREATE INDEX idx_companies_user_id ON companies(user_id);
        RAISE NOTICE 'Created index idx_companies_user_id';
    ELSE
        RAISE NOTICE 'Index idx_companies_user_id already exists';
    END IF;
END
$$;

-- สร้าง trigger สำหรับอัปเดต updated_at บน companies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'set_timestamp'
        AND event_object_table = 'companies'
    ) THEN
        CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON companies
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
        RAISE NOTICE 'Created set_timestamp trigger on companies table';
    ELSE
        RAISE NOTICE 'set_timestamp trigger on companies table already exists';
    END IF;
END
$$;

