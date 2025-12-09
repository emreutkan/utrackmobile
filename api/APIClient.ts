import axios from 'axios';
import { API_URL, REFRESH_URL } from './ApiBase';
import { getAccessToken, getRefreshToken, storeAccessToken } from './Storage';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,

    withCredentials: true,
});

export default apiClient;


// 1. Request Interceptor: Automatically add the token to every request
apiClient.interceptors.request.use(async (config) => {
    const accessToken = await getAccessToken();
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});



// 2. Response Interceptor: Handle 401 errors and refresh the token
apiClient.interceptors.response.use(
    (response) => response, // Return successful responses as is
    async (error) => {
        const originalRequest = error.config;

        // Check if the error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await getRefreshToken();
                if (refreshToken) {
                    // Call the refresh endpoint
                    // We use axios directly to avoid infinite loops with the interceptor
                    const response = await axios.post(REFRESH_URL, { refresh: refreshToken });
                    
                    if (response.status === 200) {
                        const newAccessToken = response.data.access;
                        await storeAccessToken(newAccessToken);
                        
                        // Update the header of the original request
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        
                        // Retry the original request
                        return apiClient(originalRequest);
                    }
                }
            } catch (refreshError) {
                // Refresh failed (token expired or invalid)
                // You might want to clear tokens here or redirect to login
                console.log("Refresh token expired or invalid");
                // Optional: clearTokens(); 
            }
        }

        // Return the error if it wasn't a 401 or if refresh failed
        return Promise.reject(error);
    }
);