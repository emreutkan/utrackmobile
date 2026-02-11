import apiClient from './APIClient';
import {
  CheckEmailResponse,
  CheckPasswordResponse,
  CheckNameResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  CheckEmailRequest,
  CheckPasswordRequest,
  CheckNameRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  CHECK_EMAIL_URL,
  CHECK_PASSWORD_URL,
  CHECK_NAME_URL,
  REQUEST_PASSWORD_RESET_URL,
  RESET_PASSWORD_URL,
  LOGIN_URL,
  REGISTER_URL,
} from './types/auth';

export const login = async (request: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post(LOGIN_URL, { json: request });
  return response.json();
};

export const register = async (request: RegisterRequest): Promise<RegisterResponse> => {
  const response = await apiClient.post(REGISTER_URL, { json: request });
  return response.json();
};

export const checkEmail = async (request: CheckEmailRequest): Promise<CheckEmailResponse> => {
  const response = await apiClient.post(CHECK_EMAIL_URL, { json: request });
  return response.json();
};

export const checkPassword = async (
  request: CheckPasswordRequest
): Promise<CheckPasswordResponse> => {
  const response = await apiClient.post(CHECK_PASSWORD_URL, { json: request });
  return response.json();
};

export const checkName = async (request: CheckNameRequest): Promise<CheckNameResponse> => {
  const response = await apiClient.post(CHECK_NAME_URL, { json: request });
  return response.json();
};

export const requestPasswordReset = async (
  request: RequestPasswordResetRequest
): Promise<RequestPasswordResetResponse> => {
  const response = await apiClient.post(REQUEST_PASSWORD_RESET_URL, { json: request });
  return response.json();
};

export const resetPassword = async (
  request: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  const response = await apiClient.post(RESET_PASSWORD_URL, { json: request });
  return response.json();
};
