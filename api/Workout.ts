import apiClient from './APIClient';
// Don't use the full URL here if apiClient has a baseURL
// import { CREATE_WORKOUT_URL } from './ApiBase';
import {
  AddExerciseToWorkoutRequest,
  AvailableYearsResponse,
  CalendarResponse,
  CalendarStats,
  CheckTodayResponse,
  CreateTemplateWorkoutRequest,
  CreateWorkoutRequest,
  CreateWorkoutResponse,
  GetWorkoutsResponse,
  RecoveryStatusResponse,
  StartTemplateWorkoutRequest,
  TemplateWorkout,
  UpdateWorkoutRequest,
  Workout,
} from './types';
import { getErrorMessage } from './errorHandler';

export const createWorkout = async (
  request: CreateWorkoutRequest
): Promise<CreateWorkoutResponse | any> => {
  try {
    const response = await apiClient.post('/workout/create/', request);
    return response.data;
  } catch (error: any) {
    // If the backend returned a specific error response (like 400)
    if (error.response?.data) {
      // Backend returned an error like { "error": "ACTIVE_WORKOUT_EXISTS", "active_workout": 1 }
      // We return this data object so the UI can handle it
      return error.response.data;
    }
    // Network error or something else
    return getErrorMessage(error);
  }
};

export const getActiveWorkout = async (): Promise<CreateWorkoutResponse | any> => {
  try {
    const response = await apiClient.get('/workout/active/');
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

export const getWorkouts = async (
  page?: number,
  pageSize?: number
): Promise<GetWorkoutsResponse | any> => {
  try {
    const params: any = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.page_size = pageSize;
    const response = await apiClient.get('/workout/list/', { params });
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

export const getWorkout = async (workoutID: number): Promise<Workout | any> => {
  try {
    const response = await apiClient.get(`/workout/list/${workoutID}/`);
    return response.data;
  } catch (error: any) {
    return error.message || 'An unknown error occurred';
  }
};

export const completeWorkout = async (
  workoutID: number,
  data?: { duration?: string; intensity?: number; notes?: string }
): Promise<any> => {
  try {
    const response = await apiClient.post(`/workout/${workoutID}/complete/`, data);
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

export const getWorkoutSummary = async (workoutID: number): Promise<any> => {
  try {
    const response = await apiClient.get(`/workout/${workoutID}/summary/`);
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

export const deleteWorkout = async (workoutID: number): Promise<any> => {
  try {
    const response = await apiClient.delete(`/workout/${workoutID}/delete/`);
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

// Template Workout API Functions
export const createTemplateWorkout = async (
  request: CreateTemplateWorkoutRequest
): Promise<TemplateWorkout | any> => {
  try {
    const response = await apiClient.post('/workout/template/create/', request);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    return getErrorMessage(error);
  }
};

export const getTemplateWorkouts = async (): Promise<TemplateWorkout[] | any> => {
  try {
    const response = await apiClient.get('/workout/template/list/');
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

export const deleteTemplateWorkout = async (templateID: number): Promise<any> => {
  try {
    const response = await apiClient.delete(`/workout/template/${templateID}/delete/`);
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

export const startTemplateWorkout = async (
  request: StartTemplateWorkoutRequest
): Promise<Workout | any> => {
  try {
    const response = await apiClient.post('/workout/template/start/', request);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    return getErrorMessage(error);
  }
};

// Edit Workout API Functions
export const updateWorkout = async (
  workoutId: number,
  request: UpdateWorkoutRequest
): Promise<Workout | any> => {
  try {
    const response = await apiClient.patch(`/workout/${workoutId}/update/`, request);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    return getErrorMessage(error);
  }
};

export const addExerciseToPastWorkout = async (
  workoutId: number,
  request: AddExerciseToWorkoutRequest
): Promise<any> => {
  try {
    const response = await apiClient.post(`/workout/${workoutId}/add_exercise/`, request);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    return getErrorMessage(error);
  }
};

export const getRestTimerState = async (): Promise<
  | {
      last_set_timestamp: string | null;
      last_exercise_category: string | null;
      elapsed_seconds?: number;
      rest_status?: any;
    }
  | any
> => {
  try {
    const response = await apiClient.get('/workout/active/rest-timer/');
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

export const stopRestTimer = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/workout/active/rest-timer/stop/');
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

// Calendar API Functions
export const getCalendar = async (
  year: number,
  month?: number,
  week?: number
): Promise<CalendarResponse | any> => {
  try {
    const params: any = { year };
    if (month !== undefined) params.month = month;
    if (week !== undefined) params.week = week;
    const response = await apiClient.get('/workout/calendar/', { params });
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

export const getAvailableYears = async (): Promise<AvailableYearsResponse | any> => {
  try {
    const response = await apiClient.get('/workout/years/');
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

export const getCalendarStats = async (
  year: number,
  month?: number,
  week?: number
): Promise<CalendarStats | any> => {
  try {
    const params: any = { year };
    if (month !== undefined) params.month = month;
    if (week !== undefined) params.week = week;
    const response = await apiClient.get('/workout/calendar/stats/', { params });
    return response.data;
  } catch (error: any) {
    return getErrorMessage(error);
  }
};

export const checkToday = async (): Promise<CheckTodayResponse | any> => {
  try {
    const response = await apiClient.get('/workout/check-today/');
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    return getErrorMessage(error);
  }
};

export const getRecoveryStatus = async (): Promise<RecoveryStatusResponse | any> => {
  try {
    const response = await apiClient.get('/workout/recovery/status/');
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    return getErrorMessage(error);
  }
};
