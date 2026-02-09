import { create } from 'zustand';

export interface HomeLoadingState {
    /** Whether the initial data load is complete */
    isInitialLoadComplete: boolean;
    /** Cached today status data */
    todayStatus: any | null;
    /** Cached recovery status data */
    recoveryStatus: Record<string, any> | null;

    setInitialLoadComplete: (complete: boolean) => void;
    setTodayStatus: (status: any) => void;
    setRecoveryStatus: (status: Record<string, any>) => void;
    clearHomeData: () => void;
}

/**
 * Home loading store - caches home screen data to avoid flickering on navigation
 * Stores today's status and recovery status between screen visits
 */
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

export default useHomeLoadingStore;
