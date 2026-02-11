import apiClient from './APIClient';
import type {
  AddExerciseToWorkoutRequest,
  AvailableYearsResponse,
  CalendarResponse,
  CalendarStats,
  CheckTodayResponse,
  CreateTemplateWorkoutRequest,
  CreateWorkoutRequest,
  CreateWorkoutResponse,
  RecoveryStatusResponse,
  RestTimerStopResponse,
  StartTemplateWorkoutRequest,
  TemplateWorkout,
  UpdateWorkoutRequest,
  Workout,
  CompleteWorkoutRequest,
  CompleteWorkoutResponse,
  CreateTemplateWorkoutResponse,
  StartTemplateWorkoutResponse,
  WorkoutSummaryResponse,
} from './types/workout';
import {
  CREATE_WORKOUT_URL,
  GET_ACTIVE_WORKOUT_URL,
  GET_WORKOUT_URL,
  GET_WORKOUTS_URL,
  UPDATE_WORKOUT_URL,
  ADD_EXERCISE_TO_WORKOUT_URL,
  COMPLETE_WORKOUT_URL,
  DELETE_WORKOUT_URL,
  WORKOUT_SUMMARY_URL,
  TEMPLATE_CREATE_URL,
  TEMPLATE_LIST_URL,
  TEMPLATE_DELETE_URL,
  TEMPLATE_START_URL,
  REST_TIMER_URL,
  REST_TIMER_STOP_URL,
  CALENDAR_URL,
  AVAILABLE_YEARS_URL,
  CALENDAR_STATS_URL,
  CHECK_TODAY_URL,
  RECOVERY_STATUS_URL,
} from './types/workout';
import type { PaginatedResponse } from './types/pagination';
export const createWorkout = async (
  request: CreateWorkoutRequest
): Promise<CreateWorkoutResponse | any> => {
  const response = await apiClient.post(CREATE_WORKOUT_URL, { json: request });
  return response.json();
};

export const getActiveWorkout = async (): Promise<CreateWorkoutResponse | any> => {
  const response = await apiClient.get(GET_ACTIVE_WORKOUT_URL);
  return response.json();
};

export const getWorkouts = async (
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<Workout>> => {
  const searchParams: Record<string, number> = {};
  if (page !== undefined) searchParams.page = page;
  if (pageSize !== undefined) searchParams.page_size = pageSize;
  const response = await apiClient.get(GET_WORKOUTS_URL, { searchParams });
  return response.json();
};

export const getWorkout = async (workoutId: number): Promise<Workout> => {
  const url = GET_WORKOUT_URL.replace(':id', String(workoutId));
  const response = await apiClient.get(url);
  return response.json();
};

export const completeWorkout = async (
  workoutId: number,
  request: CompleteWorkoutRequest
): Promise<CompleteWorkoutResponse> => {
  const url = COMPLETE_WORKOUT_URL.replace(':id', String(workoutId));
  const response = await apiClient.post(url, { json: request });
  return response.json();
};

export const getWorkoutSummary = async (
  workoutId: number
): Promise<WorkoutSummaryResponse> => {
  const url = WORKOUT_SUMMARY_URL.replace(':id', String(workoutId));
  const response = await apiClient.get(url);
  return response.json();
};

export const deleteWorkout = async (workoutId: number): Promise<void> => {
  const url = DELETE_WORKOUT_URL.replace(':id', String(workoutId));
  await apiClient.delete(url);
};

// Template Workout API Functions
export const createTemplateWorkout = async (
  request: CreateTemplateWorkoutRequest
): Promise<CreateTemplateWorkoutResponse> => {
  const response = await apiClient.post(TEMPLATE_CREATE_URL, { json: request });
  return response.json();
};

export const getTemplateWorkouts = async (): Promise<PaginatedResponse<TemplateWorkout>> => {
  const response = await apiClient.get(TEMPLATE_LIST_URL);
  return response.json();
};

export const deleteTemplateWorkout = async (templateId: number): Promise<void> => {
  const url = TEMPLATE_DELETE_URL.replace(':id', String(templateId));
  await apiClient.delete(url);
};

export const startTemplateWorkout = async (
  request: StartTemplateWorkoutRequest
): Promise<StartTemplateWorkoutResponse> => {
  const response = await apiClient.post(TEMPLATE_START_URL, { json: request });
  return response.json();
};

// Edit Workout API Functions
export const updateWorkout = async (
  workoutId: number,
  request: UpdateWorkoutRequest
): Promise<Workout | any> => {
  const response = await apiClient.patch(UPDATE_WORKOUT_URL.replace(':id', workoutId.toString()), {
    json: request,
  });
  return response.json();
};

export const addExerciseToPastWorkout = async (
  workoutId: number,
  request: AddExerciseToWorkoutRequest
): Promise<Workout> => {
  const url = ADD_EXERCISE_TO_WORKOUT_URL.replace(':id', String(workoutId));
  const response = await apiClient.post(url, { json: request });
  return response.json();
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
  const response = await apiClient.get(REST_TIMER_URL);
  return response.json();
};

export const stopRestTimer = async (): Promise<RestTimerStopResponse> => {
  const response = await apiClient.post(REST_TIMER_STOP_URL);
  return response.json();
};

// Calendar API Functions
export const getCalendar = async (
  year: number,
  month?: number,
  week?: number
): Promise<CalendarResponse | any> => {
  const response = await apiClient.get(CALENDAR_URL, { searchParams: { year, month, week } });
  return response.json();
};

export const getAvailableYears = async (): Promise<AvailableYearsResponse | any> => {
  const response = await apiClient.get(AVAILABLE_YEARS_URL);
  return response.json();
};

export const getCalendarStats = async (
  period: { year: number; month?: number | null; week?: number | null }
): Promise<CalendarStats | any> => {
  const searchParams: Record<string, number> = { year: period.year };
  if (period.month != null) searchParams.month = period.month;
  if (period.week != null) searchParams.week = period.week;
  const response = await apiClient.get(CALENDAR_STATS_URL, { searchParams });
  return response.json();
};

export const checkToday = async (): Promise<CheckTodayResponse | any> => {
  const response = await apiClient.get(CHECK_TODAY_URL);
  return response.json();
};

export const getRecoveryStatus = async (): Promise<RecoveryStatusResponse | any> => {
  const response = await apiClient.get(RECOVERY_STATUS_URL);
  return response.json();
};
