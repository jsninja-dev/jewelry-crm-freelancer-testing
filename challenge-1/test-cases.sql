-- CHALLENGE 1: Comprehensive test cases for the update_customer_company function
-- This file contains all test cases to validate the function works correctly

-- Setup: Ensure we have test data
INSERT INTO customers (id, name, email, company) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john@example.com', 'Acme Corp'),
('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane@example.com', 'Tech Solutions'),
('550e8400-e29b-41d4-a716-446655440003', 'Bob Johnson', 'bob@example.com', 'Design Studio')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- TEST CASE 1: Valid update scenario
-- =============================================
SELECT 'TEST 1: Valid update' as test_name;
SELECT update_customer_company('New Company Name', '550e8400-e29b-41d4-a716-446655440001');

-- Verify the update worked
SELECT 'Verification 1: Check updated company' as verification;
SELECT id, name, company, updated_at FROM customers WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- Check audit log was created
SELECT 'Verification 1: Check audit log' as verification;
SELECT * FROM customer_update_logs WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001' ORDER BY updated_at DESC LIMIT 1;

-- =============================================
-- TEST CASE 2: Invalid customer ID
-- =============================================
SELECT 'TEST 2: Invalid customer ID' as test_name;
SELECT update_customer_company('Company Name', '00000000-0000-0000-0000-000000000000');

-- =============================================
-- TEST CASE 3: Empty company name
-- =============================================
SELECT 'TEST 3: Empty company name' as test_name;
SELECT update_customer_company('', '550e8400-e29b-41d4-a716-446655440002');

-- =============================================
-- TEST CASE 4: NULL company name
-- =============================================
SELECT 'TEST 4: NULL company name' as test_name;
SELECT update_customer_company(NULL, '550e8400-e29b-41d4-a716-446655440002');

-- =============================================
-- TEST CASE 5: NULL customer ID
-- =============================================
SELECT 'TEST 5: NULL customer ID' as test_name;
SELECT update_customer_company('Valid Company', NULL);

-- =============================================
-- TEST CASE 6: Company name with only whitespace
-- =============================================
SELECT 'TEST 6: Whitespace-only company name' as test_name;
SELECT update_customer_company('   ', '550e8400-e29b-41d4-a716-446655440002');

-- =============================================
-- TEST CASE 7: Company name with leading/trailing whitespace
-- =============================================
SELECT 'TEST 7: Company name with whitespace' as test_name;
SELECT update_customer_company('  Trimmed Company  ', '550e8400-e29b-41d4-a716-446655440003');

-- Verify whitespace was trimmed
SELECT 'Verification 7: Check trimmed company' as verification;
SELECT id, name, company FROM customers WHERE id = '550e8400-e29b-41d4-a716-446655440003';

-- =============================================
-- TEST CASE 8: Very long company name
-- =============================================
SELECT 'TEST 8: Very long company name' as test_name;
SELECT update_customer_company('This is a very long company name that exceeds the normal length and should be handled properly by the database system', '550e8400-e29b-41d4-a716-446655440001');

-- =============================================
-- TEST CASE 9: Special characters in company name
-- =============================================
SELECT 'TEST 9: Special characters' as test_name;
SELECT update_customer_company('Company & Associates LLC (2024)', '550e8400-e29b-41d4-a716-446655440002');

-- =============================================
-- TEST CASE 10: Update to same company name
-- =============================================
SELECT 'TEST 10: Same company name' as test_name;
SELECT update_customer_company('Tech Solutions', '550e8400-e29b-41d4-a716-446655440002');

-- Check audit log still created
SELECT 'Verification 10: Check audit log for same value' as verification;
SELECT * FROM customer_update_logs WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002' ORDER BY updated_at DESC LIMIT 1;

-- =============================================
-- TEST CASE 11: Invalid UUID format
-- =============================================
SELECT 'TEST 11: Invalid UUID format' as test_name;
SELECT update_customer_company('Valid Company', 'invalid-uuid-format');

-- =============================================
-- TEST CASE 12: Performance test with multiple updates
-- =============================================
SELECT 'TEST 12: Multiple rapid updates' as test_name;
SELECT update_customer_company('Rapid Update 1', '550e8400-e29b-41d4-a716-446655440001');
SELECT update_customer_company('Rapid Update 2', '550e8400-e29b-41d4-a716-446655440001');
SELECT update_customer_company('Rapid Update 3', '550e8400-e29b-41d4-a716-446655440001');

-- Check all audit logs were created
SELECT 'Verification 12: Check multiple audit logs' as verification;
SELECT COUNT(*) as audit_count FROM customer_update_logs WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';

-- =============================================
-- SUMMARY: Check final state
-- =============================================
SELECT 'FINAL STATE: All customers' as summary;
SELECT id, name, email, company, updated_at FROM customers ORDER BY name;

SELECT 'FINAL STATE: All audit logs' as summary;
SELECT id, customer_id, old_company, new_company, updated_by, updated_at FROM customer_update_logs ORDER BY updated_at DESC;
