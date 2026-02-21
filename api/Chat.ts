import apiClient from './APIClient';
import type { PaginatedResponse } from './types/pagination';
import type {
  ChatSession,
  ChatMessage,
  CreateChatSessionRequest,
  SendChatMessageRequest,
} from './types';
import {
  GET_CHAT_SESSIONS_URL,
  CREATE_CHAT_SESSION_URL,
  GET_CHAT_SESSION_URL,
  DELETE_CHAT_SESSION_URL,
  SEND_CHAT_MESSAGE_URL,
} from './types';

export const getChatSessions = async (
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<ChatSession> | ChatSession[]> => {
  const searchParams: Record<string, number> = {};
  if (page !== undefined) searchParams.page = page;
  if (pageSize !== undefined) searchParams.page_size = pageSize;
  const response = await apiClient.get(GET_CHAT_SESSIONS_URL, { searchParams });
  return response.json();
};

export const createChatSession = async (
  request?: CreateChatSessionRequest
): Promise<ChatSession> => {
  const response = await apiClient.post(CREATE_CHAT_SESSION_URL, { json: request || {} });
  return response.json();
};

export const getChatSession = async (sessionId: number): Promise<ChatSession> => {
  const url = GET_CHAT_SESSION_URL.replace(':id', String(sessionId));
  const response = await apiClient.get(url);
  return response.json();
};

export const deleteChatSession = async (sessionId: number): Promise<void> => {
  const url = DELETE_CHAT_SESSION_URL.replace(':id', String(sessionId));
  await apiClient.delete(url);
};

export const sendChatMessage = async (
  sessionId: number,
  request: SendChatMessageRequest
): Promise<ChatMessage> => {
  const url = SEND_CHAT_MESSAGE_URL.replace(':id', String(sessionId));
  const response = await apiClient.post(url, { json: request });
  return response.json();
};
