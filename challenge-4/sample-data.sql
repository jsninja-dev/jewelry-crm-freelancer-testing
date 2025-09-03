-- CHALLENGE 4: Sample data for testing
-- This file contains sample data to test your authentication

-- Insert sample users
INSERT INTO users (id, name, email) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Admin User', 'admin@example.com'),
('550e8400-e29b-41d4-a716-446655440002', 'Manager User', 'manager@example.com'),
('550e8400-e29b-41d4-a716-446655440003', 'Staff User', 'staff@example.com');

-- Insert sample user data
INSERT INTO user_data (id, user_id, data) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '{"preferences": {"theme": "dark"}}'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '{"preferences": {"theme": "light"}}'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '{"preferences": {"theme": "auto"}}');
