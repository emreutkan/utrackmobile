
import apiClient from "./APIClient";
import { getAccountResponse } from "./types";

export const getAccount = async () : Promise<getAccountResponse > => {
    try {
        const response = await apiClient.get('/user/me/'); // Added trailing slash
    if (response.status === 200) {
        return response.data;
    } else {
        throw new Error('Failed to get account information /me endpoint');
    }
    } catch (error: any) {
        return error.message || 'An unknown error occurred while getting account information /me endpoint';
    }
}