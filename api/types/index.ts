// Main types index - re-export all types for backward compatibility
export * from './account';
export * from './measurements';
export * from './supplements';
export * from './auth';

export * from './workout';
export * from './pagination';
export * from './volume';

export const CREATE_CALENDAR_URL = `workout/calendar/create/`;
export const GET_CALENDAR_URL = `workout/calendar/`;
export const GET_CALENDAR_STATS_URL = `workout/calendar/stats/`;
export const LOGIN_URL = `user/login/`;
export const REGISTER_URL = `user/register/`;
export const CHECK_EMAIL_URL = `user/check-email/`;
export const CHECK_PASSWORD_URL = `user/check-password/`;
export const CHECK_NAME_URL = `user/check-name/`;
export const REQUEST_PASSWORD_RESET_URL = `user/request-password-reset/`;
export const RESET_PASSWORD_URL = `user/reset-password/`;
export const REFRESH_TOKEN_URL = `user/refresh/`;

export const CREATE_TEMPLATE_WORKOUT_URL = `workout/template/create/`;
export const GET_TEMPLATE_WORKOUTS_URL = `workout/template/`;
export const GET_TEMPLATE_WORKOUT_URL = `workout/template/:id/`;
export const CREATE_PAST_WORKOUT_URL = `workout/past/create/`;
export const GET_PAST_WORKOUTS_URL = `workout/past/`;
export const GET_PAST_WORKOUT_URL = `workout/past/:id/`;
export const CREATE_REST_TIMER_URL = `workout/rest-timer/create/`;
export const GET_REST_TIMER_URL = `workout/rest-timer/:id/`;
export const ME_URL = `user/me/`;
export const HEIGHT_URL = `user/height/`;
export const CHANGE_PASSWORD_URL = `user/change-password/`;
export const GENDER_URL = `user/gender/`;
export const WEIGHT_URL = `user/weight/`;
export const WEIGHT_HISTORY_URL = `user/weight/history/`;
export const DELETE_WEIGHT_URL = `user/weight/delete/`;
export const EXPORT_DATA_URL = `user/export-data/`;
export const CREATE_WORKOUT_URL = `workout/create/`;
export const GET_ACTIVE_WORKOUT_URL = `workout/active/`;
export const GET_WORKOUTS_URL = `workout/list/`;
export const GET_WORKOUT_URL = `workout/list/:id/`;
export const ADD_EXERCISE_TO_WORKOUT_URL = `workout/:id/add_exercise/`;
export const COMPLETE_WORKOUT_URL = `workout/:id/complete/`;
export const UPDATE_WORKOUT_URL = `workout/:id/update/`;
export const DELETE_WORKOUT_URL = `workout/:id/delete/`;
export const WORKOUT_SUMMARY_URL = `workout/:id/summary/`;
export const UPDATE_EXERCISE_ORDER_URL = `workout/:id/update_order/`;
export const ADD_SET_URL = `workout/exercise/:workout_exercise_id/add_set/`;
export const UPDATE_SET_URL = `workout/set/:set_id/update/`;
export const DELETE_SET_URL = `workout/set/:set_id/delete/`;
export const DELETE_WORKOUT_EXERCISE_URL = `workout/exercise/:workout_exercise_id/delete/`;
export const REST_TIMER_URL = `workout/active/rest-timer/`;
export const REST_TIMER_STOP_URL = `workout/active/rest-timer/stop/`;
export const REST_TIMER_RESUME_URL = `workout/active/rest-timer/resume/`;
export const CALENDAR_URL = `workout/calendar/`;
export const CALENDAR_STATS_URL = `workout/calendar/stats/`;
export const AVAILABLE_YEARS_URL = `workout/years/`;

export const CHECK_TODAY_URL = `workout/check-today/`;
export const RECOVERY_STATUS_URL = `workout/recovery/status/`;

export const TEMPLATE_CREATE_URL = `workout/template/create/`;
export const TEMPLATE_LIST_URL = `workout/template/list/`;
export const TEMPLATE_DELETE_URL = `workout/template/delete/:id/`;
export const TEMPLATE_START_URL = `workout/template/start/`;

export const GET_USER_SUPPLEMENTS_URL = `supplements/user/list/`;
export const ADD_USER_SUPPLEMENT_URL = `supplements/user/add/`;
export const LOG_USER_SUPPLEMENT_URL = `supplements/user/log/add/`;
export const GET_USER_SUPPLEMENT_LOGS_URL = `supplements/user/log/list/`;
export const DELETE_USER_SUPPLEMENT_LOG_URL = `supplements/user/log/delete/:id/`;
export const GET_USER_SUPPLEMENT_LOGS_TODAY_URL = `supplements/user/log/today/`;

export const BACKEND_URL = 'http://192.168.1.2:8000/api';
