-- CHALLENGE 2: Fix foreign key relationships between communications and users tables
-- This file contains the complete SQL to fix the relationships

-- First, ensure the tables exist with proper structure
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    sender_id UUID,
    recipient_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clean up any existing invalid foreign key constraints (if they exist)
DO $$ 
BEGIN
    -- Drop existing foreign key constraints if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_communications_sender' 
        AND table_name = 'communications'
    ) THEN
        ALTER TABLE communications DROP CONSTRAINT fk_communications_sender;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_communications_recipient' 
        AND table_name = 'communications'
    ) THEN
        ALTER TABLE communications DROP CONSTRAINT fk_communications_recipient;
    END IF;
END $$;

-- Clean up any orphaned records that don't have valid user references
-- This ensures data integrity before adding foreign key constraints
DELETE FROM communications 
WHERE sender_id IS NOT NULL 
  AND sender_id NOT IN (SELECT id FROM users);

DELETE FROM communications 
WHERE recipient_id IS NOT NULL 
  AND recipient_id NOT IN (SELECT id FROM users);

-- Add foreign key constraints
ALTER TABLE communications 
ADD CONSTRAINT fk_communications_sender 
FOREIGN KEY (sender_id) REFERENCES users(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE communications 
ADD CONSTRAINT fk_communications_recipient 
FOREIGN KEY (recipient_id) REFERENCES users(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_communications_sender_id ON communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_communications_recipient_id ON communications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON communications(created_at);

-- Add indexes for users table performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add check constraints for data validation
ALTER TABLE communications 
ADD CONSTRAINT chk_communications_message_not_empty 
CHECK (LENGTH(TRIM(message)) > 0);

ALTER TABLE users 
ADD CONSTRAINT chk_users_name_not_empty 
CHECK (LENGTH(TRIM(name)) > 0);

ALTER TABLE users 
ADD CONSTRAINT chk_users_email_valid 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Grant necessary permissions for Supabase
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON communications TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON communications TO anon;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - adjust based on your auth requirements)
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can view all communications" ON communications FOR SELECT USING (true);

-- Optional: Create policies for authenticated users only
-- CREATE POLICY "Authenticated users can view users" ON users FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can view communications" ON communications FOR SELECT USING (auth.role() = 'authenticated');
