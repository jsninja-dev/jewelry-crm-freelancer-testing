// CHALLENGE 4: TypeScript types for protected route authentication
// This file contains comprehensive TypeScript type definitions

/**
 * Supabase User type from auth.getUser()
 */
export interface SupabaseUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  aud: string;
  role?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  identities?: Array<{
    id: string;
    user_id: string;
    identity_data: Record<string, any>;
    provider: string;
    created_at: string;
    updated_at: string;
  }>;
  factors?: Array<{
    id: string;
    user_id: string;
    factor_type: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
}

/**
 * User data from the user_data table
 */
export interface UserData {
  id: string;
  user_id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Successful API response for protected route
 */
export interface ProtectedRouteSuccessResponse {
  success: true;
  data: UserData[];
  user: {
    id: string;
    email?: string;
  };
  message?: string;
}

/**
 * Error response from the protected route
 */
export interface ProtectedRouteErrorResponse {
  success: false;
  error: string;
  code: AuthenticationErrorCode;
  details?: Record<string, any>;
}

/**
 * Union type for all possible API responses
 */
export type ProtectedRouteResponse = ProtectedRouteSuccessResponse | ProtectedRouteErrorResponse;

/**
 * Error codes for different authentication failure scenarios
 */
export enum AuthenticationErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED'
}

/**
 * HTTP status codes for different scenarios
 */
export enum HttpStatusCode {
  OK = 200,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

/**
 * Authentication result from Supabase
 */
export interface AuthenticationResult {
  user: SupabaseUser | null;
  error: Error | null;
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
 * Authentication middleware configuration
 */
export interface AuthMiddlewareConfig {
  logger?: Logger;
  requireEmail?: boolean;
  allowedRoles?: string[];
  skipAuth?: boolean; // For testing purposes
}

/**
 * Request context with authentication information
 */
export interface AuthenticatedRequestContext {
  user: SupabaseUser;
  userId: string;
  isAuthenticated: true;
}

export interface UnauthenticatedRequestContext {
  user: null;
  userId: null;
  isAuthenticated: false;
}

export type RequestContext = AuthenticatedRequestContext | UnauthenticatedRequestContext;

/**
 * Type guard to check if response is successful
 */
export function isProtectedRouteSuccess(response: ProtectedRouteResponse): response is ProtectedRouteSuccessResponse {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isProtectedRouteError(response: ProtectedRouteResponse): response is ProtectedRouteErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if request context is authenticated
 */
export function isAuthenticatedContext(context: RequestContext): context is AuthenticatedRequestContext {
  return context.isAuthenticated === true;
}

/**
 * Type guard to check if user is valid
 */
export function isValidUser(user: SupabaseUser | null): user is SupabaseUser {
  return user !== null && typeof user.id === 'string' && user.id.length > 0;
}

/**
 * Authentication validation result
 */
export interface AuthValidationResult {
  isValid: boolean;
  user: SupabaseUser | null;
  error?: string;
  code?: AuthenticationErrorCode;
}

/**
 * Database query result wrapper
 */
export interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * API route handler type
 */
export type ProtectedRouteHandler = (
  request: NextRequest,
  context: RequestContext
) => Promise<NextResponse<ProtectedRouteResponse>>;

/**
 * Middleware function type
 */
export type AuthMiddleware = (
  request: NextRequest,
  config?: AuthMiddlewareConfig
) => Promise<RequestContext>;

/**
 * Error details for debugging
 */
export interface ErrorDetails {
  timestamp: string;
  requestId?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  endpoint: string;
  method: string;
  originalError?: Error;
}

/**
 * Security headers for responses
 */
export interface SecurityHeaders {
  'X-Content-Type-Options': 'nosniff';
  'X-Frame-Options': 'DENY';
  'X-XSS-Protection': '1; mode=block';
  'Strict-Transport-Security'?: string;
  'Content-Security-Policy'?: string;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Authentication token information
 */
export interface TokenInfo {
  token: string;
  type: 'Bearer' | 'Basic' | 'ApiKey';
  isValid: boolean;
  expiresAt?: Date;
  issuedAt?: Date;
}

/**
 * User session information
 */
export interface UserSession {
  userId: string;
  email?: string;
  role?: string;
  permissions?: string[];
  lastActivity: Date;
  sessionId?: string;
}

/**
 * Audit log entry for authentication events
 */
export interface AuthAuditLog {
  id: string;
  userId?: string;
  event: 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESH' | 'ACCESS_DENIED' | 'INVALID_TOKEN';
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}
