import apiClient from './APIClient';
// Don't use the full URL here if apiClient has a baseURL
// import { CREATE_WORKOUT_URL } from './ApiBase'; 
import { AddExerciseToWorkoutRequest, CreateTemplateWorkoutRequest, CreateWorkoutRequest, CreateWorkoutResponse, GetWorkoutsResponse, StartTemplateWorkoutRequest, TemplateWorkout, UpdateWorkoutRequest, Workout } from './types';

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

export const getWorkout = async (workoutID: number): Promise<Workout | any> => {
    try {
        const response = await apiClient.get(`/workout/list/${workoutID}/`);
        return response.data;
    } catch (error: any) {
            return error.message || 'An unknown error occurred';
        }
    }

export const completeWorkout = async (workoutID: number, data?: { duration?: string, intensity?: number, notes?: string }): Promise<any> => {
    try {
        const response = await apiClient.post(`/workout/${workoutID}/complete/`, data);
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

export const deleteWorkout = async (workoutID: number): Promise<any> => {
    try {
        const response = await apiClient.delete(`/workout/${workoutID}/delete/`);
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

export const checkRestDay = async (): Promise<{ is_rest_day: boolean; date: string; rest_day_id: number | null } | any> => {
    try {
        const response = await apiClient.get('/workout/check-rest-day/');
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

// Template Workout API Functions
export const createTemplateWorkout = async (request: CreateTemplateWorkoutRequest): Promise<TemplateWorkout | any> => {
    try {
        const response = await apiClient.post('/workout/template/create/', request);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
}

export const getTemplateWorkouts = async (): Promise<TemplateWorkout[] | any> => {
    try {
        const response = await apiClient.get('/workout/template/list/');
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

export const startTemplateWorkout = async (request: StartTemplateWorkoutRequest): Promise<Workout | any> => {
    try {
        const response = await apiClient.post('/workout/template/start/', request);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
}

// Edit Workout API Functions
export const updateWorkout = async (workoutId: number, request: UpdateWorkoutRequest): Promise<Workout | any> => {
    try {
        const response = await apiClient.patch(`/workout/${workoutId}/update/`, request);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
}

export const addExerciseToPastWorkout = async (workoutId: number, request: AddExerciseToWorkoutRequest): Promise<any> => {
    try {
        const response = await apiClient.post(`/workout/${workoutId}/add_exercise/`, request);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
}

export const getRestTimerState = async (): Promise<{ 
    last_set_timestamp: string | null; 
    last_exercise_category: string | null; 
    elapsed_seconds?: number;
    rest_status?: any;
} | any> => {
    try {
        const response = await apiClient.get('/workout/active/rest-timer/');
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}