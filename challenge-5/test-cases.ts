// CHALLENGE 5: Comprehensive test cases for OrderAnalyticsService
// This file contains all test cases to validate the service works correctly

import { OrderAnalyticsService } from './order-analytics-service'
import {
  Order,
  OrderItem,
  OrderStatus,
  AnalyticsResult,
  AnalyticsResponse,
  AnalyticsError,
  AnalyticsErrorCode,
  isAnalyticsSuccess,
  isAnalyticsError
} from './types'

describe('OrderAnalyticsService', () => {
  let service: OrderAnalyticsService

  beforeEach(() => {
    // Create service instance with validation enabled
    service = new OrderAnalyticsService({
      validationEnabled: true
    })
  })

  describe('calculateOrderTotals', () => {
    test('should calculate totals for valid data correctly', async () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 150.00,
          status: OrderStatus.PENDING,
          items: [
            { id: 'item-1', product_id: 'product-1', quantity: 2, price: 50.00 },
            { id: 'item-2', product_id: 'product-2', quantity: 1, price: 50.00 }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'order-2',
          customer_id: 'customer-2',
          total_amount: 100.00,
          status: OrderStatus.COMPLETED,
          items: [
            { id: 'item-3', product_id: 'product-3', quantity: 1, price: 100.00 }
          ],
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]

      const result = await service.calculateOrderTotals(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(250) // (2*50 + 1*50) + (1*100)
        expect(result.data.averageOrderValue).toBe(125) // 250 / 2
        expect(result.data.totalItems).toBe(4) // 2 + 1 + 1
        expect(result.data.totalOrders).toBe(2)
        expect(result.success).toBe(true)
        expect(result.meta?.processedOrders).toBe(2)
        expect(result.meta?.skippedOrders).toBe(0)
      }
    })

    test('should handle empty array gracefully', async () => {
      const result = await service.calculateOrderTotals([])

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(0)
        expect(result.data.averageOrderValue).toBe(0)
        expect(result.data.totalItems).toBe(0)
        expect(result.data.totalOrders).toBe(0)
        expect(result.message).toBe('No valid orders found')
        expect(result.meta?.processedOrders).toBe(0)
      }
    })

    test('should handle undefined data gracefully', async () => {
      const result = await service.calculateOrderTotals(undefined)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(0)
        expect(result.data.averageOrderValue).toBe(0)
        expect(result.data.totalItems).toBe(0)
        expect(result.data.totalOrders).toBe(0)
        expect(result.message).toBe('No valid orders found')
        expect(result.meta?.warnings).toContain('Orders array was undefined or null')
      }
    })

    test('should handle null data gracefully', async () => {
      const result = await service.calculateOrderTotals(null)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(0)
        expect(result.data.averageOrderValue).toBe(0)
        expect(result.data.totalItems).toBe(0)
        expect(result.data.totalOrders).toBe(0)
        expect(result.message).toBe('No valid orders found')
        expect(result.meta?.warnings).toContain('Orders array was undefined or null')
      }
    })

    test('should handle non-array input gracefully', async () => {
      const result = await service.calculateOrderTotals('not-an-array' as any)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(0)
        expect(result.data.averageOrderValue).toBe(0)
        expect(result.data.totalItems).toBe(0)
        expect(result.data.totalOrders).toBe(0)
        expect(result.meta?.warnings).toContain('Orders input is not an array')
      }
    })

    test('should handle orders with missing items', async () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 100.00,
          status: OrderStatus.PENDING,
          items: [], // Empty items array
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'order-2',
          customer_id: 'customer-2',
          total_amount: 50.00,
          status: OrderStatus.COMPLETED,
          items: [
            { id: 'item-1', product_id: 'product-1', quantity: 1, price: 50.00 }
          ],
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]

      const result = await service.calculateOrderTotals(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(50) // Only from order-2
        expect(result.data.averageOrderValue).toBe(25) // 50 / 2
        expect(result.data.totalItems).toBe(1) // Only from order-2
        expect(result.data.totalOrders).toBe(2)
      }
    })

    test('should handle orders with undefined items', async () => {
      const orders: any[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 100.00,
          status: OrderStatus.PENDING,
          items: undefined, // Undefined items
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const result = await service.calculateOrderTotals(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(0)
        expect(result.data.averageOrderValue).toBe(0)
        expect(result.data.totalItems).toBe(0)
        expect(result.data.totalOrders).toBe(0)
        expect(result.meta?.skippedOrders).toBe(1)
        expect(result.meta?.warnings).toContain('Skipped invalid order at index 0')
      }
    })

    test('should handle invalid order items gracefully', async () => {
      const orders: any[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 100.00,
          status: OrderStatus.PENDING,
          items: [
            { id: 'item-1', product_id: 'product-1', quantity: 2, price: 50.00 },
            { id: 'item-2', product_id: 'product-2', quantity: 'invalid', price: 50.00 }, // Invalid quantity
            { id: 'item-3', product_id: 'product-3', quantity: 1, price: 25.00 }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const result = await service.calculateOrderTotals(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(125) // (2*50) + (1*25) = 125, skipping invalid item
        expect(result.data.totalItems).toBe(3) // 2 + 1 = 3, skipping invalid item
        expect(result.data.totalOrders).toBe(1)
        expect(result.meta?.warnings).toContain('Invalid item in order order-1, skipping')
      }
    })

    test('should handle orders with negative prices', async () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 100.00,
          status: OrderStatus.PENDING,
          items: [
            { id: 'item-1', product_id: 'product-1', quantity: 1, price: -50.00 }, // Negative price
            { id: 'item-2', product_id: 'product-2', quantity: 2, price: 75.00 }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const result = await service.calculateOrderTotals(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(100) // (-50) + (2*75) = 100
        expect(result.data.totalItems).toBe(3) // 1 + 2 = 3
        expect(result.data.totalOrders).toBe(1)
        expect(result.meta?.warnings).toContain('Order order-1: Item price is negative')
      }
    })

    test('should handle orders with zero quantities', async () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 100.00,
          status: OrderStatus.PENDING,
          items: [
            { id: 'item-1', product_id: 'product-1', quantity: 0, price: 50.00 }, // Zero quantity
            { id: 'item-2', product_id: 'product-2', quantity: 1, price: 50.00 }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const result = await service.calculateOrderTotals(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(50) // (0*50) + (1*50) = 50
        expect(result.data.totalItems).toBe(1) // 0 + 1 = 1
        expect(result.data.totalOrders).toBe(1)
        expect(result.meta?.warnings).toContain('Order order-1: Item quantity is zero or negative')
      }
    })

    test('should handle mixed valid and invalid orders', async () => {
      const orders: any[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 100.00,
          status: OrderStatus.PENDING,
          items: [
            { id: 'item-1', product_id: 'product-1', quantity: 1, price: 100.00 }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'order-2',
          customer_id: 'customer-2',
          total_amount: 50.00,
          status: OrderStatus.COMPLETED,
          items: undefined // Invalid order
        },
        {
          id: 'order-3',
          customer_id: 'customer-3',
          total_amount: 75.00,
          status: OrderStatus.IN_PROGRESS,
          items: [
            { id: 'item-2', product_id: 'product-2', quantity: 1, price: 75.00 }
          ],
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z'
        }
      ]

      const result = await service.calculateOrderTotals(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(175) // 100 + 75 = 175
        expect(result.data.averageOrderValue).toBe(87.5) // 175 / 2
        expect(result.data.totalItems).toBe(2) // 1 + 1 = 2
        expect(result.data.totalOrders).toBe(2) // Only valid orders
        expect(result.meta?.processedOrders).toBe(2)
        expect(result.meta?.skippedOrders).toBe(1)
      }
    })
  })

  describe('getOrderStatistics', () => {
    test('should calculate statistics for valid data correctly', async () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 150.00,
          status: OrderStatus.PENDING,
          items: [
            { id: 'item-1', product_id: 'product-1', quantity: 2, price: 75.00 }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'order-2',
          customer_id: 'customer-2',
          total_amount: 100.00,
          status: OrderStatus.COMPLETED,
          items: [
            { id: 'item-2', product_id: 'product-2', quantity: 1, price: 100.00 }
          ],
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        },
        {
          id: 'order-3',
          customer_id: 'customer-3',
          total_amount: 200.00,
          status: OrderStatus.COMPLETED,
          items: [
            { id: 'item-3', product_id: 'product-3', quantity: 1, price: 200.00 }
          ],
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z'
        }
      ]

      const result = await service.getOrderStatistics(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalOrders).toBe(3)
        expect(result.data.statusCounts[OrderStatus.PENDING]).toBe(1)
        expect(result.data.statusCounts[OrderStatus.COMPLETED]).toBe(2)
        expect(result.data.totalRevenue).toBe(375) // 150 + 100 + 200
        expect(result.data.averageOrderValue).toBe(125) // 375 / 3
        expect(result.data.totalItems).toBe(4) // 2 + 1 + 1
        expect(result.meta?.processedOrders).toBe(3)
        expect(result.meta?.skippedOrders).toBe(0)
      }
    })

    test('should handle empty array gracefully', async () => {
      const result = await service.getOrderStatistics([])

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalOrders).toBe(0)
        expect(result.data.statusCounts).toEqual({})
        expect(result.data.totalRevenue).toBe(0)
        expect(result.data.averageOrderValue).toBe(0)
        expect(result.data.totalItems).toBe(0)
        expect(result.message).toBe('No valid orders found')
      }
    })

    test('should handle undefined data gracefully', async () => {
      const result = await service.getOrderStatistics(undefined)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalOrders).toBe(0)
        expect(result.data.statusCounts).toEqual({})
        expect(result.data.totalRevenue).toBe(0)
        expect(result.data.averageOrderValue).toBe(0)
        expect(result.data.totalItems).toBe(0)
        expect(result.meta?.warnings).toContain('Orders array was undefined or null')
      }
    })

    test('should handle orders with missing status', async () => {
      const orders: any[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 100.00,
          status: undefined, // Missing status
        items: [
            { id: 'item-1', product_id: 'product-1', quantity: 1, price: 100.00 }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const result = await service.getOrderStatistics(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalOrders).toBe(0) // Invalid order skipped
        expect(result.data.statusCounts).toEqual({})
        expect(result.meta?.skippedOrders).toBe(1)
      }
    })

    test('should handle orders with various statuses', async () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 100.00,
          status: OrderStatus.PENDING,
          items: [{ id: 'item-1', product_id: 'product-1', quantity: 1, price: 100.00 }],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'order-2',
          customer_id: 'customer-2',
          total_amount: 200.00,
          status: OrderStatus.COMPLETED,
          items: [{ id: 'item-2', product_id: 'product-2', quantity: 1, price: 200.00 }],
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        },
        {
          id: 'order-3',
          customer_id: 'customer-3',
          total_amount: 300.00,
          status: OrderStatus.CANCELLED,
          items: [{ id: 'item-3', product_id: 'product-3', quantity: 1, price: 300.00 }],
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z'
        },
        {
          id: 'order-4',
          customer_id: 'customer-4',
          total_amount: 400.00,
          status: OrderStatus.COMPLETED,
          items: [{ id: 'item-4', product_id: 'product-4', quantity: 1, price: 400.00 }],
          created_at: '2024-01-04T00:00:00Z',
          updated_at: '2024-01-04T00:00:00Z'
        }
      ]

      const result = await service.getOrderStatistics(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalOrders).toBe(4)
        expect(result.data.statusCounts[OrderStatus.PENDING]).toBe(1)
        expect(result.data.statusCounts[OrderStatus.COMPLETED]).toBe(2)
        expect(result.data.statusCounts[OrderStatus.CANCELLED]).toBe(1)
        expect(result.data.totalRevenue).toBe(1000) // 100 + 200 + 300 + 400
        expect(result.data.averageOrderValue).toBe(250) // 1000 / 4
        expect(result.data.totalItems).toBe(4)
      }
    })
  })

  describe('getCalculationBreakdown', () => {
    test('should provide detailed breakdown for debugging', async () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 150.00,
          status: OrderStatus.PENDING,
          items: [
            { id: 'item-1', product_id: 'product-1', quantity: 2, price: 75.00 }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const result = await service.getCalculationBreakdown(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(150)
        expect(result.data.averageOrderValue).toBe(150)
        expect(result.data.totalItems).toBe(2)
        expect(result.data.totalOrders).toBe(1)
        expect(result.data.processedOrders).toBe(1)
        expect(result.data.skippedOrders).toBe(0)
        expect(Array.isArray(result.data.warnings)).toBe(true)
      }
    })

    test('should handle undefined data in breakdown', async () => {
      const result = await service.getCalculationBreakdown(undefined)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(0)
        expect(result.data.averageOrderValue).toBe(0)
        expect(result.data.totalItems).toBe(0)
        expect(result.data.totalOrders).toBe(0)
        expect(result.data.processedOrders).toBe(0)
        expect(result.data.skippedOrders).toBe(0)
        expect(result.data.warnings).toContain('Orders array was undefined or null')
      }
    })
  })

  describe('Edge Cases', () => {
    test('should handle very large numbers', async () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 999999.99,
          status: OrderStatus.PENDING,
          items: [
            { id: 'item-1', product_id: 'product-1', quantity: 1000, price: 999.99 }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const result = await service.calculateOrderTotals(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(999990) // 1000 * 999.99
        expect(result.data.totalItems).toBe(1000)
        expect(result.data.totalOrders).toBe(1)
      }
    })

    test('should handle decimal precision correctly', async () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 33.33,
          status: OrderStatus.PENDING,
          items: [
            { id: 'item-1', product_id: 'product-1', quantity: 3, price: 11.11 }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const result = await service.calculateOrderTotals(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBeCloseTo(33.33, 2)
        expect(result.data.averageOrderValue).toBeCloseTo(33.33, 2)
        expect(result.data.totalItems).toBe(3)
      }
    })

    test('should handle service with validation disabled', async () => {
      const serviceNoValidation = new OrderAnalyticsService({
        validationEnabled: false
      })

      const orders: any[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 100.00,
          status: OrderStatus.PENDING,
          items: undefined // Invalid but validation disabled
        }
      ]

      const result = await serviceNoValidation.calculateOrderTotals(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(0)
        expect(result.data.totalItems).toBe(0)
        expect(result.data.totalOrders).toBe(1) // Order processed despite being invalid
      }
    })

    test('should handle concurrent calculations', async () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 100.00,
          status: OrderStatus.PENDING,
          items: [
            { id: 'item-1', product_id: 'product-1', quantity: 1, price: 100.00 }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      // Run multiple calculations concurrently
      const promises = [
        service.calculateOrderTotals(orders),
        service.getOrderStatistics(orders),
        service.getCalculationBreakdown(orders)
      ]

      const results = await Promise.all(promises)

      // All should succeed
      results.forEach(result => {
        expect(isAnalyticsSuccess(result)).toBe(true)
      })

      // All should have consistent data
      if (isAnalyticsSuccess(results[0]) && isAnalyticsSuccess(results[1])) {
        expect(results[0].data.totalRevenue).toBe(results[1].data.totalRevenue)
        expect(results[0].data.totalItems).toBe(results[1].data.totalItems)
        expect(results[0].data.totalOrders).toBe(results[1].data.totalOrders)
      }
    })
  })

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      // Mock a scenario that could cause unexpected errors
      const orders: any[] = [
        {
          id: 'order-1',
          customer_id: 'customer-1',
          total_amount: 100.00,
          status: OrderStatus.PENDING,
          items: [
            {
              id: 'item-1',
              product_id: 'product-1',
              quantity: 1,
              price: 100.00,
              // Add a circular reference to potentially cause issues
              circularRef: null as any
            }
          ],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      // Create circular reference
      orders[0].items[0].circularRef = orders[0]

      const result = await service.calculateOrderTotals(orders)

      // Should still succeed despite circular reference
      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(100)
        expect(result.data.totalItems).toBe(1)
      }
    })

    test('should handle malformed order data', async () => {
      const orders: any[] = [
        {
          // Missing required fields
          id: null,
          customer_id: undefined,
          total_amount: 'not-a-number',
          status: 123,
          items: 'not-an-array',
          created_at: 'invalid-date',
          updated_at: 'invalid-date'
        }
      ]

      const result = await service.calculateOrderTotals(orders)

      expect(isAnalyticsSuccess(result)).toBe(true)
      if (isAnalyticsSuccess(result)) {
        expect(result.data.totalRevenue).toBe(0)
        expect(result.data.totalItems).toBe(0)
        expect(result.data.totalOrders).toBe(0)
        expect(result.meta?.skippedOrders).toBe(1)
        expect(result.meta?.warnings?.length).toBeGreaterThan(0)
      }
    })
  })
})
