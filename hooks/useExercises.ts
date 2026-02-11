import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getExercises,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  addSetToExercise,
  deleteSet,
  updateSet,
  updateExerciseOrder,
  getExercise1RMHistory,
  getExerciseSetHistory,
  type AddSetRequest,
  type UpdateSetRequest,
} from '@/api/Exercises';

// Exercise list query
export const useExercises = (query: string = '', page?: number, pageSize?: number) => {
  return useQuery({
    queryKey: ['exercises', query, page, pageSize],
    queryFn: () => getExercises(query, page, pageSize),
    staleTime: 1000 * 60 * 10, // 10 minutes - exercises don't change often
  });
};

// Exercise 1RM history query
export const useExercise1RMHistory = (exerciseId: number | null) => {
  return useQuery({
    queryKey: ['exercise-1rm-history', exerciseId],
    queryFn: () => getExercise1RMHistory(exerciseId!),
    enabled: exerciseId !== null,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Exercise set history query
export const useExerciseSetHistory = (exerciseId: number | null, page: number = 1) => {
  return useQuery({
    queryKey: ['exercise-set-history', exerciseId, page],
    queryFn: () => getExerciseSetHistory(exerciseId!, page),
    enabled: exerciseId !== null,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Add exercise to workout mutation
export const useAddExerciseToWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, exerciseId }: { workoutId: number; exerciseId: number }) =>
      addExerciseToWorkout(workoutId, { exercise_id: exerciseId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout', variables.workoutId] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
  });
};

// Remove exercise from workout mutation (workoutExerciseId = id of the workout_exercise row)
export const useRemoveExerciseFromWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workoutExerciseId: number) =>
      removeExerciseFromWorkout(workoutExerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout'] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
  });
};

// Add set to exercise mutation
export const useAddSetToExercise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutExerciseId, data }: { workoutExerciseId: number; data: AddSetRequest }) =>
      addSetToExercise(workoutExerciseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout'] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
  });
};

// Update set mutation
export const useUpdateSet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ setId, data }: { setId: number; data: UpdateSetRequest }) => updateSet(setId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout'] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
  });
};

// Delete set mutation
export const useDeleteSet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (setId: number) => deleteSet(setId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout'] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
  });
};

// Update exercise order mutation
export const useUpdateExerciseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, exerciseOrders }: { workoutId: number; exerciseOrders: { id: number; order: number }[] }) =>
      updateExerciseOrder(workoutId, { exercise_orders: exerciseOrders }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout', variables.workoutId] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
  });
};
