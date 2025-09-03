-- CHALLENGE 2: Fix foreign key relationships between communications and users tables
-- This file should contain your SQL to fix the relationships

-- TODO: Add foreign key constraints here
-- You need to:
-- 1. Add foreign key constraint for sender_id -> users.id
-- 2. Add foreign key constraint for recipient_id -> users.id
-- 3. Add indexes for performance
-- 4. Handle any existing data issues

-- Example structure (you need to complete this):
/*
-- Add foreign key constraints
ALTER TABLE communications 
ADD CONSTRAINT fk_communications_sender 
FOREIGN KEY (sender_id) REFERENCES users(id);

ALTER TABLE communications 
ADD CONSTRAINT fk_communications_recipient 
FOREIGN KEY (recipient_id) REFERENCES users(id);

-- Add indexes for performance
CREATE INDEX idx_communications_sender_id ON communications(sender_id);
CREATE INDEX idx_communications_recipient_id ON communications(recipient_id);
*/
