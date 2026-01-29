import apiClient from './APIClient';
import { getGOOGLE_LOGIN_URL, LOGIN_URL, REGISTER_URL } from './ApiBase';
import { storeAccessToken, storeRefreshToken } from './Storage';
import { getErrorMessage } from './errorHandler';

// login will either return the access and refresh tokens or an error message
export const login = async (email: string, password: string): Promise<{ access: string, refresh: string } | string>  => {
    try {
        const response = await apiClient.post(LOGIN_URL, { email, password });
        if (response.status == 200) {
            await storeAccessToken(response.data.access);
            if (response.data.refresh) {
                await storeRefreshToken(response.data.refresh);
            }
            return { access: response.data.access, refresh: response.data.refresh };
        } else {
            return response.data.detail || 'An unknown error occurred while storing tokens in the secure store';
        }
    } catch (error: any) {
        return getErrorMessage(error);
    }
}


export const register = async (email: string, password: string, gender?: string, height?: number, name?: string): Promise<{ access: string, refresh: string } | string> => {
    try {
        const payload: any = { email, password };
        if (name) {
            payload.name = name;
        }
        if (gender) {
            payload.gender = gender;
        }
        if (height !== undefined && height !== null) {
            payload.height = height;
        }
        console.log("Register payload:", JSON.stringify(payload));
        const response = await apiClient.post(REGISTER_URL, payload);
        console.log("Register response status:", response.status);
        console.log("Register response data:", JSON.stringify(response.data));
        
        // Accept both 200 and 201 status codes
        if (response.status === 200 || response.status === 201) {
            if (response.data.access && response.data.refresh) {
                await storeAccessToken(response.data.access);
                await storeRefreshToken(response.data.refresh);
                return { access: response.data.access, refresh: response.data.refresh };
            } else {
                return 'Response missing access or refresh token';
            }
        }
        return response.data.detail || 'An unknown error occurred while storing tokens in the secure store';
    } catch (error: any) {
        console.error("Register error:", error);
        console.error("Register error response:", error.response?.data);
        if (error.response?.status === 401) {
            return error.response?.data?.detail || 'Invalid credentials';
        }
        return error.response?.data?.detail || error.message || 'An unknown error occurred';
    }
}

export interface CheckEmailResponse {
    is_valid: boolean;
    errors: string[];
    user_exists: boolean;
    security_threats: string[];
    normalized_email?: string;
}

export interface CheckPasswordResponse {
    is_valid: boolean;
    errors: string[];
    security_threats: string[];
    strength_score: number;
    strength_level: 'weak' | 'medium' | 'strong';
}

export interface CheckNameResponse {
    is_valid: boolean;
    errors: string[];
    security_threats: string[];
}

export const checkEmail = async (email: string): Promise<CheckEmailResponse | any> => {
    try {
        const response = await apiClient.post('/user/check-email/', { email });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return { is_valid: false, errors: [error.message || 'An unknown error occurred'], user_exists: false, security_threats: [] };
    }
};

export const checkPassword = async (password: string): Promise<CheckPasswordResponse | any> => {
    try {
        const response = await apiClient.post('/user/check-password/', { password });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return { is_valid: false, errors: [error.message || 'An unknown error occurred'], security_threats: [], strength_score: 0, strength_level: 'weak' };
    }
};

export const checkName = async (name: string): Promise<CheckNameResponse | any> => {
    try {
        const response = await apiClient.post('/user/check-name/', { name });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return { is_valid: false, errors: [error.message || 'An unknown error occurred'], security_threats: [] };
    }
};

export const googleLogin = async (accessToken: string): Promise<{ access: string, refresh: string } | string> => {
    try {
        // Log the token being sent
        console.log("Sending Google Access Token:", accessToken);
        
        const googleLoginUrl = await getGOOGLE_LOGIN_URL();
        const response = await apiClient.post(googleLoginUrl, { access_token: accessToken });
        
        console.log("Google Login Response Status:", response.status);
        console.log("Google Login Response Data:", JSON.stringify(response.data));

        if (response.status == 200) {
            await storeAccessToken(response.data.access);
            if (response.data.refresh) {
                await storeRefreshToken(response.data.refresh);
            }
            return { access: response.data.access, refresh: response.data.refresh };
        } else {
            return response.data.detail || 'An unknown error occurred during Google login';
        }
    } catch (error: any) {
        console.error("Google Login Error:", error);
         if (error.response?.status === 401) {
            return error.response?.data?.detail || 'Google authentication failed';
        }
        return error.response?.data?.detail || error.message || 'An unknown error occurred';
    }
}

/**
 * Request password reset - sends email with reset link
 */
export const requestPasswordReset = async (email: string): Promise<{ message: string } | { error: string }> => {
    try {
        const response = await apiClient.post('/user/request-password-reset/', { email });
        if (response.status === 200) {
            return response.data;
        } else {
            const errorMessage = getErrorMessage({ response: { data: response.data } });
            return { error: errorMessage };
        }
    } catch (error: any) {
        const errorMessage = getErrorMessage(error);
        return { error: errorMessage };
    }
}

/**
 * Reset password using uid and token from email link
 */
export const resetPassword = async (uid: string, token: string, newPassword: string): Promise<{ message: string } | { error: string; details?: any }> => {
    try {
        const response = await apiClient.post('/user/reset-password/', {
            uid,
            token,
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
