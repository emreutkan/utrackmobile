import { getAccount } from '@/api/account';
import { getAccountResponse, Workout } from '@/api/types';
import { getWorkouts } from '@/api/Workout';
import { create } from 'zustand';

interface UserState {
    user: getAccountResponse | null;
    isLoading: boolean;
    fetchUser: () => Promise<void>;
    clearUser: () => void;
}

interface WorkoutState {
    workouts: Workout[];
    isLoading: boolean;
    fetchWorkouts: () => Promise<void>;
    clearWorkouts: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    isLoading: false,
    fetchUser: async () => {
        set({ isLoading: true });
        try {
            const userData = await getAccount();
            set({ user: userData });
        } catch (error) {
            console.error('Failed to fetch user:', error);
            set({ user: null });
        } finally {
            set({ isLoading: false });
        }
    },
    clearUser: () => set({ user: null }),
}));

export const useWorkoutStore = create<WorkoutState>((set) => ({
    workouts: [],
    isLoading: false,
    fetchWorkouts: async () => {
        set({ isLoading: true });
        try {
            const workoutsData = await getWorkouts();
            set({ workouts: workoutsData });
        } catch (error) {
            console.error('Failed to fetch workouts:', error);
            set({ workouts: [] });
        } finally {
            set({ isLoading: false });
        }
    },
    clearWorkouts: () => set({ workouts: [] }),
}));

interface ActiveWorkoutState {
    lastSetTimestamp: number | null;
    lastExerciseCategory: string;
    setLastSetTimestamp: (timestamp: number | null) => void;
    setLastExerciseCategory: (category: string) => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set) => ({
    lastSetTimestamp: null,
    lastExerciseCategory: 'isolation',
    setLastSetTimestamp: (timestamp) => set({ lastSetTimestamp: timestamp }),
    setLastExerciseCategory: (category) => set({ lastExerciseCategory: category }),
}));