-- Add template field to user_profiles table
DO $$
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'template'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_profiles
        ADD COLUMN template VARCHAR(50) DEFAULT 'classic';
        
        -- Update existing records to have 'classic' as default
        UPDATE user_profiles
        SET template = 'classic'
        WHERE template IS NULL;
        
        RAISE NOTICE 'Added template column to user_profiles table';
    ELSE
        RAISE NOTICE 'template column already exists in user_profiles table';
    END IF;
END
$$;


