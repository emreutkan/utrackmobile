import apiClient from './APIClient';
import { BodyMeasurement, CalculateBodyFatMenRequest, CalculateBodyFatResponse, CalculateBodyFatWomenRequest, CreateMeasurementRequest } from './types';
import { getErrorMessage, getValidationErrors } from './errorHandler';
import { PaginatedResponse, extractResults, isPaginatedResponse } from './types/pagination';

export const createMeasurement = async (request: CreateMeasurementRequest): Promise<BodyMeasurement | { error: string; details?: any }> => {
    try {
        const response = await apiClient.post('/measurements/create/', request);
        return response.data;
    } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        const validationErrors = getValidationErrors(error);
        return { error: errorMessage, details: validationErrors };
    }
};

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

export const calculateBodyFatMen = async (request: CalculateBodyFatMenRequest): Promise<CalculateBodyFatResponse | { error: string; details?: any }> => {
    try {
        const response = await apiClient.post('/measurements/calculate-body-fat/men/', request);
        return response.data;
    } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        const validationErrors = getValidationErrors(error);
        return { error: errorMessage, details: validationErrors };
    }
};

export const calculateBodyFatWomen = async (request: CalculateBodyFatWomenRequest): Promise<CalculateBodyFatResponse | { error: string; details?: any }> => {
    try {
        const response = await apiClient.post('/measurements/calculate-body-fat/women/', request);
        return response.data;
    } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        const validationErrors = getValidationErrors(error);
        return { error: errorMessage, details: validationErrors };
    }
};

