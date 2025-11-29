-- Remove email field from user_profiles table
DO $$
BEGIN
    -- Check if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'email'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_profiles
        DROP COLUMN email;
        
        RAISE NOTICE 'Removed email column from user_profiles table';
    ELSE
        RAISE NOTICE 'email column does not exist in user_profiles table';
    END IF;
END
$$;
