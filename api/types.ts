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
    id: string;
    email: string;
    is_verified: boolean;
    gender: string;
    height: number | null;
    weight: number | null;
    created_at: string;
}

export interface Workout {
    id: number;
    title: string;
    datetime: string; // When the workout actually happened
    created_at: string; // When the record was created
    updated_at: string;
    duration: number; // time in SECONDS (backend uses PositiveIntegerField)
    intensity: "low" | "medium" | "high" | ""; // Backend uses lowercase only, can be empty string
    notes?: string | null;
    is_done: boolean;
    is_rest_day?: boolean; // Optional - true if this is a rest day
    exercises: WorkoutExercise[];
    total_volume?: number; // Total volume in kg (weight × reps for all sets)
    primary_muscles_worked?: string[]; // Array of primary muscles targeted
    secondary_muscles_worked?: string[]; // Array of secondary muscles targeted
    calories_burned?: string | number; // Calories burned during the workout
}

export interface WorkoutExercise {
    id: number;
    workout: number; // workout ID
    exercise: Exercise;
    order: number; // MISSING in your interface!
    sets: WorkoutExerciseSet[];
    one_rep_max?: number | null; // Calculated 1RM (only for completed workouts)
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
    eccentric_time?: number | null; // Time under tension - eccentric phase (seconds)
    concentric_time?: number | null; // Time under tension - concentric phase (seconds)
    total_tut?: number | null; // Total time under tension (seconds)
}

export interface GetWorkoutsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Workout[];
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

// Template Workout Types
export interface CreateTemplateWorkoutRequest {
    title: string;
    exercises: number[]; // Array of exercise IDs
    notes?: string;
}

export interface TemplateWorkoutExercise {
    id: number;
    exercise: Exercise; // Full exercise object
    order: number;
}

export interface TemplateWorkout {
    id: number;
    title: string;
    exercises: TemplateWorkoutExercise[];
    primary_muscle_groups: string[];
    secondary_muscle_groups: string[];
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface StartTemplateWorkoutRequest {
    template_workout_id: number;
}

// Edit Workout Types
export interface UpdateWorkoutRequest {
    title?: string;
    date?: string;  // ISO datetime string
    duration?: number;  // seconds
    intensity?: "low" | "medium" | "high";
    notes?: string;
    is_done?: boolean;
}

export interface AddExerciseToWorkoutRequest {
    exercise_id: number;
}

// Exercise 1RM History Types
export interface Exercise1RMHistoryEntry {
    workout_id: number;
    workout_title: string;
    workout_date: string; // ISO datetime string
    one_rep_max: number;
}

export interface Exercise1RMHistory {
    exercise_id: number;
    exercise_name: string;
    total_workouts: number;
    history: Exercise1RMHistoryEntry[];
}

// Body Measurements Types
export interface BodyMeasurement {
    id: number;
    height: number | string;  // cm
    weight: number | string;  // kg
    waist: number | string;   // cm
    neck: number | string;    // cm
    hips: number | string | null;  // cm (required for women)
    body_fat_percentage: number | string | null;  // Auto-calculated
    gender: "male" | "female";
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateMeasurementRequest {
    height: number;
    weight: number;
    waist: number;
    neck: number;
    hips?: number;  // Required for women
    gender?: "male" | "female";  // Optional - uses user's gender from database if not provided
    notes?: string;
}

export interface CalculateBodyFatMenRequest {
    height: number;
    weight: number;
    waist: number;
    neck: number;
    gender?: "male" | "female";  // Optional - uses user's gender from database if not provided
}

export interface CalculateBodyFatWomenRequest {
    height: number;
    weight: number;
    waist: number;
    neck: number;
    hips: number;
    gender?: "male" | "female";  // Optional - uses user's gender from database if not provided
}

export interface CalculateBodyFatResponse {
    body_fat_percentage: number;
    measurements: {
        height_cm: number;
        weight_kg: number;
        waist_cm: number;
        neck_cm: number;
        hips_cm?: number;  // Only for women
    };
    gender_used: "male" | "female";
    method: string;
}

// Knowledge Base Types
export interface TrainingResearch {
    id: number;
    title: string;
    summary: string;
    content: string;
    category: string;
    tags: string[];
    source_title?: string;
    source_url?: string;
    source_authors: string[];
    publication_date?: string;
    evidence_level?: string;
    confidence_score: number;
    applicable_muscle_groups: string[];
    applicable_exercise_types: string[];
    parameters: Record<string, any>;
    is_active: boolean;
    is_validated: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface ResearchFilters {
    category?: string;
    muscle_group?: string;
    exercise_type?: string;
    tags?: string[];
}

// Volume Analysis Types
export interface MuscleGroupData {
    total_volume: number;
    sets: number;
    workouts: number;
}

export interface WeeklyVolumeData {
    week_start: string; // YYYY-MM-DD
    week_end: string; // YYYY-MM-DD
    muscle_groups: Record<string, MuscleGroupData>;
}

export interface VolumePeriod {
    start_date: string;
    end_date: string;
    total_weeks: number;
}

export interface VolumeAnalysisResponse {
    period: VolumePeriod;
    weeks: WeeklyVolumeData[];
}

export interface VolumeAnalysisFilters {
    weeks_back?: number;
    start_date?: string; // YYYY-MM-DD
    end_date?: string; // YYYY-MM-DD
}

// Weight History Types
export interface WeightHistoryEntry {
    id: number;
    date: string;
    weight: number;
    bodyfat: number | null;
}

export interface WeightHistoryResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: WeightHistoryEntry[];
}

// Calendar Types
export interface CalendarDay {
    date: string; // ISO date string "2025-12-18"
    day: number; // Day of month (1-31)
    weekday: number; // Day of week (0=Sunday, 6=Saturday)
    has_workout: boolean;
    is_rest_day: boolean;
    workout_count: number;
    rest_day_count: number;
}

export interface CalendarPeriod {
    year: number;
    month: number | null;
    week: number | null;
    start_date: string; // ISO date string
    end_date: string; // ISO date string
}

export interface CalendarResponse {
    calendar: CalendarDay[];
    period: CalendarPeriod;
}

export interface CalendarStats {
    total_workouts: number;
    total_rest_days: number;
    days_not_worked: number;
    total_days: number;
    period: CalendarPeriod;
}

export interface AvailableYearsResponse {
    years: number[];
}

// Muscle Recovery Types
export interface MuscleRecovery {
    id: number | null;
    muscle_group: string;
    fatigue_score: number;
    total_sets: number;
    recovery_hours: number;
    recovery_until: string | null;
    is_recovered: boolean;
    hours_until_recovery: number;
    recovery_percentage: number;
    source_workout: number | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface RecoveryStatusResponse {
    recovery_status: Record<string, MuscleRecovery>;
    timestamp: string;
}

// Exercise 1RM History Types
export interface Exercise1RMHistoryEntry {
    workout_id: number;
    workout_title: string;
    workout_date: string; // ISO datetime string
    one_rep_max: number;
}

export interface Exercise1RMHistory {
    exercise_id: number;
    exercise_name: string;
    total_workouts: number;
    history: Exercise1RMHistoryEntry[];
}

// Body Measurements Types
export interface BodyMeasurement {
    id: number;
    height: number | string;  // cm
    weight: number | string;  // kg
    waist: number | string;   // cm
    neck: number | string;    // cm
    hips: number | string | null;  // cm (required for women)
    body_fat_percentage: number | string | null;  // Auto-calculated
    gender: "male" | "female";
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateMeasurementRequest {
    height: number;
    weight: number;
    waist: number;
    neck: number;
    hips?: number;  // Required for women
    gender?: "male" | "female";  // Optional - uses user's gender from database if not provided
    notes?: string;
}

export interface CalculateBodyFatMenRequest {
    height: number;
    weight: number;
    waist: number;
    neck: number;
    gender?: "male" | "female";  // Optional - uses user's gender from database if not provided
}

export interface CalculateBodyFatWomenRequest {
    height: number;
    weight: number;
    waist: number;
    neck: number;
    hips: number;
    gender?: "male" | "female";  // Optional - uses user's gender from database if not provided
}

export interface CalculateBodyFatResponse {
    body_fat_percentage: number;
    measurements: {
        height_cm: number;
        weight_kg: number;
        waist_cm: number;
        neck_cm: number;
        hips_cm?: number;  // Only for women
    };
    gender_used: "male" | "female";
    method: string;
}

// Knowledge Base Types
export interface TrainingResearch {
    id: number;
    title: string;
    summary: string;
    content: string;
    category: string;
    tags: string[];
    source_title?: string;
    source_url?: string;
    source_authors: string[];
    publication_date?: string;
    evidence_level?: string;
    confidence_score: number;
    applicable_muscle_groups: string[];
    applicable_exercise_types: string[];
    parameters: Record<string, any>;
    is_active: boolean;
    is_validated: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface ResearchFilters {
    category?: string;
    muscle_group?: string;
    exercise_type?: string;
    tags?: string[];
}

// Volume Analysis Types
export interface MuscleGroupData {
    total_volume: number;
    sets: number;
    workouts: number;
}

export interface WeeklyVolumeData {
    week_start: string; // YYYY-MM-DD
    week_end: string; // YYYY-MM-DD
    muscle_groups: Record<string, MuscleGroupData>;
}

export interface VolumePeriod {
    start_date: string;
    end_date: string;
    total_weeks: number;
}

export interface VolumeAnalysisResponse {
    period: VolumePeriod;
    weeks: WeeklyVolumeData[];
}

export interface VolumeAnalysisFilters {
    weeks_back?: number;
    start_date?: string; // YYYY-MM-DD
    end_date?: string; // YYYY-MM-DD
}

// Weight History Types
export interface WeightHistoryEntry {
    id: number;
    date: string;
    weight: number;
    bodyfat: number | null;
}

export interface WeightHistoryResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: WeightHistoryEntry[];
}