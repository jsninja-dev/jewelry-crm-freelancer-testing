-- CHALLENGE 1: Create the missing update_customer_company function
-- This file contains the complete SQL function definition

-- First, create the audit logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_update_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    old_company VARCHAR(255),
    new_company VARCHAR(255),
    updated_by VARCHAR(255) DEFAULT 'system',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create the update_customer_company function
CREATE OR REPLACE FUNCTION update_customer_company(
    company_name VARCHAR(255),
    customer_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_exists BOOLEAN;
    old_company_value VARCHAR(255);
    result JSON;
BEGIN
    -- Validate input parameters
    IF company_name IS NULL OR TRIM(company_name) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Company name is required',
            'code', 'INVALID_COMPANY_NAME'
        );
    END IF;

    IF customer_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Customer ID is required',
            'code', 'INVALID_CUSTOMER_ID'
        );
    END IF;

    -- Check if customer exists and get current company value
    SELECT EXISTS(SELECT 1 FROM customers WHERE id = customer_id), 
           (SELECT company FROM customers WHERE id = customer_id)
    INTO customer_exists, old_company_value;

    IF NOT customer_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Customer not found',
            'code', 'CUSTOMER_NOT_FOUND'
        );
    END IF;

    -- Update the customer's company
    UPDATE customers 
    SET 
        company = TRIM(company_name),
        updated_at = NOW()
    WHERE id = customer_id;

    -- Check if the update was successful
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to update customer',
            'code', 'UPDATE_FAILED'
        );
    END IF;

    -- Create audit log entry
    INSERT INTO customer_update_logs (customer_id, old_company, new_company, updated_by)
    VALUES (customer_id, old_company_value, TRIM(company_name), 'system');

    -- Return success response
    RETURN json_build_object(
        'success', true,
        'message', 'Customer company updated successfully',
        'data', json_build_object(
            'customer_id', customer_id,
            'old_company', old_company_value,
            'new_company', TRIM(company_name),
            'updated_at', NOW()
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Handle any unexpected errors
        RETURN json_build_object(
            'success', false,
            'error', 'An unexpected error occurred: ' || SQLERRM,
            'code', 'INTERNAL_ERROR'
        );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_customer_company(VARCHAR(255), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_customer_company(VARCHAR(255), UUID) TO anon;
