export interface CreateWorkoutRequest {
    title: string;
}

export interface CreateWorkoutResponse {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface getAccountResponse {
    id: number;
    email: string;
    is_verified: boolean;
    created_at: string;
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
}

export interface GetWorkoutsResponse {
    workouts: Workout[];
}