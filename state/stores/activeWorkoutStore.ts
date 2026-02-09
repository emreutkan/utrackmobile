import { create } from 'zustand';

export interface ActiveWorkoutState {
    /** ID of the currently active workout */
    workoutId: number | null;
    /** Timestamp of the last completed set (for rest timer) */
    lastSetTimestamp: number | null;
    /** Category of the last exercise ('compound' or 'isolation') */
    lastExerciseCategory: string;

    setWorkoutId: (id: number | null) => void;
    setLastSetTimestamp: (timestamp: number | null) => void;
    setLastExerciseCategory: (category: string) => void;
    clearActiveWorkout: () => void;
}

/**
 * Active workout store - manages state for the currently active workout session
 * Tracks rest timer state and exercise category for proper rest calculations
 */
export const useActiveWorkoutStore = create<ActiveWorkoutState>((set) => ({
    workoutId: null,
    lastSetTimestamp: null,
    lastExerciseCategory: 'isolation',

    setWorkoutId: (id) => set({ workoutId: id }),

    setLastSetTimestamp: (timestamp) => set({ lastSetTimestamp: timestamp }),

    setLastExerciseCategory: (category) => set({ lastExerciseCategory: category }),

    clearActiveWorkout: () => set({
        workoutId: null,
        lastSetTimestamp: null,
        lastExerciseCategory: 'isolation'
    }),
}));

export default useActiveWorkoutStore;
