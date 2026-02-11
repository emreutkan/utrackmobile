export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

export const isPaginatedResponse = <T>(data: unknown): data is PaginatedResponse<T> => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'count' in data &&
    'next' in data &&
    'previous' in data &&
    'results' in data &&
    Array.isArray((data as PaginatedResponse<unknown>).results)
  );
};

export const extractResults = <T>(data: T[] | PaginatedResponse<T>): T[] => {
  if (isPaginatedResponse<T>(data)) {
    return data.results;
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [];
};
