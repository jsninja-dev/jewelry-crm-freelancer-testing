// CHALLENGE 3: Fixed OrdersService with proper error handling and data validation
// This file contains the complete fixed service implementation

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  Order,
  OrderStatus,
  ServiceResult,
  ServiceResponse,
  ServiceError,
  ServiceErrorCode,
  OrderQueryParams,
  CreateOrderParams,
  UpdateOrderParams,
  ValidationResult,
  ValidationError,
  Logger,
  OrdersServiceConfig,
  ORDER_VALIDATION,
  isServiceSuccess,
  isServiceError
} from './types'

/**
 * Default console logger implementation
 */
class ConsoleLogger implements Logger {
  info(message: string, meta?: Record<string, any>): void {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '')
  }
}

/**
 * Fixed OrdersService with proper error handling and data validation
 */
export class OrdersService {
  private supabase: SupabaseClient
  private logger: Logger
  private validationEnabled: boolean
  private defaultLimit: number
  private maxLimit: number

  constructor(config?: Partial<OrdersServiceConfig>) {
    // Initialize Supabase client
    this.supabase = createClient(
      config?.supabase?.url || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      config?.supabase?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Initialize logger
    this.logger = config?.logger || new ConsoleLogger()
    
    // Initialize configuration
    this.validationEnabled = config?.validationEnabled ?? true
    this.defaultLimit = config?.defaultLimit ?? 20
    this.maxLimit = config?.maxLimit ?? 100

    this.logger.info('OrdersService initialized', {
      validationEnabled: this.validationEnabled,
      defaultLimit: this.defaultLimit,
      maxLimit: this.maxLimit
    })
  }

  /**
   * Validates order data according to the schema
   */
  private validateOrder(order: Partial<Order>): ValidationResult {
    const errors: ValidationError[] = []

    // Validate ID if present
    if (order.id !== undefined) {
      if (!order.id || typeof order.id !== 'string') {
        errors.push({
          field: 'id',
          message: 'ID must be a non-empty string',
          value: order.id
        })
      } else if (!this.isValidUUID(order.id)) {
        errors.push({
          field: 'id',
          message: 'ID must be a valid UUID',
          value: order.id
        })
      }
    }

    // Validate customer_id if present
    if (order.customer_id !== undefined) {
      if (!order.customer_id || typeof order.customer_id !== 'string') {
        errors.push({
          field: 'customer_id',
          message: 'Customer ID must be a non-empty string',
          value: order.customer_id
        })
      } else if (!this.isValidUUID(order.customer_id)) {
        errors.push({
          field: 'customer_id',
          message: 'Customer ID must be a valid UUID',
          value: order.customer_id
        })
      }
    }

    // Validate total_amount if present
    if (order.total_amount !== undefined) {
      if (typeof order.total_amount !== 'number' || isNaN(order.total_amount)) {
        errors.push({
          field: 'total_amount',
          message: 'Total amount must be a valid number',
          value: order.total_amount
        })
      } else if (order.total_amount < ORDER_VALIDATION.total_amount.min) {
        errors.push({
          field: 'total_amount',
          message: `Total amount must be at least ${ORDER_VALIDATION.total_amount.min}`,
          value: order.total_amount
        })
      } else if (order.total_amount > ORDER_VALIDATION.total_amount.max) {
        errors.push({
          field: 'total_amount',
          message: `Total amount must not exceed ${ORDER_VALIDATION.total_amount.max}`,
          value: order.total_amount
        })
      }
    }

    // Validate status if present
    if (order.status !== undefined) {
      if (!order.status || typeof order.status !== 'string') {
        errors.push({
          field: 'status',
          message: 'Status must be a non-empty string',
          value: order.status
        })
      } else if (!Object.values(OrderStatus).includes(order.status as OrderStatus)) {
        errors.push({
          field: 'status',
          message: `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
          value: order.status
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validates UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Creates a success response
   */
  private createSuccessResponse<T>(data: T, message?: string): ServiceResponse<T> {
    return {
      success: true,
      data,
      message
    }
  }

  /**
   * Creates an error response
   */
  private createErrorResponse(
    error: string,
    code: ServiceErrorCode,
    details?: Record<string, any>
  ): ServiceError {
    return {
      success: false,
      error,
      code,
      details
    }
  }

  /**
   * Handles database errors and converts them to service errors
   */
  private handleDatabaseError(error: any, operation: string): ServiceError {
    this.logger.error(`Database error during ${operation}`, { error })

    if (error?.code === 'PGRST116') {
      return this.createErrorResponse(
        'Order not found',
        ServiceErrorCode.NOT_FOUND,
        { operation, originalError: error.message }
      )
    }

    if (error?.code === '23505') {
      return this.createErrorResponse(
        'Order with this ID already exists',
        ServiceErrorCode.VALIDATION_ERROR,
        { operation, originalError: error.message }
      )
    }

    if (error?.code === '23503') {
      return this.createErrorResponse(
        'Referenced customer does not exist',
        ServiceErrorCode.VALIDATION_ERROR,
        { operation, originalError: error.message }
      )
    }

    return this.createErrorResponse(
      `Database error during ${operation}`,
      ServiceErrorCode.DATABASE_ERROR,
      { operation, originalError: error?.message || 'Unknown database error' }
    )
  }

  /**
   * Gets all orders with optional filtering and pagination
   * NEVER returns undefined - always returns an array
   */
  async getOrders(params: OrderQueryParams = {}): Promise<ServiceResult<Order[]>> {
    try {
      this.logger.info('Fetching orders', { params })

      // Validate and sanitize parameters
      const limit = Math.min(params.limit || this.defaultLimit, this.maxLimit)
      const offset = Math.max(params.offset || 0, 0)

      // Build query
      let query = this.supabase
        .from('orders')
        .select('*')

      // Apply filters
      if (params.customer_id) {
        if (!this.isValidUUID(params.customer_id)) {
          return this.createErrorResponse(
            'Invalid customer ID format',
            ServiceErrorCode.INVALID_INPUT,
            { field: 'customer_id', value: params.customer_id }
          )
        }
        query = query.eq('customer_id', params.customer_id)
      }

      if (params.status) {
        query = query.eq('status', params.status)
      }

      // Apply sorting
      const sortBy = params.sort_by || 'created_at'
      const sortOrder = params.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      // Execute query
      const { data, error } = await query

      if (error) {
        return this.handleDatabaseError(error, 'getOrders')
      }

      // Ensure we always return an array, never undefined
      const orders = Array.isArray(data) ? data : []
      
      this.logger.info('Successfully fetched orders', { 
        count: orders.length,
        limit,
        offset 
      })

      return this.createSuccessResponse(orders, `Retrieved ${orders.length} orders`)

    } catch (error) {
      this.logger.error('Unexpected error in getOrders', { error })
      return this.createErrorResponse(
        'An unexpected error occurred while fetching orders',
        ServiceErrorCode.UNKNOWN_ERROR,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Gets a single order by ID
   * Returns null for not found, never undefined
   */
  async getOrderById(id: string): Promise<ServiceResult<Order | null>> {
    try {
      this.logger.info('Fetching order by ID', { id })

      // Validate input
      if (!id || typeof id !== 'string') {
        return this.createErrorResponse(
          'Order ID is required and must be a string',
          ServiceErrorCode.INVALID_INPUT,
          { field: 'id', value: id }
        )
      }

      if (!this.isValidUUID(id)) {
        return this.createErrorResponse(
          'Invalid order ID format',
          ServiceErrorCode.INVALID_INPUT,
          { field: 'id', value: id }
        )
      }

      // Execute query
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return this.handleDatabaseError(error, 'getOrderById')
      }

      // Return null for not found, never undefined
      const order = data || null

      this.logger.info('Successfully fetched order', { 
        id,
        found: order !== null 
      })

      return this.createSuccessResponse(order, order ? 'Order found' : 'Order not found')

    } catch (error) {
      this.logger.error('Unexpected error in getOrderById', { error })
      return this.createErrorResponse(
        'An unexpected error occurred while fetching order',
        ServiceErrorCode.UNKNOWN_ERROR,
        { id, originalError: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Creates a new order
   */
  async createOrder(orderData: CreateOrderParams): Promise<ServiceResult<Order>> {
    try {
      this.logger.info('Creating new order', { orderData })

      // Validate input
      if (this.validationEnabled) {
        const validation = this.validateOrder(orderData)
        if (!validation.isValid) {
          return this.createErrorResponse(
            'Validation failed',
            ServiceErrorCode.VALIDATION_ERROR,
            { validationErrors: validation.errors }
          )
        }
      }

      // Prepare order data
      const orderToCreate = {
        customer_id: orderData.customer_id,
        total_amount: orderData.total_amount,
        status: orderData.status || OrderStatus.PENDING,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Execute query
      const { data, error } = await this.supabase
        .from('orders')
        .insert(orderToCreate)
        .select()
        .single()

      if (error) {
        return this.handleDatabaseError(error, 'createOrder')
      }

      if (!data) {
        return this.createErrorResponse(
          'Failed to create order - no data returned',
          ServiceErrorCode.DATABASE_ERROR,
          { operation: 'createOrder' }
        )
      }

      this.logger.info('Successfully created order', { id: data.id })

      return this.createSuccessResponse(data, 'Order created successfully')

    } catch (error) {
      this.logger.error('Unexpected error in createOrder', { error })
      return this.createErrorResponse(
        'An unexpected error occurred while creating order',
        ServiceErrorCode.UNKNOWN_ERROR,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Updates an existing order
   */
  async updateOrder(id: string, updates: UpdateOrderParams): Promise<ServiceResult<Order>> {
    try {
      this.logger.info('Updating order', { id, updates })

      // Validate ID
      if (!id || !this.isValidUUID(id)) {
        return this.createErrorResponse(
          'Invalid order ID format',
          ServiceErrorCode.INVALID_INPUT,
          { field: 'id', value: id }
        )
      }

      // Validate updates
      if (this.validationEnabled) {
        const validation = this.validateOrder(updates)
        if (!validation.isValid) {
          return this.createErrorResponse(
            'Validation failed',
            ServiceErrorCode.VALIDATION_ERROR,
            { validationErrors: validation.errors }
          )
        }
      }

      // Prepare update data
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Execute query
      const { data, error } = await this.supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return this.handleDatabaseError(error, 'updateOrder')
      }

      if (!data) {
        return this.createErrorResponse(
          'Order not found',
          ServiceErrorCode.NOT_FOUND,
          { id, operation: 'updateOrder' }
        )
      }

      this.logger.info('Successfully updated order', { id })

      return this.createSuccessResponse(data, 'Order updated successfully')

    } catch (error) {
      this.logger.error('Unexpected error in updateOrder', { error })
      return this.createErrorResponse(
        'An unexpected error occurred while updating order',
        ServiceErrorCode.UNKNOWN_ERROR,
        { id, originalError: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Deletes an order
   */
  async deleteOrder(id: string): Promise<ServiceResult<boolean>> {
    try {
      this.logger.info('Deleting order', { id })

      // Validate ID
      if (!id || !this.isValidUUID(id)) {
        return this.createErrorResponse(
          'Invalid order ID format',
          ServiceErrorCode.INVALID_INPUT,
          { field: 'id', value: id }
        )
      }

      // Execute query
      const { error } = await this.supabase
        .from('orders')
        .delete()
        .eq('id', id)

      if (error) {
        return this.handleDatabaseError(error, 'deleteOrder')
      }

      this.logger.info('Successfully deleted order', { id })

      return this.createSuccessResponse(true, 'Order deleted successfully')

    } catch (error) {
      this.logger.error('Unexpected error in deleteOrder', { error })
      return this.createErrorResponse(
        'An unexpected error occurred while deleting order',
        ServiceErrorCode.UNKNOWN_ERROR,
        { id, originalError: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Gets order statistics
   */
  async getOrderStats(): Promise<ServiceResult<{ total: number; byStatus: Record<string, number> }>> {
    try {
      this.logger.info('Fetching order statistics')

      const { data, error } = await this.supabase
        .from('orders')
        .select('status')

      if (error) {
        return this.handleDatabaseError(error, 'getOrderStats')
      }

      const orders = Array.isArray(data) ? data : []
      const stats = {
        total: orders.length,
        byStatus: orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      this.logger.info('Successfully fetched order statistics', { stats })

      return this.createSuccessResponse(stats, 'Order statistics retrieved')

    } catch (error) {
      this.logger.error('Unexpected error in getOrderStats', { error })
      return this.createErrorResponse(
        'An unexpected error occurred while fetching order statistics',
        ServiceErrorCode.UNKNOWN_ERROR,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }
}
