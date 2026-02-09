import { triggerTokenError } from '@/components/AuthCheck';
import axios from 'axios';
import { API_URL, REFRESH_URL, getAPI_URL } from './ApiBase';
import { clearTokens, getAccessToken, getRefreshToken, storeAccessToken, storeRefreshToken } from './Storage';

// Initialize with default (local) API URL
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

try {
    getAPI_URL().then(url => {
        apiClient.defaults.baseURL = url;
    }).catch(() => {});
} catch (e: any) {}

export default apiClient;


// 1. Request Interceptor: Automatically add the token to every request
apiClient.interceptors.request.use(async (config) => {
    // Ensure baseURL is always correct (in case app was restarted)
    const correctBaseURL = await getAPI_URL();
    if (config.baseURL !== correctBaseURL) {
        config.baseURL = correctBaseURL;
    }

    const accessToken = await getAccessToken();
    // Construct full URL - if url already starts with http/https, use it as-is
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});



// 2. Response Interceptor: Handle 401 errors and refresh the token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response, // Return successful responses as is
    async (error) => {
        const originalRequest = error.config;

        // Check if the error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await getRefreshToken();
                if (!refreshToken) {
                    await clearTokens();
                    // Don't trigger token error here - AuthCheck already handles no-token case
                    throw new Error("NO_REFRESH_TOKEN");
                }

                // Call the refresh endpoint
                // We use axios directly to avoid infinite loops with the interceptor
                const apiUrl = await getAPI_URL();
                const refreshUrl = `${apiUrl}${REFRESH_URL}`;
                const response = await axios.post(refreshUrl, { refresh: refreshToken });

                if (response.status === 200) {
                    const newAccessToken = response.data.access;
                    const newRefreshToken = response.data.refresh; // Capture new refresh token if rotated

                    await storeAccessToken(newAccessToken);
                    if (newRefreshToken) {
                        await storeRefreshToken(newRefreshToken); // Save the new refresh token
                    }

                    // Update the header of the original request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    processQueue(null, newAccessToken);
                    isRefreshing = false;

                    // Retry the original request
                    return apiClient(originalRequest);
                }

                throw new Error("Refresh failed");
            } catch (refreshError: any) {
                await clearTokens();
                // Only trigger if it's an actual auth error (401/403), not network errors
                if (refreshError?.response?.status === 401 || refreshError?.response?.status === 403) {
                    triggerTokenError(); // Trigger auth check to show loading and route to login
                }
                isRefreshing = false;
                processQueue(refreshError, null);
                // Reject with a specific error that can be caught by components if needed
                return Promise.reject(new Error("REFRESH_TOKEN_EXPIRED"));
            }
        }

        // Return the error if it wasn't a 401 or if refresh failed
        return Promise.reject(error);
    }
);
