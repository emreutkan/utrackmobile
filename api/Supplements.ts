import apiClient from "@/api/APIClient";
import { getErrorMessage, getErrorCode, getValidationErrors } from "./errorHandler";
import { PaginatedResponse, extractResults, isPaginatedResponse } from "./types/pagination";

export interface Supplement {
    id: number;
    name: string;
    description: string;
    dosage_unit: string;
    default_dosage: number;
}

export interface UserSupplement {
    id: number;
    supplement_id: number;
    supplement_details: Supplement;
    dosage: number;
    frequency: string;
    time_of_day: string;
    is_active: boolean;
}

export interface CreateUserSupplementRequest {
    supplement_id: number;
    dosage: number;
    frequency: string;
    time_of_day?: string;
}

export interface LogUserSupplementRequest {
    user_supplement_id: number;
    date: string;
    time: string;
    dosage: number;
}

export interface SupplementLog {
    id: number;
    user_supplement_id: number;
    user_supplement?: UserSupplement;
    user_supplement_details?: UserSupplement;
    date: string;
    time: string;
    dosage: number;
    created_at?: string;
}

export interface TodayLogsResponse {
    date: string;
    logs: SupplementLog[];
    count: number;
}

export const getSupplements = async (page?: number, pageSize?: number): Promise<PaginatedResponse<Supplement> | Supplement[]> => {
    try {
        const params: any = {};
        if (page !== undefined) params.page = page;
        if (pageSize !== undefined) params.page_size = pageSize;
        
        const response = await apiClient.get('/supplements/list/', { params });
        const data = response.data;
        
        // Handle backward compatibility: if response is array, return as-is
        if (Array.isArray(data)) {
            return data;
        }
        
        // If paginated, return paginated response
        if (isPaginatedResponse<Supplement>(data)) {
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
        console.error('Error fetching supplements:', error);
        return [];
    }
}

export const getUserSupplements = async (page?: number, pageSize?: number): Promise<PaginatedResponse<UserSupplement> | UserSupplement[]> => {
    try {
        const params: any = {};
        if (page !== undefined) params.page = page;
        if (pageSize !== undefined) params.page_size = pageSize;
        
        const response = await apiClient.get('/supplements/user/list/', { params });
        const data = response.data;
        
        // Handle backward compatibility: if response is array, return as-is
        if (Array.isArray(data)) {
            return data;
        }
        
        // If paginated, return paginated response
        if (isPaginatedResponse<UserSupplement>(data)) {
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
        console.error('Error fetching user supplements:', error);
        return [];
    }
}

export const addUserSupplement = async (data: CreateUserSupplementRequest): Promise<UserSupplement | { error: string; details?: any }> => {
    try {
        const response = await apiClient.post('/supplements/user/add/', data);
        return response.data;
    } catch (error: any) {
        console.error('Error adding user supplement:', error);
        const errorMessage = getErrorMessage(error);
        const validationErrors = getValidationErrors(error);
        return { error: errorMessage, details: validationErrors };
    }
}


export const logUserSupplement = async (data: LogUserSupplementRequest): Promise<SupplementLog | { error: string }> => {
    try {
        const response = await apiClient.post('/supplements/user/log/add/', data);
        return response.data;
    } catch (error: any) {
        console.error('Error logging user supplement:', error);
        const errorMessage = getErrorMessage(error);
        return { error: errorMessage };
    }
}

export const getSupplementLogs = async (userSupplementId: number): Promise<SupplementLog[]> => {
    try {
        const response = await apiClient.get(`/supplements/user/log/list/?user_supplement_id=${userSupplementId}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching supplement logs:', error);
        return [];
    }
}

export const deleteSupplementLog = async (logId: number): Promise<boolean> => {
    try {
        await apiClient.delete(`/supplements/user/log/delete/${logId}/`);
        return true;
    } catch (error: any) {
        console.error('Error deleting supplement log:', error);
        return false;
    }
}

export const getTodayLogs = async (): Promise<TodayLogsResponse | null> => {
    try {
        const response = await apiClient.get('/supplements/user/log/today/');
        return response.data;
    } catch (error: any) {
        console.error('Error fetching today logs:', error);
        return null;
    }
}