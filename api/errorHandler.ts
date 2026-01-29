/**
 * Centralized error handling for API responses
 * Handles the new standardized error format: { error: string, message: string, details?: any }
 */

export interface ApiErrorResponse {
    error: string; // Error code (e.g., "BAD_REQUEST", "UNAUTHORIZED")
    message: string; // User-friendly error message
    details?: any; // Additional error details (often validation errors)
}

export interface ValidationErrorDetails {
    [field: string]: string[] | string;
}

/**
 * Extract error information from API error response
 */
export const parseApiError = (error: any): ApiErrorResponse | null => {
    if (!error?.response?.data) {
        return null;
    }

    const errorData = error.response.data;

    // Check if it's the new standardized format
    if (errorData.error && errorData.message) {
        return {
            error: errorData.error,
            message: errorData.message,
            details: errorData.details,
        };
    }

    // Backward compatibility: handle old format
    if (errorData.error && typeof errorData.error === 'string') {
        return {
            error: 'UNKNOWN_ERROR',
            message: errorData.error,
            details: errorData.details,
        };
    }

    // Handle detail field (common in Django REST Framework)
    if (errorData.detail) {
        return {
            error: 'UNKNOWN_ERROR',
            message: errorData.detail,
            details: errorData,
        };
    }

    return null;
};

/**
 * Get user-friendly error message from API error
 */
export const getErrorMessage = (error: any): string => {
    const parsedError = parseApiError(error);
    if (parsedError) {
        return parsedError.message;
    }

    // Fallback to error message
    if (error?.message) {
        return error.message;
    }

    return 'An unexpected error occurred';
};

/**
 * Get error code from API error
 */
export const getErrorCode = (error: any): string | null => {
    const parsedError = parseApiError(error);
    return parsedError?.error || null;
};

/**
 * Extract validation errors from error details
 */
export const getValidationErrors = (error: any): ValidationErrorDetails | null => {
    const parsedError = parseApiError(error);
    if (!parsedError?.details) {
        return null;
    }

    const details = parsedError.details;

    // If details is already an object with field names as keys
    if (typeof details === 'object' && !Array.isArray(details)) {
        return details as ValidationErrorDetails;
    }

    return null;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (validationErrors: ValidationErrorDetails): string[] => {
    const messages: string[] = [];

    Object.keys(validationErrors).forEach(field => {
        const fieldErrors = validationErrors[field];
        if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((error: string) => {
                messages.push(error);
            });
        } else if (typeof fieldErrors === 'string') {
            messages.push(fieldErrors);
        }
    });

    return messages;
};

/**
 * Check if error requires user action (e.g., redirect to login)
 */
export const requiresUserAction = (error: any): { action: 'login' | 'upgrade' | 'none'; code?: string } => {
    const errorCode = getErrorCode(error);

    switch (errorCode) {
        case 'UNAUTHORIZED':
            return { action: 'login', code: errorCode };
        case 'FORBIDDEN':
            // Check if it's a PRO feature error
            const parsedError = parseApiError(error);
            if (parsedError?.details?.error === 'PRO feature') {
                return { action: 'upgrade', code: errorCode };
            }
            return { action: 'none', code: errorCode };
        default:
            return { action: 'none', code: errorCode || undefined };
    }
};
