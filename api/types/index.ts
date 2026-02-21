// Main types index - re-export all types for backward compatibility
export * from './account';
export * from './measurements';
// export * from './supplements'; // Supplements feature disabled

export * from './workout';
export * from './pagination';
export * from './volume';
export * from './chat';

export const CREATE_CALENDAR_URL = `workout/calendar/create/`;
export const GET_CALENDAR_URL = `workout/calendar/`;
export const GET_CALENDAR_STATS_URL = `workout/calendar/stats/`;

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
export const DELETE_ACCOUNT_URL = `user/me/delete/`;
export const CHANGE_EMAIL_URL = `user/me/`;
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
export const USER_STATS_URL = `workout/user-stats/`;
export const VOLUME_ANALYSIS_URL = `workout/volume-analysis/`;
export const OVERLOAD_TREND_URL = `workout/exercise/:exercise_id/overload-trend/`;
export const SUGGEST_EXERCISE_URL = `workout/active/suggest-exercise/`;
export const OPTIMIZATION_CHECK_URL = `workout/exercise/:workout_exercise_id/optimization-check/`;

export const TEMPLATE_CREATE_URL = `workout/template/create/`;
export const TEMPLATE_LIST_URL = `workout/template/list/`;
export const TEMPLATE_DELETE_URL = `workout/template/delete/:id/`;
export const TEMPLATE_START_URL = `workout/template/start/`;

// Chat API endpoints
export const GET_CHAT_SESSIONS_URL = `chat/session/`;
export const CREATE_CHAT_SESSION_URL = `chat/session/`;
export const GET_CHAT_SESSION_URL = `chat/session/:id/`;
export const DELETE_CHAT_SESSION_URL = `chat/session/:id/`;
export const SEND_CHAT_MESSAGE_URL = `chat/session/:id/message/`;

// Supplements API endpoints - disabled
// export const GET_USER_SUPPLEMENTS_URL = `supplements/user/list/`;
// export const ADD_USER_SUPPLEMENT_URL = `supplements/user/add/`;
// export const LOG_USER_SUPPLEMENT_URL = `supplements/user/log/add/`;
// export const GET_USER_SUPPLEMENT_LOGS_URL = `supplements/user/log/list/`;
// export const DELETE_USER_SUPPLEMENT_LOG_URL = `supplements/user/log/delete/:id/`;
// export const GET_USER_SUPPLEMENT_LOGS_TODAY_URL = `supplements/user/log/today/`;

export const BACKEND_URL = 'http://192.168.1.2:8000/api';
// export const BACKEND_URL = 'http://api.utrack.irfanemreutkan.com/api';
