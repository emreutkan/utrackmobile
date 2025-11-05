import apiClient from './APIClient';
// Don't use the full URL here if apiClient has a baseURL
// import { CREATE_WORKOUT_URL } from './ApiBase'; 
import { CreateWorkoutRequest, CreateWorkoutResponse, GetWorkoutsResponse } from './types';

export const createWorkout = async (request: CreateWorkoutRequest): Promise<CreateWorkoutResponse | any> => {
    try {
        const response = await apiClient.post('/workout/create/', request);
        return response.data;
    } catch (error: any) {
        // If the backend returned a specific error response (like 400)
        if (error.response) {
            // Backend returned an error like { "error": "ACTIVE_WORKOUT_EXISTS", "active_workout": 1 }
            // We return this data object so the UI can handle it
            return error.response.data;
        }
        // Network error or something else
        return error.message || 'An unknown error occurred';
    }
}

export const getActiveWorkout = async (): Promise<CreateWorkoutResponse | any> => {
    try {
        const response = await apiClient.get('/workout/active/');
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

export const getWorkouts = async (): Promise<GetWorkoutsResponse | any> => {
    try {
        const response = await apiClient.get('/workout/list/');
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}