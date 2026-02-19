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
  deleteAccount,
  changeEmail,
} from '@/api/account';

// User profile queries
export const useUser = (options?: { enabled: boolean }) => {
  return useQuery({
    queryKey: ['user'],
    queryFn: getAccount,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true, // ✅ Respect the enabled option
    retry: false, // Avoid 3 retries on 401 → each retry would hit 401 again and clearTokens again
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

// Delete account mutation
export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: (password?: string) => deleteAccount(password),
  });
};

// Change email mutation
export const useChangeEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newEmail: string) => changeEmail(newEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
