import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '@/api/Auth';
import { LoginRequest, LoginResponse } from '@/api/types/auth';
import { storeAccessToken, storeRefreshToken } from './Storage';

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
    onSuccess: async (data: LoginResponse) => {
      // Await token storage to ensure they're saved before proceeding
      await storeAccessToken(data.access);
      await storeRefreshToken(data.refresh);

      // Invalidate user query to trigger refetch with new tokens
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
