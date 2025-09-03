# 🟡 **CHALLENGE 5: Data Transformation Pipeline**
## **MEDIUM PRIORITY**

### **Problem Description**
You have a complex data transformation pipeline that processes orders and calculates totals, but it's failing when some data is missing or undefined. This is causing the analytics dashboard to crash.

### **Error Message**
```
Cannot read property 'length' of undefined
```

### **Current Broken Code**
```typescript
// File: lib/services/OrderAnalyticsService.ts
export class OrderAnalyticsService {
  async calculateOrderTotals(orders: Order[]): Promise<OrderTotals> {
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity)
      }, 0)
    }, 0)
    
    // This crashes when orders is undefined
    const averageOrderValue = totalRevenue / orders.length
    
    // This crashes when order.items is undefined
    const totalItems = orders.reduce((sum, order) => {
      return sum + order.items.length
    }, 0)
    
    return { totalRevenue, averageOrderValue, totalItems }
  }
  
  async getOrderStatistics(orders: Order[]): Promise<OrderStatistics> {
    // This crashes when orders is undefined
    const totalOrders = orders.length
    
    const statusCounts = orders.reduce((counts, order) => {
      counts[order.status] = (counts[order.status] || 0) + 1
      return counts
    }, {})
    
    return { totalOrders, statusCounts }
  }
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

-- Table: order_items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Requirements**
1. **Fix the data transformation** to handle undefined data
2. **Handle missing or undefined data** gracefully
3. **Add proper validation** for input data
4. **Implement error handling** for transformation errors
5. **Add TypeScript types** for all methods
6. **Create test cases** that demonstrate the fix

### **Success Criteria**
- ✅ No crashes with undefined data
- ✅ Proper handling of empty arrays
- ✅ Correct calculations for valid data
- ✅ TypeScript types are correct and complete
- ✅ Error handling is comprehensive
- ✅ Data validation is implemented

### **Test Cases**
```typescript
// Test 1: Valid data
const orders = [validOrder1, validOrder2]
const totals = await service.calculateOrderTotals(orders)
// Expected: Correct calculations

// Test 2: Empty array
const totals = await service.calculateOrderTotals([])
// Expected: Zero values, no crash

// Test 3: Undefined data
const totals = await service.calculateOrderTotals(undefined)
// Expected: Error handling, no crash

// Test 4: Missing items
const orders = [{ id: 1, items: undefined }]
const totals = await service.calculateOrderTotals(orders)
// Expected: Error handling, no crash
```

### **Expected Behavior**
- **Valid data**: Return correct calculations
- **Empty array**: Return zero values
- **Undefined data**: Return error or default values
- **Missing items**: Handle gracefully with error or default values

### **Files to Create/Modify**
1. `challenge-5/order-analytics-service.ts` - Fixed service code
2. `challenge-5/types.ts` - TypeScript types
3. `challenge-5/test-cases.ts` - Test cases
4. `challenge-5/explanation.md` - Your explanation of the solution



---

## 🎯 **SUBMISSION CHECKLIST**
- [ ] Data transformation fixed
- [ ] Error handling implemented
- [ ] TypeScript types defined
- [ ] Test cases written and passing
- [ ] Explanation document completed
- [ ] All files submitted in challenge-5 folder
