import apiClient from './APIClient';
import type { VolumeAnalysisFilters, VolumeAnalysisResponse } from './types';

export const getVolumeAnalysis = async (
  filters?: VolumeAnalysisFilters
): Promise<VolumeAnalysisResponse> => {
  const searchParams: Record<string, string | number> = {};
  if (filters?.weeks_back !== undefined) searchParams.weeks_back = filters.weeks_back;
  if (filters?.start_date) searchParams.start_date = filters.start_date;
  if (filters?.end_date) searchParams.end_date = filters.end_date;

  return apiClient.get('/workout/volume-analysis/', { searchParams }).json();
};
