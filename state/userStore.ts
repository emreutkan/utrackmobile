/**
 * Legacy export file for backward compatibility
 *
 * All stores have been moved to state/stores/ directory.
 * This file re-exports them to maintain backward compatibility with existing imports.
 *
 * Prefer importing from '@/state' or '@/state/stores' in new code.
 */

export {
    useUserStore,
    useWorkoutStore,
    useActiveWorkoutStore,
    useHomeLoadingStore,
    useDateStore,
    useSupplementStore
} from './stores';

// Re-export types for backward compatibility
export type {
    UserState,
    WorkoutState,
    ActiveWorkoutState,
    HomeLoadingState,
    DateState,
    SupplementState
} from './stores';
