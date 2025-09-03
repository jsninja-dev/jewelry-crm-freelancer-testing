# 🔴 **CHALLENGE 1: Database Function Error**
## **CRITICAL PRIORITY**

### **Problem Description**
You have a Supabase database with a customers table. The application is trying to call a function `update_customer_company()` but it doesn't exist, causing API failures across the system.

### **Error Message**
```
Could not find the function public.update_customer_company(company_name, customer_id)
```

### **Database Schema**
```sql
-- Table: customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Current Broken Code**
```typescript
// File: app/api/customers/[id]/route.ts
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { company } = await request.json()
    const { id } = params
    
    // This call fails because the function doesn't exist
    const { data, error } = await supabase.rpc('update_customer_company', {
      company_name: company,
      customer_id: id
    })
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### **Requirements**
1. **Create the missing function** `update_customer_company()`
2. **Handle proper parameter validation** (check if customer exists, validate company name)
3. **Add error handling** for invalid inputs
4. **Include audit logging** (log who updated what and when)
5. **Test the function** works correctly
6. **Add TypeScript types** for the function parameters

### **Success Criteria**
- ✅ Function executes without errors
- ✅ Company field updates correctly in the database
- ✅ Proper error messages for invalid inputs (customer not found, invalid company name)
- ✅ Audit trail is created in a logs table
- ✅ TypeScript types are properly defined
- ✅ Function handles edge cases (empty company name, non-existent customer)

### **Test Cases**
```sql
-- Test 1: Valid update
SELECT update_customer_company('New Company Name', 'valid-customer-id');

-- Test 2: Invalid customer ID
SELECT update_customer_company('Company Name', 'invalid-id');

-- Test 3: Empty company name
SELECT update_customer_company('', 'valid-customer-id');

-- Test 4: NULL company name
SELECT update_customer_company(NULL, 'valid-customer-id');
```

### **Expected Behavior**
- **Valid inputs**: Update company field and return success
- **Invalid customer ID**: Return error message "Customer not found"
- **Empty/NULL company**: Return error message "Company name is required"
- **Database errors**: Return appropriate error message

### **Files to Create/Modify**
1. `challenge-1/create-function.sql` - SQL function definition
2. `challenge-1/types.ts` - TypeScript types
3. `challenge-1/test-cases.sql` - Test cases
4. `challenge-1/explanation.md` - Your explanation of the solution



---

## 🎯 **SUBMISSION CHECKLIST**
- [ ] Function created and working
- [ ] Error handling implemented
- [ ] TypeScript types defined
- [ ] Test cases written and passing
- [ ] Explanation document completed
- [ ] All files submitted in challenge-1 folder
