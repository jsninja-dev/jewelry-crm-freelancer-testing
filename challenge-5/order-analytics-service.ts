// CHALLENGE 5: Fixed OrderAnalyticsService with proper error handling and data validation
// This file contains the complete fixed service implementation

import {
  Order,
  OrderItem,
  OrderTotals,
  OrderStatistics,
  OrderStatus,
  AnalyticsResult,
  AnalyticsResponse,
  AnalyticsError,
  AnalyticsErrorCode,
  ValidationResult,
  ValidationError,
  TransformationOptions,
  Logger,
  OrderAnalyticsConfig,
  CalculationResult,
  isValidOrder,
  isValidOrderItem,
  isValidOrdersArray,
  ORDER_VALIDATION_SCHEMA,
  isAnalyticsSuccess,
  isAnalyticsError
} from './types'

/**
 * Default console logger implementation
 */
class ConsoleLogger implements Logger {
  info(message: string, meta?: Record<string, any>): void {
    console.log(`[ANALYTICS-INFO] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[ANALYTICS-WARN] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(`[ANALYTICS-ERROR] ${message}`, meta ? JSON.stringify(meta) : '')
  }

  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`[ANALYTICS-DEBUG] ${message}`, meta ? JSON.stringify(meta) : '')
  }
}

/**
 * Fixed OrderAnalyticsService with proper error handling and data validation
 * NEVER crashes on undefined data - always handles gracefully
 */
export class OrderAnalyticsService {
  private logger: Logger
  private validationEnabled: boolean
  private defaultOptions: TransformationOptions

  constructor(config?: OrderAnalyticsConfig) {
    // Initialize logger
    this.logger = config?.logger || new ConsoleLogger()
    
    // Initialize configuration
    this.validationEnabled = config?.validationEnabled ?? true
    
    // Initialize default transformation options
    this.defaultOptions = {
      skipInvalidOrders: true,
      defaultValues: {
        quantity: 1,
        price: 0,
        status: config?.defaultOrderStatus || OrderStatus.PENDING
      },
      validationEnabled: this.validationEnabled,
      loggingEnabled: true,
      ...config?.transformationOptions
    }

    this.logger.info('OrderAnalyticsService initialized', {
      validationEnabled: this.validationEnabled,
      skipInvalidOrders: this.defaultOptions.skipInvalidOrders
    })
  }

  /**
   * Validates order data according to the schema
   */
  private validateOrder(order: any, orderIndex?: number): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Check if order exists
    if (!order) {
      errors.push({
        field: 'order',
        message: 'Order is null or undefined',
        value: order,
        orderId: orderIndex?.toString()
      })
      return { isValid: false, errors, warnings }
    }

    // Validate order structure
    if (!isValidOrder(order)) {
      errors.push({
        field: 'order',
        message: 'Invalid order structure',
        value: order,
        orderId: order.id || orderIndex?.toString()
      })
      return { isValid: false, errors, warnings }
    }

    // Validate individual fields
    if (!order.id || typeof order.id !== 'string') {
      errors.push({
        field: 'id',
        message: 'Order ID is required and must be a string',
        value: order.id,
        orderId: order.id
      })
    }

    if (!order.customer_id || typeof order.customer_id !== 'string') {
      errors.push({
        field: 'customer_id',
        message: 'Customer ID is required and must be a string',
        value: order.customer_id,
        orderId: order.id
      })
    }

    if (typeof order.total_amount !== 'number' || isNaN(order.total_amount)) {
      errors.push({
        field: 'total_amount',
        message: 'Total amount must be a valid number',
        value: order.total_amount,
        orderId: order.id
      })
    } else if (order.total_amount < 0) {
      warnings.push({
        field: 'total_amount',
        message: 'Total amount is negative',
        value: order.total_amount,
        orderId: order.id
      })
    }

    if (!order.status || typeof order.status !== 'string') {
      errors.push({
        field: 'status',
        message: 'Order status is required and must be a string',
        value: order.status,
        orderId: order.id
      })
    }

    // Validate items array
    if (!Array.isArray(order.items)) {
      errors.push({
        field: 'items',
        message: 'Items must be an array',
        value: order.items,
        orderId: order.id
      })
    } else {
      // Validate each item
      order.items.forEach((item: any, itemIndex: number) => {
        if (!isValidOrderItem(item)) {
          errors.push({
            field: `items[${itemIndex}]`,
            message: 'Invalid order item structure',
            value: item,
            orderId: order.id
          })
        } else {
          // Additional item validation
          if (item.quantity <= 0) {
            warnings.push({
              field: `items[${itemIndex}].quantity`,
              message: 'Item quantity is zero or negative',
              value: item.quantity,
              orderId: order.id
            })
          }
          if (item.price < 0) {
            warnings.push({
              field: `items[${itemIndex}].price`,
              message: 'Item price is negative',
              value: item.price,
              orderId: order.id
            })
          }
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Safely processes orders array, handling undefined/null cases
   */
  private processOrdersArray(orders: Order[] | undefined | null): {
    validOrders: Order[];
    skippedOrders: number;
    warnings: string[];
  } {
    // Handle undefined/null input
    if (!orders) {
      this.logger.warn('Orders array is undefined or null, returning empty results')
      return {
        validOrders: [],
        skippedOrders: 0,
        warnings: ['Orders array was undefined or null']
      }
    }

    // Handle non-array input
    if (!Array.isArray(orders)) {
      this.logger.error('Orders input is not an array', { type: typeof orders, value: orders })
      return {
        validOrders: [],
        skippedOrders: 0,
        warnings: ['Orders input is not an array']
      }
    }

    const validOrders: Order[] = []
    let skippedOrders = 0
    const warnings: string[] = []

    // Process each order
    orders.forEach((order, index) => {
      if (this.validationEnabled) {
        const validation = this.validateOrder(order, index)
        
        if (!validation.isValid) {
          skippedOrders++
          this.logger.warn(`Skipping invalid order at index ${index}`, {
            orderId: order?.id,
            errors: validation.errors
          })
          warnings.push(`Skipped invalid order at index ${index}: ${validation.errors.map(e => e.message).join(', ')}`)
          return
        }

        // Add warnings for this order
        validation.warnings.forEach(warning => {
          warnings.push(`Order ${order.id}: ${warning.message}`)
        })
      }

      validOrders.push(order)
    })

    this.logger.info('Processed orders array', {
      totalOrders: orders.length,
      validOrders: validOrders.length,
      skippedOrders,
      warnings: warnings.length
    })

    return { validOrders, skippedOrders, warnings }
  }

  /**
   * Creates a success response
   */
  private createSuccessResponse<T>(
    data: T, 
    message?: string, 
    meta?: { processedOrders: number; skippedOrders: number; warnings?: string[] }
  ): AnalyticsResponse<T> {
    return {
      success: true,
      data,
      message,
      meta
    }
  }

  /**
   * Creates an error response
   */
  private createErrorResponse(
    error: string,
    code: AnalyticsErrorCode,
    details?: Record<string, any>
  ): AnalyticsError {
    return {
      success: false,
      error,
      code,
      details
    }
  }

  /**
   * Safely calculates order totals with comprehensive error handling
   * NEVER crashes on undefined data - always returns a result
   */
  async calculateOrderTotals(orders: Order[] | undefined | null): Promise<AnalyticsResult<OrderTotals>> {
    try {
      this.logger.info('Starting order totals calculation', { 
        ordersCount: orders?.length || 0,
        ordersType: typeof orders 
      })

      // Process orders array safely
      const { validOrders, skippedOrders, warnings } = this.processOrdersArray(orders)

      // Handle empty orders case
      if (validOrders.length === 0) {
        const emptyTotals: OrderTotals = {
          totalRevenue: 0,
          averageOrderValue: 0,
          totalItems: 0,
          totalOrders: 0
        }

        this.logger.info('No valid orders found, returning zero totals')
        return this.createSuccessResponse(
          emptyTotals,
          'No valid orders found',
          { processedOrders: 0, skippedOrders, warnings }
        )
      }

      // Calculate totals safely
      let totalRevenue = 0
      let totalItems = 0
      let calculationWarnings: string[] = [...warnings]

      for (const order of validOrders) {
        try {
          // Safely calculate order revenue
          if (Array.isArray(order.items)) {
            const orderRevenue = order.items.reduce((sum, item) => {
              if (isValidOrderItem(item)) {
                const itemTotal = (item.price || 0) * (item.quantity || 0)
                totalRevenue += itemTotal
                return sum + itemTotal
              } else {
                calculationWarnings.push(`Invalid item in order ${order.id}, skipping`)
                return sum
              }
            }, 0)

            // Count items safely
            const orderItemCount = order.items.reduce((count, item) => {
              if (isValidOrderItem(item)) {
                return count + (item.quantity || 0)
              }
              return count
            }, 0)
            totalItems += orderItemCount
          } else {
            calculationWarnings.push(`Order ${order.id} has invalid items array`)
          }
        } catch (itemError) {
          this.logger.error(`Error processing items for order ${order.id}`, { error: itemError })
          calculationWarnings.push(`Error processing items for order ${order.id}`)
        }
      }

      // Calculate average order value safely
      const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0

      const totals: OrderTotals = {
        totalRevenue,
        averageOrderValue,
        totalItems,
        totalOrders: validOrders.length
      }

      this.logger.info('Successfully calculated order totals', {
        totals,
        processedOrders: validOrders.length,
        skippedOrders,
        warnings: calculationWarnings.length
      })

      return this.createSuccessResponse(
        totals,
        `Calculated totals for ${validOrders.length} orders`,
        { 
          processedOrders: validOrders.length, 
          skippedOrders, 
          warnings: calculationWarnings 
        }
      )

    } catch (error) {
      this.logger.error('Unexpected error in calculateOrderTotals', { error })
      return this.createErrorResponse(
        'An unexpected error occurred while calculating order totals',
        AnalyticsErrorCode.UNKNOWN_ERROR,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Safely gets order statistics with comprehensive error handling
   * NEVER crashes on undefined data - always returns a result
   */
  async getOrderStatistics(orders: Order[] | undefined | null): Promise<AnalyticsResult<OrderStatistics>> {
    try {
      this.logger.info('Starting order statistics calculation', { 
        ordersCount: orders?.length || 0,
        ordersType: typeof orders 
      })

      // Process orders array safely
      const { validOrders, skippedOrders, warnings } = this.processOrdersArray(orders)

      // Handle empty orders case
      if (validOrders.length === 0) {
        const emptyStats: OrderStatistics = {
          totalOrders: 0,
          statusCounts: {},
          totalRevenue: 0,
          averageOrderValue: 0,
          totalItems: 0
        }

        this.logger.info('No valid orders found, returning empty statistics')
        return this.createSuccessResponse(
          emptyStats,
          'No valid orders found',
          { processedOrders: 0, skippedOrders, warnings }
        )
      }

      // Calculate statistics safely
      const statusCounts: Record<string, number> = {}
      let totalRevenue = 0
      let totalItems = 0
      let calculationWarnings: string[] = [...warnings]

      for (const order of validOrders) {
        try {
          // Count statuses safely
          const status = order.status || 'unknown'
          statusCounts[status] = (statusCounts[status] || 0) + 1

          // Calculate revenue safely
          if (Array.isArray(order.items)) {
            const orderRevenue = order.items.reduce((sum, item) => {
              if (isValidOrderItem(item)) {
                return sum + ((item.price || 0) * (item.quantity || 0))
              }
              return sum
            }, 0)
            totalRevenue += orderRevenue

            // Count items safely
            const orderItemCount = order.items.reduce((count, item) => {
              if (isValidOrderItem(item)) {
                return count + (item.quantity || 0)
              }
              return count
            }, 0)
            totalItems += orderItemCount
          } else {
            calculationWarnings.push(`Order ${order.id} has invalid items array`)
          }
        } catch (orderError) {
          this.logger.error(`Error processing order ${order.id}`, { error: orderError })
          calculationWarnings.push(`Error processing order ${order.id}`)
        }
      }

      // Calculate average order value safely
      const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0

      const statistics: OrderStatistics = {
        totalOrders: validOrders.length,
        statusCounts,
        totalRevenue,
        averageOrderValue,
        totalItems
      }

      this.logger.info('Successfully calculated order statistics', {
        statistics,
        processedOrders: validOrders.length,
        skippedOrders,
        warnings: calculationWarnings.length
      })

      return this.createSuccessResponse(
        statistics,
        `Calculated statistics for ${validOrders.length} orders`,
        { 
          processedOrders: validOrders.length, 
          skippedOrders, 
          warnings: calculationWarnings 
        }
      )

    } catch (error) {
      this.logger.error('Unexpected error in getOrderStatistics', { error })
      return this.createErrorResponse(
        'An unexpected error occurred while calculating order statistics',
        AnalyticsErrorCode.UNKNOWN_ERROR,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Gets detailed calculation breakdown for debugging
   */
  async getCalculationBreakdown(orders: Order[] | undefined | null): Promise<AnalyticsResult<CalculationResult>> {
    try {
      this.logger.info('Starting calculation breakdown', { 
        ordersCount: orders?.length || 0,
        ordersType: typeof orders 
      })

      // Process orders array safely
      const { validOrders, skippedOrders, warnings } = this.processOrdersArray(orders)

      let totalRevenue = 0
      let totalItems = 0
      let calculationWarnings: string[] = [...warnings]

      // Process each order with detailed tracking
      for (const order of validOrders) {
        try {
          if (Array.isArray(order.items)) {
            const orderRevenue = order.items.reduce((sum, item) => {
              if (isValidOrderItem(item)) {
                return sum + ((item.price || 0) * (item.quantity || 0))
              } else {
                calculationWarnings.push(`Invalid item in order ${order.id}`)
                return sum
              }
            }, 0)
            totalRevenue += orderRevenue

            const orderItemCount = order.items.reduce((count, item) => {
              if (isValidOrderItem(item)) {
                return count + (item.quantity || 0)
              }
              return count
            }, 0)
            totalItems += orderItemCount
          }
        } catch (orderError) {
          this.logger.error(`Error processing order ${order.id}`, { error: orderError })
          calculationWarnings.push(`Error processing order ${order.id}`)
        }
      }

      const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0

      const breakdown: CalculationResult = {
        totalRevenue,
        averageOrderValue,
        totalItems,
        totalOrders: validOrders.length,
        processedOrders: validOrders.length,
        skippedOrders,
        warnings: calculationWarnings
      }

      return this.createSuccessResponse(
        breakdown,
        'Calculation breakdown completed',
        { 
          processedOrders: validOrders.length, 
          skippedOrders, 
          warnings: calculationWarnings 
        }
      )

    } catch (error) {
      this.logger.error('Unexpected error in getCalculationBreakdown', { error })
      return this.createErrorResponse(
        'An unexpected error occurred while calculating breakdown',
        AnalyticsErrorCode.UNKNOWN_ERROR,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }
}
