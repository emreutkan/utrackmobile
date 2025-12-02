import * as SecureStore from 'expo-secure-store';

export const storeAccessToken = async (token: string) => {
    await SecureStore.setItemAsync('access_token', token);
}

export const storeRefreshToken = async (token: string) => {
    await SecureStore.setItemAsync('refresh_token', token);
}

export const getAccessToken = async () => {
    return await SecureStore.getItemAsync('access_token');
}

export const getRefreshToken = async () => {
    return await SecureStore.getItemAsync('refresh_token');
}

export const clearTokens = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
}