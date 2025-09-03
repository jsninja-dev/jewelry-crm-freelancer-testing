# 🟡 **CHALLENGE 4: Authentication Middleware Error**
## **MEDIUM PRIORITY**

### **Problem Description**
You have a Next.js API route with authentication middleware that's failing when the user is not authenticated. This is causing the API to crash instead of returning proper error responses.

### **Error Message**
```
Cannot read property 'user' of undefined
```

### **Current Broken Code**
```typescript
// File: app/api/protected-route/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // This crashes when user is undefined
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // This line crashes when user is undefined
    const userId = user.id
    
    // Rest of the protected logic
    const { data, error: dbError } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
    
    if (dbError) throw dbError
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in protected route:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

### **Requirements**
1. **Fix the authentication check** to handle undefined users
2. **Add proper error handling** for authentication failures
3. **Return appropriate HTTP status codes** (401 for unauthorized, 500 for server errors)
4. **Add TypeScript types** for the response
5. **Handle both authenticated and unauthenticated cases**
6. **Add logging** for debugging purposes

### **Success Criteria**
- ✅ No crashes when user is undefined
- ✅ Proper 401 responses for unauthenticated users
- ✅ Proper 200 responses for authenticated users
- ✅ TypeScript types are correct and complete
- ✅ Error handling is comprehensive
- ✅ Logging is added for debugging

### **Test Cases**
```typescript
// Test 1: Authenticated user
// Expected: 200 status with user data

// Test 2: Unauthenticated user
// Expected: 401 status with error message

// Test 3: Database error
// Expected: 500 status with error message

// Test 4: Invalid token
// Expected: 401 status with error message
```

### **Expected Behavior**
- **Authenticated user**: Return 200 status with user data
- **Unauthenticated user**: Return 401 status with "Unauthorized" message
- **Database error**: Return 500 status with error message
- **Invalid token**: Return 401 status with "Invalid token" message

### **Files to Create/Modify**
1. `challenge-4/protected-route.ts` - Fixed API route code
2. `challenge-4/types.ts` - TypeScript types
3. `challenge-4/test-cases.ts` - Test cases
4. `challenge-4/explanation.md` - Your explanation of the solution



---

## 🎯 **SUBMISSION CHECKLIST**
- [ ] Authentication check fixed
- [ ] Error handling implemented
- [ ] TypeScript types defined
- [ ] Test cases written and passing
- [ ] Explanation document completed
- [ ] All files submitted in challenge-4 folder
