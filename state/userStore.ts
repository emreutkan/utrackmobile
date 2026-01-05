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
    isLoadingMore: boolean;
    hasMore: boolean;
    currentPage: number;
    fetchWorkouts: (reset?: boolean) => Promise<void>;
    loadMoreWorkouts: () => Promise<void>;
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
    clearWorkouts: () => set({ workouts: [], currentPage: 1, hasMore: false }),
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

interface HomeLoadingState {
    isInitialLoadComplete: boolean;
    todayStatus: any | null;
    recoveryStatus: Record<string, any> | null;
    setInitialLoadComplete: (complete: boolean) => void;
    setTodayStatus: (status: any) => void;
    setRecoveryStatus: (status: Record<string, any>) => void;
    clearHomeData: () => void;
}

export const useHomeLoadingStore = create<HomeLoadingState>((set) => ({
    isInitialLoadComplete: false,
    todayStatus: null,
    recoveryStatus: null,
    setInitialLoadComplete: (complete) => set({ isInitialLoadComplete: complete }),
    setTodayStatus: (status) => set({ todayStatus: status }),
    setRecoveryStatus: (status) => set({ recoveryStatus: status }),
    clearHomeData: () => set({ 
        isInitialLoadComplete: false, 
        todayStatus: null, 
        recoveryStatus: null 
    }),
}));
