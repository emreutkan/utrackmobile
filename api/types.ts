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

export interface GetAccountResponse {
    id: number;
    email: string;
    is_verified: boolean;
    created_at: string;
}

export interface Workout {
    id: number;
    title: string;
    datetime: string; // When the workout actually happened
    created_at: string; // When the record was created
    updated_at: string;
    duration: number; // time in SECONDS (backend uses PositiveIntegerField)
    intensity: "low" | "medium" | "high"; // Backend uses lowercase only
    notes?: string | null;
    is_done: boolean;
    is_rest_day?: boolean; // Optional - true if this is a rest day
    exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
    id: number;
    workout: number; // workout ID
    exercise: Exercise;
    order: number; // MISSING in your interface!
    sets: WorkoutExerciseSet[];
}

export interface WorkoutExerciseSet {
    id: number;
    workout_exercise: number; // workout_exercise ID (may not be needed in frontend)
    set_number: number; // MISSING in your interface!
    reps: number;
    weight: number; // DecimalField, comes as string or number
    reps_in_reserve: number;
    rest_time_before_set: number;
    is_warmup: boolean;
}

export interface GetWorkoutsResponse {
    workouts: Workout[];
}

export interface Exercise {
    id: number;
    name: string;
    description?: string | null;
    instructions?: string | null;
    safety_tips?: string | null;
    image?: string | null; // URL string
    video_url?: string | null;
    is_active: boolean;
    primary_muscle: string; // You had "muscle_group" - wrong field name!
    secondary_muscles?: string[] | null; // JSON array
    equipment_type: string;
    category: string; // Correct
    difficulty_level: string; // MISSING in your interface!
}