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
 * Extract error information from API error response.
 * Supports ky (Response has .json(), no .data) and axios-style (response.data).
 * For ky, use parseApiErrorAsync to get body from error.response.json().
 */
export const parseApiError = (error: unknown): ApiErrorResponse | null => {
    const res = (error as { response?: { data?: unknown; json?: () => Promise<unknown> } })?.response;
    if (!res) return null;
    // Axios-style: response.data
    const errorData = 'data' in res && res.data !== undefined ? res.data : null;
    if (errorData == null) return null;

    const data = errorData as Record<string, unknown>;
    if (data.error && data.message) {
        return {
            error: String(data.error),
            message: String(data.message),
            details: data.details,
        };
    }
    if (data.error && typeof data.error === 'string') {
        return {
            error: 'UNKNOWN_ERROR',
            message: data.error,
            details: data.details,
        };
    }
    if (data.detail) {
        return {
            error: 'UNKNOWN_ERROR',
            message: typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail),
            details: data,
        };
    }
    return null;
};

/**
 * Parse API error from ky HTTPError (error.response is a Response).
 * Use in catch blocks when using ky.
 */
export const parseApiErrorAsync = async (error: unknown): Promise<ApiErrorResponse | null> => {
    const res = (error as { response?: Response })?.response;
    if (!res || typeof res.json !== 'function') return parseApiError(error);
    try {
        const data = (await res.json()) as Record<string, unknown>;
        if (data.error && data.message) {
            return {
                error: String(data.error),
                message: String(data.message),
                details: data.details,
            };
        }
        if (data.error && typeof data.error === 'string') {
            return {
                error: 'UNKNOWN_ERROR',
                message: data.error as string,
                details: data.details,
            };
        }
        if (data.detail) {
            return {
                error: 'UNKNOWN_ERROR',
                message: typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail),
                details: data,
            };
        }
    } catch {
        // ignore JSON parse failure
    }
    return null;
};

/**
 * Get user-friendly error message from API error (sync; works when response has .data).
 * For ky errors use getErrorMessageAsync to read response body.
 */
export const getErrorMessage = (error: unknown): string => {
    const parsedError = parseApiError(error);
    if (parsedError) return parsedError.message;
    if (error instanceof Error) return error.message;
    return 'An unexpected error occurred';
};

/**
 * Get error message from ky HTTPError (reads response body).
 */
export const getErrorMessageAsync = async (error: unknown): Promise<string> => {
    const parsed = await parseApiErrorAsync(error);
    if (parsed) return parsed.message;
    if (error instanceof Error) return error.message;
    return 'An unexpected error occurred';
};

/**
 * Get error code from API error
 */
export const getErrorCode = (error: unknown): string | null => {
    const parsedError = parseApiError(error);
    return parsedError?.error ?? null;
};

/**
 * Extract validation errors from error details
 */
export const getValidationErrors = (error: unknown): ValidationErrorDetails | null => {
    const parsedError = parseApiError(error);
    if (!parsedError?.details) return null;
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
export const requiresUserAction = (error: unknown): { action: 'login' | 'upgrade' | 'none'; code?: string } => {
    const errorCode = getErrorCode(error);
    switch (errorCode) {
        case 'UNAUTHORIZED':
            return { action: 'login', code: errorCode };
        case 'FORBIDDEN': {
            const parsedError = parseApiError(error);
            const details = parsedError?.details as { error?: string } | undefined;
            if (details?.error === 'PRO feature') return { action: 'upgrade', code: errorCode };
            return { action: 'none', code: errorCode };
        }
        default:
            return { action: 'none', code: errorCode ?? undefined };
    }
};
