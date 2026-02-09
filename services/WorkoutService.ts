import { SetService } from './SetService';
import { TimerService } from './TimerService';

export interface WorkoutExercise {
    id: number;
    exercise: {
        id: number;
        name: string;
        category?: string;
        primary_muscles?: string[];
    };
    sets: Array<{
        id: number;
        weight?: number;
        reps?: number;
        reps_in_reserve?: number;
        rest_time_before_set?: number;
        total_tut?: number;
        is_warmup?: boolean;
    }>;
}

export interface Workout {
    id: number;
    name?: string;
    created_at: string;
    completed_at?: string;
    exercises: WorkoutExercise[];
    duration?: number;
    total_volume?: number;
}

export interface CanCompleteResult {
    valid: boolean;
    reason?: string;
}

/**
 * WorkoutService - Centralized workout business logic
 * Handles workout calculations, validation, and formatting
 */
export const WorkoutService = {
    /**
     * Calculate total volume for a workout
     * @param workout - Workout object with exercises and sets
     * @returns Total volume (sum of weight × reps for all sets)
     */
    calculateVolume(workout: Workout | null | undefined): number {
        if (!workout?.exercises) return 0;

        return workout.exercises.reduce((total, exercise) => {
            const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
                // Skip warmup sets in volume calculation
                if (set.is_warmup) return setTotal;
                return setTotal + SetService.calculateVolume(set.weight || 0, set.reps || 0);
            }, 0);
            return total + exerciseVolume;
        }, 0);
    },

    /**
     * Calculate total sets count (excluding warmups)
     * @param workout - Workout object
     * @returns Number of working sets
     */
    calculateTotalSets(workout: Workout | null | undefined): number {
        if (!workout?.exercises) return 0;

        return workout.exercises.reduce((total, exercise) => {
            const workingSets = exercise.sets.filter(s => !s.is_warmup).length;
            return total + workingSets;
        }, 0);
    },

    /**
     * Calculate total exercises count
     * @param workout - Workout object
     * @returns Number of exercises
     */
    calculateExerciseCount(workout: Workout | null | undefined): number {
        return workout?.exercises?.length || 0;
    },

    /**
     * Get all unique target muscles from a workout
     * @param workout - Workout object
     * @returns Array of unique muscle names
     */
    getTargetMuscles(workout: Workout | null | undefined): string[] {
        if (!workout?.exercises) return [];

        const muscles = new Set<string>();
        workout.exercises.forEach(exercise => {
            exercise.exercise.primary_muscles?.forEach(muscle => {
                muscles.add(muscle);
            });
        });

        return Array.from(muscles);
    },

    /**
     * Format workout duration
     * @param workout - Workout object
     * @returns Formatted duration string
     */
    formatDuration(workout: Workout | null | undefined): string {
        if (!workout) return '0m';

        // If workout has stored duration, use that
        if (workout.duration) {
            return TimerService.formatDuration(workout.duration);
        }

        // Otherwise calculate from timestamps
        if (workout.created_at) {
            const endTime = workout.completed_at
                ? new Date(workout.completed_at)
                : new Date();
            const startTime = new Date(workout.created_at);
            const seconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
            return TimerService.formatDuration(seconds);
        }

        return '0m';
    },

    /**
     * Get workout duration in seconds
     * @param workout - Workout object
     * @returns Duration in seconds
     */
    getDurationSeconds(workout: Workout | null | undefined): number {
        if (!workout) return 0;

        if (workout.duration) {
            return workout.duration;
        }

        if (workout.created_at) {
            const endTime = workout.completed_at
                ? new Date(workout.completed_at)
                : new Date();
            const startTime = new Date(workout.created_at);
            return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        }

        return 0;
    },

    /**
     * Check if a workout can be completed
     * @param workout - Workout object
     * @returns Result with valid flag and optional reason
     */
    canCompleteWorkout(workout: Workout | null | undefined): CanCompleteResult {
        if (!workout) {
            return { valid: false, reason: 'No workout found' };
        }

        if (!workout.exercises || workout.exercises.length === 0) {
            return { valid: false, reason: 'Add at least one exercise before completing' };
        }

        // Check if at least one exercise has sets
        const hasAnySets = workout.exercises.some(
            exercise => exercise.sets && exercise.sets.length > 0
        );

        if (!hasAnySets) {
            return { valid: false, reason: 'Complete at least one set before finishing' };
        }

        return { valid: true };
    },

    /**
     * Get workout intensity estimate based on average RIR
     * @param workout - Workout object
     * @returns Intensity level
     */
    getIntensity(workout: Workout | null | undefined): 'low' | 'medium' | 'high' {
        if (!workout?.exercises) return 'medium';

        let totalRIR = 0;
        let setCount = 0;

        workout.exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
                if (set.reps_in_reserve !== undefined && set.reps_in_reserve !== null && !set.is_warmup) {
                    totalRIR += set.reps_in_reserve;
                    setCount++;
                }
            });
        });

        if (setCount === 0) return 'medium';

        const avgRIR = totalRIR / setCount;

        if (avgRIR <= 1) return 'high';
        if (avgRIR <= 2) return 'medium';
        return 'low';
    },

    /**
     * Calculate workout score/rating
     * @param workout - Workout object
     * @returns Score 0-100
     */
    calculateScore(workout: Workout | null | undefined): number {
        if (!workout?.exercises) return 0;

        let score = 0;

        // Base points for completing workout
        score += 20;

        // Points per exercise (max 30 points)
        const exercisePoints = Math.min(workout.exercises.length * 6, 30);
        score += exercisePoints;

        // Points for total sets (max 30 points)
        const totalSets = this.calculateTotalSets(workout);
        const setPoints = Math.min(totalSets * 3, 30);
        score += setPoints;

        // Points for duration (max 20 points)
        const durationMinutes = this.getDurationSeconds(workout) / 60;
        const durationPoints = Math.min(durationMinutes / 3, 20);
        score += durationPoints;

        return Math.min(Math.round(score), 100);
    },

    /**
     * Get a summary string for the workout
     * @param workout - Workout object
     * @returns Summary string like "4 exercises • 16 sets • 12,500 kg"
     */
    getSummary(workout: Workout | null | undefined): string {
        if (!workout) return 'No workout data';

        const exercises = this.calculateExerciseCount(workout);
        const sets = this.calculateTotalSets(workout);
        const volume = this.calculateVolume(workout);

        const parts = [];
        parts.push(`${exercises} exercise${exercises !== 1 ? 's' : ''}`);
        parts.push(`${sets} set${sets !== 1 ? 's' : ''}`);

        if (volume > 0) {
            const formattedVolume = volume >= 1000
                ? `${(volume / 1000).toFixed(1)}k`
                : volume.toString();
            parts.push(`${formattedVolume} kg`);
        }

        return parts.join(' • ');
    },

    /**
     * Check if workout is currently active (not completed)
     * @param workout - Workout object
     * @returns Boolean indicating if workout is active
     */
    isActive(workout: Workout | null | undefined): boolean {
        if (!workout) return false;
        return !workout.completed_at;
    }
};

export default WorkoutService;
