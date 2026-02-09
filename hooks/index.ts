// Hooks barrel export

// Core utility hooks
export { useAsync, useAsyncEffect } from './useAsync';
export type { UseAsyncResult, UseAsyncState, UseAsyncOptions } from './useAsync';

export { useTimer } from './useTimer';
export type { UseTimerResult } from './useTimer';

export { useModal, useModals } from './useModal';
export type { UseModalResult } from './useModal';

export { useForm, FormValidators } from './useForm';
export type { UseFormResult, UseFormOptions, ValidationSchema, ValidationRule } from './useForm';

// Data fetching hooks
export { useHomeData } from './useHomeData';
export type { UseHomeDataResult } from './useHomeData';

export { useActiveWorkout } from './useActiveWorkout';
export type { UseActiveWorkoutResult, AddSetData, UpdateSetData } from './useActiveWorkout';

export { useWorkoutList } from './useWorkoutList';
export type { UseWorkoutListResult } from './useWorkoutList';

// Re-export existing hooks
export { useRestTimer } from '@/components/RestTimerBar';
