// CHALLENGE 5: Fixed OrderAnalyticsService
// This file should contain your fixed service code

// TODO: Fix the OrderAnalyticsService here
// You need to:
// 1. Handle undefined data properly
// 2. Add proper error handling
// 3. Add data validation
// 4. Add TypeScript types
// 5. Add logging for debugging

export class OrderAnalyticsService {
  async calculateOrderTotals(orders: Order[]): Promise<OrderTotals> {
    // TODO: Fix this method
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
    // TODO: Fix this method
    // This crashes when orders is undefined
    const totalOrders = orders.length
    
    const statusCounts = orders.reduce((counts, order) => {
      counts[order.status] = (counts[order.status] || 0) + 1
      return counts
    }, {})
    
    return { totalOrders, statusCounts }
  }
}
