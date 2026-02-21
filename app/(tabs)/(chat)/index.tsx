import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { GiftedChat, IMessage, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import { useChatStore } from '@/state/userStore';
import { useUser } from '@/hooks/useUser';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const sessionId = id ? parseInt(id as string, 10) : null;
  const { data: user } = useUser();

  const { activeSession, fetchSession, startSession, sendMessage, isSending } = useChatStore();

  const [messages, setMessages] = useState<IMessage[]>([]);

  // Convert backend ChatMessage to GiftedChat IMessage format
  const formatMessages = useCallback(
    (backendMessages: any[] = []): IMessage[] => {
      return backendMessages
        .map((msg) => ({
          _id: msg.id,
          text: msg.content,
          createdAt: new Date(msg.timestamp),
          user: {
            _id: msg.role === 'user' ? 1 : 2,
            name: msg.role === 'user' ? user?.email?.split('@')[0] || 'You' : 'Force AI',
            avatar:
              msg.role === 'ai'
                ? 'https://ui-avatars.com/api/?name=F&background=A855F7&color=fff'
                : undefined,
          },
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // GiftedChat expects desc order
    },
    [user]
  );

  // Load session or start new one
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    } else {
      startSession('New AI Chat');
    }
  }, [sessionId]);

  // Sync state to UI
  useEffect(() => {
    if (activeSession?.messages) {
      setMessages(formatMessages(activeSession.messages));
    }
  }, [activeSession?.messages, formatMessages]);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      if (!activeSession?.id) return;
      const messageText = newMessages[0].text;
      sendMessage(activeSession.id, messageText);
    },
    [activeSession?.id, sendMessage]
  );

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: theme.colors.status.active, // Active blue/primary for user
            borderRadius: theme.borderRadius.xl,
            padding: 4,
          },
          left: {
            backgroundColor: theme.colors.ui.glassStrong, // Standard app glass color
            borderRadius: theme.borderRadius.xl,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)',
            padding: 4,
          },
        }}
        textStyle={{
          right: {
            color: '#ffffff',
            fontSize: theme.typography.sizes.m,
          },
          left: {
            color: theme.colors.text.primary,
            fontSize: theme.typography.sizes.m,
          },
        }}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send {...props}>
        <View style={styles.sendButton}>
          <Ionicons name="send" size={20} color={theme.colors.status.active} />
        </View>
      </Send>
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={{ alignItems: 'center' }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Ionicons name="sparkles" size={16} color={theme.colors.status.active} />
            <Animated.Text style={styles.headerTitle}>Force AI Assistant</Animated.Text>
          </View>
        </View>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={styles.chatContainer}>
        <GiftedChat
          messages={messages}
          onSend={(messages) => onSend(messages)}
          user={{ _id: 1 }}
          renderBubble={renderBubble}
          renderSend={renderSend}
          renderInputToolbar={renderInputToolbar}
          isTyping={isSending}
          // @ts-ignore: bottomOffset is valid at runtime but missing from type definitions
          bottomOffset={insets.bottom + 65}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    zIndex: 1,
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.l,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inputToolbar: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui.border,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.full,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
});
