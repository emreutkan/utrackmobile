// Body Measurements Types
export interface BodyMeasurement {
    id: number;
    height: number | string;  // cm
    weight: number | string;  // kg
    waist: number | string;   // cm
    neck: number | string;    // cm
    hips: number | string | null;  // cm (required for women)
    body_fat_percentage: number | string | null;  // Auto-calculated
    gender: "male" | "female";
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

// Weight History Types
export interface WeightHistoryEntry {
    id: number;
    date: string;
    weight: number;
    bodyfat: number | null;
}

export interface WeightHistoryResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: WeightHistoryEntry[];
}
