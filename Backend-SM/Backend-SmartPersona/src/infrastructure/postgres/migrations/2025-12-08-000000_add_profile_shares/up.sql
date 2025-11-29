-- สร้างตารางสำหรับเก็บ share links ของ user profiles
CREATE TABLE IF NOT EXISTS profile_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_token VARCHAR(128) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profile_shares_user_id ON profile_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_shares_token ON profile_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_profile_shares_expires_at ON profile_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_profile_shares_is_active ON profile_shares(is_active) WHERE is_active = true;

-- Function for updating updated_at
CREATE OR REPLACE FUNCTION update_profile_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_profile_shares_updated_at ON profile_shares;
CREATE TRIGGER trigger_profile_shares_updated_at
    BEFORE UPDATE ON profile_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_shares_updated_at();

-- Comments
COMMENT ON TABLE profile_shares IS 'ตารางเก็บข้อมูลการแชร์ user profile ผ่าน public link';
COMMENT ON COLUMN profile_shares.id IS 'Primary key UUID';
COMMENT ON COLUMN profile_shares.user_id IS 'เจ้าของ share link (FK จาก users table)';
COMMENT ON COLUMN profile_shares.share_token IS 'Token สำหรับการเข้าถึง (64 chars random string)';
COMMENT ON COLUMN profile_shares.expires_at IS 'วันเวลาหมดอายุที่ user กำหนด';
COMMENT ON COLUMN profile_shares.view_count IS 'จำนวนครั้งที่มีคนเข้าดู';
COMMENT ON COLUMN profile_shares.last_viewed_at IS 'วันเวลาที่ครั้งล่าสุดที่มีคนเข้าดู';
COMMENT ON COLUMN profile_shares.is_active IS 'สถานะว่า link ยังใช้งานได้หรือไม่';
COMMENT ON COLUMN profile_shares.created_at IS 'วันเวลาสร้าง share link';
COMMENT ON COLUMN profile_shares.updated_at IS 'วันเวลาอัปเดตล่าสุด';
