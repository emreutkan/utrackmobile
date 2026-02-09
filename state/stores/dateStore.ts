import { create } from 'zustand';

export interface DateState {
    /** Current date reference */
    today: Date;
    setToday: (date: Date) => void;
}

/**
 * Date store - manages global date reference
 * Useful for consistent date handling across the app
 */
export const useDateStore = create<DateState>((set) => ({
    today: new Date(),
    setToday: (date) => set({ today: date }),
}));

export default useDateStore;
