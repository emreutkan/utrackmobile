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

