import { Workout } from '@/api/types';
import { getWorkouts } from '@/api/Workout';
import { create } from 'zustand';

export interface WorkoutState {
    workouts: Workout[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    currentPage: number;
    fetchWorkouts: (reset?: boolean) => Promise<void>;
    loadMoreWorkouts: () => Promise<void>;
    setWorkouts: (workouts: Workout[]) => void;
    appendWorkouts: (workouts: Workout[]) => void;
    clearWorkouts: () => void;
}

/**
 * Workout store - manages workout list with pagination
 * Handles fetching and caching of workout history
 */
export const useWorkoutStore = create<WorkoutState>((set, get) => ({
    workouts: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    currentPage: 1,

    fetchWorkouts: async (reset = true) => {
        if (reset) {
            set({ isLoading: true, currentPage: 1 });
        }
        try {
            const workoutsData = await getWorkouts(1);
            const workoutsArray = workoutsData?.results || [];
            set({
                workouts: workoutsArray,
                hasMore: !!workoutsData?.next,
                currentPage: 1,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch workouts:', error);
            set({ workouts: [], hasMore: false, isLoading: false });
        }
    },

    loadMoreWorkouts: async () => {
        const { currentPage, hasMore, isLoadingMore } = get();
        if (!hasMore || isLoadingMore) return;

        set({ isLoadingMore: true });
        try {
            const nextPage = currentPage + 1;
            const workoutsData = await getWorkouts(nextPage);
            const newWorkouts = workoutsData?.results || [];
            set((state) => ({
                workouts: [...state.workouts, ...newWorkouts],
                hasMore: !!workoutsData?.next,
                currentPage: nextPage,
                isLoadingMore: false
            }));
        } catch (error) {
            console.error('Failed to load more workouts:', error);
            set({ isLoadingMore: false });
        }
    },

    setWorkouts: (workouts) => set({ workouts }),

    appendWorkouts: (workouts) => set((state) => ({
        workouts: [...state.workouts, ...workouts]
    })),

    clearWorkouts: () => set({
        workouts: [],
        currentPage: 1,
        hasMore: false
    }),
}));

export default useWorkoutStore;
