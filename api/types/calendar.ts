export interface CalendarDay {
  date: string; // ISO date string "2025-12-18"
  day: number; // Day of month (1-31)
  weekday: number; // Day of week (0=Sunday, 6=Saturday)
  has_workout: boolean;
  is_rest_day: boolean;
  workout_count: number;
  rest_day_count: number;
}

export interface CalendarPeriod {
  year: number;
  month: number | null;
  week: number | null;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
}

export interface CalendarResponse {
  calendar: CalendarDay[];
  period: CalendarPeriod;
}

export interface CalendarStats {
  total_workouts: number;
  total_rest_days: number;
  days_not_worked: number;
  total_days: number;
  period: CalendarPeriod;
}

export interface AvailableYearsResponse {
  years: number[];
}
export const CREATE_CALENDAR_URL = `/workout/calendar/create/`;
export const GET_CALENDAR_URL = `/workout/calendar/`;
export const GET_CALENDAR_STATS_URL = `/workout/calendar/stats/`;
