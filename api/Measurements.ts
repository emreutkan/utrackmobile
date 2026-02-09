import apiClient from './APIClient';
import { BodyMeasurement } from './types';
import { getErrorMessage } from './errorHandler';
import { PaginatedResponse, isPaginatedResponse } from './types/pagination';

export const getMeasurements = async (page?: number, pageSize?: number): Promise<PaginatedResponse<BodyMeasurement> | BodyMeasurement[] | any> => {
    try {
        const params: any = {};
        if (page !== undefined) params.page = page;
        if (pageSize !== undefined) params.page_size = pageSize;

        const response = await apiClient.get('/measurements/', { params });
        const data = response.data;

        // Handle backward compatibility: if response is array, return as-is
        if (Array.isArray(data)) {
            return data;
        }

        // If paginated, return paginated response
        if (isPaginatedResponse<BodyMeasurement>(data)) {
            return data;
        }

        // Fallback: wrap in paginated format
        return {
            count: data.results?.length || 0,
            next: data.next || null,
            previous: data.previous || null,
            results: data.results || []
        };
    } catch (error: any) {
        return getErrorMessage(error);
    }
};
