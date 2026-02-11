import apiClient from './APIClient';
import type {
  AddSetRequest,
  UpdateSetRequest,
  UpdateExerciseOrderRequest,
  Exercise1RMHistory,
} from './types/exercise';
import { EXERCISE_LIST_URL } from './types/exercise';

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
  return apiClient.post(`/exercise/add/${workoutId}/`, { json: body }).json();
};

export const removeExerciseFromWorkout = async (workoutExerciseId: number): Promise<boolean> => {
  const response = await apiClient.delete(`/workout/exercise/${workoutExerciseId}/delete/`);
  return response.status === 204;
};

export const addSetToExercise = async (
  workoutExerciseId: number,
  data: AddSetRequest
): Promise<unknown> => {
  return apiClient.post(`/workout/exercise/${workoutExerciseId}/add_set/`, { json: data }).json();
};

export const updateSet = async (setId: number, data: UpdateSetRequest): Promise<unknown> => {
  return apiClient.patch(`/workout/set/${setId}/update/`, { json: data }).json();
};

export const deleteSet = async (setId: number): Promise<boolean> => {
  const response = await apiClient.delete(`/workout/set/${setId}/delete/`);
  return response.status === 204;
};

export const updateExerciseOrder = async (
  workoutId: number,
  body: UpdateExerciseOrderRequest
): Promise<boolean> => {
  const response = await apiClient.post(`/workout/${workoutId}/update_order/`, { json: body });
  return response.status === 200;
};

export const getExercise1RMHistory = async (
  exerciseId: number
): Promise<Exercise1RMHistory | unknown> => {
  return apiClient.get(`/workout/exercise/${exerciseId}/1rm-history/`).json();
};

export const getExerciseSetHistory = async (
  exerciseId: number,
  page: number = 1,
  pageSize?: number
): Promise<unknown> => {
  const searchParams: Record<string, number> = { page };
  if (pageSize != null) searchParams.page_size = pageSize;
  return apiClient
    .get(`/workout/exercise/${exerciseId}/set-history/`, {
      searchParams,
    })
    .json();
};

export const getExerciseLastWorkout = async (exerciseId: number): Promise<unknown> => {
  return apiClient.get(`/workout/exercise/${exerciseId}/last-workout/`).json();
};

// Re-export for consumers that expect these type names from Exercises
export type { AddSetRequest, UpdateSetRequest };
