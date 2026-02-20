// ============== Exercise (nested in workout) ==============
export type Exercise = {
  id: number;
  name: string;
  description: string | null;
  instructions: string | null;
  safety_tips: string | null;
  image: string | null;
  video_url: string | null;
  is_active: boolean;
  primary_muscle: string | null;
  secondary_muscles: string[] | null;
  equipment_type: string | null;
  category: string;
  difficulty_level: string | null;
};

// ============== Set insights (optional from backend) ==============
export type SetInsightItem = {
  reason: string;
  current_reps?: number;
  current_tut?: number;
  optimal_range?: string;
  seconds_per_rep?: number;
  set_position?: number;
  total_sets?: number;
  optimal_sets?: string;
};

export type SetInsights = {
  good: Record<string, SetInsightItem>;
  bad: Record<string, SetInsightItem>;
};

// ============== Exercise set ==============
export type ExerciseSet = {
  id: number;
  workout_exercise: number;
  set_number: number;
  reps: number;
  weight: number;
  rest_time_before_set: number;
  is_warmup: boolean;
  reps_in_reserve: number;
  eccentric_time: number | null;
  concentric_time: number | null;
  total_tut: number | null;
  insights?: SetInsights | null;
};

// ============== Workout exercise ==============
export type WorkoutExercise = {
  id: number;
  workout: number;
  exercise: Exercise;
  order: number;
  sets: ExerciseSet[];
  one_rep_max: number | null;
};

// ============== Workout ==============
export type Workout = {
  id: number;
  title: string;
  datetime: string;
  created_at: string;
  updated_at: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high' | '';
  notes: string | null;
  is_done: boolean;
  is_rest_day: boolean;
  calories_burned: number | string | null;
  exercises: WorkoutExercise[];
  total_volume: number;
  primary_muscles_worked: string[];
  secondary_muscles_worked: string[];
  muscle_recovery_pre_workout: Record<string, number>;
  cns_load: number;
};

// ============== Create workout ==============
export type CreateWorkoutRequest = {
  title?: string;
  workout_date?: string;
  date?: string;
  is_done?: boolean;
  is_rest_day?: boolean;
};

export type CreateWorkoutResponse = {
  id: number;
  title: string;
};

// ============== List workouts (paginated) ==============
export type GetWorkoutsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Workout[];
};

// ============== Update workout ==============
export type UpdateWorkoutRequest = {
  title?: string;
  date?: string;
  duration?: number;
  intensity?: 'low' | 'medium' | 'high';
  notes?: string;
  is_done?: boolean;
};

// ============== Add exercise to workout ==============
export type AddExerciseToWorkoutRequest = {
  exercise_id: number;
};

// ============== Complete workout ==============
export type CompleteWorkoutRequest = {
  duration?: number;
  intensity?: 'low' | 'medium' | 'high';
  notes?: string;
};

export type CompleteWorkoutResponse = Workout;

// ============== Update exercise order ==============
export type UpdateExerciseOrderRequest = {
  exercise_orders: { id: number; order: number }[];
};

// ============== Check today ==============
export type CheckTodayResponse = {
  date: string;
  status: 'none' | 'active' | 'rest_day' | 'completed';
  active_workout: Workout | null;
  completed_workout: (Workout & { is_rest_day?: boolean }) | null;
};

// ============== Rest timer ==============
export type RestTimerStateResponse = {
  last_set_timestamp: string | null;
  last_exercise_category: string | null;
  elapsed_seconds: number;
  is_paused: boolean;
  rest_status?: Record<string, unknown>;
};

export type RestTimerStopResponse = RestTimerStateResponse & {
  message: string;
};

// ============== Calendar ==============
export type CalendarDay = {
  date: string;
  day: number;
  weekday: number;
  has_workout: boolean;
  is_rest_day: boolean;
  workout_count: number;
  rest_day_count: number;
};

export type CalendarResponse = {
  calendar: CalendarDay[];
  period: {
    year: number;
    month: number | null;
    week: number | null;
    start_date: string;
    end_date: string;
  };
};

export type AvailableYearsResponse = {
  years: number[];
};

export type CalendarStats = {
  total_workouts: number;
  total_rest_days: number;
  days_not_worked: number;
  total_days: number;
  period: {
    year: number;
    month: number | null;
    week: number | null;
    start_date: string;
    end_date: string;
  };
};

// ============== Template workout ==============
export type TemplateWorkoutExercise = {
  id: number;
  exercise: Exercise;
  order: number;
};

export type TemplateWorkout = {
  id: number;
  title: string;
  exercises: TemplateWorkoutExercise[];
  primary_muscle_groups: string[];
  secondary_muscle_groups: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTemplateWorkoutRequest = {
  title: string;
  exercises: number[];
  notes?: string | null;
};

export type StartTemplateWorkoutRequest = {
  template_workout_id: number;
};

export type CreateTemplateWorkoutResponse = TemplateWorkout;
export type StartTemplateWorkoutResponse = Workout;

// ============== Workout summary ==============
export type WorkoutSummaryInsight = {
  type: 'recovery' | '1rm';
  message: string;
  pre_recovery?: number | null;
  current_1rm?: number;
  previous_1rm?: number | null;
  difference?: number | null;
  percent_change?: number | null;
};

export type WorkoutSummaryResponse = {
  workout_id: number;
  score: number;
  positives: Record<string, WorkoutSummaryInsight>;
  negatives: Record<string, WorkoutSummaryInsight>;
  neutrals: Record<string, WorkoutSummaryInsight>;
  summary: {
    total_positives: number;
    total_negatives: number;
    total_neutrals: number;
    muscles_worked: string[];
    exercises_performed: number;
  };
  is_pro: boolean;
  has_advanced_insights: boolean;
};

// ============== Recovery status ==============
export type MuscleRecoveryItem = {
  id: number | null;
  muscle_group: string;
  fatigue_score: number;
  total_sets: number;
  recovery_hours: number;
  recovery_until: string | null;
  is_recovered: boolean;
  source_workout: number | null;
  hours_until_recovery: number;
  recovery_percentage: number;
  created_at: string | null;
  updated_at: string | null;
};

export type CNSRecoveryItem = {
  id: number | null;
  cns_load: number;
  recovery_hours: number;
  recovery_until: string | null;
  is_recovered: boolean;
  source_workout: number | null;
  hours_until_recovery: number;
  recovery_percentage: number;
  created_at: string | null;
  updated_at: string | null;
};

export type RecoveryStatusResponse = {
  recovery_status: Record<string, MuscleRecoveryItem>;
  cns_recovery: CNSRecoveryItem | null;
  is_pro: boolean;
  timestamp: string;
};

export type UserStats = {
  streak: {
    current: number;
    longest: number;
  };
  sessions: {
    total: number;
    this_week: number;
    this_month: number;
  };
  volume_kg: {
    total: number;
    this_week: number;
    this_month: number;
  };
  time: {
    total_minutes: number;
    avg_per_session_minutes: number;
  };
  calories: {
    total: number;
    this_week: number;
    this_month: number;
  };
  consistency: {
    active_days_last_30: number;
    avg_sessions_per_week: number;
  };
};
