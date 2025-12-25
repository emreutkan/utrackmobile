import { Platform } from 'react-native';
import { getBackendPreference, BackendType } from './Storage';

// Backend configurations
const LOCAL_IP = '192.168.1.7';
const EC2_DOMAIN = 'api.utrack.irfanemreutkan.com';

// Get API URLs based on backend preference
export const getAPI_URL = async (): Promise<string> => {
    const backend = await getBackendPreference();
    if (backend === 'local') {
        return `http://${LOCAL_IP}:8000/api`;
    } else {
        return `http://${EC2_DOMAIN}/api`;
    }
};

export const getBASE_URL = async (): Promise<string> => {
    const backend = await getBackendPreference();
    if (backend === 'local') {
        return `http://${LOCAL_IP}:8000`;
    } else {
        return `http://${EC2_DOMAIN}`;
    }
};

// Synchronous versions (for immediate use, defaults to local)
// These will be updated when backend preference changes
let cachedAPI_URL = `http://${LOCAL_IP}:8000/api`;
let cachedBASE_URL = `http://${LOCAL_IP}:8000`;

// Initialize cache
getAPI_URL().then(url => cachedAPI_URL = url);
getBASE_URL().then(url => cachedBASE_URL = url);

// Export cached values for synchronous access
export let API_URL = cachedAPI_URL;
export let BASE_URL = cachedBASE_URL;

// Function to update API base URL (called from debug view)
export const updateApiBaseUrl = async (backend: BackendType) => {
    if (backend === 'local') {
        cachedAPI_URL = `http://${LOCAL_IP}:8000/api`;
        cachedBASE_URL = `http://${LOCAL_IP}:8000`;
    } else {
        cachedAPI_URL = `http://${EC2_DOMAIN}/api`;
        cachedBASE_URL = `http://${EC2_DOMAIN}`;
    }
    API_URL = cachedAPI_URL;
    BASE_URL = cachedBASE_URL;
    
    // Update the axios instance baseURL
    const apiClient = require('./APIClient').default;
    apiClient.defaults.baseURL = cachedAPI_URL;
};

// Relative URLs (will be combined with baseURL from APIClient)
export const LOGIN_URL = `/user/login/`;
export const REGISTER_URL = `/user/register/`;
export const REFRESH_URL = `/token/refresh/`;
export const CREATE_WORKOUT_URL = `/workout/create/`;

// Full URL for Google login (uses BASE_URL, not API_URL)
export const getGOOGLE_LOGIN_URL = async () => {
    const baseUrl = await getBASE_URL();
    return `${baseUrl}/auth/google/`;
};
