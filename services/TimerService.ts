// Colors for rest status - extracted to avoid React Native theme import in tests
export const REST_COLORS = {
    resting: '#ff453a',   // red - theme.colors.status.error
    readying: '#ff9f0a',  // orange - theme.colors.status.warning
    ready: '#34d399',     // green - theme.colors.status.success
};

export interface RestStatus {
    text: string;
    color: string;
    subText: string;
    goal: number;
    maxGoal: number;
}

/**
 * TimerService - Centralized timer and rest calculations
 * Consolidates timer logic previously scattered across components
 */
export const TimerService = {
    /**
     * Format elapsed time from a start date to now
     * @param startTime - The start time (Date object or ISO string)
     * @returns Formatted string "HH:MM:SS"
     */
    formatElapsedTime(startTime: Date | string | null): string {
        if (!startTime) return '00:00:00';

        const start = typeof startTime === 'string'
            ? new Date(startTime).getTime()
            : startTime.getTime();

        const now = Date.now();
        const diff = Math.max(0, now - start);

        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const hours = Math.floor(diff / (1000 * 60 * 60));

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * Calculate elapsed seconds from a start time
     * @param startTime - The start time
     * @returns Number of seconds elapsed
     */
    getElapsedSeconds(startTime: Date | string | null): number {
        if (!startTime) return 0;

        const start = typeof startTime === 'string'
            ? new Date(startTime).getTime()
            : startTime.getTime();

        return Math.max(0, Math.floor((Date.now() - start) / 1000));
    },

    /**
     * Format seconds as "M:SS" rest timer display
     * @param seconds - Total seconds
     * @returns Formatted string "M:SS"
     */
    formatRestTime(seconds: number): string {
        if (!seconds || seconds < 0) return '0:00';

        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    },

    /**
     * Format duration in seconds to human-readable format
     * @param seconds - Total seconds
     * @returns Formatted string like "1h 23m" or "45m" or "30s"
     */
    formatDuration(seconds: number): string {
        if (!seconds || seconds < 0) return '0s';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        if (minutes > 0) {
            return `${minutes}m`;
        }
        return `${secs}s`;
    },

    /**
     * Get rest status (traffic light) based on elapsed time and exercise category
     * @param elapsedSeconds - Seconds since last set
     * @param category - Exercise category ('compound' or 'isolation')
     * @returns RestStatus object with text, color, and goals
     */
    getRestStatus(elapsedSeconds: number, category: string = 'isolation'): RestStatus {
        const isCompound = category?.toLowerCase() === 'compound';

        // Thresholds in seconds
        const phase1Limit = isCompound ? 90 : 60;  // Red light limit
        const phase2Limit = isCompound ? 180 : 90; // Yellow light limit

        if (elapsedSeconds < phase1Limit) {
            return {
                text: 'Resting',
                color: REST_COLORS.resting,
                subText: 'Recovery in progress',
                goal: phase1Limit,
                maxGoal: phase2Limit
            };
        } else if (elapsedSeconds < phase2Limit) {
            return {
                text: 'Readying',
                color: REST_COLORS.readying,
                subText: 'ATP level rising',
                goal: phase2Limit,
                maxGoal: phase2Limit
            };
        } else {
            return {
                text: 'Ready',
                color: REST_COLORS.ready,
                subText: '100% capacity',
                goal: phase2Limit,
                maxGoal: phase2Limit
            };
        }
    },

    /**
     * Calculate progress percentage for rest timer
     * @param elapsedSeconds - Seconds elapsed
     * @param maxGoal - Maximum goal in seconds
     * @returns Progress as decimal 0-1
     */
    calculateProgress(elapsedSeconds: number, maxGoal: number): number {
        if (!maxGoal || maxGoal <= 0) return 0;
        return Math.min(elapsedSeconds / maxGoal, 1);
    },

    /**
     * Format goal time for display
     * @param seconds - Goal in seconds
     * @returns Formatted string "M:SS"
     */
    formatGoal(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
};

export default TimerService;
