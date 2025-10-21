// CHALLENGE 3: TypeScript types for OrdersService
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
 * Order interface representing a single order
 */
export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Order with customer information (for extended queries)
 */
export interface OrderWithCustomer extends Order {
  customer?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
}

/**
 * Service response wrapper for successful operations
 */
export interface ServiceResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Service error response
 */
export interface ServiceError {
  success: false;
  error: string;
  code: ServiceErrorCode;
  details?: Record<string, any>;
}

/**
 * Union type for all service responses
 */
export type ServiceResult<T> = ServiceResponse<T> | ServiceError;

/**
 * Error codes for different failure scenarios
 */
export enum ServiceErrorCode {
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Query parameters for filtering orders
 */
export interface OrderQueryParams {
  customer_id?: string;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'updated_at' | 'total_amount';
  sort_order?: 'asc' | 'desc';
}

/**
 * Order creation parameters
 */
export interface CreateOrderParams {
  customer_id: string;
  total_amount: number;
  status?: OrderStatus;
}

/**
 * Order update parameters
 */
export interface UpdateOrderParams {
  customer_id?: string;
  total_amount?: number;
  status?: OrderStatus;
}

/**
 * Validation schema for order data
 */
export interface OrderValidationSchema {
  id: {
    required: boolean;
    type: 'string';
    format: 'uuid';
  };
  customer_id: {
    required: boolean;
    type: 'string';
    format: 'uuid';
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
    enum: OrderStatus[];
  };
}

/**
 * Default validation rules
 */
export const ORDER_VALIDATION: OrderValidationSchema = {
  id: {
    required: true,
    type: 'string',
    format: 'uuid'
  },
  customer_id: {
    required: true,
    type: 'string',
    format: 'uuid'
  },
  total_amount: {
    required: true,
    type: 'number',
    min: 0.01,
    max: 999999.99
  },
  status: {
    required: true,
    type: 'string',
    enum: Object.values(OrderStatus)
  }
};

/**
 * Type guard to check if response is successful
 */
export function isServiceSuccess<T>(response: ServiceResult<T>): response is ServiceResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isServiceError<T>(response: ServiceResult<T>): response is ServiceError {
  return response.success === false;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
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
 * Supabase client configuration
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Service configuration options
 */
export interface OrdersServiceConfig {
  supabase: SupabaseConfig;
  logger?: Logger;
  validationEnabled?: boolean;
  defaultLimit?: number;
  maxLimit?: number;
}

/**
 * Method parameter types for OrdersService methods
 */
export interface GetOrdersParams extends OrderQueryParams {}

export interface GetOrderByIdParams {
  id: string;
}

export interface CreateOrderParams {
  order: CreateOrderParams;
}

export interface UpdateOrderParams {
  id: string;
  updates: UpdateOrderParams;
}

export interface DeleteOrderParams {
  id: string;
}

/**
 * Statistics interface for order analytics
 */
export interface OrderStats {
  total: number;
  byStatus: Record<OrderStatus, number>;
  totalAmount: number;
  averageAmount: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ServiceResponse<T[]> {
  meta: PaginationMeta;
}
