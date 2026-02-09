// Workout Types
import type { WorkoutExercise } from './exercise';

export interface CreateWorkoutRequest {
  title?: string;
  date?: string; // Optional - ISO datetime string like "2025-12-09T01:05:00.000Z"
  is_done?: boolean; // Optional - defaults to false, set to true for past workouts
  is_rest_day?: boolean; // Optional - defaults to false, set to true for rest days
}

export interface CreateWorkoutResponse {
  id: number;
  title: string;
  // Note: CreateWorkoutSerializer only returns id and title
  // Other fields come from GetWorkoutSerializer
}

export interface Workout {
  id: number;
  title: string;
  datetime: string; // When the workout actually happened
  created_at: string; // When the record was created
  updated_at: string;
  duration: number; // time in SECONDS (backend uses PositiveIntegerField)
  intensity: 'low' | 'medium' | 'high' | ''; // Backend uses lowercase only, can be empty string
  notes?: string | null;
  is_done: boolean;
  is_rest_day?: boolean; // Optional - true if this is a rest day
  exercises: WorkoutExercise[];
  total_volume?: number; // Total volume in kg (weight × reps for all sets)
  primary_muscles_worked?: string[]; // Array of primary muscles targeted
  secondary_muscles_worked?: string[]; // Array of secondary muscles targeted
  calories_burned?: string | number; // Calories burned during the workout
  muscle_recovery_pre_workout?: Record<string, number>; // {muscle_group: recovery_percentage}
  cns_load?: number; // CNS load score for this workout
}

export interface GetWorkoutsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Workout[];
}

export interface UpdateWorkoutRequest {
  title?: string;
  date?: string; // ISO datetime string
  duration?: number; // seconds
  intensity?: 'low' | 'medium' | 'high';
  notes?: string;
  is_done?: boolean;
}

export interface AddExerciseToWorkoutRequest {
  exercise_id: number;
}

export interface CompleteWorkoutRequest {
  duration?: number; // seconds
  intensity?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface UpdateExerciseOrderRequest {
  exercise_orders: {
    id: number; // WorkoutExercise ID
    order: number;
  }[];
}

export interface TotalWorkoutsPerformedResponse {
  total_workouts: number;
  average_workouts_per_week: number;
  workouts_this_year: number;
  projected_workouts_this_year: number;
}

export interface CheckTodayResponse {
  workout_performed: boolean;
  active_workout?: boolean;
  is_rest?: boolean;
  date?: string;
  message?: string;
  workout?: Workout;
}
