// Workout Summary Types
export type WorkoutSummaryInsight = {
  type: 'recovery' | '1rm';
  message: string;
  pre_recovery?: number;
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
