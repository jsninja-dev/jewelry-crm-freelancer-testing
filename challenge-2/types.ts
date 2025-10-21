// CHALLENGE 2: TypeScript types for communications API
// This file contains comprehensive TypeScript type definitions

/**
 * User type representing a user in the system
 */
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

/**
 * Communication type with optional user relationships
 */
export interface Communication {
  id: string;
  message: string;
  sender_id: string | null;
  recipient_id: string | null;
  created_at: string;
  updated_at: string;
  sender?: User | null;
  recipient?: User | null;
}

/**
 * Communication with populated user relationships
 */
export interface CommunicationWithUsers extends Omit<Communication, 'sender' | 'recipient'> {
  sender: User | null;
  recipient: User | null;
}

/**
 * Successful API response for communications
 */
export interface CommunicationsResponse {
  success: true;
  data: CommunicationWithUsers[];
  meta?: {
    total: number;
    page?: number;
    limit?: number;
  };
}

/**
 * Error response from the API
 */
export interface CommunicationsError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Union type for all possible API responses
 */
export type CommunicationsApiResponse = CommunicationsResponse | CommunicationsError;

/**
 * Query parameters for filtering communications
 */
export interface CommunicationsQueryParams {
  limit?: number;
  offset?: number;
  sender_id?: string;
  recipient_id?: string;
  search?: string;
  sort_by?: 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

/**
 * Supabase query result type for communications with joins
 */
export interface SupabaseCommunicationResult {
  id: string;
  message: string;
  sender_id: string | null;
  recipient_id: string | null;
  created_at: string;
  updated_at: string;
  sender: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
  } | null;
  recipient: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
  } | null;
}

/**
 * Error codes that can be returned by the API
 */
export enum CommunicationsErrorCode {
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  QUERY_ERROR = 'QUERY_ERROR'
}

/**
 * HTTP status codes for different scenarios
 */
export enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

/**
 * Type guard to check if response is successful
 */
export function isCommunicationsSuccess(response: CommunicationsApiResponse): response is CommunicationsResponse {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isCommunicationsError(response: CommunicationsApiResponse): response is CommunicationsError {
  return response.success === false;
}

/**
 * Validation schema for communication query parameters
 */
export interface CommunicationQueryValidation {
  limit?: {
    min: number;
    max: number;
    default: number;
  };
  offset?: {
    min: number;
    default: number;
  };
  sort_by?: string[];
  sort_order?: string[];
}

/**
 * Default validation rules
 */
export const COMMUNICATION_QUERY_VALIDATION: CommunicationQueryValidation = {
  limit: {
    min: 1,
    max: 100,
    default: 20
  },
  offset: {
    min: 0,
    default: 0
  },
  sort_by: ['created_at', 'updated_at'],
  sort_order: ['asc', 'desc']
};

/**
 * Utility type for API route handler
 */
export type CommunicationsApiHandler = (
  request: Request,
  context?: { params?: Record<string, string> }
) => Promise<Response>;

/**
 * Type for Supabase client configuration
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}
