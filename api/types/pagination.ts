/**
 * Pagination types for API responses
 */

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface PaginationParams {
    page?: number;
    page_size?: number;
}

/**
 * Check if a response is paginated
 */
export const isPaginatedResponse = <T>(data: any): data is PaginatedResponse<T> => {
    return (
        typeof data === 'object' &&
        data !== null &&
        'count' in data &&
        'next' in data &&
        'previous' in data &&
        'results' in data &&
        Array.isArray(data.results)
    );
};

/**
 * Extract results from paginated or non-paginated response
 * (for backward compatibility)
 */
export const extractResults = <T>(data: T[] | PaginatedResponse<T>): T[] => {
    if (isPaginatedResponse<T>(data)) {
        return data.results;
    }
    if (Array.isArray(data)) {
        return data;
    }
    return [];
};
