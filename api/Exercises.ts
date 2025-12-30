import apiClient from './APIClient';

export const getExercises = async (query: string = '', page?: number, pageSize?: number) => {
    try {
        const params: any = {};
        if (query) params.search = query;
        if (page !== undefined) params.page = page;
        if (pageSize !== undefined) params.page_size = pageSize;
        const response = await apiClient.get(`/exercise/list/`, { params });
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
        // Warning: This endpoint expects workout_exercise_id, but here we are passing exerciseId. 
        // If the frontend is passing the raw exercise ID (e.g. "Bench Press" ID), this will fail.
        // It needs the ID of the row in the workout_exercises table.
        // Assuming the UI passes the correct ID (idToLock in the UI seems to be workoutExercise.id).
        const response = await apiClient.delete(`/workout/exercise/${exerciseId}/delete/`);
        return response.status === 204;
    } catch (error: any) {
        return false;
    }

}

export interface AddSetRequest {
    reps: number;
    weight: number;
    rest_time_before_set?: number;
    is_warmup?: boolean;
    reps_in_reserve?: number;
    eccentric_time?: number; // Time under tension - eccentric phase (seconds)
    concentric_time?: number; // Time under tension - concentric phase (seconds)
    total_tut?: number; // Total time under tension (seconds)
}

export const addSetToExercise = async (workoutExerciseId: number, data: AddSetRequest) => {
    try {
        const response = await apiClient.post(`/workout/exercise/${workoutExerciseId}/add_set/`, data);
        return response.data;
    } catch (error: any) {
        // Handle validation errors (400 Bad Request)
        if (error.response?.status === 400 && error.response?.data) {
            return { error: true, validationErrors: error.response.data };
        }
        // Handle other errors
        return { error: true, message: error.response?.data?.detail || error.message || 'An unknown error occurred' };
    }
}

export const deleteSet = async (setId: number) => {
    try {
        const response = await apiClient.delete(`/workout/set/${setId}/delete/`);
        return response.status === 204;
    } catch (error: any) {
        return false;
    }
}

export interface UpdateSetRequest {
    reps?: number;
    weight?: number;
    reps_in_reserve?: number;
    rest_time_before_set?: number;
    is_warmup?: boolean;
    eccentric_time?: number; // Time under tension - eccentric phase (seconds)
    concentric_time?: number; // Time under tension - concentric phase (seconds)
    total_tut?: number; // Total time under tension (seconds)
}

export const updateSet = async (setId: number, data: UpdateSetRequest) => {
    try {
        const response = await apiClient.patch(`/workout/set/${setId}/update/`, data);
        return response.data;
    } catch (error: any) {
        // Handle validation errors (400 Bad Request)
        if (error.response?.status === 400 && error.response?.data) {
            return { error: true, validationErrors: error.response.data };
        }
        // Handle other errors
        return { error: true, message: error.response?.data?.detail || error.message || 'An unknown error occurred' };
    }
}

export const updateExerciseOrder = async (workoutId: number, exercise_orders: { id: number, order: number }[]) => {
    try {
        const response = await apiClient.post(`/workout/${workoutId}/update_order/`, { exercise_orders: exercise_orders });
        return response.status === 200;
    } catch (error: any) {
        return false;
    }
}

export const getExercise1RMHistory = async (exerciseId: number): Promise<any> => {
    try {
        const response = await apiClient.get(`/workout/exercise/${exerciseId}/1rm-history/`);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
}