import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useDateStore } from '@/state/userStore';
import {
  createWorkout,
  getActiveWorkout,
  getWorkouts,
  getWorkout,
  completeWorkout,
  getWorkoutSummary,
  deleteWorkout,
  createTemplateWorkout,
  getTemplateWorkouts,
  deleteTemplateWorkout,
  startTemplateWorkout,
  updateWorkout,
  addExerciseToPastWorkout,
  getRestTimerState,
  stopRestTimer,
  getCalendar,
  getAvailableYears,
  getCalendarStats,
  checkToday,
  getRecoveryStatus,
  getUserStats,
  getSuggestNextExercise,
  getExerciseOptimizationCheck,
} from '@/api/Workout';
import { getVolumeAnalysis } from '@/api/VolumeAnalysis';
import type { VolumeAnalysisFilters } from '@/api/types';
import type {
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
  AddExerciseToWorkoutRequest,
  CreateTemplateWorkoutRequest,
  StartTemplateWorkoutRequest,
} from '@/api/types';

// Workouts list with pagination
export const useWorkouts = (page: number = 1, pageSize?: number) => {
  return useQuery({
    queryKey: ['workouts', page, pageSize],
    queryFn: () => getWorkouts(page, pageSize),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Infinite scroll for workouts
export const useInfiniteWorkouts = (pageSize: number = 10) => {
  return useInfiniteQuery({
    queryKey: ['workouts-infinite'],
    queryFn: ({ pageParam = 1 }) => getWorkouts(pageParam, pageSize),
    getNextPageParam: (lastPage) => {
      if (lastPage?.next) {
        const url = new URL(lastPage.next);
        const page = url.searchParams.get('page');
        return page ? parseInt(page) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2,
  });
};

// Single workout query
export const useWorkout = (workoutId: number | null) => {
  return useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => getWorkout(workoutId!),
    enabled: workoutId !== null,
    staleTime: 1000 * 60 * 2,
  });
};

// Active workout query – one fetch shared by all consumers; no refetch on window/tab focus
export const useActiveWorkout = () => {
  return useQuery({
    queryKey: ['active-workout'],
    queryFn: getActiveWorkout,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // use cache when another screen already fetched
  });
};

// Create workout mutation
export const useCreateWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateWorkoutRequest) => createWorkout(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
      queryClient.invalidateQueries({ queryKey: ['today-status'] });
    },
  });
};

// Complete workout mutation
export const useCompleteWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workoutId,
      data,
    }: {
      workoutId: number;
      data?: {
        duration?: string;
        intensity?: number;
        notes?: string;
        normalize_duration?: boolean;
        proceed_as_is?: boolean;
      };
    }) =>
      completeWorkout(workoutId, {
        duration: data?.duration != null ? Number(data.duration) : undefined,
        intensity: data?.intensity as 'low' | 'medium' | 'high' | undefined,
        notes: data?.notes,
        normalize_duration: data?.normalize_duration,
        proceed_as_is: data?.proceed_as_is,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
      queryClient.invalidateQueries({ queryKey: ['today-status'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['recovery-status'] }); // Completing a workout affects recovery
    },
  });
};

// Workout summary query
export const useWorkoutSummary = (workoutId: number | null) => {
  return useQuery({
    queryKey: ['workout-summary', workoutId],
    queryFn: () => getWorkoutSummary(workoutId!),
    enabled: workoutId !== null,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Delete workout mutation
export const useDeleteWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: number) => deleteWorkout(workoutId),
    onSuccess: (_, workoutId) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['today-status'] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
      queryClient.invalidateQueries({ queryKey: ['workout-summary', workoutId] });
      queryClient.invalidateQueries({ queryKey: ['recovery-status'] }); // Deleting a workout affects recovery
    },
  });
};

// Template workouts
export const useTemplateWorkouts = () => {
  return useQuery({
    queryKey: ['template-workouts'],
    queryFn: getTemplateWorkouts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Create template workout mutation
export const useCreateTemplateWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateTemplateWorkoutRequest) => createTemplateWorkout(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-workouts'] });
    },
  });
};

// Delete template workout mutation
export const useDeleteTemplateWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: number) => deleteTemplateWorkout(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-workouts'] });
    },
  });
};

// Start template workout mutation
export const useStartTemplateWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: StartTemplateWorkoutRequest) => startTemplateWorkout(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
      queryClient.invalidateQueries({ queryKey: ['today-status'] });
    },
  });
};

// Update workout mutation
export const useUpdateWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, request }: { workoutId: number; request: UpdateWorkoutRequest }) =>
      updateWorkout(workoutId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout', variables.workoutId] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
    },
  });
};

// Add exercise to past workout mutation
export const useAddExerciseToPastWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workoutId,
      request,
    }: {
      workoutId: number;
      request: AddExerciseToWorkoutRequest;
    }) => addExerciseToPastWorkout(workoutId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout', variables.workoutId] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
    },
  });
};

// Rest timer state query
export const useRestTimerState = () => {
  return useQuery({
    queryKey: ['rest-timer-state'],
    queryFn: getRestTimerState,
    staleTime: 1000 * 5, // 5 seconds
  });
};

// Stop rest timer mutation
export const useStopRestTimer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stopRestTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rest-timer-state'] });
    },
  });
};

// Calendar queries
export const useCalendar = (year: number, month?: number, week?: number) => {
  return useQuery({
    queryKey: ['calendar', year, month, week],
    queryFn: () => getCalendar(year, month, week),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAvailableYears = () => {
  return useQuery({
    queryKey: ['available-years'],
    queryFn: getAvailableYears,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCalendarStats = (year: number, month?: number, week?: number) => {
  return useQuery({
    queryKey: ['calendar-stats', year, month, week],
    queryFn: () => getCalendarStats({ year, month, week }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Today status query - pass date for status on that day (defaults to "today" when not provided)
export const useTodayStatus = (date?: Date) => {
  const dateStr = date
    ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    : '';
  return useQuery({
    queryKey: ['today-status', dateStr],
    queryFn: () => checkToday(date ?? undefined),
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Recovery status query
export const useRecoveryStatus = () => {
  return useQuery({
    queryKey: ['recovery-status'],
    queryFn: getRecoveryStatus,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// User stats query
export const useUserStats = () => {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: getUserStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Volume analysis query
export const useVolumeAnalysis = (filters?: VolumeAnalysisFilters) => {
  return useQuery({
    queryKey: ['volume-analysis', filters?.weeks_back, filters?.start_date, filters?.end_date],
    queryFn: () => getVolumeAnalysis(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Suggest next exercise query — refreshes whenever active workout changes
export const useSuggestNextExercise = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['suggest-next-exercise'],
    queryFn: getSuggestNextExercise,
    enabled,
    staleTime: 1000 * 30, // 30 seconds — muscles recover over time
    refetchOnWindowFocus: false,
  });
};

// Optimization check — fetched on demand; callers trigger via queryClient.fetchQuery or useQuery with enabled flag
export const useExerciseOptimizationCheck = (workoutExerciseId: number | null) => {
  return useQuery({
    queryKey: ['optimization-check', workoutExerciseId],
    queryFn: () => getExerciseOptimizationCheck(workoutExerciseId!),
    enabled: workoutExerciseId !== null,
    staleTime: 1000 * 60 * 2,
    retry: false, // Don't retry on error — show result immediately
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
};

// Utility hooks
export const useInvalidateWorkouts = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['workouts'] });
    queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
  };
};

export const useInvalidateTodayStatus = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['today-status'] });
};

/** Set selected date and invalidate today-status cache so the new date's data refetches. */
export const useSetSelectedDate = () => {
  const setToday = useDateStore((s) => s.setToday);
  const queryClient = useQueryClient();
  return useCallback(
    (date: Date) => {
      setToday(date);
      queryClient.invalidateQueries({ queryKey: ['today-status'] });
    },
    [setToday, queryClient]
  );
};
