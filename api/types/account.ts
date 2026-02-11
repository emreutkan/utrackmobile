export const ME_URL = '/user/me/';
export const HEIGHT_URL = '/user/height/';
export const CHANGE_PASSWORD_URL = '/user/change-password/';
export const GENDER_URL = '/user/gender/';
export const WEIGHT_URL = '/user/weight/';
export const WEIGHT_HISTORY_URL = '/user/weight/history/';
export const DELETE_WEIGHT_URL = '/user/weight/';
export const EXPORT_DATA_URL = '/user/export-data/';
export interface GetAccountResponse {
  id: string;
  email: string;
  is_verified: boolean;
  gender: string;
  height: number | null;
  weight: number | null;
  created_at: string;
  is_pro: boolean; // Has PRO access (paid or trial)
  is_paid_pro: boolean; // Has paid PRO subscription
  is_trial: boolean; // Has active trial
  pro_days_remaining: number | null; // Days left on paid subscription
  trial_days_remaining: number | null; // Days left on trial
  pro_until: string | null; // Paid subscription expiration date (ISO datetime)
  trial_until: string | null; // Trial expiration date (ISO datetime)
  subscription_id: string | null;
}

export interface ExportDataResponse {
  download_url: string;
  expires_at?: string;
  message?: string;
}
export interface UserStatistics {
  total_workouts: number;
  total_workout_duration: number;
  total_volume: number;
  total_sets: number;
  total_reps: number;
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
  total_achievements: number;
  total_points: number;
  total_prs: number;
  prs_this_month: number;
}

export interface PROErrorResponse {
  error: 'PRO feature';
  message: string;
  is_pro: false;
  upgrade_url: string;
}
