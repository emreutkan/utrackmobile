import apiClient from './APIClient';
import type {
  AddSetRequest,
  UpdateSetRequest,
  UpdateExerciseOrderRequest,
  Exercise1RMHistory,
} from './types/exercise';
import {
  EXERCISE_LIST_URL,
  EXERCISE_ADD_TO_WORKOUT_URL,
  EXERCISE_1RM_HISTORY_URL,
  EXERCISE_SET_HISTORY_URL,
  EXERCISE_LAST_WORKOUT_URL,
} from './types/exercise';
import {
  ADD_SET_URL,
  DELETE_SET_URL,
  UPDATE_SET_URL,
  DELETE_WORKOUT_EXERCISE_URL,
  UPDATE_EXERCISE_ORDER_URL,
  OVERLOAD_TREND_URL,
} from './types';
import type { OverloadTrendResponse } from './types/volume';

export const getExercises = async (
  search: string = '',
  page?: number,
  pageSize?: number
): Promise<unknown> => {
  const searchParams: Record<string, string | number> = {};
  if (search) searchParams.search = search;
  if (page !== undefined) searchParams.page = page;
  if (pageSize !== undefined) searchParams.page_size = pageSize;
  return apiClient.get(EXERCISE_LIST_URL, { searchParams }).json();
};

export const addExerciseToWorkout = async (
  workoutId: number,
  body: { exercise_id: number; order?: number }
): Promise<unknown> => {
  const url = EXERCISE_ADD_TO_WORKOUT_URL.replace(':workout_id', workoutId.toString());
  return apiClient.post(url, { json: body }).json();
};

export const removeExerciseFromWorkout = async (workoutExerciseId: number): Promise<boolean> => {
  const url = DELETE_WORKOUT_EXERCISE_URL.replace(':workout_exercise_id', workoutExerciseId.toString());
  const response = await apiClient.delete(url);
  return response.status === 204;
};

export const addSetToExercise = async (
  workoutExerciseId: number,
  data: AddSetRequest
): Promise<unknown> => {
  const url = ADD_SET_URL.replace(':workout_exercise_id', workoutExerciseId.toString());
  return apiClient.post(url, { json: data }).json();
};

export const updateSet = async (setId: number, data: UpdateSetRequest): Promise<unknown> => {
  const url = UPDATE_SET_URL.replace(':set_id', setId.toString());
  return apiClient.patch(url, { json: data }).json();
};

export const deleteSet = async (setId: number): Promise<boolean> => {
  const url = DELETE_SET_URL.replace(':set_id', setId.toString());
  const response = await apiClient.delete(url);
  return response.status === 204;
};

export const updateExerciseOrder = async (
  workoutId: number,
  body: UpdateExerciseOrderRequest
): Promise<boolean> => {
  const url = UPDATE_EXERCISE_ORDER_URL.replace(':id', workoutId.toString());
  const response = await apiClient.post(url, { json: body });
  return response.status === 200;
};

export const getExercise1RMHistory = async (
  exerciseId: number
): Promise<Exercise1RMHistory | unknown> => {
  const url = EXERCISE_1RM_HISTORY_URL.replace(':exercise_id', exerciseId.toString());
  return apiClient.get(url).json();
};

export const getExerciseSetHistory = async (
  exerciseId: number,
  page: number = 1,
  pageSize?: number
): Promise<unknown> => {
  const searchParams: Record<string, number> = { page };
  if (pageSize != null) searchParams.page_size = pageSize;
  const url = EXERCISE_SET_HISTORY_URL.replace(':exercise_id', exerciseId.toString());
  return apiClient.get(url, { searchParams }).json();
};

export const getExerciseLastWorkout = async (exerciseId: number): Promise<unknown> => {
  const url = EXERCISE_LAST_WORKOUT_URL.replace(':exercise_id', exerciseId.toString());
  return apiClient.get(url).json();
};

export const getExerciseOverloadTrend = async (
  exerciseId: number
): Promise<OverloadTrendResponse> => {
  const url = OVERLOAD_TREND_URL.replace(':exercise_id', exerciseId.toString());
  return apiClient.get(url).json();
};

// Re-export for consumers that expect these type names from Exercises
export type { AddSetRequest, UpdateSetRequest };
