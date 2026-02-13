import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccount,
  updateHeight,
  updateGender,
  updateWeight,
  getWeightHistory,
  deleteWeightEntry,
  changePassword,
  exportUserData,
} from '@/api/account';

// User profile queries
export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: getAccount,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useInvalidateUser = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['user'] });
};

export const useClearUser = () => {
  const queryClient = useQueryClient();
  return () => queryClient.removeQueries({ queryKey: ['user'] });
};

// Update height mutation
export const useUpdateHeight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (height: number) => updateHeight(height),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// Update gender mutation
export const useUpdateGender = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gender: 'male' | 'female') => updateGender(gender),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// Update weight mutation
export const useUpdateWeight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weight: number) => updateWeight(weight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['weight-history'] });
    },
  });
};

// Weight history query
export const useWeightHistory = (page: number = 1, pageSize: number = 100) => {
  return useQuery({
    queryKey: ['weight-history', page, pageSize],
    queryFn: () => getWeightHistory(page, pageSize),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Delete weight entry mutation
export const useDeleteWeightEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ weightId, deleteBodyfat }: { weightId: number; deleteBodyfat?: boolean }) =>
      deleteWeightEntry(weightId, deleteBodyfat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-history'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// P password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      changePassword(oldPassword, newPassword),
  });
};

// Export user data mutation
export const useExportUserData = () => {
  return useMutation({
    mutationFn: exportUserData,
  });
};
