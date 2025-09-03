// CHALLENGE 2: Fixed API route for communications
// This file should contain your fixed API route code

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// TODO: Fix the API route here
// You need to:
// 1. Fix the query to work with the new relationships
// 2. Add proper error handling
// 3. Add proper TypeScript types
// 4. Add data validation

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // TODO: Fix this query
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
