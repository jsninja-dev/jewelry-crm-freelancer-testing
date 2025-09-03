-- CHALLENGE 2: Sample data for testing
-- This file contains sample data to test your API

-- Insert sample users
INSERT INTO users (id, name, email) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Admin User', 'admin@example.com'),
('550e8400-e29b-41d4-a716-446655440002', 'Manager User', 'manager@example.com'),
('550e8400-e29b-41d4-a716-446655440003', 'Staff User', 'staff@example.com');

-- Insert sample communications
INSERT INTO communications (id, message, sender_id, recipient_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Hello, how are you?', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440002', 'Meeting at 3 PM', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', 'Project update needed', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001');
