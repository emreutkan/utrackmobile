import apiClient from './APIClient';
import {
  UserAchievement,
  AchievementCategoryStats,
  UnnotifiedAchievement,
  PersonalRecord,
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
} from './types/achievements';
import { PaginatedResponse } from './types/pagination';
import { UserStatistics } from './types/account';
import { ExerciseRanking, ExerciseLeaderboard } from './types/exercise';

export const getAchievements = async (
  category?: string,
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<UserAchievement> | UserAchievement[]> => {
  const searchParams: Record<string, string> = {};
  if (category) searchParams.category = category;
  if (page !== undefined) searchParams.page = page.toString();
  if (pageSize !== undefined) searchParams.page_size = pageSize.toString();

  const response = await apiClient.get(ACHIEVEMENTS_URL, { searchParams });
  return response.json();
};

export const getEarnedAchievements = async (): Promise<UserAchievement[]> => {
  const response = await apiClient.get(EARNED_ACHIEVEMENTS_URL);
  return response.json();
};

export const getAchievementCategories = async (): Promise<AchievementCategoryStats[]> => {
  const response = await apiClient.get(ACHIEVEMENT_CATEGORIES_URL);
  return response.json();
};

export const getUnnotifiedAchievements = async (): Promise<UnnotifiedAchievement[]> => {
  const response = await apiClient.get(UNNOTIFIED_ACHIEVEMENTS_URL);
  return response.json();
};

export const markAchievementsSeen = async (achievementIds?: string[]): Promise<void> => {
  await apiClient.post(MARK_ACHIEVEMENTS_SEEN_URL, {
    json: { achievement_ids: achievementIds },
  });
};

export const getPersonalRecords = async (): Promise<PaginatedResponse<PersonalRecord>> => {
  const response = await apiClient.get(PERSONAL_RECORDS_URL);
  return response.json();
};

export const getExercisePR = async (exerciseId: string | number): Promise<PersonalRecord> => {
  const response = await apiClient.get(`${EXERCISE_PR_URL}${exerciseId}/`);
  return response.json();
};

export const getUserStatistics = async (): Promise<UserStatistics> => {
  const response = await apiClient.get(USER_STATISTICS_URL);
  return response.json();
};

export const forceRecalculateStats = async (): Promise<{
  status: string;
  new_achievements: number;
  stats: UserStatistics;
}> => {
  const response = await apiClient.post(RECALCULATE_STATS_URL);
  return response.json();
};

export const getExerciseRanking = async (exerciseId: string | number): Promise<ExerciseRanking> => {
  const response = await apiClient.get(`${RANKING_URL}${exerciseId}/`);
  return response.json();
};

export const getAllRankings = async (): Promise<ExerciseRanking[]> => {
  const response = await apiClient.get(RANKINGS_URL);
  return response.json();
};

export const getLeaderboard = async (
  exerciseId: string | number,
  limit: number = 10,
  stat: 'weight' | 'one_rm' = 'one_rm'
): Promise<ExerciseLeaderboard> => {
  const searchParams: Record<string, string> = { limit: limit.toString(), stat };
  const response = await apiClient.get(`${LEADERBOARD_URL}${exerciseId}/`, { searchParams });
  return response.json();
};
