import apiClient from './APIClient';
import type { BodyMeasurement } from './types';
import { isPaginatedResponse, type PaginatedResponse } from './types/pagination';

export const getMeasurements = async (
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<BodyMeasurement> | BodyMeasurement[]> => {
  const searchParams: Record<string, number> = {};
  if (page !== undefined) searchParams.page = page;
  if (pageSize !== undefined) searchParams.page_size = pageSize;

  const data = await apiClient.get('/measurements/', { searchParams }).json();

  if (Array.isArray(data)) return data as BodyMeasurement[];
  if (isPaginatedResponse<BodyMeasurement>(data)) return data;
  const d = data as { results?: BodyMeasurement[]; next?: string | null; previous?: string | null };
  return {
    count: d.results?.length ?? 0,
    next: d.next ?? null,
    previous: d.previous ?? null,
    results: d.results ?? [],
  };
};
