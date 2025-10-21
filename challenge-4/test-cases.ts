// CHALLENGE 4: Comprehensive test cases for protected route authentication
// This file contains all test cases to validate the authentication works correctly

import { NextRequest } from 'next/server'
import { GET, POST } from './protected-route'
import {
  SupabaseUser,
  UserData,
  ProtectedRouteResponse,
  ProtectedRouteSuccessResponse,
  ProtectedRouteErrorResponse,
  AuthenticationErrorCode,
  HttpStatusCode,
  isProtectedRouteSuccess,
  isProtectedRouteError
} from './types'

// Mock Supabase client for testing
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn()
}))

describe('Protected Route Authentication', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    
    // Create mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis()
    }

    // Mock the createSupabaseServerClient function
    const { createSupabaseServerClient } = require('@/lib/supabase/server')
    createSupabaseServerClient.mockResolvedValue(mockSupabase)
  })

  describe('GET /api/protected-route', () => {
    test('should return 200 for authenticated user', async () => {
      // Mock authenticated user
      const mockUser: SupabaseUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated',
        role: 'user'
      }

      const mockUserData: UserData[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: '550e8400-e29b-41d4-a716-446655440001',
          data: { preferences: { theme: 'dark' } },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.eq.mockResolvedValue({
        data: mockUserData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      const responseData = await response.json() as ProtectedRouteSuccessResponse
      expect(isProtectedRouteSuccess(responseData)).toBe(true)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toHaveLength(1)
      expect(responseData.user.id).toBe('550e8400-e29b-41d4-a716-446655440001')
      expect(responseData.user.email).toBe('user@example.com')
    })

    test('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user (no user returned)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route')
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED)
      
      const responseData = await response.json() as ProtectedRouteErrorResponse
      expect(isProtectedRouteError(responseData)).toBe(true)
      expect(responseData.success).toBe(false)
      expect(responseData.code).toBe(AuthenticationErrorCode.UNAUTHORIZED)
      expect(responseData.error).toContain('Unauthorized access')
    })

    test('should return 401 for invalid token', async () => {
      // Mock authentication error
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token', name: 'AuthApiError' }
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED)
      
      const responseData = await response.json() as ProtectedRouteErrorResponse
      expect(isProtectedRouteError(responseData)).toBe(true)
      expect(responseData.code).toBe(AuthenticationErrorCode.UNAUTHORIZED)
    })

    test('should return 500 for database errors', async () => {
      // Mock authenticated user
      const mockUser: SupabaseUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock database error
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'PGRST301' }
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      
      const responseData = await response.json() as ProtectedRouteErrorResponse
      expect(isProtectedRouteError(responseData)).toBe(true)
      expect(responseData.code).toBe(AuthenticationErrorCode.DATABASE_ERROR)
      expect(responseData.error).toContain('Failed to fetch user data')
    })

    test('should handle user without email when email is required', async () => {
      // Mock user without email
      const mockUser: SupabaseUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated'
        // No email field
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route')
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED)
      
      const responseData = await response.json() as ProtectedRouteErrorResponse
      expect(isProtectedRouteError(responseData)).toBe(true)
      expect(responseData.code).toBe(AuthenticationErrorCode.UNAUTHORIZED)
    })

    test('should handle empty user data array', async () => {
      // Mock authenticated user
      const mockUser: SupabaseUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock empty data
      mockSupabase.eq.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      const responseData = await response.json() as ProtectedRouteSuccessResponse
      expect(isProtectedRouteSuccess(responseData)).toBe(true)
      expect(responseData.data).toHaveLength(0)
      expect(responseData.message).toContain('Retrieved 0 data entries')
    })

    test('should handle null data from database', async () => {
      // Mock authenticated user
      const mockUser: SupabaseUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock null data
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      const responseData = await response.json() as ProtectedRouteSuccessResponse
      expect(isProtectedRouteSuccess(responseData)).toBe(true)
      expect(responseData.data).toHaveLength(0)
    })

    test('should handle unexpected errors gracefully', async () => {
      // Mock unexpected error
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/protected-route')
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      
      const responseData = await response.json() as ProtectedRouteErrorResponse
      expect(isProtectedRouteError(responseData)).toBe(true)
      expect(responseData.code).toBe(AuthenticationErrorCode.INTERNAL_ERROR)
      expect(responseData.error).toContain('An unexpected error occurred')
    })
  })

  describe('POST /api/protected-route', () => {
    test('should create user data for authenticated user', async () => {
      // Mock authenticated user
      const mockUser: SupabaseUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated'
      }

      const mockCreatedData: UserData = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        data: { preferences: { theme: 'light' } },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [mockCreatedData],
        error: null
      })

      const requestData = { preferences: { theme: 'light' } }
      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      const responseData = await response.json() as ProtectedRouteSuccessResponse
      expect(isProtectedRouteSuccess(responseData)).toBe(true)
      expect(responseData.data).toHaveLength(1)
      expect(responseData.message).toBe('User data created successfully')
    })

    test('should return 401 for unauthenticated user on POST', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const requestData = { preferences: { theme: 'light' } }
      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED)
      
      const responseData = await response.json() as ProtectedRouteErrorResponse
      expect(isProtectedRouteError(responseData)).toBe(true)
      expect(responseData.code).toBe(AuthenticationErrorCode.UNAUTHORIZED)
    })

    test('should handle invalid JSON in request body', async () => {
      // Mock authenticated user
      const mockUser: SupabaseUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(HttpStatusCode.BAD_REQUEST)
      
      const responseData = await response.json() as ProtectedRouteErrorResponse
      expect(isProtectedRouteError(responseData)).toBe(true)
      expect(responseData.code).toBe(AuthenticationErrorCode.INVALID_TOKEN)
      expect(responseData.error).toContain('Invalid JSON')
    })

    test('should handle empty request body', async () => {
      // Mock authenticated user
      const mockUser: SupabaseUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(null)
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(HttpStatusCode.BAD_REQUEST)
      
      const responseData = await response.json() as ProtectedRouteErrorResponse
      expect(isProtectedRouteError(responseData)).toBe(true)
      expect(responseData.code).toBe(AuthenticationErrorCode.INVALID_TOKEN)
      expect(responseData.error).toContain('Request data is required')
    })

    test('should handle database errors during POST', async () => {
      // Mock authenticated user
      const mockUser: SupabaseUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock database error
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Database insert failed', code: 'PGRST301' }
      })

      const requestData = { preferences: { theme: 'light' } }
      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      
      const responseData = await response.json() as ProtectedRouteErrorResponse
      expect(isProtectedRouteError(responseData)).toBe(true)
      expect(responseData.code).toBe(AuthenticationErrorCode.DATABASE_ERROR)
      expect(responseData.error).toContain('Failed to create user data')
    })
  })

  describe('Edge Cases', () => {
    test('should handle malformed user object', async () => {
      // Mock malformed user (missing required fields)
      const malformedUser = {
        // Missing id field
        email: 'user@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: malformedUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route')
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED)
      
      const responseData = await response.json() as ProtectedRouteErrorResponse
      expect(isProtectedRouteError(responseData)).toBe(true)
      expect(responseData.code).toBe(AuthenticationErrorCode.UNAUTHORIZED)
    })

    test('should handle user with empty id', async () => {
      // Mock user with empty id
      const mockUser: SupabaseUser = {
        id: '', // Empty id
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route')
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED)
      
      const responseData = await response.json() as ProtectedRouteErrorResponse
      expect(isProtectedRouteError(responseData)).toBe(true)
      expect(responseData.code).toBe(AuthenticationErrorCode.UNAUTHORIZED)
    })

    test('should include security headers in responses', async () => {
      // Mock authenticated user
      const mockUser: SupabaseUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.eq.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      // Check security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains')
    })

    test('should include security headers in error responses', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/protected-route')
      
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED)
      
      // Check security headers are present even in error responses
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    })

    test('should handle very large request body', async () => {
      // Mock authenticated user
      const mockUser: SupabaseUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        aud: 'authenticated'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      })

      // Create a large request body
      const largeData = {
        preferences: {
          theme: 'dark',
          data: 'x'.repeat(10000) // Large string
        }
      }

      const request = new NextRequest('http://localhost:3000/api/protected-route', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(largeData)
      })
      
      const response = await POST(request)
      
      // Should either succeed or fail gracefully
      expect([HttpStatusCode.OK, HttpStatusCode.BAD_REQUEST]).toContain(response.status)
    })
  })
})
