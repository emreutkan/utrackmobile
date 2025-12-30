import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export type BackendType = 'local' | 'ec2';

export const storeAccessToken = async (token: string) => {
    if (isWeb && typeof localStorage !== 'undefined') {
        localStorage.setItem('access_token', token);
    } else {
        await SecureStore.setItemAsync('access_token', token);
    }
}

export const storeRefreshToken = async (token: string) => {
    if (isWeb && typeof localStorage !== 'undefined') {
        localStorage.setItem('refresh_token', token);
    } else {
        await SecureStore.setItemAsync('refresh_token', token);
    }
}

export const getAccessToken = async () => {
    if (isWeb && typeof localStorage !== 'undefined') {
        return localStorage.getItem('access_token');
    }
    return await SecureStore.getItemAsync('access_token');
}

export const getRefreshToken = async () => {
    if (isWeb && typeof localStorage !== 'undefined') {
        return localStorage.getItem('refresh_token');
    }
    return await SecureStore.getItemAsync('refresh_token');
}

export const clearTokens = async () => {
    if (isWeb && typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    } else {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
    }
}

export const setBackendPreference = async (backend: BackendType) => {
    if (isWeb && typeof localStorage !== 'undefined') {
        localStorage.setItem('backend_preference', backend);
    } else {
        await SecureStore.setItemAsync('backend_preference', backend);
    }
}

export const getBackendPreference = async (): Promise<BackendType> => {
    let preference: string | null = null;
    
    // Safely check for localStorage - must be in browser environment
    try {
        if (isWeb && typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
            preference = localStorage.getItem('backend_preference');
        }
    } catch (e) {
        // localStorage not available, will use SecureStore
    }
    
    // If we didn't get preference from localStorage, try SecureStore
    if (preference === null) {
        try {
            preference = await SecureStore.getItemAsync('backend_preference');
        } catch (e) {
            // SecureStore also failed, will default to 'local'
        }
    }
    
    // Default to 'local' if no preference is set
    return (preference === 'local' || preference === 'ec2') ? preference : 'local';
}