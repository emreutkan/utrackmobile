export type CalendarDay = {
  date: string;
  day: number;
  weekday: number;
  has_workout: boolean;
  is_rest_day: boolean;
  workout_count: number;
  rest_day_count: number;
};

export type CalendarPeriod = {
  year: number;
  month: number | null;
  week: number | null;
  start_date: string;
  end_date: string;
};

export type CalendarResponse = {
  calendar: CalendarDay[];
  period: CalendarPeriod;
};

export type CalendarStats = {
  total_workouts: number;
  total_rest_days: number;
  days_not_worked: number;
  total_days: number;
  period: CalendarPeriod;
};

export type AvailableYearsResponse = {
  years: number[];
};

export const CREATE_CALENDAR_URL = `/workout/calendar/create/`;
export const GET_CALENDAR_URL = `/workout/calendar/`;
export const GET_CALENDAR_STATS_URL = `/workout/calendar/stats/`;
