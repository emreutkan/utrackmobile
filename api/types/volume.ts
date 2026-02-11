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

export type VolumeAnalysisResponse = {
  period: VolumePeriod;
  weeks: WeeklyVolumeData[];
  is_pro: boolean;
  weeks_limit?: number;
};

export type VolumeAnalysisFilters = {
  weeks_back?: number;
  start_date?: string;
  end_date?: string;
};
