// CHALLENGE 5: TypeScript types for OrderAnalyticsService
// This file contains comprehensive TypeScript type definitions

/**
 * Order status enum for type safety
 */
export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

/**
 * Order item interface representing a single item in an order
 */
export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at?: string;
}

/**
 * Order interface representing a single order with items
 */
export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: OrderStatus | string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

/**
 * Order totals interface for analytics calculations
 */
export interface OrderTotals {
  totalRevenue: number;
  averageOrderValue: number;
  totalItems: number;
  totalOrders: number;
}

/**
 * Order statistics interface for analytics dashboard
 */
export interface OrderStatistics {
  totalOrders: number;
  statusCounts: Record<string, number>;
  totalRevenue: number;
  averageOrderValue: number;
  totalItems: number;
}

/**
 * Service response wrapper for successful operations
 */
export interface AnalyticsResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    processedOrders: number;
    skippedOrders: number;
    warnings?: string[];
  };
}

/**
 * Service error response
 */
export interface AnalyticsError {
  success: false;
  error: string;
  code: AnalyticsErrorCode;
  details?: Record<string, any>;
}

/**
 * Union type for all service responses
 */
export type AnalyticsResult<T> = AnalyticsResponse<T> | AnalyticsError;

/**
 * Error codes for different failure scenarios
 */
export enum AnalyticsErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  DATA_VALIDATION_ERROR = 'DATA_VALIDATION_ERROR',
  TRANSFORMATION_ERROR = 'TRANSFORMATION_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  MISSING_DATA_ERROR = 'MISSING_DATA_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  orderId?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Data transformation options
 */
export interface TransformationOptions {
  skipInvalidOrders?: boolean;
  defaultValues?: {
    quantity?: number;
    price?: number;
    status?: string;
  };
  validationEnabled?: boolean;
  loggingEnabled?: boolean;
}

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

/**
 * Service configuration options
 */
export interface OrderAnalyticsConfig {
  logger?: Logger;
  transformationOptions?: TransformationOptions;
  validationEnabled?: boolean;
  defaultOrderStatus?: OrderStatus;
}

/**
 * Type guard to check if response is successful
 */
export function isAnalyticsSuccess<T>(response: AnalyticsResult<T>): response is AnalyticsResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isAnalyticsError<T>(response: AnalyticsResult<T>): response is AnalyticsError {
  return response.success === false;
}

/**
 * Type guard to check if order is valid
 */
export function isValidOrder(order: any): order is Order {
  return (
    order &&
    typeof order === 'object' &&
    typeof order.id === 'string' &&
    typeof order.customer_id === 'string' &&
    typeof order.total_amount === 'number' &&
    typeof order.status === 'string' &&
    Array.isArray(order.items) &&
    typeof order.created_at === 'string' &&
    typeof order.updated_at === 'string'
  );
}

/**
 * Type guard to check if order item is valid
 */
export function isValidOrderItem(item: any): item is OrderItem {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.product_id === 'string' &&
    typeof item.quantity === 'number' &&
    typeof item.price === 'number' &&
    item.quantity > 0 &&
    item.price >= 0
  );
}

/**
 * Type guard to check if orders array is valid
 */
export function isValidOrdersArray(orders: any): orders is Order[] {
  return Array.isArray(orders) && orders.every(isValidOrder);
}

/**
 * Validation schema for order data
 */
export interface OrderValidationSchema {
  id: {
    required: boolean;
    type: 'string';
    minLength: number;
  };
  customer_id: {
    required: boolean;
    type: 'string';
    minLength: number;
  };
  total_amount: {
    required: boolean;
    type: 'number';
    min: number;
    max: number;
  };
  status: {
    required: boolean;
    type: 'string';
    allowedValues: string[];
  };
  items: {
    required: boolean;
    type: 'array';
    minLength: number;
  };
}

/**
 * Default validation rules
 */
export const ORDER_VALIDATION_SCHEMA: OrderValidationSchema = {
  id: {
    required: true,
    type: 'string',
    minLength: 1
  },
  customer_id: {
    required: true,
    type: 'string',
    minLength: 1
  },
  total_amount: {
    required: true,
    type: 'number',
    min: 0,
    max: 999999.99
  },
  status: {
    required: true,
    type: 'string',
    allowedValues: Object.values(OrderStatus)
  },
  items: {
    required: true,
    type: 'array',
    minLength: 0
  }
};

/**
 * Analytics calculation result
 */
export interface CalculationResult {
  totalRevenue: number;
  averageOrderValue: number;
  totalItems: number;
  totalOrders: number;
  processedOrders: number;
  skippedOrders: number;
  warnings: string[];
}

/**
 * Method parameter types for OrderAnalyticsService methods
 */
export interface CalculateOrderTotalsParams {
  orders: Order[] | undefined | null;
  options?: TransformationOptions;
}

export interface GetOrderStatisticsParams {
  orders: Order[] | undefined | null;
  options?: TransformationOptions;
}

/**
 * Statistics breakdown by status
 */
export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
  totalRevenue: number;
  averageOrderValue: number;
}

/**
 * Extended statistics with breakdown
 */
export interface ExtendedOrderStatistics extends OrderStatistics {
  statusBreakdown: StatusBreakdown[];
  topCustomers: Array<{
    customer_id: string;
    orderCount: number;
    totalSpent: number;
  }>;
  dateRange?: {
    earliest: string;
    latest: string;
  };
}
