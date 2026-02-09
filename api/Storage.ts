import * as SecureStore from 'expo-secure-store';


export type BackendType = 'local' | 'ec2';

export const storeAccessToken = async (token: string) => {
  console.log("Storing Access Token to storage:", token);
  await SecureStore.setItemAsync('access_token', token);

}

export const storeRefreshToken = async (token: string) => {
  console.log("Storing Refresh Token to storage:", token);
  await SecureStore.setItemAsync('refresh_token', token);
}

export const getAccessToken = async () => {
  console.log("Getting Access Token from storage");
  return await SecureStore.getItemAsync('access_token');
}

export const getRefreshToken = async () => {
  console.log("Getting Refresh Token from storage");
  return await SecureStore.getItemAsync('refresh_token');
}

export const clearTokens = async () => {
  console.log("Clearing Tokens from storage");
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
}

export const setBackendPreference = async (backend: BackendType) => {
  console.log("Setting Backend Preference to storage:", backend);
  await SecureStore.setItemAsync('backend_preference', backend);
}

export const getBackendPreference = async (): Promise<BackendType> => {
  let preference: string | null = null;
  preference = await SecureStore.getItemAsync('backend_preference');
  console.log("Getting Backend Preference from storage:", preference);

  return (preference === 'local' || preference === 'ec2') ? preference : 'local';
}
