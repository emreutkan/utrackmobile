import apiClient from './APIClient';
import { GOOGLE_LOGIN_URL, LOGIN_URL, REGISTER_URL } from './ApiBase';
import { storeAccessToken, storeRefreshToken } from './Storage';

// login will either return the access and refresh tokens or an error message
export const login = async (email: string, password: string): Promise<{ access: string, refresh: string } | string>  => {
    try {
        const response = await apiClient.post(LOGIN_URL, { email, password });
        if (response.status == 200) {
            await storeAccessToken(response.data.access);
            await storeRefreshToken(response.data.refresh);
            return { access: response.data.access, refresh: response.data.refresh };
        } else {
            return response.data.detail || 'An unknown error occurred while storing tokens in the secure store';
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
        return response.data.detail || 'An unknown error occurred while storing tokens in the secure store';
    } catch (error: any) {
        if (error.response?.status === 401) {
            return error.response?.data?.detail || 'Invalid credentials';
        }
        return error.response?.data?.detail || error.message || 'An unknown error occurred';
    }
}

export const googleLogin = async (accessToken: string): Promise<{ access: string, refresh: string } | string> => {
    try {
        const response = await apiClient.post(GOOGLE_LOGIN_URL, { access_token: accessToken });
        if (response.status == 200) {
            await storeAccessToken(response.data.access);
            await storeRefreshToken(response.data.refresh);
            return { access: response.data.access, refresh: response.data.refresh };
        } else {
            return response.data.detail || 'An unknown error occurred during Google login';
        }
    } catch (error: any) {
         if (error.response?.status === 401) {
            return error.response?.data?.detail || 'Google authentication failed';
        }
        return error.response?.data?.detail || error.message || 'An unknown error occurred';
    }
}
