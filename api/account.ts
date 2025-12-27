
import apiClient from "./APIClient";
import { getAccountResponse } from "./types";

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
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
}

export const changePassword = async (oldPassword: string, newPassword: string): Promise<{ message: string } | { error: string }> => {
    try {
        const response = await apiClient.post('/user/change-password/', {
            old_password: oldPassword,
            new_password: newPassword
        });
        if (response.status === 200) {
            return response.data;
        } else {
            return { error: response.data?.error || 'Failed to change password' };
        }
    } catch (error: any) {
        if (error.response) {
            return error.response.data || { error: 'An unknown error occurred' };
        }
        return { error: error.message || 'An unknown error occurred' };
    }
}

export const updateGender = async (gender: 'male' | 'female'): Promise<{ gender: string; message: string } | any> => {
    try {
        const response = await apiClient.post('/user/gender/', { gender });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
}