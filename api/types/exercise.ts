// Exercise Types
export type Exercise = {
  id: number;
  name: string;
  description?: string | null;
  instructions?: string | null;
  safety_tips?: string | null;
  image?: string | null;
  video_url?: string | null;
  is_active: boolean;
  primary_muscle: string;
  secondary_muscles?: string[] | null;
  equipment_type: string;
  category: string;
  difficulty_level: string;
};

// Exercise Set Insights Types
export type SetInsight = {
  reason: string;
  current_reps?: number;
  optimal_range?: string;
  current_tut?: number;
  seconds_per_rep?: number;
  set_position?: number;
  total_sets?: number;
  optimal_sets?: string;
};

export type ExerciseSetInsights = {
  good: Record<string, SetInsight>;
  bad: Record<string, SetInsight>;
};

export type WorkoutExercise = {
  id: number;
  workout: number;
  exercise: Exercise;
  order: number;
  sets: WorkoutExerciseSet[];
  one_rep_max?: number | null;
};

export type WorkoutExerciseSet = {
  id: number;
  workout_exercise: number;
  set_number: number;
  reps: number;
  weight: number;
  reps_in_reserve: number;
  rest_time_before_set: number;
  is_warmup: boolean;
  eccentric_time?: number | null;
  concentric_time?: number | null;
  total_tut?: number | null;
  insights?: ExerciseSetInsights | null;
};

export type AddExerciseSetRequest = {
  reps: number;
  weight: number;
  reps_in_reserve: number;
  rest_time_before_set: number;
  is_warmup: boolean;
  eccentric_time?: number | null;
  concentric_time?: number | null;
  total_tut?: number | null;
};

/** Request body for adding a set (optional fields for flexibility) */
export type AddSetRequest = {
  reps: number;
  weight: number;
  rest_time_before_set?: number;
  is_warmup?: boolean;
  reps_in_reserve?: number;
  eccentric_time?: number;
  concentric_time?: number;
  total_tut?: number;
};

export type UpdateExerciseSetRequest = {
  reps?: number;
  weight?: number;
  reps_in_reserve?: number;
  rest_time_before_set?: number;
  is_warmup?: boolean;
  eccentric_time?: number | null;
  concentric_time?: number | null;
  total_tut?: number | null;
};

/** Request body for updating a set */
export type UpdateSetRequest = Partial<UpdateExerciseSetRequest>;

/** Request body for update exercise order */
export type UpdateExerciseOrderRequest = {
  exercise_orders: { id: number; order: number }[];
};

// Exercise API URL constants (relative to api base)
export const EXERCISE_LIST_URL = '/exercise/list/';
export const EXERCISE_ADD_TO_WORKOUT_URL = '/exercise/add/:workout_id/';
export const EXERCISE_1RM_HISTORY_URL = '/workout/exercise/:exercise_id/1rm-history/';
export const EXERCISE_SET_HISTORY_URL = '/workout/exercise/:exercise_id/set-history/';
export const EXERCISE_LAST_WORKOUT_URL = '/workout/exercise/:exercise_id/last-workout/';

// Exercise 1RM History Types
export type Exercise1RMHistoryEntry = {
  workout_id: number;
  workout_title: string;
  workout_date: string;
  one_rep_max: number;
};

export type Exercise1RMHistory = {
  exercise_id: number;
  exercise_name: string;
  total_workouts: number;
  history: Exercise1RMHistoryEntry[];
};

// Exercise Ranking & Leaderboard Types
export type ExerciseRanking = {
  exercise_id: string;
  exercise_name: string;
  user_best_weight: number;
  user_best_one_rm: number;
  weight_percentile: number;
  one_rm_percentile: number;
  total_users: number;
  percentile_message: string;
};

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  display_name: string;
  value: number;
  is_current_user: boolean;
};

export type ExerciseLeaderboard = {
  exercise_id: string;
  exercise_name: string;
  stat_type: 'weight' | 'one_rm';
  leaderboard: LeaderboardEntry[];
  user_entry: LeaderboardEntry | null;
};
