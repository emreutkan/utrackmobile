export interface CheckEmailResponse {
  is_valid: boolean;
  errors: string[];
  user_exists: boolean;
  security_threats: string[];
  normalized_email?: string;
}

export interface CheckPasswordResponse {
  is_valid: boolean;
  errors: string[];
  security_threats: string[];
  strength_score: number;
  strength_level: 'weak' | 'medium' | 'strong';
}

export interface CheckNameResponse {
  is_valid: boolean;
  errors: string[];
  security_threats: string[];
}

// Login
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

// Register
export interface RegisterRequest {
  email: string;
  password: string;
  gender?: 'male' | 'female';
  height?: number | null;
}
export interface User {
  id: string;
  email: string;
  is_verified: boolean;
  gender: string;
  height: number | null;
  weight: number | null;
  created_at: string;
  is_pro: boolean;
  is_paid_pro: boolean;
  is_trial: boolean;
  pro_days_remaining: number | null;
  trial_days_remaining: number | null;
  pro_until: string | null;
  trial_until: string | null;
}
export interface RegisterResponse {
  user: User;
  refresh: string;
  access: string;
}

// Refresh
export interface RefreshRequest {
  refresh: string;
}
export interface RefreshResponse {
  access: string;
  refresh?: string;
}

// Me
export type MeResponse = User;

// Change password
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}
export interface ChangePasswordResponse {
  message: string;
}

// Password reset
export interface RequestPasswordResetRequest {
  email: string;
}
export interface RequestPasswordResetResponse {
  message: string;
}
export interface ResetPasswordRequest {
  uid: string;
  token: string;
  new_password: string;
}
export interface ResetPasswordResponse {
  message: string;
}
export interface CheckEmailRequest {
  email: string;
}

export interface CheckPasswordRequest {
  password: string;
}

export interface CheckNameRequest {
  name: string;
}

export const LOGIN_URL = `/user/login/`;
export const REGISTER_URL = `/user/register/`;
export const CHECK_EMAIL_URL = `/user/check-email/`;
export const CHECK_PASSWORD_URL = `/user/check-password/`;
export const CHECK_NAME_URL = `/user/check-name/`;
export const REQUEST_PASSWORD_RESET_URL = `/user/request-password-reset/`;
export const RESET_PASSWORD_URL = `/user/reset-password/`;
