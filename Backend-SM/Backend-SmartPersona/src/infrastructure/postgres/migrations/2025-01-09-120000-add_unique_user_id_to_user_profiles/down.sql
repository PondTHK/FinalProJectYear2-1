-- This file should undo anything in `up.sql`
-- ============================================
-- ลบ UNIQUE constraint บน user_id
-- ============================================

-- ตรวจสอบว่า constraint มีอยู่ก่อนลบเพื่อป้องกัน error
DO $$
BEGIN
    -- ตรวจสอบว่า constraint มีอยู่ในตาราง user_profiles หรือไม่
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'user_profiles_user_id_unique'
        AND table_name = 'user_profiles'
        AND constraint_type = 'UNIQUE'
    ) THEN
        -- ถ้ามีอยู่ ให้ลบ constraint
        ALTER TABLE user_profiles
        DROP CONSTRAINT user_profiles_user_id_unique;
        RAISE NOTICE 'Dropped user_profiles_user_id_unique constraint';
    ELSE
        -- ถ้าไม่มี แสดงว่าไม่ต้องทำอะไร
        RAISE NOTICE 'user_profiles_user_id_unique constraint does not exist';
    END IF;
END $$;
