import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  getSupplements,
  getUserSupplements,
  addUserSupplement,
  logUserSupplement,
  getSupplementLogs,
  deleteSupplementLog,
  getTodayLogs,
  type CreateUserSupplementRequest,
  type LogUserSupplementRequest,
} from '@/api/Supplements';

// Available supplements query
export const useSupplements = (page: number = 1, pageSize: number = 50) => {
  return useQuery({
    queryKey: ['supplements', page, pageSize],
    queryFn: () => getSupplements(page, pageSize),
    staleTime: 1000 * 60 * 10, // 10 minutes - supplements don't change often
  });
};

// Infinite scroll for available supplements
export const useInfiniteSupplements = (pageSize: number = 50) => {
  return useInfiniteQuery({
    queryKey: ['supplements-infinite'],
    queryFn: ({ pageParam = 1 }) => getSupplements(pageParam, pageSize),
    getNextPageParam: (lastPage) => {
      if (lastPage && typeof lastPage === 'object' && 'next' in lastPage && lastPage.next) {
        const url = new URL(lastPage.next as string);
        const page = url.searchParams.get('page');
        return page ? parseInt(page) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 10,
  });
};

// User supplements query

// Infinite scroll for user supplements
export const useInfiniteUserSupplements = (page: number, pageSize: number) => {
  return useInfiniteQuery({
    queryKey: ['user-supplements-infinite'],
    queryFn: () => getUserSupplements({ page, pageSize }),
    getNextPageParam: (lastPage) => {
      if (lastPage && typeof lastPage === 'object' && 'next' in lastPage && lastPage.next) {
        const url = new URL(lastPage.next as string);
        const page = url.searchParams.get('page');
        return page ? parseInt(page) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2,
  });
};

// Today's supplement logs query
export const useTodaySupplementLogs = () => {
  return useQuery({
    queryKey: ['supplement-logs-today'],
    queryFn: getTodayLogs,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Supplement logs for a specific user supplement
export const useSupplementLogs = (userSupplementId: number | null) => {
  return useQuery({
    queryKey: ['supplement-logs', userSupplementId],
    queryFn: () => getSupplementLogs(userSupplementId!),
    enabled: userSupplementId !== null,
    staleTime: 1000 * 60, // 1 minute
  });
};

// Add user supplement mutation
export const useAddUserSupplement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserSupplementRequest) => addUserSupplement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-supplements'] });
      queryClient.invalidateQueries({ queryKey: ['user-supplements-infinite'] });
    },
  });
};

// Log supplement mutation
export const useLogSupplement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LogUserSupplementRequest) => logUserSupplement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplement-logs-today'] });
      queryClient.invalidateQueries({ queryKey: ['supplement-logs'] });
    },
  });
};

// Delete supplement log mutation
export const useDeleteSupplementLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (logId: number) => deleteSupplementLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplement-logs-today'] });
      queryClient.invalidateQueries({ queryKey: ['supplement-logs'] });
    },
  });
};

// Utility hooks
export const useInvalidateSupplements = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['user-supplements'] });
    queryClient.invalidateQueries({ queryKey: ['user-supplements-infinite'] });
    queryClient.invalidateQueries({ queryKey: ['supplement-logs-today'] });
  };
};
