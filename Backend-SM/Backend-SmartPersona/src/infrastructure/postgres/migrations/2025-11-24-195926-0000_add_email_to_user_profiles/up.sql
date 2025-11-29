-- Add email field to user_profiles table
DO $$
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'email'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_profiles
        ADD COLUMN email VARCHAR(255);
        
        RAISE NOTICE 'Added email column to user_profiles table';
    ELSE
        RAISE NOTICE 'email column already exists in user_profiles table';
    END IF;
END
$$;
