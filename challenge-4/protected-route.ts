// CHALLENGE 4: Fixed protected API route with proper authentication handling
// This file contains the complete fixed protected route implementation

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  SupabaseUser,
  UserData,
  ProtectedRouteResponse,
  ProtectedRouteSuccessResponse,
  ProtectedRouteErrorResponse,
  AuthenticationErrorCode,
  HttpStatusCode,
  RequestContext,
  AuthenticatedRequestContext,
  UnauthenticatedRequestContext,
  AuthMiddlewareConfig,
  Logger,
  ErrorDetails,
  SecurityHeaders,
  isValidUser,
  isProtectedRouteSuccess,
  isProtectedRouteError,
  isAuthenticatedContext
} from './types'

/**
 * Default console logger implementation
 */
class ConsoleLogger implements Logger {
  info(message: string, meta?: Record<string, any>): void {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
  }

  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
  }
}

/**
 * Creates security headers for responses
 */
function createSecurityHeaders(): SecurityHeaders {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'"
  }
}

/**
 * Creates error details for debugging
 */
function createErrorDetails(
  request: NextRequest,
  userId?: string,
  originalError?: Error
): ErrorDetails {
  return {
    timestamp: new Date().toISOString(),
    requestId: request.headers.get('x-request-id') || undefined,
    userId,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    endpoint: request.url,
    method: request.method,
    originalError
  }
}

/**
 * Creates a success response
 */
function createSuccessResponse(
  data: UserData[],
  user: SupabaseUser,
  message?: string
): NextResponse<ProtectedRouteSuccessResponse> {
  const response: ProtectedRouteSuccessResponse = {
    success: true,
    data,
    user: {
      id: user.id,
      email: user.email
    },
    message
  }

  return NextResponse.json(response, {
    status: HttpStatusCode.OK,
    headers: createSecurityHeaders()
  })
}

/**
 * Creates an error response
 */
function createErrorResponse(
  error: string,
  code: AuthenticationErrorCode,
  status: HttpStatusCode,
  details?: Record<string, any>
): NextResponse<ProtectedRouteErrorResponse> {
  const response: ProtectedRouteErrorResponse = {
    success: false,
    error,
    code,
    details
  }

  return NextResponse.json(response, {
    status,
    headers: createSecurityHeaders()
  })
}

/**
 * Authentication middleware to handle user authentication
 */
async function authenticateUser(
  request: NextRequest,
  config: AuthMiddlewareConfig = {}
): Promise<RequestContext> {
  const logger = config.logger || new ConsoleLogger()
  
  try {
    logger.debug('Starting authentication process', {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent')
    })

    // Skip authentication for testing purposes
    if (config.skipAuth) {
      logger.warn('Authentication skipped for testing')
      return {
        user: null,
        userId: null,
        isAuthenticated: false
      } as UnauthenticatedRequestContext
    }

    const supabase = await createSupabaseServerClient()
    
    // Get user from Supabase auth
    const { data: { user }, error } = await supabase.auth.getUser()

    // Handle authentication errors
    if (error) {
      logger.warn('Authentication error', {
        error: error.message,
        code: error.name
      })
      
      return {
        user: null,
        userId: null,
        isAuthenticated: false
      } as UnauthenticatedRequestContext
    }

    // Check if user exists and is valid
    if (!isValidUser(user)) {
      logger.warn('Invalid or missing user', {
        user: user ? 'exists but invalid' : 'null'
      })
      
      return {
        user: null,
        userId: null,
        isAuthenticated: false
      } as UnauthenticatedRequestContext
    }

    // Additional validation if email is required
    if (config.requireEmail && !user.email) {
      logger.warn('User missing required email', {
        userId: user.id
      })
      
      return {
        user: null,
        userId: null,
        isAuthenticated: false
      } as UnauthenticatedRequestContext
    }

    // Check role-based access if roles are specified
    if (config.allowedRoles && config.allowedRoles.length > 0) {
      const userRole = user.role || user.app_metadata?.role
      if (!userRole || !config.allowedRoles.includes(userRole)) {
        logger.warn('User role not allowed', {
          userId: user.id,
          userRole,
          allowedRoles: config.allowedRoles
        })
        
        return {
          user: null,
          userId: null,
          isAuthenticated: false
        } as UnauthenticatedRequestContext
      }
    }

    logger.info('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      role: user.role
    })

    return {
      user,
      userId: user.id,
      isAuthenticated: true
    } as AuthenticatedRequestContext

  } catch (error) {
    logger.error('Unexpected error during authentication', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return {
      user: null,
      userId: null,
      isAuthenticated: false
    } as UnauthenticatedRequestContext
  }
}

/**
 * Main protected route handler
 */
export async function GET(request: NextRequest): Promise<NextResponse<ProtectedRouteResponse>> {
  const logger = new ConsoleLogger()
  
  try {
    logger.info('Protected route accessed', {
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString()
    })

    // Authenticate user
    const authContext = await authenticateUser(request, {
      logger,
      requireEmail: true
    })

    // Check if user is authenticated
    if (!isAuthenticatedContext(authContext)) {
      logger.warn('Unauthorized access attempt', {
        url: request.url,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })

      return createErrorResponse(
        'Unauthorized access. Please log in to continue.',
        AuthenticationErrorCode.UNAUTHORIZED,
        HttpStatusCode.UNAUTHORIZED,
        {
          timestamp: new Date().toISOString(),
          endpoint: request.url
        }
      )
    }

    const { user, userId } = authContext
    logger.debug('User authenticated, fetching user data', { userId })

    // Initialize Supabase client
    const supabase = await createSupabaseServerClient()

    // Fetch user data from database
    const { data, error: dbError } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)

    // Handle database errors
    if (dbError) {
      logger.error('Database error while fetching user data', {
        userId,
        error: dbError.message,
        code: dbError.code,
        details: dbError.details
      })

      return createErrorResponse(
        'Failed to fetch user data',
        AuthenticationErrorCode.DATABASE_ERROR,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        {
          ...createErrorDetails(request, userId, dbError),
          databaseError: dbError.message
        }
      )
    }

    // Ensure data is an array
    const userData = Array.isArray(data) ? data : []

    logger.info('User data fetched successfully', {
      userId,
      dataCount: userData.length
    })

    return createSuccessResponse(
      userData,
      user,
      `Retrieved ${userData.length} data entries for user`
    )

  } catch (error) {
    logger.error('Unexpected error in protected route', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url
    })

    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      AuthenticationErrorCode.INTERNAL_ERROR,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      {
        ...createErrorDetails(request, undefined, error instanceof Error ? error : undefined),
        timestamp: new Date().toISOString()
      }
    )
  }
}

/**
 * POST handler for creating user data
 */
export async function POST(request: NextRequest): Promise<NextResponse<ProtectedRouteResponse>> {
  const logger = new ConsoleLogger()
  
  try {
    logger.info('Protected route POST accessed', {
      url: request.url,
      method: request.method
    })

    // Authenticate user
    const authContext = await authenticateUser(request, {
      logger,
      requireEmail: true
    })

    // Check if user is authenticated
    if (!isAuthenticatedContext(authContext)) {
      return createErrorResponse(
        'Unauthorized access. Please log in to continue.',
        AuthenticationErrorCode.UNAUTHORIZED,
        HttpStatusCode.UNAUTHORIZED
      )
    }

    const { user, userId } = authContext

    // Parse request body
    let requestData: Record<string, any>
    try {
      requestData = await request.json()
    } catch (parseError) {
      logger.warn('Invalid JSON in request body', {
        userId,
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      })

      return createErrorResponse(
        'Invalid JSON in request body',
        AuthenticationErrorCode.INVALID_TOKEN,
        HttpStatusCode.BAD_REQUEST
      )
    }

    // Validate request data
    if (!requestData || typeof requestData !== 'object') {
      return createErrorResponse(
        'Request data is required and must be an object',
        AuthenticationErrorCode.INVALID_TOKEN,
        HttpStatusCode.BAD_REQUEST
      )
    }

    // Initialize Supabase client
    const supabase = await createSupabaseServerClient()

    // Insert user data
    const { data, error: dbError } = await supabase
      .from('user_data')
      .insert({
        user_id: userId,
        data: requestData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (dbError) {
      logger.error('Database error while creating user data', {
        userId,
        error: dbError.message
      })

      return createErrorResponse(
        'Failed to create user data',
        AuthenticationErrorCode.DATABASE_ERROR,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    }

    logger.info('User data created successfully', {
      userId,
      dataId: data?.[0]?.id
    })

    return createSuccessResponse(
      data || [],
      user,
      'User data created successfully'
    )

  } catch (error) {
    logger.error('Unexpected error in protected route POST', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      AuthenticationErrorCode.INTERNAL_ERROR,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    )
  }
}

/**
 * Utility function to create a protected route handler
 */
export function createProtectedRouteHandler(
  handler: (request: NextRequest, context: AuthenticatedRequestContext) => Promise<NextResponse<ProtectedRouteResponse>>,
  config: AuthMiddlewareConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse<ProtectedRouteResponse>> => {
    const authContext = await authenticateUser(request, config)
    
    if (!isAuthenticatedContext(authContext)) {
      return createErrorResponse(
        'Unauthorized access. Please log in to continue.',
        AuthenticationErrorCode.UNAUTHORIZED,
        HttpStatusCode.UNAUTHORIZED
      )
    }

    return handler(request, authContext)
  }
}
