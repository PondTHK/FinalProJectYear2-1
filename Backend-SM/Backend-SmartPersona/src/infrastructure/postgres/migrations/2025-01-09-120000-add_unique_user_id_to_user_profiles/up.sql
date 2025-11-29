-- Your SQL goes here
-- ============================================
-- เพิ่ม UNIQUE constraint บน user_id
-- เพื่อให้ user 1 คนมีโปรไฟล์ได้เพียง 1 โปรไฟล์เท่านั้น
-- และรองรับการทำงานของ UPSERT (INSERT ... ON CONFLICT)
-- ============================================

-- ตรวจสอบว่า constraint ยังไม่มีอยู่ก่อนเพิ่ม
DO $$
BEGIN
    -- ตรวจสอบว่า constraint ยังไม่มีอยู่ในตาราง user_profiles
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'user_profiles_user_id_unique'
        AND table_name = 'user_profiles'
        AND constraint_type = 'UNIQUE'
    ) THEN
        -- ถ้าไม่มี ให้เพิ่ม constraint
        ALTER TABLE user_profiles
        ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
        RAISE NOTICE 'Added user_profiles_user_id_unique constraint';
    ELSE
        -- ถ้ามีแล้ว แสดงว่าไม่ต้องทำอะไร
        RAISE NOTICE 'user_profiles_user_id_unique constraint already exists';
    END IF;
END $$;
