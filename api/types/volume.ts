// Volume Analysis Types
export type MuscleGroupData = {
  total_volume: number;
  sets: number;
  workouts: number;
};

export type WeeklyVolumeData = {
  week_start: string;
  week_end: string;
  muscle_groups: Record<string, MuscleGroupData>;
};

export type VolumePeriod = {
  start_date: string;
  end_date: string;
  total_weeks: number;
};

// New: per-muscle summary with evidence-based targets
export type MuscleSummary = {
  average_volume_per_week: number;
  max_volume_per_week: number;
  min_volume_per_week: number;
  total_weeks_trained: number;
  total_sets: number;
  total_workouts: number;
  sets_per_week: number;
  target_min: number | null;
  target_max: number | null;
  volume_status: 'optimal' | 'undertrained' | 'overtrained' | 'untrained';
  volume_status_message: string;
};

// New: antagonist pair balance
export type BalancePair = {
  label: string;
  sets_a: number;
  sets_b: number;
  muscle_a: string;
  muscle_b: string;
  ratio: number | null;
  status: 'balanced' | 'imbalanced' | 'no_data';
  message: string;
};

export type VolumeAnalysisResponse = {
  period: VolumePeriod;
  weeks: WeeklyVolumeData[];
  summary?: Record<string, MuscleSummary>;
  balance?: Record<string, BalancePair>;
  is_pro: boolean;
  weeks_limit?: number;
};

export type VolumeAnalysisFilters = {
  weeks_back?: number;
  start_date?: string;
  end_date?: string;
};

// Progressive Overload Trend (PRO only)
export type OverloadDataPoint = {
  date: string;
  one_rep_max: number;
};

export type OverloadTrendResponse = {
  exercise_id: number;
  exercise_name: string;
  trend: 'progressing' | 'stagnating' | 'regressing' | 'insufficient_data';
  data_points: OverloadDataPoint[];
  weeks_analyzed: number;
  change_kg: number | null;
  change_percent: number | null;
  message: string;
};
