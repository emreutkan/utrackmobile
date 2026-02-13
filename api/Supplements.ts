import apiClient from './APIClient';
import type {
  Supplement,
  UserSupplement,
  UserSupplementLog,
  UserSupplementLogTodayResponse,
  GetUserSupplementsRequest,
  PaginatedUserSupplementsResponse,
} from './types/supplements';
import type { PaginatedResponse } from './types/pagination';
import { isPaginatedResponse } from './types/pagination';
import {
  ADD_USER_SUPPLEMENT_URL,
  DELETE_USER_SUPPLEMENT_LOG_URL,
  GET_USER_SUPPLEMENT_LOGS_URL,
  GET_USER_SUPPLEMENTS_URL,
  LOG_USER_SUPPLEMENT_URL,
  GET_USER_SUPPLEMENT_LOGS_TODAY_URL,
} from './types/index';

export type CreateUserSupplementRequest = {
  supplement_id: number;
  dosage: number;
  frequency: string;
  time_of_day?: string;
};

export type LogUserSupplementRequest = {
  user_supplement_id: number;
  date?: string;
  time?: string;
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
  params: GetUserSupplementsRequest
): Promise<PaginatedUserSupplementsResponse> => {
  const data = await apiClient
    .get(GET_USER_SUPPLEMENTS_URL, { searchParams: params })
    .json<PaginatedUserSupplementsResponse>();

  return data;
};

export const addUserSupplement = async (
  data: CreateUserSupplementRequest
): Promise<UserSupplement> => {
  return apiClient.post(ADD_USER_SUPPLEMENT_URL, { json: data }).json();
};

export const logUserSupplement = async (
  data: LogUserSupplementRequest
): Promise<UserSupplementLog> => {
  return apiClient.post(LOG_USER_SUPPLEMENT_URL, { json: data }).json();
};

export const getSupplementLogs = async (userSupplementId: number): Promise<UserSupplementLog[]> => {
  const data = await apiClient
    .get(GET_USER_SUPPLEMENT_LOGS_URL, {
      searchParams: { user_supplement_id: userSupplementId },
    })
    .json();
  return Array.isArray(data) ? data : ((data as { results?: UserSupplementLog[] }).results ?? []);
};

export const deleteSupplementLog = async (logId: number): Promise<void> => {
  await apiClient.delete(DELETE_USER_SUPPLEMENT_LOG_URL.replace(':id', logId.toString())).json();
};

export const getTodayLogs = async (): Promise<UserSupplementLogTodayResponse> => {
  return apiClient.get(GET_USER_SUPPLEMENT_LOGS_TODAY_URL).json();
};
