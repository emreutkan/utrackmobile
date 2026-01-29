
import apiClient from "./APIClient";
import { getAccountResponse, WeightHistoryResponse } from "./types";
import { getErrorMessage, getValidationErrors } from "./errorHandler";

export const getAccount = async () : Promise<getAccountResponse > => {
    try {
        const response = await apiClient.get('/user/me/'); // Added trailing slash
    if (response.status === 200) {
        return response.data;
    } else {
        throw new Error('Failed to get account information /me endpoint');
    }
    } catch (error: any) {
        return error.message || 'An unknown error occurred while getting account information /me endpoint';
    }
}

export const updateHeight = async (height: number): Promise<{ height: string; message: string } | any> => {
    try {
        const response = await apiClient.post('/user/height/', { height });
        return response.data;
    } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        const validationErrors = getValidationErrors(error);
        return { error: errorMessage, details: validationErrors };
    }
}

export const changePassword = async (oldPassword: string, newPassword: string): Promise<{ message: string } | { error: string; details?: any }> => {
    try {
        const response = await apiClient.post('/user/change-password/', {
            old_password: oldPassword,
            new_password: newPassword
        });
        if (response.status === 200) {
            return response.data;
        } else {
            const errorMessage = getErrorMessage({ response: { data: response.data } });
            return { error: errorMessage };
        }
    } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        const validationErrors = getValidationErrors(error);
        return { error: errorMessage, details: validationErrors };
    }
}

export const updateGender = async (gender: 'male' | 'female'): Promise<{ gender: string; message: string } | any> => {
    try {
        const response = await apiClient.post('/user/gender/', { gender });
        return response.data;
    } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        const validationErrors = getValidationErrors(error);
        return { error: errorMessage, details: validationErrors };
    }
}

export const updateWeight = async (weight: number): Promise<{ weight: number; message: string } | any> => {
    try {
        const response = await apiClient.post('/user/weight/', { weight });
        return response.data;
    } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        const validationErrors = getValidationErrors(error);
        return { error: errorMessage, details: validationErrors };
    }
}

export const getWeightHistory = async (page: number = 1, pageSize: number = 100): Promise<WeightHistoryResponse | any> => {
    try {
        const params: any = {
            page,
            page_size: pageSize
        };
        const response = await apiClient.get('/user/weight/history/', { params });
        return response.data;
    } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        const validationErrors = getValidationErrors(error);
        return { error: errorMessage, details: validationErrors };
    }
}

export const deleteWeightEntry = async (weightId: number, deleteBodyfat: boolean = false): Promise<{ message: string; deleted_date: string; bodyfat_deleted?: boolean } | any> => {
    try {
        const url = deleteBodyfat 
            ? `/user/weight/${weightId}/?delete_bodyfat=true`
            : `/user/weight/${weightId}/`;
        const response = await apiClient.delete(url);
        return response.data;
    } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        const validationErrors = getValidationErrors(error);
        return { error: errorMessage, details: validationErrors };
    }
}

export interface ExportDataResponse {
    download_url: string;
    expires_at?: string;
    message?: string;
}

export const exportUserData = async (): Promise<ExportDataResponse | any> => {
    try {
        const response = await apiClient.post('/user/export-data/');
        if (response.status === 200 || response.status === 201) {
            return response.data;
        } else {
            return { error: response.data?.error || 'Failed to export user data' };
        }
    } catch (error: any) {
        if (error.response) {
            return error.response.data || { error: 'An unknown error occurred' };
        }
        return { error: error.message || 'An unknown error occurred' };
    }
}