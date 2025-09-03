// CHALLENGE 3: Fixed OrdersService
// This file should contain your fixed service code

import { createClient } from '@supabase/supabase-js'

// TODO: Fix the OrdersService here
// You need to:
// 1. Handle undefined data properly
// 2. Add proper error handling
// 3. Add data validation
// 4. Add TypeScript types
// 5. Add logging for debugging

export class OrdersService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async getOrders(): Promise<Order[]> {
    // TODO: Fix this method
    const { data, error } = await supabase
      .from('orders')
      .select('*')
    
    // This can be undefined, causing crashes
    return data
  }
  
  async getOrderById(id: string): Promise<Order | null> {
    // TODO: Fix this method
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    
    // This can also be undefined
    return data
  }
}
