# 🟡 **CHALLENGE 3: Service Layer Data Handling**
## **MEDIUM PRIORITY**

### **Problem Description**
You have a service that fetches data from an API but sometimes returns undefined, causing the frontend to crash when trying to map over the data. This is a common issue in production applications.

### **Error Message**
```
Cannot read property 'map' of undefined
```

### **Current Broken Code**
```typescript
// File: lib/services/OrdersService.ts
export class OrdersService {
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
    
    // This can be undefined, causing crashes
    return data
  }
  
  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    
    // This can also be undefined
    return data
  }
}
```

### **Frontend Usage (Where the Crash Happens)**
```typescript
// File: components/orders/OrderList.tsx
export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  
  useEffect(() => {
    const fetchOrders = async () => {
      const ordersService = new OrdersService()
      const ordersData = await ordersService.getOrders()
      
      // This crashes when ordersData is undefined
      const orderNames = ordersData.map(order => order.name)
      setOrders(ordersData)
    }
    
    fetchOrders()
  }, [])
  
  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>{order.name}</div>
      ))}
    </div>
  )
}
```

### **Database Schema**
```sql
-- Table: orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Requirements**
1. **Fix the service** to handle undefined data properly
2. **Add proper error handling** for database errors
3. **Implement data validation** to ensure data integrity
4. **Add TypeScript types** for all methods
5. **Create a test case** that demonstrates the fix
6. **Add logging** for debugging purposes

### **Success Criteria**
- ✅ Service never returns undefined
- ✅ Proper error messages for database errors
- ✅ Frontend doesn't crash with undefined data
- ✅ TypeScript types are correct and complete
- ✅ Data validation is implemented
- ✅ Logging is added for debugging

### **Test Cases**
```typescript
// Test 1: Valid data
const orders = await ordersService.getOrders()
// Expected: Array of orders, never undefined

// Test 2: Database error
// Expected: Proper error handling, no crash

// Test 3: Empty result
// Expected: Empty array, not undefined

// Test 4: Invalid ID
const order = await ordersService.getOrderById('invalid-id')
// Expected: null, not undefined
```

### **Expected Behavior**
- **Valid data**: Return array of orders
- **Database error**: Throw meaningful error, don't return undefined
- **Empty result**: Return empty array
- **Invalid ID**: Return null for single item queries

### **Files to Create/Modify**
1. `challenge-3/orders-service.ts` - Fixed service code
2. `challenge-3/types.ts` - TypeScript types
3. `challenge-3/test-cases.ts` - Test cases
4. `challenge-3/explanation.md` - Your explanation of the solution



---

## 🎯 **SUBMISSION CHECKLIST**
- [ ] Service fixed to handle undefined data
- [ ] Error handling implemented
- [ ] TypeScript types defined
- [ ] Test cases written and passing
- [ ] Explanation document completed
- [ ] All files submitted in challenge-3 folder
