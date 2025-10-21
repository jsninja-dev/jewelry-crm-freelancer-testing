// CHALLENGE 2: Comprehensive test cases for communications API
// This file contains all test cases to validate the API works correctly

import { NextRequest } from 'next/server'
import { GET } from './api-route'
import {
  CommunicationsApiResponse,
  CommunicationsResponse,
  CommunicationsError,
  CommunicationsErrorCode,
  HttpStatusCode,
  isCommunicationsSuccess,
  isCommunicationsError
} from './types'

// Mock Supabase client for testing
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn()
}))

describe('Communications API', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    
    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis()
    }

    // Mock the createSupabaseServerClient function
    const { createSupabaseServerClient } = require('@/lib/supabase/server')
    createSupabaseServerClient.mockResolvedValue(mockSupabase)
  })

  describe('GET /api/communications', () => {
    test('should return communications with user names successfully', async () => {
      // Mock successful database response
      const mockData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          message: 'Hello, how are you?',
          sender_id: '550e8400-e29b-41d4-a716-446655440001',
          recipient_id: '550e8400-e29b-41d4-a716-446655440002',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          sender: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Admin User',
            email: 'admin@example.com',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          recipient: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Manager User',
            email: 'manager@example.com',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1
      })

      const request = new NextRequest('http://localhost:3000/api/communications')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      const responseData = await response.json() as CommunicationsResponse
      expect(isCommunicationsSuccess(responseData)).toBe(true)
      expect(responseData.success).toBe(true)
      expect(Array.isArray(responseData.data)).toBe(true)
      expect(responseData.data).toHaveLength(1)
      expect(responseData.data[0].sender?.name).toBe('Admin User')
      expect(responseData.data[0].recipient?.name).toBe('Manager User')
      expect(responseData.meta?.total).toBe(1)
    })

    test('should handle empty result set', async () => {
      // Mock empty database response
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      const request = new NextRequest('http://localhost:3000/api/communications')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      const responseData = await response.json() as CommunicationsResponse
      expect(isCommunicationsSuccess(responseData)).toBe(true)
      expect(responseData.data).toHaveLength(0)
      expect(responseData.meta?.total).toBe(0)
    })

    test('should handle database connection error', async () => {
      // Mock database error
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
        count: null
      })

      const request = new NextRequest('http://localhost:3000/api/communications')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      
      const responseData = await response.json() as CommunicationsError
      expect(isCommunicationsError(responseData)).toBe(true)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Failed to fetch communications')
      expect(responseData.code).toBe(CommunicationsErrorCode.DATABASE_ERROR)
    })

    test('should validate query parameters correctly', async () => {
      // Test invalid limit parameter
      const request = new NextRequest('http://localhost:3000/api/communications?limit=150')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.BAD_REQUEST)
      
      const responseData = await response.json() as CommunicationsError
      expect(isCommunicationsError(responseData)).toBe(true)
      expect(responseData.code).toBe(CommunicationsErrorCode.VALIDATION_ERROR)
      expect(responseData.error).toContain('Validation failed')
    })

    test('should validate UUID format for sender_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/communications?sender_id=invalid-uuid')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.BAD_REQUEST)
      
      const responseData = await response.json() as CommunicationsError
      expect(isCommunicationsError(responseData)).toBe(true)
      expect(responseData.error).toContain('Invalid sender_id format')
    })

    test('should validate UUID format for recipient_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/communications?recipient_id=invalid-uuid')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.BAD_REQUEST)
      
      const responseData = await response.json() as CommunicationsError
      expect(isCommunicationsError(responseData)).toBe(true)
      expect(responseData.error).toContain('Invalid recipient_id format')
    })

    test('should validate sort_by parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/communications?sort_by=invalid_field')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.BAD_REQUEST)
      
      const responseData = await response.json() as CommunicationsError
      expect(isCommunicationsError(responseData)).toBe(true)
      expect(responseData.error).toContain('Sort by must be one of')
    })

    test('should validate sort_order parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/communications?sort_order=invalid_order')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.BAD_REQUEST)
      
      const responseData = await response.json() as CommunicationsError
      expect(isCommunicationsError(responseData)).toBe(true)
      expect(responseData.error).toContain('Sort order must be one of')
    })

    test('should handle valid query parameters', async () => {
      const mockData = []
      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 0
      })

      const request = new NextRequest('http://localhost:3000/api/communications?limit=10&offset=0&sort_by=created_at&sort_order=desc&search=test&sender_id=550e8400-e29b-41d4-a716-446655440001')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      // Verify that the query methods were called with correct parameters
      expect(mockSupabase.eq).toHaveBeenCalledWith('sender_id', '550e8400-e29b-41d4-a716-446655440001')
      expect(mockSupabase.ilike).toHaveBeenCalledWith('message', '%test%')
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9)
    })

    test('should handle communications with null sender/recipient', async () => {
      const mockData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          message: 'System message',
          sender_id: null,
          recipient_id: '550e8400-e29b-41d4-a716-446655440001',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          sender: null,
          recipient: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Admin User',
            email: 'admin@example.com',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1
      })

      const request = new NextRequest('http://localhost:3000/api/communications')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      const responseData = await response.json() as CommunicationsResponse
      expect(isCommunicationsSuccess(responseData)).toBe(true)
      expect(responseData.data[0].sender).toBeNull()
      expect(responseData.data[0].recipient?.name).toBe('Admin User')
    })

    test('should handle unexpected errors gracefully', async () => {
      // Mock an unexpected error
      mockSupabase.range.mockRejectedValue(new Error('Unexpected error'))

    const request = new NextRequest('http://localhost:3000/api/communications')
    const response = await GET(request)
    
      expect(response.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      
      const responseData = await response.json() as CommunicationsError
      expect(isCommunicationsError(responseData)).toBe(true)
      expect(responseData.code).toBe(CommunicationsErrorCode.INTERNAL_ERROR)
      expect(responseData.error).toBe('An unexpected error occurred')
    })

    test('should apply pagination correctly', async () => {
      const mockData = []
      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 50
      })

      const request = new NextRequest('http://localhost:3000/api/communications?limit=20&offset=20')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      const responseData = await response.json() as CommunicationsResponse
      expect(isCommunicationsSuccess(responseData)).toBe(true)
      expect(responseData.meta?.total).toBe(50)
      expect(responseData.meta?.page).toBe(2)
      expect(responseData.meta?.limit).toBe(20)
      
      // Verify range was called correctly (offset=20, limit=20 means range 20-39)
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 39)
    })

    test('should handle search functionality', async () => {
      const mockData = []
      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 0
      })

      const request = new NextRequest('http://localhost:3000/api/communications?search=meeting')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      // Verify search was applied
      expect(mockSupabase.ilike).toHaveBeenCalledWith('message', '%meeting%')
    })
  })

  describe('Edge Cases', () => {
    test('should handle very long search terms', async () => {
      const longSearchTerm = 'a'.repeat(1000)
      const request = new NextRequest(`http://localhost:3000/api/communications?search=${longSearchTerm}`)
      
      // This should not throw an error, but may be limited by database constraints
      const response = await GET(request)
      
      // Should either succeed or fail gracefully
      expect([HttpStatusCode.OK, HttpStatusCode.BAD_REQUEST]).toContain(response.status)
    })

    test('should handle special characters in search', async () => {
      const mockData = []
      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 0
      })

      const request = new NextRequest('http://localhost:3000/api/communications?search=test%20%26%20more')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      expect(mockSupabase.ilike).toHaveBeenCalledWith('message', '%test & more%')
    })

    test('should handle multiple filters simultaneously', async () => {
      const mockData = []
      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 0
      })

      const request = new NextRequest('http://localhost:3000/api/communications?sender_id=550e8400-e29b-41d4-a716-446655440001&recipient_id=550e8400-e29b-41d4-a716-446655440002&search=test&limit=5&offset=10')
      const response = await GET(request)
      
      expect(response.status).toBe(HttpStatusCode.OK)
      
      // Verify all filters were applied
      expect(mockSupabase.eq).toHaveBeenCalledWith('sender_id', '550e8400-e29b-41d4-a716-446655440001')
      expect(mockSupabase.eq).toHaveBeenCalledWith('recipient_id', '550e8400-e29b-41d4-a716-446655440002')
      expect(mockSupabase.ilike).toHaveBeenCalledWith('message', '%test%')
      expect(mockSupabase.range).toHaveBeenCalledWith(10, 14)
    })
  })
})
