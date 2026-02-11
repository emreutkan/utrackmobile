// Achievements & Personal Records Types
export type AchievementCategory =
  | 'workout_count'
  | 'workout_streak'
  | 'pr_weight'
  | 'pr_one_rep_max'
  | 'total_volume'
  | 'exercise_count'
  | 'muscle_volume'
  | 'consistency';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  category_display: string;
  rarity: AchievementRarity;
  rarity_display: string;
  requirement_value: number;
  exercise: string | null;
  exercise_name: string | null;
  muscle_group: string | null;
  points: number;
  is_hidden: boolean;
  order: number;
};

export type UserAchievement = {
  achievement: Achievement;
  is_earned: boolean;
  current_progress: number;
  progress_percentage: number;
  earned_at: string | null;
  earned_value: number | null;
};

export type AchievementCategoryStats = {
  code: AchievementCategory;
  name: string;
  total: number;
  earned: number;
  progress_percentage: number;
};

export type UnnotifiedAchievement = UserAchievement & {
  message: string;
};

export type PersonalRecord = {
  id: string;
  exercise_id: string;
  exercise_name: string;
  best_weight: number;
  best_weight_reps: number;
  best_weight_date: string | null;
  best_one_rep_max: number;
  best_one_rep_max_weight: number;
  best_one_rep_max_reps: number;
  best_one_rep_max_date: string | null;
  best_set_volume: number;
  best_set_volume_date: string | null;
  total_volume: number;
  total_sets: number;
  total_reps: number;
  created_at: string;
  updated_at: string;
};

const ACHIEVEMENTS_URL = '/achievements/list/';
const EARNED_ACHIEVEMENTS_URL = '/achievements/earned/';
const ACHIEVEMENT_CATEGORIES_URL = '/achievements/categories/';
const UNNOTIFIED_ACHIEVEMENTS_URL = '/achievements/unnotified/';
const MARK_ACHIEVEMENTS_SEEN_URL = '/achievements/unnotified/mark-seen/';
const PERSONAL_RECORDS_URL = '/achievements/prs/';
const EXERCISE_PR_URL = '/achievements/prs/';
const USER_STATISTICS_URL = '/achievements/stats/';
const RECALCULATE_STATS_URL = '/achievements/recalculate/';
const RANKING_URL = '/achievements/ranking/';
const RANKINGS_URL = '/achievements/rankings/';
const LEADERBOARD_URL = '/achievements/leaderboard/';

export {
  ACHIEVEMENTS_URL,
  EARNED_ACHIEVEMENTS_URL,
  ACHIEVEMENT_CATEGORIES_URL,
  UNNOTIFIED_ACHIEVEMENTS_URL,
  MARK_ACHIEVEMENTS_SEEN_URL,
  PERSONAL_RECORDS_URL,
  EXERCISE_PR_URL,
  USER_STATISTICS_URL,
  RECALCULATE_STATS_URL,
  RANKING_URL,
  RANKINGS_URL,
  LEADERBOARD_URL,
};
