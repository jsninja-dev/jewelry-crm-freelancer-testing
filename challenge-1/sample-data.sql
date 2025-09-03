-- CHALLENGE 1: Sample data for testing
-- This file contains sample data to test your function

-- Insert sample customers
INSERT INTO customers (id, name, email, company) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john@example.com', 'Acme Corp'),
('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane@example.com', 'Tech Solutions'),
('550e8400-e29b-41d4-a716-446655440003', 'Bob Johnson', 'bob@example.com', 'Design Studio');

-- Test your function with this data
-- Example: SELECT update_customer_company('New Company Name', '550e8400-e29b-41d4-a716-446655440001');
