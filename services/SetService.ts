export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface SetData {
    weight?: number | string;
    reps?: number | string;
    reps_in_reserve?: number | string;
    rest_time_before_set?: number | string;
    total_tut?: number | string;
    is_warmup?: boolean;
}

/**
 * SetService - Centralized set validation, formatting, and calculations
 * Consolidates logic previously in ExerciseCardUtils and scattered components
 */
export const SetService = {
    /**
     * Validate set data against business rules
     * @param data - Set data to validate
     * @returns ValidationResult with isValid flag and error messages
     */
    validateSetData(data: SetData): ValidationResult {
        const errors: string[] = [];

        if (data.reps !== undefined && data.reps !== null && data.reps !== '') {
            const reps = typeof data.reps === 'string' ? parseInt(data.reps) : data.reps;
            if (isNaN(reps) || reps < 1 || reps > 100) {
                errors.push('Reps must be between 1 and 100');
            }
        }

        if (data.reps_in_reserve !== undefined && data.reps_in_reserve !== null && data.reps_in_reserve !== '') {
            const rir = typeof data.reps_in_reserve === 'string' ? parseInt(data.reps_in_reserve) : data.reps_in_reserve;
            if (isNaN(rir) || rir < 0 || rir > 100) {
                errors.push('RIR must be between 0 and 100');
            }
        }

        if (data.rest_time_before_set !== undefined && data.rest_time_before_set !== null && data.rest_time_before_set !== '') {
            const restTime = typeof data.rest_time_before_set === 'string' ? parseInt(data.rest_time_before_set) : data.rest_time_before_set;
            if (isNaN(restTime) || restTime < 0 || restTime > 10800) {
                errors.push('Rest time cannot exceed 3 hours');
            }
        }

        if (data.total_tut !== undefined && data.total_tut !== null && data.total_tut !== '') {
            const tut = typeof data.total_tut === 'string' ? parseInt(data.total_tut) : data.total_tut;
            if (isNaN(tut) || tut < 0 || tut > 600) {
                errors.push('Time under tension cannot exceed 10 minutes');
            }
        }

        if (data.weight !== undefined && data.weight !== null && data.weight !== '') {
            const weight = typeof data.weight === 'string' ? parseFloat(data.weight) : data.weight;
            if (isNaN(weight) || weight < 0) {
                errors.push('Weight cannot be negative');
            }
        }

        return { isValid: errors.length === 0, errors };
    },

    /**
     * Format weight for display
     * @param weight - Weight value
     * @returns Formatted weight string
     */
    formatWeight(weight: number | string | null | undefined): string {
        if (weight === null || weight === undefined || weight === '') return '-';

        const w = typeof weight === 'string' ? parseFloat(weight) : weight;
        if (isNaN(w)) return '-';

        // Remove trailing zeros and unnecessary decimal point
        if (Math.abs(w % 1) < 0.0000001) {
            return Math.round(w).toString();
        }
        return parseFloat(w.toFixed(2)).toString();
    },

    /**
     * Parse rest time input - handles both seconds and minute notation
     * If input contains ".", treat as minutes (X.YY), else as seconds
     * @param input - User input string
     * @returns Time in seconds
     */
    parseRestTimeInput(input: string): number {
        if (!input || input.trim() === '') return 0;

        if (input.includes('.')) {
            // Treat as minutes: X.YY -> convert to seconds
            const minutes = parseFloat(input);
            if (isNaN(minutes)) return 0;
            return Math.round(minutes * 60);
        } else {
            // Treat as seconds
            const seconds = parseInt(input);
            return isNaN(seconds) ? 0 : seconds;
        }
    },

    /**
     * Format rest time for display (shows as X.YY for minutes or just number for seconds)
     * @param seconds - Time in seconds
     * @returns Formatted string
     */
    formatRestTimeForDisplay(seconds: number | null | undefined): string {
        if (!seconds) return '';
        if (seconds < 60) return `${seconds}`;

        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return s > 0 ? `${m}.${s.toString().padStart(2, '0')}` : `${m}`;
    },

    /**
     * Format rest time for input field (same as display)
     * @param seconds - Time in seconds
     * @returns Formatted string for input
     */
    formatRestTimeForInput(seconds: number | null | undefined): string {
        return this.formatRestTimeForDisplay(seconds);
    },

    /**
     * Calculate estimated 1RM using Brzycki formula
     * @param weight - Weight lifted
     * @param reps - Number of reps
     * @returns Estimated 1RM
     */
    calculate1RM(weight: number, reps: number): number {
        if (!weight || weight <= 0 || !reps || reps <= 0) return 0;
        if (reps === 1) return weight;

        // Brzycki formula: 1RM = weight × (36 / (37 - reps))
        // Valid for reps <= 12 typically, but we'll allow higher
        if (reps >= 37) return weight; // Avoid division by zero/negative

        return weight * (36 / (37 - reps));
    },

    /**
     * Calculate volume for a set (weight × reps)
     * @param weight - Weight lifted
     * @param reps - Number of reps
     * @returns Volume
     */
    calculateVolume(weight: number, reps: number): number {
        if (!weight || !reps) return 0;
        return weight * reps;
    },

    /**
     * Calculate total volume for multiple sets
     * @param sets - Array of sets with weight and reps
     * @returns Total volume
     */
    calculateTotalVolume(sets: Array<{ weight?: number; reps?: number }>): number {
        return sets.reduce((total, set) => {
            return total + this.calculateVolume(set.weight || 0, set.reps || 0);
        }, 0);
    },

    /**
     * Format TUT (time under tension) for display
     * @param seconds - TUT in seconds
     * @returns Formatted string "Xs" or "M:SS"
     */
    formatTUT(seconds: number | null | undefined): string {
        if (!seconds) return '-';
        if (seconds < 60) return `${seconds}s`;

        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
};

export default SetService;
