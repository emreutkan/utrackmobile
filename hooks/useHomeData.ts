import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { healthService } from '@/api/Health';
import {
    CalendarDay,
    CalendarStats,
    CheckTodayResponse,
    CNSRecovery,
    MuscleRecovery,
    TemplateWorkout,
    Workout
} from '@/api/types';
import {
    checkToday,
    getActiveWorkout,
    getCalendar,
    getCalendarStats,
    getRecoveryStatus,
    getTemplateWorkouts,
    getWorkouts,
    getWorkoutSummary
} from '@/api/Workout';
import { useHomeLoadingStore } from '@/state/userStore';
import { getWeekNumber } from '@/utils/dateTime';

export interface UseHomeDataResult {
    // Data
    todayStatus: CheckTodayResponse | null;
    activeWorkout: Workout | null;
    recoveryStatus: Record<string, MuscleRecovery>;
    cnsRecovery: CNSRecovery | null;
    templates: TemplateWorkout[];
    calendarData: CalendarDay[];
    calendarStats: CalendarStats | null;
    steps: number | null;
    recentWorkouts: Workout[];
    todayWorkoutScore: number | null;

    // State
    isLoading: boolean;
    isRefreshing: boolean;

    // Actions
    refresh: () => Promise<void>;
    fetchCalendar: (year: number, month?: number, week?: number) => Promise<void>;
    fetchCalendarStats: (year: number, month?: number, week?: number) => Promise<void>;
}

/**
 * Custom hook for managing home screen data
 * Consolidates the 8+ data fetches from the home screen into a single hook
 *
 * @returns Home screen data, loading states, and refresh actions
 */
export function useHomeData(): UseHomeDataResult {
    // Get cached data from store
    const {
        isInitialLoadComplete,
        todayStatus: cachedTodayStatus,
        recoveryStatus: cachedRecoveryStatus,
        setInitialLoadComplete,
        setTodayStatus: setCachedTodayStatus,
        setRecoveryStatus: setCachedRecoveryStatus
    } = useHomeLoadingStore();

    // Data state
    const [todayStatus, setTodayStatus] = useState<CheckTodayResponse | null>(cachedTodayStatus);
    const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
    const [recoveryStatus, setRecoveryStatus] = useState<Record<string, MuscleRecovery>>(
        cachedRecoveryStatus || {}
    );
    const [cnsRecovery, setCnsRecovery] = useState<CNSRecovery | null>(null);
    const [templates, setTemplates] = useState<TemplateWorkout[]>([]);
    const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
    const [calendarStats, setCalendarStats] = useState<CalendarStats | null>(null);
    const [steps, setSteps] = useState<number | null>(null);
    const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
    const [todayWorkoutScore, setTodayWorkoutScore] = useState<number | null>(null);

    // Loading state
    const [isLoading, setIsLoading] = useState(!isInitialLoadComplete);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch steps from health service
    const fetchSteps = useCallback(async (): Promise<number | null> => {
        try {
            const init = await healthService.initialize();
            return init ? await healthService.getTodaySteps() : null;
        } catch {
            return null;
        }
    }, []);

    // Fetch all home data
    const fetchAllData = useCallback(async () => {
        try {
            const now = new Date();
            const currentWeek = getWeekNumber(now);

            // Parallel fetching for speed
            const [
                status,
                active,
                tpls,
                recovery,
                stepsData,
                cal,
                calStats,
                workoutsData
            ] = await Promise.all([
                checkToday(),
                getActiveWorkout(),
                getTemplateWorkouts(),
                getRecoveryStatus(),
                fetchSteps(),
                getCalendar(now.getFullYear(), undefined, currentWeek),
                getCalendarStats(now.getFullYear(), undefined, currentWeek),
                getWorkouts(1, 50)
            ]);

            // Update today status
            setTodayStatus(status);
            setCachedTodayStatus(status);

            // Update active workout
            if (active && typeof active === 'object' && 'id' in active) {
                setActiveWorkout(active);
            } else {
                setActiveWorkout(null);
            }

            // Update templates
            setTemplates(Array.isArray(tpls) ? tpls : []);

            // Update recovery status
            if (recovery?.recovery_status) {
                setRecoveryStatus(recovery.recovery_status);
                setCachedRecoveryStatus(recovery.recovery_status);
            }
            if (recovery?.cns_recovery) {
                setCnsRecovery(recovery.cns_recovery);
            }

            // Update steps
            setSteps(stepsData);

            // Update calendar
            setCalendarData(cal?.calendar || []);
            setCalendarStats(calStats);

            // Update recent workouts
            if (workoutsData && 'results' in workoutsData && Array.isArray(workoutsData.results)) {
                setRecentWorkouts(workoutsData.results);
            }

            // Fetch workout summary if today's workout exists
            if (
                status &&
                typeof status === 'object' &&
                'workout_performed' in status &&
                status.workout_performed &&
                'workout' in status &&
                status.workout
            ) {
                try {
                    const summary = await getWorkoutSummary((status.workout as Workout).id);
                    if (summary && typeof summary === 'object' && 'score' in summary) {
                        setTodayWorkoutScore(summary.score as number);
                    }
                } catch (e) {
                    console.error('Error fetching workout summary:', e);
                }
            } else {
                setTodayWorkoutScore(null);
            }
        } catch (e) {
            console.error('Home fetch error:', e);
        }
    }, [fetchSteps, setCachedTodayStatus, setCachedRecoveryStatus]);

    // Background refresh (lighter weight - only essential data)
    const backgroundRefresh = useCallback(async () => {
        try {
            const [active, status, tpls, stepsData] = await Promise.all([
                getActiveWorkout(),
                checkToday(),
                getTemplateWorkouts(),
                fetchSteps()
            ]);

            if (active && typeof active === 'object' && 'id' in active) {
                setActiveWorkout(active);
            } else {
                setActiveWorkout(null);
            }

            setTodayStatus(status);
            setTemplates(Array.isArray(tpls) ? tpls : []);
            setSteps(stepsData);
        } catch (e) {
            console.error('Background refresh error:', e);
        }
    }, [fetchSteps]);

    // Initial load on focus
    useFocusEffect(
        useCallback(() => {
            if (!isInitialLoadComplete) {
                fetchAllData().then(() => {
                    setIsLoading(false);
                    setInitialLoadComplete(true);
                });
            } else {
                // Background refresh on focus
                backgroundRefresh();
            }
        }, [isInitialLoadComplete, fetchAllData, backgroundRefresh, setInitialLoadComplete])
    );

    // Refresh function for pull-to-refresh
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchAllData();
        setIsRefreshing(false);
    }, [fetchAllData]);

    // Calendar data fetchers
    const fetchCalendar = useCallback(async (year: number, month?: number, week?: number) => {
        try {
            const result = await getCalendar(year, month, week);
            if (result?.calendar) {
                setCalendarData(result.calendar);
            }
        } catch (error) {
            console.error('Error fetching calendar:', error);
        }
    }, []);

    const fetchCalendarStatsData = useCallback(
        async (year: number, month?: number, week?: number) => {
            try {
                const result = await getCalendarStats(year, month, week);
                if (result) {
                    setCalendarStats(result);
                }
            } catch (error) {
                console.error('Error fetching calendar stats:', error);
            }
        },
        []
    );

    return {
        // Data
        todayStatus,
        activeWorkout,
        recoveryStatus,
        cnsRecovery,
        templates,
        calendarData,
        calendarStats,
        steps,
        recentWorkouts,
        todayWorkoutScore,

        // State
        isLoading,
        isRefreshing,

        // Actions
        refresh,
        fetchCalendar,
        fetchCalendarStats: fetchCalendarStatsData
    };
}

export default useHomeData;
