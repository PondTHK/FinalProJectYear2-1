-- Remove template field from user_profiles table
DO $$
BEGIN
    -- Check if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'template'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_profiles
        DROP COLUMN template;
        
        RAISE NOTICE 'Removed template column from user_profiles table';
    ELSE
        RAISE NOTICE 'template column does not exist in user_profiles table';
    END IF;
END
$$;


