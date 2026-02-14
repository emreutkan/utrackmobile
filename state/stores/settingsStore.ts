import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SettingsState {
    /** Countdown seconds before TUT tracking starts (default 3) */
    tutCountdown: number;
    /** Reaction time seconds to subtract when TUT stops (default 2) */
    tutReactionOffset: number;

    setTutCountdown: (seconds: number) => void;
    setTutReactionOffset: (seconds: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            tutCountdown: 3,
            tutReactionOffset: 2,

            setTutCountdown: (seconds) => set({ tutCountdown: seconds }),
            setTutReactionOffset: (seconds) => set({ tutReactionOffset: seconds }),
        }),
        {
            name: 'force-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
