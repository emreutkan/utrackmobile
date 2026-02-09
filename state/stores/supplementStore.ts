import {
    addUserSupplement,
    CreateUserSupplementRequest,
    deleteSupplementLog,
    getSupplementLogs,
    getSupplements,
    getTodayLogs,
    getUserSupplements,
    logUserSupplement,
    Supplement,
    SupplementLog,
    UserSupplement
} from '@/api/Supplements';
import { extractResults, isPaginatedResponse } from '@/api/types/pagination';
import { create } from 'zustand';

export interface SupplementState {
    userSupplements: UserSupplement[];
    availableSupplements: Supplement[];
    todayLogsMap: Map<number, boolean>;
    viewingLogs: SupplementLog[];
    isLoading: boolean;
    isLoadingLogs: boolean;

    // Pagination state
    userSupplementsPage: number;
    userSupplementsHasMore: boolean;
    userSupplementsCount: number;
    availableSupplementsPage: number;
    availableSupplementsHasMore: boolean;
    availableSupplementsCount: number;

    // Actions
    fetchData: (page?: number, pageSize?: number) => Promise<void>;
    loadMoreUserSupplements: (pageSize?: number) => Promise<void>;
    loadMoreAvailableSupplements: (pageSize?: number) => Promise<void>;
    logSupplement: (item: UserSupplement) => Promise<{ success: boolean; error?: string }>;
    addSupplement: (data: CreateUserSupplementRequest) => Promise<{ success: boolean; error?: string; details?: any }>;
    fetchLogs: (userSupplementId: number) => Promise<void>;
    deleteLog: (logId: number) => Promise<void>;
    clearSupplements: () => void;
}

/**
 * Supplement store - manages supplement data and operations
 * Handles user supplements, available supplements, and logging
 */
export const useSupplementStore = create<SupplementState>((set, get) => ({
    userSupplements: [],
    availableSupplements: [],
    todayLogsMap: new Map(),
    viewingLogs: [],
    isLoading: false,
    isLoadingLogs: false,
    userSupplementsPage: 1,
    userSupplementsHasMore: false,
    userSupplementsCount: 0,
    availableSupplementsPage: 1,
    availableSupplementsHasMore: false,
    availableSupplementsCount: 0,

    fetchData: async (page: number = 1, pageSize: number = 50) => {
        set({ isLoading: true });
        try {
            const [userData, allData, todayData] = await Promise.all([
                getUserSupplements(page, pageSize),
                getSupplements(page, pageSize),
                getTodayLogs()
            ]);

            // Extract results from paginated or non-paginated responses
            const userResults = extractResults(userData);
            const availableResults = extractResults(allData);

            // Extract pagination info if available
            const userPagination = isPaginatedResponse(userData) ? {
                page: page,
                hasMore: !!userData.next,
                count: userData.count
            } : { page: 1, hasMore: false, count: userResults.length };

            const availablePagination = isPaginatedResponse(allData) ? {
                page: page,
                hasMore: !!allData.next,
                count: allData.count
            } : { page: 1, hasMore: false, count: availableResults.length };

            const logMap = new Map<number, boolean>();
            if (todayData?.logs) {
                todayData.logs.forEach(log => {
                    if (log.user_supplement_details?.id) {
                        logMap.set(log.user_supplement_details.id, true);
                    }
                });
            }

            set({
                userSupplements: userResults,
                availableSupplements: availableResults,
                todayLogsMap: logMap,
                userSupplementsPage: userPagination.page,
                userSupplementsHasMore: userPagination.hasMore,
                userSupplementsCount: userPagination.count,
                availableSupplementsPage: availablePagination.page,
                availableSupplementsHasMore: availablePagination.hasMore,
                availableSupplementsCount: availablePagination.count,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch supplements:', error);
            set({ isLoading: false });
        }
    },

    loadMoreUserSupplements: async (pageSize: number = 50) => {
        const { userSupplementsPage, userSupplementsHasMore, userSupplements } = get();
        if (!userSupplementsHasMore) return;

        const nextPage = userSupplementsPage + 1;
        try {
            const userData = await getUserSupplements(nextPage, pageSize);
            const newResults = extractResults(userData);

            const pagination = isPaginatedResponse(userData) ? {
                hasMore: !!userData.next,
                count: userData.count
            } : { hasMore: false, count: userSupplements.length + newResults.length };

            set({
                userSupplements: [...userSupplements, ...newResults],
                userSupplementsPage: nextPage,
                userSupplementsHasMore: pagination.hasMore,
                userSupplementsCount: pagination.count
            });
        } catch (error) {
            console.error('Failed to load more user supplements:', error);
        }
    },

    loadMoreAvailableSupplements: async (pageSize: number = 50) => {
        const { availableSupplementsPage, availableSupplementsHasMore, availableSupplements } = get();
        if (!availableSupplementsHasMore) return;

        const nextPage = availableSupplementsPage + 1;
        try {
            const allData = await getSupplements(nextPage, pageSize);
            const newResults = extractResults(allData);

            const pagination = isPaginatedResponse(allData) ? {
                hasMore: !!allData.next,
                count: allData.count
            } : { hasMore: false, count: availableSupplements.length + newResults.length };

            set({
                availableSupplements: [...availableSupplements, ...newResults],
                availableSupplementsPage: nextPage,
                availableSupplementsHasMore: pagination.hasMore,
                availableSupplementsCount: pagination.count
            });
        } catch (error) {
            console.error('Failed to load more available supplements:', error);
        }
    },

    logSupplement: async (item: UserSupplement): Promise<{ success: boolean; error?: string }> => {
        const now = new Date();
        const result = await logUserSupplement({
            user_supplement_id: item.id,
            date: now.toISOString().split('T')[0],
            time: `${now.getHours()}:${now.getMinutes()}:00`,
            dosage: item.dosage
        });
        if (result && 'error' in result) {
            return { success: false, error: result.error };
        }
        if (result) {
            await get().fetchData();
            return { success: true };
        }
        return { success: false, error: 'Failed to log supplement' };
    },

    addSupplement: async (data: CreateUserSupplementRequest): Promise<{ success: boolean; error?: string; details?: any }> => {
        const result = await addUserSupplement(data);
        if (result && 'error' in result) {
            return { success: false, error: result.error, details: result.details };
        }
        if (result) {
            await get().fetchData();
            return { success: true };
        }
        return { success: false, error: 'Failed to add supplement' };
    },

    fetchLogs: async (userSupplementId: number) => {
        set({ isLoadingLogs: true });
        try {
            const logs = await getSupplementLogs(userSupplementId);
            set({ viewingLogs: logs, isLoadingLogs: false });
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            set({ isLoadingLogs: false });
        }
    },

    deleteLog: async (logId: number) => {
        await deleteSupplementLog(logId);
        const { viewingLogs } = get();
        const log = viewingLogs.find(l => l.id === logId);
        if (log) {
            await get().fetchLogs(log.user_supplement_id);
        }
        await get().fetchData();
    },

    clearSupplements: () => set({
        userSupplements: [],
        availableSupplements: [],
        todayLogsMap: new Map(),
        viewingLogs: []
    }),
}));

export default useSupplementStore;
