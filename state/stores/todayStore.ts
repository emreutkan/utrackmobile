import { checkToday, getActiveWorkout, getWorkout } from '@/api/Workout';
import { CheckTodayResponse, Workout } from '@/api/types';
import { create } from 'zustand';

interface getTodayStatusResponse {
  workout_status: 'performed' | 'not_performed' | 'rest_day' | 'performing';
  workout?: Workout | null;
}

interface TodayStoreState {
  isLoading: boolean;
  fetchTodayStatus: () => void;
  todayStatus: getTodayStatusResponse | null;
  getTodayStatus: () => Promise<getTodayStatusResponse | null>;
  clearTodayStatus: () => void;
}

export const useTodayStore = create<TodayStoreState>((set, get) => ({
  isLoading: false,
  todayStatus: null,
  getTodayStatus: async (): Promise<getTodayStatusResponse | null> => {
    if (get().todayStatus === null) {
      await get().fetchTodayStatus();

      return get().todayStatus;
    } else {
      return get().todayStatus;
    }
  },
  clearTodayStatus: () => {},
  fetchTodayStatus: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      const status: CheckTodayResponse = await checkToday();

      if (!status.workout_performed && !status.active_workout) {
        set({
          todayStatus: {
            workout_status: 'not_performed',
          },
        });
      } else if (status.is_rest && status.workout_performed) {
        set({
          todayStatus: {
            workout_status: 'rest_day',
          },
        });
      } else if (status.workout_performed && !status.is_rest) {
        set({
          todayStatus: {
            workout_status: 'performed',
            workout: status.workout,
          },
        });
      } else if (status.active_workout) {
        const activeWorkout = await getActiveWorkout();
        let workout: Workout | null = null;
        if (activeWorkout) {
          workout = await getWorkout(activeWorkout.id);
        }
        set({
          todayStatus: {
            workout_status: 'performing',
            workout: workout,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch today status:', error);
    }
  },
}));
