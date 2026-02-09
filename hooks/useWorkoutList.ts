import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Workout } from '@/api/types';
import { useWorkoutStore } from '@/state/userStore';

export interface UseWorkoutListResult {
    /** List of workouts */
    workouts: Workout[];
    /** Whether initial load is in progress */
    isLoading: boolean;
    /** Whether loading more workouts */
    isLoadingMore: boolean;
    /** Whether more workouts are available to load */
    hasMore: boolean;
    /** Current page number */
    currentPage: number;
    /** Refresh the workout list */
    refresh: () => Promise<void>;
    /** Load more workouts (pagination) */
    loadMore: () => Promise<void>;
    /** Clear the workout list */
    clear: () => void;
}

/**
 * Custom hook for managing workout list with pagination
 * Wraps the workout store to provide a cleaner interface
 *
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Workout list data and actions
 *
 * @example
 * ```tsx
 * const { workouts, isLoading, hasMore, refresh, loadMore } = useWorkoutList();
 *
 * <FlatList
 *     data={workouts}
 *     onEndReached={hasMore ? loadMore : undefined}
 *     refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
 * />
 * ```
 */
export function useWorkoutList(autoFetch: boolean = true): UseWorkoutListResult {
    const {
        workouts,
        isLoading,
        isLoadingMore,
        hasMore,
        currentPage,
        fetchWorkouts,
        loadMoreWorkouts,
        clearWorkouts
    } = useWorkoutStore();

    // Auto-fetch on focus if enabled
    useFocusEffect(
        useCallback(() => {
            if (autoFetch && workouts.length === 0) {
                fetchWorkouts(true);
            }
        }, [autoFetch, workouts.length, fetchWorkouts])
    );

    // Refresh function - resets pagination
    const refresh = useCallback(async () => {
        await fetchWorkouts(true);
    }, [fetchWorkouts]);

    // Load more function - appends to existing
    const loadMore = useCallback(async () => {
        if (!isLoadingMore && hasMore) {
            await loadMoreWorkouts();
        }
    }, [isLoadingMore, hasMore, loadMoreWorkouts]);

    return {
        workouts,
        isLoading,
        isLoadingMore,
        hasMore,
        currentPage,
        refresh,
        loadMore,
        clear: clearWorkouts
    };
}

export default useWorkoutList;
