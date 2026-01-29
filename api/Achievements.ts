import apiClient from './APIClient';
import { 
    UserAchievement, 
    AchievementCategoryStats, 
    UnnotifiedAchievement, 
    PersonalRecord, 
    UserStatistics, 
    ExerciseRanking, 
    ExerciseLeaderboard 
} from './types';
import { PaginatedResponse, extractResults, isPaginatedResponse } from './types/pagination';

/**
 * ACHIEVEMENT ENDPOINTS
 */

export const getAchievements = async (category?: string, page?: number, pageSize?: number): Promise<PaginatedResponse<UserAchievement> | UserAchievement[]> => {
    try {
        const params: any = {};
        if (category) params.category = category;
        if (page !== undefined) params.page = page;
        if (pageSize !== undefined) params.page_size = pageSize;
        
        const response = await apiClient.get('/achievements/list/', { params });
        const data = response.data;
        
        // Handle backward compatibility: if response is array, return as-is
        if (Array.isArray(data)) {
            return data;
        }
        
        // If paginated, return paginated response
        if (isPaginatedResponse<UserAchievement>(data)) {
            return data;
        }
        
        // Fallback: wrap in paginated format
        return {
            count: data.results?.length || 0,
            next: data.next || null,
            previous: data.previous || null,
            results: data.results || []
        };
    } catch (error) {
        console.error('Failed to get achievements:', error);
        return [];
    }
};

export const getEarnedAchievements = async (): Promise<UserAchievement[]> => {
    try {
        const response = await apiClient.get('/achievements/earned/');
        return response.data;
    } catch (error) {
        console.error('Failed to get earned achievements:', error);
        return [];
    }
};

export const getAchievementCategories = async (): Promise<AchievementCategoryStats[]> => {
    try {
        const response = await apiClient.get('/achievements/categories/');
        return response.data;
    } catch (error) {
        console.error('Failed to get achievement categories:', error);
        return [];
    }
};

export const getUnnotifiedAchievements = async (): Promise<UnnotifiedAchievement[]> => {
    try {
        const response = await apiClient.get('/achievements/unnotified/');
        return response.data;
    } catch (error) {
        console.error('Failed to get unnotified achievements:', error);
        return [];
    }
};

export const markAchievementsSeen = async (achievementIds?: string[]): Promise<void> => {
    try {
        await apiClient.post('/achievements/unnotified/mark-seen/', {
            achievement_ids: achievementIds
        });
    } catch (error) {
        console.error('Failed to mark achievements as seen:', error);
    }
};

/**
 * PERSONAL RECORD ENDPOINTS
 */

export const getPersonalRecords = async (): Promise<any[]> => {
    try {
        const response = await apiClient.get('/achievements/prs/');
        return response.data;
    } catch (error) {
        console.error('Failed to get personal records:', error);
        return [];
    }
};

export const getExercisePR = async (exerciseId: string | number): Promise<PersonalRecord | null> => {
    try {
        const response = await apiClient.get(`/achievements/prs/${exerciseId}/`);
        return response.data;
    } catch (error) {
        console.error(`Failed to get PR for exercise ${exerciseId}:`, error);
        return null;
    }
};

/**
 * STATISTICS ENDPOINTS
 */

export const getUserStatistics = async (): Promise<UserStatistics | null> => {
    try {
        const response = await apiClient.get('/achievements/stats/');
        return response.data;
    } catch (error) {
        console.error('Failed to get user statistics:', error);
        return null;
    }
};

export const forceRecalculateStats = async (): Promise<{ status: string, new_achievements: number, stats: UserStatistics } | null> => {
    try {
        const response = await apiClient.post('/achievements/recalculate/');
        return response.data;
    } catch (error) {
        console.error('Failed to recalculate stats:', error);
        return null;
    }
};

/**
 * RANKING & LEADERBOARD ENDPOINTS
 */

export const getExerciseRanking = async (exerciseId: string | number): Promise<ExerciseRanking | null> => {
    try {
        const response = await apiClient.get(`/achievements/ranking/${exerciseId}/`);
        return response.data;
    } catch (error) {
        console.error(`Failed to get ranking for exercise ${exerciseId}:`, error);
        return null;
    }
};

export const getAllRankings = async (): Promise<ExerciseRanking[]> => {
    try {
        const response = await apiClient.get('/achievements/rankings/');
        return response.data;
    } catch (error) {
        console.error('Failed to get all rankings:', error);
        return [];
    }
};

export const getLeaderboard = async (
    exerciseId: string | number, 
    limit: number = 10, 
    stat: 'weight' | 'one_rm' = 'one_rm'
): Promise<ExerciseLeaderboard | null> => {
    try {
        const response = await apiClient.get(`/achievements/leaderboard/${exerciseId}/`, {
            params: { limit, stat }
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to get leaderboard for exercise ${exerciseId}:`, error);
        return null;
    }
};
