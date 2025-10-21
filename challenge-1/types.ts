// CHALLENGE 1: TypeScript types for the update_customer_company function

/**
 * Parameters for the update_customer_company function
 */
export interface UpdateCustomerCompanyParams {
  company_name: string;
  customer_id: string;
}

/**
 * Response from the update_customer_company function
 */
export interface UpdateCustomerCompanyResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  data?: {
    customer_id: string;
    old_company: string | null;
    new_company: string;
    updated_at: string;
  };
}

/**
 * Error codes that can be returned by the function
 */
export enum UpdateCustomerCompanyErrorCode {
  INVALID_COMPANY_NAME = 'INVALID_COMPANY_NAME',
  INVALID_CUSTOMER_ID = 'INVALID_CUSTOMER_ID',
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  UPDATE_FAILED = 'UPDATE_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Audit log entry structure
 */
export interface CustomerUpdateLog {
  id: string;
  customer_id: string;
  old_company: string | null;
  new_company: string;
  updated_by: string;
  updated_at: string;
}

/**
 * Customer record structure
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Type guard to check if response is successful
 */
export function isUpdateSuccess(response: UpdateCustomerCompanyResponse): response is UpdateCustomerCompanyResponse & { success: true; data: NonNullable<UpdateCustomerCompanyResponse['data']> } {
  return response.success === true && response.data !== undefined;
}

/**
 * Type guard to check if response is an error
 */
export function isUpdateError(response: UpdateCustomerCompanyResponse): response is UpdateCustomerCompanyResponse & { success: false; error: string } {
  return response.success === false && response.error !== undefined;
}