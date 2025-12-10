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
        // Assuming the endpoint is something like /workout/{workout_id}/exercise/{exercise_id}/remove/
        // OR /exercise/remove/{workout_id}/
        // I'll assume a pattern similar to add: /exercise/remove/
        // But better to check if you have a specific endpoint. 
        // Based on add: path('add/<int:workout_id>/', ...)
        // I will guess: path('remove/<int:workout_id>/', ...) 
        // But usually removing needs the specific ID of the JOIN table or the exercise ID.
        
        // Let's assume standard REST: DELETE /workout/{workoutId}/exercises/{exerciseId}/ 
        // OR post to a remove endpoint.
        
        // Since I don't have the backend code for remove, I'll assume a likely path and we might need to fix it.
        // I'll try: POST /exercise/remove/<workout_id>/ with body { exercise_id: ... }
        const response = await apiClient.post(`/exercise/remove/${workoutId}/`, {
            exercise_id: exerciseId
        });
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}
