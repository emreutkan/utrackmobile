export type CheckEmailResponse = {
  is_valid: boolean;
  errors: string[];
  user_exists: boolean;
  security_threats: string[];
  normalized_email?: string;
};

export type CheckPasswordResponse = {
  is_valid: boolean;
  errors: string[];
  security_threats: string[];
  strength_score: number;
  strength_level: 'weak' | 'medium' | 'strong';
};

export type CheckNameResponse = {
  is_valid: boolean;
  errors: string[];
  security_threats: string[];
};

// Login
export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
};

// Register
export type RegisterRequest = {
  email: string;
  password: string;
  gender?: 'male' | 'female';
  height?: number | null;
};

export type User = {
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
};

export type RegisterResponse = {
  user: User;
  refresh: string;
  access: string;
};

// Refresh
export type RefreshRequest = {
  refresh: string;
};

export type RefreshResponse = {
  access: string;
  refresh?: string;
};

// Me
export type MeResponse = User;

// Change password
export type ChangePasswordRequest = {
  old_password: string;
  new_password: string;
};

export type ChangePasswordResponse = {
  message: string;
};

// Password reset
export type RequestPasswordResetRequest = {
  email: string;
};

export type RequestPasswordResetResponse = {
  message: string;
};

export type ResetPasswordRequest = {
  uid: string;
  token: string;
  new_password: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export type CheckEmailRequest = {
  email: string;
};

export type CheckPasswordRequest = {
  password: string;
};

export type CheckNameRequest = {
  name: string;
};

export const LOGIN_URL = `/user/login/`;
export const REGISTER_URL = `/user/register/`;
export const CHECK_EMAIL_URL = `/user/check-email/`;
export const CHECK_PASSWORD_URL = `/user/check-password/`;
export const CHECK_NAME_URL = `/user/check-name/`;
export const REQUEST_PASSWORD_RESET_URL = `/user/request-password-reset/`;
export const RESET_PASSWORD_URL = `/user/reset-password/`;
