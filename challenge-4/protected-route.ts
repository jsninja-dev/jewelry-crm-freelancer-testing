// CHALLENGE 4: Fixed protected API route
// This file should contain your fixed API route code

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// TODO: Fix the protected route here
// You need to:
// 1. Handle undefined user properly
// 2. Add proper error handling
// 3. Return appropriate HTTP status codes
// 4. Add TypeScript types
// 5. Add logging for debugging

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // TODO: Fix this authentication check
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
