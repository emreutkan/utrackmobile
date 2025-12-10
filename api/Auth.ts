import apiClient from './APIClient';
import { APPLE_LOGIN_URL, GOOGLE_LOGIN_URL, LOGIN_URL, REGISTER_URL } from './ApiBase';
import { storeAccessToken, storeRefreshToken } from './Storage';

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
        // Log the token being sent
        // console.log("Sending Google Access Token:", accessToken);
        
        const response = await apiClient.post(GOOGLE_LOGIN_URL, { access_token: accessToken });
        
        // console.log("Google Login Response Status:", response.status);
        // console.log("Google Login Response Data:", JSON.stringify(response.data));

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

export const appleLogin = async (idToken: string, code: string, user?: any): Promise<{ access: string, refresh: string } | string> => {
    try {
        // Backend expects id_token (Apple's identity token)
        const payload: any = { 
            id_token: idToken, 
            code: code 
        };

        if (user) {
            // Apple only sends name/email on the very first login.
            // We can pass it if the backend needs to create the user with these details.
            if (user.name) {
                payload.first_name = user.name.givenName;
                payload.last_name = user.name.familyName;
            }
            // Email is inside the identity token usually, but sometimes provided separately
        }
        
        const response = await apiClient.post(APPLE_LOGIN_URL, payload);

        if (response.status == 200) {
            await storeAccessToken(response.data.access);
            if (response.data.refresh) {
                await storeRefreshToken(response.data.refresh);
            }
            return { access: response.data.access, refresh: response.data.refresh };
        } else {
            return response.data.detail || 'An unknown error occurred during Apple login';
        }
    } catch (error: any) {
        console.error("Apple Login Error:", error);
         if (error.response?.status === 401) {
            return error.response?.data?.detail || 'Apple authentication failed';
        }
        return error.response?.data?.detail || error.message || 'An unknown error occurred';
    }
}
