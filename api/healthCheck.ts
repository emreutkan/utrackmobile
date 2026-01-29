import apiClient from './APIClient';

export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy';
    checks: {
        database: {
            status: 'healthy' | 'unhealthy';
            message: string;
        };
        cache: {
            status: 'healthy' | 'unhealthy';
            message: string;
        };
    };
    environment: {
        debug: boolean;
        timezone: string;
    };
}

/**
 * Check API health status
 * This endpoint does not require authentication
 */
export const checkApiHealth = async (): Promise<HealthCheckResponse | null> => {
    try {
        const response = await apiClient.get('/health/', {
            timeout: 5000, // 5 second timeout
        });
        return response.data;
    } catch (error: any) {
        // Network errors, timeouts, or 5xx errors indicate backend is down
        if (
            error.code === 'ERR_NETWORK' ||
            error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT' ||
            (error.response && error.response.status >= 500)
        ) {
            console.error('Backend appears to be down:', error.message || error.code);
            return null;
        }
        console.error('Error checking API health:', error);
        return null;
    }
};
