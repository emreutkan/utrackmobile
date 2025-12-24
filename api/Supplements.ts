import apiClient from "@/api/APIClient";

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

export const getSupplements = async (): Promise<Supplement[]> => {
    try {
        const response = await apiClient.get('/supplements/list/');
        return response.data;
    } catch (error: any) {
        console.error('Error fetching supplements:', error);
        return [];
    }
}

export const getUserSupplements = async (): Promise<UserSupplement[]> => {
    try {
        const response = await apiClient.get('/supplements/user/list/');
        return response.data;
    } catch (error: any) {
        console.error('Error fetching user supplements:', error);
        return [];
    }
}

export const addUserSupplement = async (data: CreateUserSupplementRequest): Promise<UserSupplement | null> => {
    try {
        const response = await apiClient.post('/supplements/user/add/', data);
        return response.data;
    } catch (error: any) {
        console.error('Error adding user supplement:', error);
        return null;
    }
}


export const logUserSupplement = async (data: LogUserSupplementRequest): Promise<SupplementLog | null> => {
    try {
        const response = await apiClient.post('/supplements/user/log/add/', data);
        return response.data;
    } catch (error: any) {
        console.error('Error logging user supplement:', error);
        return null;
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