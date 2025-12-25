import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export type BackendType = 'local' | 'ec2';

export const storeAccessToken = async (token: string) => {
    if (isWeb) {
        localStorage.setItem('access_token', token);
    } else {
        await SecureStore.setItemAsync('access_token', token);
    }
}

export const storeRefreshToken = async (token: string) => {
    if (isWeb) {
        localStorage.setItem('refresh_token', token);
    } else {
        await SecureStore.setItemAsync('refresh_token', token);
    }
}

export const getAccessToken = async () => {
    if (isWeb) {
        return localStorage.getItem('access_token');
    }
    return await SecureStore.getItemAsync('access_token');
}

export const getRefreshToken = async () => {
    if (isWeb) {
        return localStorage.getItem('refresh_token');
    }
    return await SecureStore.getItemAsync('refresh_token');
}

export const clearTokens = async () => {
    if (isWeb) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    } else {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
    }
}

export const setBackendPreference = async (backend: BackendType) => {
    if (isWeb) {
        localStorage.setItem('backend_preference', backend);
    } else {
        await SecureStore.setItemAsync('backend_preference', backend);
    }
}

export const getBackendPreference = async (): Promise<BackendType> => {
    let preference: string | null;
    if (isWeb) {
        preference = localStorage.getItem('backend_preference');
    } else {
        preference = await SecureStore.getItemAsync('backend_preference');
    }
    // Default to 'local' if no preference is set
    return (preference === 'local' || preference === 'ec2') ? preference : 'local';
}