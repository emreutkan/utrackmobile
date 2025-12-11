import apiClient from './APIClient';

export const getExercises = async (query: string = '') => {
    try {
        const response = await apiClient.get(`/exercise/list/`, {
            params: { search: query }
        });
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

export const addExerciseToWorkout = async (workoutId: number, exerciseId: number) => {
    try {
        const response = await apiClient.post(`/exercise/add/${workoutId}/`, {
            exercise_id: exerciseId
        });
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

export const removeExerciseFromWorkout = async (workoutId: number, exerciseId: number) => {
    try {
        const response = await apiClient.post(`/exercise/remove/${workoutId}/`, {
            exercise_id: exerciseId
        });
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

export interface AddSetRequest {
    reps: number;
    weight: number;
    rest_time_before_set?: number;
    is_warmup?: boolean;
    reps_in_reserve?: number;
}

export const addSetToExercise = async (workoutExerciseId: number, data: AddSetRequest) => {
    try {
        const response = await apiClient.post(`/workout/exercise/${workoutExerciseId}/add_set/`, data);
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}
