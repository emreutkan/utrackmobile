import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';
import {
    addExerciseToWorkout,
    addSetToExercise,
    deleteSet,
    removeExerciseFromWorkout,
    updateSet
} from '@/api/Exercises';
import { completeWorkout, getActiveWorkout, getRestTimerState } from '@/api/Workout';
import { Workout } from '@/api/types';
import { useActiveWorkoutStore } from '@/state/userStore';
import { useTimer } from './useTimer';
import { ValidationService } from '@/services/ValidationService';

export interface AddSetData {
    weight: number;
    reps: number;
    reps_in_reserve?: number;
    rest_time_before_set?: number;
    total_tut?: number;
    is_warmup?: boolean;
}

export interface UpdateSetData {
    weight?: number;
    reps?: number;
    reps_in_reserve?: number;
    rest_time_before_set?: number;
    total_tut?: number;
    is_warmup?: boolean;
}

export interface UseActiveWorkoutResult {
    // Data
    workout: Workout | null;
    elapsedTime: string;
    elapsedSeconds: number;

    // Rest timer
    lastSetTimestamp: number | null;
    lastExerciseCategory: string;

    // State
    isLoading: boolean;

    // Actions
    refresh: () => Promise<void>;
    addExercise: (exerciseId: number) => Promise<boolean>;
    removeExercise: (workoutExerciseId: number) => Promise<boolean>;
    addSet: (workoutExerciseId: number, setData: AddSetData) => Promise<boolean>;
    updateSetData: (setId: number, data: UpdateSetData) => Promise<boolean>;
    deleteSetById: (setId: number) => Promise<boolean>;
    finishWorkout: () => Promise<boolean>;
}

/**
 * Custom hook for managing active workout state and operations
 * Consolidates workout operations from the active workout screen
 *
 * @returns Active workout data, timer state, and workout operations
 */
export function useActiveWorkout(): UseActiveWorkoutResult {
    // State
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Rest timer from store
    const {
        lastSetTimestamp,
        lastExerciseCategory,
        setLastSetTimestamp,
        setLastExerciseCategory
    } = useActiveWorkoutStore();

    // Elapsed time using the timer hook
    const { elapsedTime, elapsedSeconds } = useTimer(workout?.created_at);

    // Fetch active workout
    const fetchActiveWorkout = useCallback(async () => {
        try {
            const activeWorkout = await getActiveWorkout();
            if (activeWorkout && typeof activeWorkout === 'object' && 'id' in activeWorkout) {
                setWorkout(activeWorkout);
            } else {
                setWorkout(null);
            }
        } catch (error) {
            console.error('Failed to fetch active workout:', error);
            setWorkout(null);
        }
    }, []);

    // Fetch rest timer state
    const fetchRestTimerState = useCallback(async () => {
        try {
            const state = await getRestTimerState();
            if (state && state.last_set_timestamp) {
                const timestamp = new Date(state.last_set_timestamp).getTime();
                const now = Date.now();

                // Handle timestamp in future (timezone/clock skew)
                if (timestamp > now) {
                    console.warn('Rest timer timestamp is in the future, using current time');
                    setLastSetTimestamp(now);
                } else {
                    setLastSetTimestamp(timestamp);
                }
                setLastExerciseCategory(state.last_exercise_category || 'isolation');
            } else {
                setLastSetTimestamp(null);
                setLastExerciseCategory('isolation');
            }
        } catch (error) {
            console.error('Failed to fetch rest timer state:', error);
        }
    }, [setLastSetTimestamp, setLastExerciseCategory]);

    // Initial load on focus
    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            Promise.all([fetchActiveWorkout(), fetchRestTimerState()]).finally(() => {
                setIsLoading(false);
            });
        }, [fetchActiveWorkout, fetchRestTimerState])
    );

    // Refresh function
    const refresh = useCallback(async () => {
        await Promise.all([fetchActiveWorkout(), fetchRestTimerState()]);
    }, [fetchActiveWorkout, fetchRestTimerState]);

    // Add exercise to workout
    const addExercise = useCallback(
        async (exerciseId: number): Promise<boolean> => {
            if (!workout?.id) return false;

            try {
                await addExerciseToWorkout(workout.id, exerciseId);
                await fetchActiveWorkout();
                return true;
            } catch (error) {
                console.error('Failed to add exercise:', error);
                Alert.alert('Error', 'Failed to add exercise');
                return false;
            }
        },
        [workout?.id, fetchActiveWorkout]
    );

    // Remove exercise from workout
    const removeExercise = useCallback(
        async (workoutExerciseId: number): Promise<boolean> => {
            if (!workout?.id) return false;

            try {
                await removeExerciseFromWorkout(workout.id, workoutExerciseId);
                await fetchActiveWorkout();
                return true;
            } catch (error) {
                console.error('Failed to remove exercise:', error);
                Alert.alert('Error', 'Failed to remove exercise');
                return false;
            }
        },
        [workout?.id, fetchActiveWorkout]
    );

    // Add set to exercise
    const addSet = useCallback(
        async (workoutExerciseId: number, setData: AddSetData): Promise<boolean> => {
            try {
                const result = await addSetToExercise(workoutExerciseId, setData);

                // Check for validation errors
                if (result && typeof result === 'object' && 'error' in result) {
                    if ('validationErrors' in result && result.validationErrors) {
                        const errorMessage = ValidationService.formatValidationErrors(
                            result.validationErrors
                        );
                        Alert.alert('Validation Error', errorMessage);
                    } else if ('message' in result) {
                        Alert.alert('Error', result.message as string);
                    } else {
                        Alert.alert('Error', 'Failed to add set');
                    }
                    return false;
                }

                // Success - refresh workout and rest timer
                if (result?.id || (typeof result === 'object' && !('error' in result))) {
                    await fetchActiveWorkout();
                    await fetchRestTimerState();
                    return true;
                }

                Alert.alert('Error', 'Failed to add set');
                return false;
            } catch (error: any) {
                console.error('Failed to add set:', error);
                Alert.alert('Error', error?.message || 'Failed to add set');
                return false;
            }
        },
        [fetchActiveWorkout, fetchRestTimerState]
    );

    // Update set
    const updateSetData = useCallback(
        async (setId: number, data: UpdateSetData): Promise<boolean> => {
            try {
                const result = await updateSet(setId, data);

                if (result && typeof result === 'object' && 'error' in result) {
                    if ('validationErrors' in result && result.validationErrors) {
                        const errorMessage = ValidationService.formatValidationErrors(
                            result.validationErrors
                        );
                        Alert.alert('Validation Error', errorMessage);
                    } else {
                        Alert.alert('Error', 'Failed to update set');
                    }
                    return false;
                }

                await fetchActiveWorkout();
                return true;
            } catch (error) {
                console.error('Failed to update set:', error);
                return false;
            }
        },
        [fetchActiveWorkout]
    );

    // Delete set
    const deleteSetById = useCallback(
        async (setId: number): Promise<boolean> => {
            try {
                const success = await deleteSet(setId);
                if (success) {
                    await fetchActiveWorkout();
                    return true;
                }
                Alert.alert('Error', 'Failed to delete set');
                return false;
            } catch (error) {
                console.error('Failed to delete set:', error);
                Alert.alert('Error', 'Failed to delete set');
                return false;
            }
        },
        [fetchActiveWorkout]
    );

    // Finish workout
    const finishWorkout = useCallback(async (): Promise<boolean> => {
        if (!workout?.id) return false;

        return new Promise(resolve => {
            Alert.alert('Finish Workout', 'Are you sure you want to finish this workout?', [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                {
                    text: 'Finish',
                    style: 'default',
                    onPress: async () => {
                        try {
                            const now = Date.now();
                            const startTime = new Date(workout.created_at).getTime();
                            const durationSeconds = Math.floor(Math.max(0, now - startTime) / 1000);

                            await completeWorkout(workout.id, {
                                duration: durationSeconds.toString()
                            });

                            // Clear rest timer state
                            setLastSetTimestamp(null);
                            setLastExerciseCategory('isolation');

                            resolve(true);
                        } catch (error) {
                            console.error('Failed to complete workout:', error);
                            Alert.alert('Error', 'Failed to complete workout. Please try again.');
                            resolve(false);
                        }
                    }
                }
            ]);
        });
    }, [workout?.id, workout?.created_at, setLastSetTimestamp, setLastExerciseCategory]);

    return {
        // Data
        workout,
        elapsedTime,
        elapsedSeconds,

        // Rest timer
        lastSetTimestamp,
        lastExerciseCategory,

        // State
        isLoading,

        // Actions
        refresh,
        addExercise,
        removeExercise,
        addSet,
        updateSetData,
        deleteSetById,
        finishWorkout
    };
}

export default useActiveWorkout;
