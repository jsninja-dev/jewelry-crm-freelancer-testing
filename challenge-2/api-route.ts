// CHALLENGE 2: Fixed API route for communications
// This file contains the complete fixed API route code

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  CommunicationsApiResponse,
  CommunicationsResponse,
  CommunicationsError,
  CommunicationsQueryParams,
  CommunicationsErrorCode,
  HttpStatusCode,
  COMMUNICATION_QUERY_VALIDATION,
  SupabaseCommunicationResult,
  CommunicationWithUsers
} from './types'

/**
 * Validates and sanitizes query parameters
 */
function validateQueryParams(searchParams: URLSearchParams): {
  params: CommunicationsQueryParams;
  errors: string[];
} {
  const errors: string[] = [];
  const params: CommunicationsQueryParams = {};

  // Validate limit
  const limitParam = searchParams.get('limit');
  if (limitParam) {
    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit < COMMUNICATION_QUERY_VALIDATION.limit!.min || limit > COMMUNICATION_QUERY_VALIDATION.limit!.max) {
      errors.push(`Limit must be between ${COMMUNICATION_QUERY_VALIDATION.limit!.min} and ${COMMUNICATION_QUERY_VALIDATION.limit!.max}`);
    } else {
      params.limit = limit;
    }
  } else {
    params.limit = COMMUNICATION_QUERY_VALIDATION.limit!.default;
  }

  // Validate offset
  const offsetParam = searchParams.get('offset');
  if (offsetParam) {
    const offset = parseInt(offsetParam, 10);
    if (isNaN(offset) || offset < COMMUNICATION_QUERY_VALIDATION.offset!.min) {
      errors.push(`Offset must be at least ${COMMUNICATION_QUERY_VALIDATION.offset!.min}`);
    } else {
      params.offset = offset;
    }
  } else {
    params.offset = COMMUNICATION_QUERY_VALIDATION.offset!.default;
  }

  // Validate sort_by
  const sortByParam = searchParams.get('sort_by');
  if (sortByParam) {
    if (!COMMUNICATION_QUERY_VALIDATION.sort_by!.includes(sortByParam)) {
      errors.push(`Sort by must be one of: ${COMMUNICATION_QUERY_VALIDATION.sort_by!.join(', ')}`);
    } else {
      params.sort_by = sortByParam as 'created_at' | 'updated_at';
    }
  } else {
    params.sort_by = 'created_at';
  }

  // Validate sort_order
  const sortOrderParam = searchParams.get('sort_order');
  if (sortOrderParam) {
    if (!COMMUNICATION_QUERY_VALIDATION.sort_order!.includes(sortOrderParam)) {
      errors.push(`Sort order must be one of: ${COMMUNICATION_QUERY_VALIDATION.sort_order!.join(', ')}`);
    } else {
      params.sort_order = sortOrderParam as 'asc' | 'desc';
    }
  } else {
    params.sort_order = 'desc';
  }

  // Validate optional filters
  const senderId = searchParams.get('sender_id');
  if (senderId) {
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(senderId)) {
      errors.push('Invalid sender_id format');
    } else {
      params.sender_id = senderId;
    }
  }

  const recipientId = searchParams.get('recipient_id');
  if (recipientId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recipientId)) {
      errors.push('Invalid recipient_id format');
    } else {
      params.recipient_id = recipientId;
    }
  }

  const search = searchParams.get('search');
  if (search) {
    params.search = search.trim();
  }

  return { params, errors };
}

/**
 * Transforms Supabase result to our API response format
 */
function transformSupabaseResult(result: SupabaseCommunicationResult[]): CommunicationWithUsers[] {
  return result.map(item => ({
    id: item.id,
    message: item.message,
    sender_id: item.sender_id,
    recipient_id: item.recipient_id,
    created_at: item.created_at,
    updated_at: item.updated_at,
    sender: item.sender ? {
      id: item.sender.id,
      name: item.sender.name,
      email: item.sender.email,
      created_at: item.sender.created_at,
      updated_at: item.sender.updated_at
    } : null,
    recipient: item.recipient ? {
      id: item.recipient.id,
      name: item.recipient.name,
      email: item.recipient.email,
      created_at: item.recipient.created_at,
      updated_at: item.recipient.updated_at
    } : null
  }));
}

/**
 * Creates an error response
 */
function createErrorResponse(
  error: string,
  code: CommunicationsErrorCode,
  status: HttpStatusCode,
  details?: Record<string, any>
): NextResponse<CommunicationsError> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details
    },
    { status }
  );
}

/**
 * Creates a success response
 */
function createSuccessResponse(
  data: CommunicationWithUsers[],
  meta?: { total: number; page?: number; limit?: number }
): NextResponse<CommunicationsResponse> {
  return NextResponse.json({
    success: true,
    data,
    meta
  });
}

export async function GET(request: NextRequest): Promise<NextResponse<CommunicationsApiResponse>> {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const { params, errors } = validateQueryParams(searchParams);

    // Return validation errors if any
    if (errors.length > 0) {
      return createErrorResponse(
        `Validation failed: ${errors.join(', ')}`,
        CommunicationsErrorCode.VALIDATION_ERROR,
        HttpStatusCode.BAD_REQUEST,
        { validationErrors: errors }
      );
    }

    // Initialize Supabase client
    const supabase = await createSupabaseServerClient();

    // Build the query with proper relationship syntax
    let query = supabase
      .from('communications')
      .select(`
        id,
        message,
        sender_id,
        recipient_id,
        created_at,
        updated_at,
        sender:sender_id (
          id,
          name,
          email,
          created_at,
          updated_at
        ),
        recipient:recipient_id (
          id,
          name,
          email,
          created_at,
          updated_at
        )
      `);

    // Apply filters
    if (params.sender_id) {
      query = query.eq('sender_id', params.sender_id);
    }

    if (params.recipient_id) {
      query = query.eq('recipient_id', params.recipient_id);
    }

    if (params.search) {
      query = query.ilike('message', `%${params.search}%`);
    }

    // Apply sorting
    query = query.order(params.sort_by!, { ascending: params.sort_order === 'asc' });

    // Apply pagination
    query = query.range(params.offset!, params.offset! + params.limit! - 1);

    // Execute the query
    const { data, error, count } = await query;

    // Handle database errors
    if (error) {
      console.error('Database error:', error);
      return createErrorResponse(
        'Failed to fetch communications',
        CommunicationsErrorCode.DATABASE_ERROR,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        { databaseError: error.message }
      );
    }

    // Transform the data
    const transformedData = transformSupabaseResult(data || []);

    // Create response with metadata
    const meta = {
      total: count || transformedData.length,
      page: Math.floor(params.offset! / params.limit!) + 1,
      limit: params.limit!
    };

    return createSuccessResponse(transformedData, meta);

  } catch (error) {
    console.error('Unexpected error in communications API:', error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      return createErrorResponse(
        'An unexpected error occurred',
        CommunicationsErrorCode.INTERNAL_ERROR,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        { errorMessage: error.message }
      );
    }

    return createErrorResponse(
      'An unknown error occurred',
      CommunicationsErrorCode.INTERNAL_ERROR,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}
