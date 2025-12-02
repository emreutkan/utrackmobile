import apiClient from './APIClient';
import { LOGIN_URL, REGISTER_URL } from './ApiBase';
import { storeAccessToken, storeRefreshToken } from './Storage';

// login will either return the access and refresh tokens or an error message
export const login = async (email: string, password: string): Promise<{ access: string, refresh: string } | string>  => {
    try {
        const response = await apiClient.post(LOGIN_URL, { email, password });
        if (response.status == 200) {
            await storeAccessToken(response.data.access);
            await storeRefreshToken(response.data.refresh);
            return { access: response.data.access, refresh: response.data.refresh };

        }
    } catch (error: any) {
        if (error.response?.status === 401) {
            return error.response?.data?.detail || 'Invalid credentials';
        }
        return error.response?.data?.detail || error.message || 'An unknown error occurred';
    }
}


export const register = async (email: string, password: string): Promise<{ access: string, refresh: string } | string> => {
    try {
        const response = await apiClient.post(REGISTER_URL, { email, password });
        if (response.status == 200) {
            await storeAccessToken(response.data.access);
            await storeRefreshToken(response.data.refresh);
            return { access: response.data.access, refresh: response.data.refresh };
        }
    } catch (error: any) {
        if (error.response?.status === 401) {
            return error.response?.data?.detail || 'Invalid credentials';
        }
        return error.response?.data?.detail || error.message || 'An unknown error occurred';
    }
}

