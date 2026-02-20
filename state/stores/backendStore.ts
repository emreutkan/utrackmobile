import { create } from 'zustand';

interface BackendState {
  isDown: boolean;
  failureCount: number;
  lastFailureAt: number;
  setDown: (down: boolean) => void;
  recordFailure: () => void;
  recordSuccess: () => void;
}

const FAILURE_THRESHOLD = 3;
const FAILURE_WINDOW_MS = 15_000; // 3 failures within 15s = backend down

export const useBackendStore = create<BackendState>((set, get) => ({
  isDown: false,
  failureCount: 0,
  lastFailureAt: 0,

  setDown: (down) => set({ isDown: down }),

  recordFailure: () => {
    const now = Date.now();
    const { failureCount, lastFailureAt } = get();
    const withinWindow = now - lastFailureAt < FAILURE_WINDOW_MS;
    const newCount = withinWindow ? failureCount + 1 : 1;

    set({
      failureCount: newCount,
      lastFailureAt: now,
      isDown: newCount >= FAILURE_THRESHOLD,
    });
  },

  recordSuccess: () => set({ failureCount: 0, isDown: false }),
}));
