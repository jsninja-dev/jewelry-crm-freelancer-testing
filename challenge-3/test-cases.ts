// CHALLENGE 3: Comprehensive test cases for OrdersService
// This file contains all test cases to validate the service works correctly

import { OrdersService } from './orders-service'
import {
  Order,
  OrderStatus,
  ServiceResult,
  ServiceResponse,
  ServiceError,
  ServiceErrorCode,
  CreateOrderParams,
  UpdateOrderParams,
  OrderQueryParams,
  isServiceSuccess,
  isServiceError
} from './types'

// Mock Supabase client for testing
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}))

describe('OrdersService', () => {
  let ordersService: OrdersService
  let mockSupabase: any

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    
    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis()
    }

    // Mock the createClient function
    const { createClient } = require('@supabase/supabase-js')
    createClient.mockReturnValue(mockSupabase)

    // Create service instance
    ordersService = new OrdersService({
      supabase: {
        url: 'https://test.supabase.co',
        anonKey: 'test-key'
      },
      validationEnabled: true
    })
  })

  describe('getOrders', () => {
    test('should return array of orders, never undefined', async () => {
      // Mock successful database response
      const mockOrders: Order[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          customer_id: '550e8400-e29b-41d4-a716-446655440001',
          total_amount: 150.00,
          status: OrderStatus.PENDING,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          customer_id: '550e8400-e29b-41d4-a716-446655440002',
          total_amount: 275.50,
          status: OrderStatus.COMPLETED,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockOrders,
        error: null
      })

      const result = await ordersService.getOrders()
      
      expect(isServiceSuccess(result)).toBe(true)
      if (isServiceSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data).toHaveLength(2)
        expect(result.data[0].id).toBe('550e8400-e29b-41d4-a716-446655440001')
        expect(result.data[1].status).toBe(OrderStatus.COMPLETED)
      }
    })

    test('should return empty array when no orders exist', async () => {
      // Mock empty database response
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await ordersService.getOrders()
      
      expect(isServiceSuccess(result)).toBe(true)
      if (isServiceSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data).toHaveLength(0)
      }
    })

    test('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed', code: 'PGRST301' }
      })

      const result = await ordersService.getOrders()
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.success).toBe(false)
        expect(result.code).toBe(ServiceErrorCode.DATABASE_ERROR)
        expect(result.error).toContain('Database error')
      }
    })

    test('should handle null data from database', async () => {
      // Mock null data response
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await ordersService.getOrders()
      
      expect(isServiceSuccess(result)).toBe(true)
      if (isServiceSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data).toHaveLength(0)
      }
    })

    test('should validate query parameters', async () => {
      const invalidParams: OrderQueryParams = {
        customer_id: 'invalid-uuid',
        limit: 150, // Exceeds max limit
        offset: -1 // Negative offset
      }

      const result = await ordersService.getOrders(invalidParams)
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.INVALID_INPUT)
        expect(result.error).toContain('Invalid customer ID format')
      }
    })

    test('should apply filters correctly', async () => {
      const mockOrders: Order[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          customer_id: '550e8400-e29b-41d4-a716-446655440001',
          total_amount: 150.00,
          status: OrderStatus.PENDING,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockOrders,
        error: null
      })

      const params: OrderQueryParams = {
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        status: OrderStatus.PENDING,
        limit: 10,
        offset: 0,
        sort_by: 'created_at',
        sort_order: 'desc'
      }

      const result = await ordersService.getOrders(params)
      
      expect(isServiceSuccess(result)).toBe(true)
      
      // Verify query methods were called
      expect(mockSupabase.eq).toHaveBeenCalledWith('customer_id', '550e8400-e29b-41d4-a716-446655440001')
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', OrderStatus.PENDING)
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9)
    })
  })

  describe('getOrderById', () => {
    test('should return order when found', async () => {
      const mockOrder: Order = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        total_amount: 150.00,
        status: OrderStatus.PENDING,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.single.mockResolvedValue({
        data: mockOrder,
        error: null
      })

      const result = await ordersService.getOrderById('550e8400-e29b-41d4-a716-446655440001')
      
      expect(isServiceSuccess(result)).toBe(true)
      if (isServiceSuccess(result)) {
        expect(result.data).toEqual(mockOrder)
        expect(result.data).not.toBeNull()
      }
    })

    test('should return null for invalid order ID', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' }
      })

      const result = await ordersService.getOrderById('550e8400-e29b-41d4-a716-446655440999')
      
      expect(isServiceSuccess(result)).toBe(true)
      if (isServiceSuccess(result)) {
        expect(result.data).toBeNull()
      }
    })

    test('should validate ID format', async () => {
      const result = await ordersService.getOrderById('invalid-id')
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.INVALID_INPUT)
        expect(result.error).toContain('Invalid order ID format')
      }
    })

    test('should handle empty ID', async () => {
      const result = await ordersService.getOrderById('')
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.INVALID_INPUT)
        expect(result.error).toContain('Order ID is required')
      }
    })

    test('should handle database errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'PGRST301' }
      })

      const result = await ordersService.getOrderById('550e8400-e29b-41d4-a716-446655440001')
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.DATABASE_ERROR)
      }
    })
  })

  describe('createOrder', () => {
    test('should create order successfully', async () => {
      const orderData: CreateOrderParams = {
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        total_amount: 150.00,
        status: OrderStatus.PENDING
      }

      const mockCreatedOrder: Order = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        total_amount: 150.00,
        status: OrderStatus.PENDING,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.single.mockResolvedValue({
        data: mockCreatedOrder,
        error: null
      })

      const result = await ordersService.createOrder(orderData)
      
      expect(isServiceSuccess(result)).toBe(true)
      if (isServiceSuccess(result)) {
        expect(result.data).toEqual(mockCreatedOrder)
        expect(result.message).toBe('Order created successfully')
      }
    })

    test('should validate order data', async () => {
      const invalidOrderData: CreateOrderParams = {
        customer_id: 'invalid-uuid',
        total_amount: -10, // Negative amount
        status: 'invalid_status' as OrderStatus
      }

      const result = await ordersService.createOrder(invalidOrderData)
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR)
        expect(result.error).toContain('Validation failed')
      }
    })

    test('should handle database constraint errors', async () => {
      const orderData: CreateOrderParams = {
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        total_amount: 150.00
      }

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Foreign key constraint violation', code: '23503' }
      })

      const result = await ordersService.createOrder(orderData)
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR)
        expect(result.error).toContain('Referenced customer does not exist')
      }
    })
  })

  describe('updateOrder', () => {
    test('should update order successfully', async () => {
      const updates: UpdateOrderParams = {
        status: OrderStatus.COMPLETED,
        total_amount: 200.00
      }

      const mockUpdatedOrder: Order = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        total_amount: 200.00,
        status: OrderStatus.COMPLETED,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedOrder,
        error: null
      })

      const result = await ordersService.updateOrder('550e8400-e29b-41d4-a716-446655440001', updates)
      
      expect(isServiceSuccess(result)).toBe(true)
      if (isServiceSuccess(result)) {
        expect(result.data).toEqual(mockUpdatedOrder)
        expect(result.message).toBe('Order updated successfully')
      }
    })

    test('should handle order not found', async () => {
      const updates: UpdateOrderParams = {
        status: OrderStatus.COMPLETED
      }

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' }
      })

      const result = await ordersService.updateOrder('550e8400-e29b-41d4-a716-446655440999', updates)
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND)
        expect(result.error).toBe('Order not found')
      }
    })

    test('should validate update data', async () => {
      const invalidUpdates: UpdateOrderParams = {
        total_amount: -10, // Negative amount
        status: 'invalid_status' as OrderStatus
      }

      const result = await ordersService.updateOrder('550e8400-e29b-41d4-a716-446655440001', invalidUpdates)
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR)
      }
    })
  })

  describe('deleteOrder', () => {
    test('should delete order successfully', async () => {
      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await ordersService.deleteOrder('550e8400-e29b-41d4-a716-446655440001')
      
      expect(isServiceSuccess(result)).toBe(true)
      if (isServiceSuccess(result)) {
        expect(result.data).toBe(true)
        expect(result.message).toBe('Order deleted successfully')
      }
    })

    test('should validate order ID', async () => {
      const result = await ordersService.deleteOrder('invalid-id')
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.INVALID_INPUT)
        expect(result.error).toContain('Invalid order ID format')
      }
    })

    test('should handle database errors during deletion', async () => {
      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST301' }
      })

      const result = await ordersService.deleteOrder('550e8400-e29b-41d4-a716-446655440001')
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.DATABASE_ERROR)
      }
    })
  })

  describe('getOrderStats', () => {
    test('should return order statistics', async () => {
      const mockData = [
        { status: OrderStatus.PENDING },
        { status: OrderStatus.COMPLETED },
        { status: OrderStatus.PENDING },
        { status: OrderStatus.IN_PROGRESS }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await ordersService.getOrderStats()
      
      expect(isServiceSuccess(result)).toBe(true)
      if (isServiceSuccess(result)) {
        expect(result.data.total).toBe(4)
        expect(result.data.byStatus[OrderStatus.PENDING]).toBe(2)
        expect(result.data.byStatus[OrderStatus.COMPLETED]).toBe(1)
        expect(result.data.byStatus[OrderStatus.IN_PROGRESS]).toBe(1)
      }
    })

    test('should handle empty statistics', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await ordersService.getOrderStats()
      
      expect(isServiceSuccess(result)).toBe(true)
      if (isServiceSuccess(result)) {
        expect(result.data.total).toBe(0)
        expect(Object.keys(result.data.byStatus)).toHaveLength(0)
      }
    })
  })

  describe('Edge Cases', () => {
    test('should handle unexpected errors gracefully', async () => {
      // Mock an unexpected error
      mockSupabase.range.mockRejectedValue(new Error('Unexpected error'))

      const result = await ordersService.getOrders()
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.UNKNOWN_ERROR)
        expect(result.error).toContain('An unexpected error occurred')
      }
    })

    test('should handle malformed data from database', async () => {
      // Mock malformed data
      mockSupabase.range.mockResolvedValue({
        data: 'not-an-array',
        error: null
      })

      const result = await ordersService.getOrders()
      
      expect(isServiceSuccess(result)).toBe(true)
      if (isServiceSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data).toHaveLength(0)
      }
    })

    test('should handle very large amounts', async () => {
      const orderData: CreateOrderParams = {
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        total_amount: 999999.99 // Maximum allowed amount
      }

      const mockOrder: Order = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        total_amount: 999999.99,
        status: OrderStatus.PENDING,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.single.mockResolvedValue({
        data: mockOrder,
        error: null
      })

      const result = await ordersService.createOrder(orderData)
      
      expect(isServiceSuccess(result)).toBe(true)
    })

    test('should reject amounts exceeding maximum', async () => {
      const orderData: CreateOrderParams = {
        customer_id: '550e8400-e29b-41d4-a716-446655440001',
        total_amount: 1000000.00 // Exceeds maximum
      }

      const result = await ordersService.createOrder(orderData)
      
      expect(isServiceError(result)).toBe(true)
      if (isServiceError(result)) {
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR)
        expect(result.error).toContain('Validation failed')
      }
    })
  })

  describe('Service Configuration', () => {
    test('should work with validation disabled', async () => {
      const serviceWithoutValidation = new OrdersService({
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'test-key'
        },
        validationEnabled: false
      })

      const invalidOrderData: CreateOrderParams = {
        customer_id: 'invalid-uuid',
        total_amount: -10
      }

      // Should not validate when validation is disabled
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST301' }
      })

      const result = await serviceWithoutValidation.createOrder(invalidOrderData)
      
      // Should proceed to database operation despite invalid data
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    test('should respect custom limits', async () => {
      const serviceWithCustomLimits = new OrdersService({
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'test-key'
        },
        defaultLimit: 50,
        maxLimit: 200
      })

      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null
      })

      await serviceWithCustomLimits.getOrders({ limit: 150 })
      
      // Should respect the custom max limit
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 149)
    })
  })
})
