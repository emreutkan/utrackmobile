import { getAccount } from '@/api/account';
import { getAccountResponse } from '@/api/types';
import { create } from 'zustand';

export interface UserState {
    user: getAccountResponse | null;
    isLoading: boolean;
    fetchUser: () => Promise<void>;
    setUser: (user: getAccountResponse | null) => void;
    clearUser: () => void;
}

/**
 * User store - manages user profile data
 * Simplified: API calls remain in store for now, but could be moved to hooks
 */
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

    setUser: (user) => set({ user }),

    clearUser: () => set({ user: null }),
}));

export default useUserStore;
