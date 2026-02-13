import apiClient from './APIClient';
import {
  GetAccountResponse,
  WeightHistoryResponse,
  ExportDataResponse,
  ME_URL,
  HEIGHT_URL,
  CHANGE_PASSWORD_URL,
  GENDER_URL,
  WEIGHT_URL,
  WEIGHT_HISTORY_URL,
  DELETE_WEIGHT_URL,
  EXPORT_DATA_URL,
} from './types';

export const getAccount = async (): Promise<GetAccountResponse> => {
  const response = await apiClient.get(ME_URL).json<GetAccountResponse>();
  return response;
};
export const updateHeight = async (
  height: number
): Promise<{ height: string; message: string }> => {
  const response = await apiClient.post(HEIGHT_URL, { json: { height } });
  return response.json();
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  const response = await apiClient.post(CHANGE_PASSWORD_URL, {
    json: {
      old_password: oldPassword,
      new_password: newPassword,
    },
  });
  return response.json();
};

export const updateGender = async (
  gender: 'male' | 'female'
): Promise<{ gender: string; message: string }> => {
  const response = await apiClient.post(GENDER_URL, { json: { gender } });
  return response.json();
};

export const updateWeight = async (
  weight: number
): Promise<{ weight: number; message: string }> => {
  const response = await apiClient.post(WEIGHT_URL, { json: { weight } });
  return response.json();
};

export const getWeightHistory = async (
  page: number = 1,
  pageSize: number = 100
): Promise<WeightHistoryResponse> => {
  const params: any = {
    page,
    page_size: pageSize,
  };
  const response = await apiClient.get(WEIGHT_HISTORY_URL, { searchParams: params });
  return response.json();
};

export const deleteWeightEntry = async (
  weightId: number,
  deleteBodyfat: boolean = false
): Promise<{ message: string; deleted_date: string; bodyfat_deleted?: boolean }> => {
  const url = deleteBodyfat
    ? `${DELETE_WEIGHT_URL}${weightId}/?delete_bodyfat=true`
    : `${DELETE_WEIGHT_URL}${weightId}/`;
  const response = await apiClient.delete(url);
  return response.json();
};

export const exportUserData = async (): Promise<ExportDataResponse> => {
  const response = await apiClient.post(EXPORT_DATA_URL);
  return response.json();
};
