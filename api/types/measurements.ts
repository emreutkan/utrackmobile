// Body Measurements Types
export type BodyMeasurement = {
  id: number;
  height: number | string;
  weight: number | string;
  waist: number | string;
  neck: number | string;
  hips: number | string | null;
  body_fat_percentage: number | string | null;
  gender: 'male' | 'female';
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

// Weight History Types
export type WeightHistoryEntry = {
  id: number;
  date: string;
  weight: number;
  bodyfat: number | null;
};

export type WeightHistoryResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: WeightHistoryEntry[];
};
