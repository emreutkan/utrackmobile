import { create } from 'zustand';
import {
  getChatSessions,
  createChatSession,
  getChatSession,
  deleteChatSession,
  sendChatMessage,
} from '@/api/Chat';
import type { ChatSession, ChatMessage } from '@/api/types';

export interface ChatState {
  // Data
  sessions: ChatSession[];
  activeSession: ChatSession | null;

  // UI State
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Actions
  fetchSessions: () => Promise<void>;
  fetchSession: (id: number) => Promise<void>;
  startSession: (title?: string) => Promise<ChatSession>;
  removeSession: (id: number) => Promise<void>;
  sendMessage: (sessionId: number, message: string) => Promise<void>;
  clearActiveSession: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSession: null,
  isLoading: false,
  isSending: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getChatSessions();
      const sessions = Array.isArray(response) ? response : response.results;
      set({ sessions: sessions || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch sessions', isLoading: false });
    }
  },

  fetchSession: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const session = await getChatSession(id);
      set({ activeSession: session, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch session', isLoading: false });
    }
  },

  startSession: async (title?: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await createChatSession({ title });
      const currentSessions = get().sessions;
      set({
        sessions: [session, ...currentSessions],
        activeSession: session,
        isLoading: false,
      });
      return session;
    } catch (error: any) {
      set({ error: error.message || 'Failed to start session', isLoading: false });
      throw error;
    }
  },

  removeSession: async (id: number) => {
    try {
      // Optimistic delete
      const state = get();
      set({
        sessions: state.sessions.filter((s) => s.id !== id),
        activeSession: state.activeSession?.id === id ? null : state.activeSession,
      });
      await deleteChatSession(id);
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete session' });
      // Revert optimism if needed (requires storing previous state, simplified here)
      get().fetchSessions();
    }
  },

  sendMessage: async (sessionId: number, content: string) => {
    set({ isSending: true, error: null });

    // Create optimistic user message
    const tempId = -Date.now();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const currentState = get();
    if (currentState.activeSession && currentState.activeSession.id === sessionId) {
      const updatedMessages = [...(currentState.activeSession.messages || []), optimisticMessage];
      set({
        activeSession: { ...currentState.activeSession, messages: updatedMessages },
      });
    }

    try {
      const aiResponse = await sendChatMessage(sessionId, { message: content });

      const stateAfterSend = get();
      if (stateAfterSend.activeSession && stateAfterSend.activeSession.id === sessionId) {
        // Add the AI response
        const updatedMessages = [...(stateAfterSend.activeSession.messages || []), aiResponse];
        set({
          activeSession: { ...stateAfterSend.activeSession, messages: updatedMessages },
          isSending: false,
        });
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      const stateAfterFail = get();
      if (stateAfterFail.activeSession && stateAfterFail.activeSession.id === sessionId) {
        // Remove optimistic user message on failure
        const rollbackMessages =
          stateAfterFail.activeSession.messages?.filter((m) => m.id !== tempId) || [];
        set({
          activeSession: { ...stateAfterFail.activeSession, messages: rollbackMessages },
          error: error.message || 'Failed to send message',
          isSending: false,
        });
      }
    }
  },

  clearActiveSession: () => {
    set({ activeSession: null });
  },

  reset: () => {
    set({
      sessions: [],
      activeSession: null,
      error: null,
      isLoading: false,
      isSending: false,
    });
  },
}));
