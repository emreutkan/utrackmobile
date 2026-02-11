import apiClient from './APIClient';
import type {
  Supplement,
  UserSupplement,
  UserSupplementLog,
  UserSupplementLogTodayResponse,
} from './types/supplements';
import type { PaginatedResponse } from './types/pagination';
import { isPaginatedResponse } from './types/pagination';

export type CreateUserSupplementRequest = {
  supplement_id: number;
  dosage: number;
  frequency: string;
  time_of_day?: string;
};

export type LogUserSupplementRequest = {
  user_supplement_id: number;
  date: string;
  time: string;
  dosage: number;
};

export const getSupplements = async (
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<Supplement> | Supplement[]> => {
  const searchParams: Record<string, number> = {};
  if (page !== undefined) searchParams.page = page;
  if (pageSize !== undefined) searchParams.page_size = pageSize;

  const data = await apiClient.get('/supplements/list/', { searchParams }).json();

  if (Array.isArray(data)) return data as Supplement[];
  if (isPaginatedResponse<Supplement>(data)) return data;
  const d = data as { results?: Supplement[]; next?: string | null; previous?: string | null };
  return {
    count: d.results?.length ?? 0,
    next: d.next ?? null,
    previous: d.previous ?? null,
    results: d.results ?? [],
  };
};

export const getUserSupplements = async (
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<UserSupplement> | UserSupplement[]> => {
  const searchParams: Record<string, number> = {};
  if (page !== undefined) searchParams.page = page;
  if (pageSize !== undefined) searchParams.page_size = pageSize;

  const data = await apiClient.get('/supplements/user/list/', { searchParams }).json();

  if (Array.isArray(data)) return data as UserSupplement[];
  if (isPaginatedResponse<UserSupplement>(data)) return data;
  const d = data as {
    results?: UserSupplement[];
    next?: string | null;
    previous?: string | null;
  };
  return {
    count: d.results?.length ?? 0,
    next: d.next ?? null,
    previous: d.previous ?? null,
    results: d.results ?? [],
  };
};

export const addUserSupplement = async (
  data: CreateUserSupplementRequest
): Promise<UserSupplement> => {
  return apiClient.post('/supplements/user/add/', { json: data }).json();
};

export const logUserSupplement = async (
  data: LogUserSupplementRequest
): Promise<UserSupplementLog> => {
  return apiClient.post('/supplements/user/log/add/', { json: data }).json();
};

export const getSupplementLogs = async (
  userSupplementId: number
): Promise<UserSupplementLog[]> => {
  const data = await apiClient
    .get('/supplements/user/log/list/', {
      searchParams: { user_supplement_id: userSupplementId },
    })
    .json();
  return Array.isArray(data) ? data : (data as { results?: UserSupplementLog[] }).results ?? [];
};

export const deleteSupplementLog = async (logId: number): Promise<void> => {
  await apiClient.delete(`/supplements/user/log/delete/${logId}/`);
};

export const getTodayLogs = async (): Promise<UserSupplementLogTodayResponse> => {
  return apiClient.get('/supplements/user/log/today/').json();
};
