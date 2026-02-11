import * as SecureStore from 'expo-secure-store';


export type BackendType = 'local' | 'ec2';

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

export const setBackendPreference = async (backend: BackendType) => {
  await SecureStore.setItemAsync('backend_preference', backend);
}

export const getBackendPreference = async (): Promise<BackendType> => {
  const preference = await SecureStore.getItemAsync('backend_preference');
  return (preference === 'local' || preference === 'ec2') ? preference : 'local';
}
