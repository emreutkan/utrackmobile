export interface CreateWorkoutRequest {
    title: string;
}

export interface CreateWorkoutResponse {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    duration: number;
    intensity: "low" | "medium" | "high" | "Low" | "Medium" | "High";
    notes?: string;
    is_done: boolean;
}

export interface getAccountResponse {
    id: number;
    email: string;
    is_verified: boolean;
    created_at: string;
}

export interface Exercise {
    id: number;
    name: string;
    description?: string;
    instructions?: string;
    safety_tips?: string;
    image?: string;
    video_url?: string;
    is_active: boolean;
    primary_muscle?: string;
    secondary_muscles?: string;
    equipment_type?: string;
    category?: string;
    difficulty_level?: string;
}

export interface WorkoutExercise {
    id: number;
    exercise: Exercise;
    // Add other fields like sets, reps, weight if your backend provides them
}

export interface Workout {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    duration: number; // time in seconds
    intensity: "low" | "medium" | "high" | "Low" | "Medium" | "High";
    notes?: string;
    is_done: boolean;
    exercises?: WorkoutExercise[];
}

export interface GetWorkoutsResponse {
    workouts: Workout[];
}