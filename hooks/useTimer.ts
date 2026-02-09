import { useCallback, useEffect, useRef, useState } from 'react';
import { TimerService } from '@/services/TimerService';

export interface UseTimerResult {
    /** Formatted elapsed time "HH:MM:SS" */
    elapsedTime: string;
    /** Elapsed time in seconds */
    elapsedSeconds: number;
    /** Whether the timer is currently running */
    isRunning: boolean;
    /** Start or restart the timer with optional start time */
    start: (startTime?: Date | string) => void;
    /** Stop the timer */
    stop: () => void;
    /** Reset the timer to initial state */
    reset: () => void;
}

/**
 * Custom hook for managing elapsed time tracking
 * Consolidates timer logic previously scattered across Home and ActiveWorkout screens
 *
 * @param initialStartTime - Optional initial start time (Date object or ISO string)
 * @returns Timer state and control functions
 *
 * @example
 * ```tsx
 * // Basic usage with initial time
 * const { elapsedTime, elapsedSeconds, isRunning } = useTimer(workout?.created_at);
 *
 * // Manual control
 * const { elapsedTime, start, stop, reset } = useTimer();
 * start(new Date()); // Start with current time
 * stop(); // Pause
 * reset(); // Clear
 * ```
 */
export function useTimer(initialStartTime?: Date | string | null): UseTimerResult {
    const [startTime, setStartTime] = useState<Date | null>(() => {
        if (!initialStartTime) return null;
        return typeof initialStartTime === 'string'
            ? new Date(initialStartTime)
            : initialStartTime;
    });

    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(!!initialStartTime);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Clear interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Update when initialStartTime changes (e.g., when workout loads)
    useEffect(() => {
        if (initialStartTime) {
            const newStartTime = typeof initialStartTime === 'string'
                ? new Date(initialStartTime)
                : initialStartTime;
            setStartTime(newStartTime);
            setIsRunning(true);
        } else {
            setStartTime(null);
            setIsRunning(false);
            setElapsedTime('00:00:00');
            setElapsedSeconds(0);
        }
    }, [initialStartTime]);

    // Timer interval effect
    useEffect(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!isRunning || !startTime) {
            return;
        }

        const updateTimer = () => {
            const formatted = TimerService.formatElapsedTime(startTime);
            const seconds = TimerService.getElapsedSeconds(startTime);
            setElapsedTime(formatted);
            setElapsedSeconds(seconds);
        };

        // Initial update
        updateTimer();

        // Set up interval
        intervalRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, startTime]);

    const start = useCallback((newStartTime?: Date | string) => {
        const time = newStartTime
            ? (typeof newStartTime === 'string' ? new Date(newStartTime) : newStartTime)
            : new Date();
        setStartTime(time);
        setIsRunning(true);
    }, []);

    const stop = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback(() => {
        setIsRunning(false);
        setStartTime(null);
        setElapsedTime('00:00:00');
        setElapsedSeconds(0);
    }, []);

    return {
        elapsedTime,
        elapsedSeconds,
        isRunning,
        start,
        stop,
        reset
    };
}

export default useTimer;
