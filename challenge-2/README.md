# 🔴 **CHALLENGE 2: API Relationship Error**
## **CRITICAL PRIORITY**

### **Problem Description**
You have a Next.js API endpoint that's trying to join two tables but failing due to missing foreign key relationships. This is causing the communications API to return 500 errors.

### **Error Message**
```
Could not find a relationship between 'communications' and 'users'
```

### **Database Schema**
```sql
-- Table: communications
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    sender_id UUID,
    recipient_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Current Broken Code**
```typescript
// File: app/api/communications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // This query fails because there's no foreign key relationship
    const { data, error } = await supabase
      .from('communications')
      .select(`
        *,
        sender:users(name),
        recipient:users(name)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching communications:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

### **Requirements**
1. **Fix the database relationship** by adding proper foreign key constraints
2. **Update the API query** to work with the new relationships
3. **Handle errors properly** with appropriate HTTP status codes
4. **Add proper TypeScript types** for the response
5. **Test the endpoint** works correctly
6. **Add data validation** for the response

### **Success Criteria**
- ✅ API returns communications with user names
- ✅ No more relationship errors
- ✅ Proper error handling with appropriate HTTP status codes
- ✅ TypeScript types are correct and complete
- ✅ Foreign key constraints are properly defined
- ✅ Query performance is optimized

### **Test Cases**
```typescript
// Test 1: Valid request
GET /api/communications
// Expected: 200 status with communications array including sender/recipient names

// Test 2: Database connection error
// Expected: 500 status with error message

// Test 3: Empty result set
// Expected: 200 status with empty array
```

### **Expected Behavior**
- **Valid request**: Return communications with sender and recipient names
- **Database error**: Return 500 status with error message
- **Empty result**: Return 200 status with empty array
- **Invalid query**: Return 400 status with validation error

### **Files to Create/Modify**
1. `challenge-2/fix-relationships.sql` - SQL to fix foreign key relationships
2. `challenge-2/api-route.ts` - Fixed API route code
3. `challenge-2/types.ts` - TypeScript types
4. `challenge-2/test-cases.ts` - Test cases
5. `challenge-2/explanation.md` - Your explanation of the solution



---

## 🎯 **SUBMISSION CHECKLIST**
- [ ] Foreign key relationships fixed
- [ ] API query updated and working
- [ ] Error handling implemented
- [ ] TypeScript types defined
- [ ] Test cases written and passing
- [ ] Explanation document completed
- [ ] All files submitted in challenge-2 folder
