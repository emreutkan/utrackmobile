// Use your computer's local IP for phone access (192.168.1.9)
// Change back to 127.0.0.1 for emulator/simulator
const LOCAL_IP = '192.168.1.15';
export const API_URL = `http://${LOCAL_IP}:8000/api`;
export const BASE_URL = `http://${LOCAL_IP}:8000`; // Added base URL without /api

export const LOGIN_URL = `${API_URL}/user/login/`;
export const REGISTER_URL = `${API_URL}/user/register/`;
export const GOOGLE_LOGIN_URL = `${BASE_URL}/auth/google/`; // Pointing to root/auth/google/
export const APPLE_LOGIN_URL = `${BASE_URL}/auth/apple/`;
export const REFRESH_URL = `${API_URL}/user/token/refresh/`;
export const CREATE_WORKOUT_URL = `${API_URL}/workout/create/`;
