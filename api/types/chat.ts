export interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

export interface CreateChatSessionRequest {
  title?: string;
}

export interface SendChatMessageRequest {
  message: string;
}
