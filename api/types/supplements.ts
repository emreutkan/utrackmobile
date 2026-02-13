// Supplements Types
export type Supplement = {
  id: number;
  name: string;
  description?: string | null;
  dosage_unit: 'mg' | 'g' | 'mcg' | 'IU' | 'ml' | 'tablet' | 'capsule' | 'scoop' | 'other';
  default_dosage?: number | null;
  bioavailability_score?: string | null;
};

export type GetUserSupplementsRequest = {
  page?: number;
  pageSize?: number;
};

export type UserSupplement = {
  supplement_details: {
    id: number;
    name: string;
    description: string;
    dosage_unit: string;
    default_dosage: number;
    bioavailability_score: string;
  };
  dosage: number;
  frequency: 'daily' | 'weekly' | 'custom';
  time_of_day: string;
  is_active: boolean;
};

export type PaginatedUserSupplementsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserSupplement[];
};

export type UserSupplementLog = {
  id: number;
  user_supplement_id: number;
  user_supplement?: UserSupplement;
  date: string;
  time: string;
  dosage: number;
};

export type UserSupplementLogTodayResponse = {
  date: string;
  logs: UserSupplementLog[];
  count: number;
};
