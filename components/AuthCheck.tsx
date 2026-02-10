import { getAPI_URL, REFRESH_URL } from '@/api/ApiBase';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  storeAccessToken,
  storeRefreshToken,
} from '@/api/Storage';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { RelativePathString, useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HERO_SEEN_KEY = '@force_hero_seen';

// Global event emitter for token errors
let tokenErrorListeners: (() => void)[] = [];
let globalHasChecked = false; // Global flag to prevent infinite loops

export const onTokenError = (callback: () => void) => {
  tokenErrorListeners.push(callback);
  return () => {
    tokenErrorListeners = tokenErrorListeners.filter((l: () => void) => l !== callback);
  };
};

export const triggerTokenError = () => {
  // Only trigger if we haven't already checked and are not in a loop
  if (!globalHasChecked) {
    tokenErrorListeners.forEach((listener: () => void) => listener());
  }
};

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [initialRoute, setInitialRoute] = useState<RelativePathString | null>(null);
  const [waitingForAnimation, setWaitingForAnimation] = useState<boolean>(true);
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const isCheckingRef = useRef<boolean>(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [readyToRoute, setReadyToRoute] = useState<boolean>(false);
  const [routeTarget, setRouteTarget] = useState<RelativePathString | null>(null);

  useEffect(() => {
    if (readyToRoute && routeTarget && !waitingForAnimation) {
      router.replace(routeTarget as RelativePathString);
    }
  }, [readyToRoute, routeTarget, waitingForAnimation]);
  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous checks
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    setIsChecking(true);
    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();

      // No tokens - check hero first, then go to auth
      if (!accessToken && !refreshToken) {
        isCheckingRef.current = false;
        setIsChecking(false);
        // Only route if not already on auth or hero
        if (segments[0] !== '(auth)' && segments[0] !== 'hero') {
          const heroSeen = await AsyncStorage.getItem(HERO_SEEN_KEY);
          if (!heroSeen) {
            setReadyToRoute(true);
            setRouteTarget('/hero' as RelativePathString);
          } else {
            setReadyToRoute(true);
            setRouteTarget('/(auth)' as RelativePathString);
          }
        }
        return;
      }

      // Have tokens - validate them
      if (refreshToken) {
        try {
          const apiUrl = await getAPI_URL();

          const response = await axios.post(
            `${apiUrl}${REFRESH_URL}`,
            { refresh: refreshToken },
            {
              timeout: 3000,
            }
          );

          if (response.status === 200 && response.data.access) {
            await storeAccessToken(response.data.access);
            if (response.data.refresh) {
              await storeRefreshToken(response.data.refresh);
            }
            isCheckingRef.current = false;

            setReadyToRoute(true);
            setRouteTarget('/(home)' as RelativePathString);
            return;
          }
        } catch (error: any) {
          // Check if it's an authentication error (401, 403) vs network error
          const status = error?.response?.status;
          const isAuthError = status === 401 || status === 403;

          if (isAuthError) {
            // Token is actually invalid - clear and check hero first
            await clearTokens();
            isCheckingRef.current = false;
            setIsChecking(false);
            if (segments[0] !== '(auth)' && segments[0] !== 'hero') {
              const heroSeen = await AsyncStorage.getItem(HERO_SEEN_KEY);
              setTimeout(() => {
                if (!heroSeen) {
                  setReadyToRoute(true);
                  setRouteTarget('/hero' as RelativePathString);
                } else {
                  setReadyToRoute(true);
                  setRouteTarget('/(auth)' as RelativePathString);
                }
              }, 100);
            }
          } else {
            // Network error or other issue - keep tokens, assume valid, go to home
            isCheckingRef.current = false;
            setIsChecking(false);
            setReadyToRoute(true);
            setRouteTarget('/(home)' as RelativePathString);
          }
          return;
        }
      }

      // Have access token but no refresh - assume valid
      if (accessToken) {
        isCheckingRef.current = false;
        setReadyToRoute(true);
        setRouteTarget('/(home)' as RelativePathString);
        return;
      }

      // Fallback - check hero first, then go to auth
      isCheckingRef.current = false;
      setIsChecking(false);
      if (segments[0] !== '(auth)' && segments[0] !== 'hero') {
        const heroSeen = await AsyncStorage.getItem(HERO_SEEN_KEY);
        setTimeout(() => {
          if (!heroSeen) {
            setReadyToRoute(true);
            setRouteTarget('/hero' as RelativePathString);
          } else {
            setReadyToRoute(true);
            setRouteTarget('/(auth)' as RelativePathString);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      isCheckingRef.current = false;
      setIsChecking(false);
      if (segments[0] !== '(auth)' && segments[0] !== 'hero') {
        const heroSeen = await AsyncStorage.getItem(HERO_SEEN_KEY);
        setTimeout(() => {
          if (!heroSeen) {
            setReadyToRoute(true);
            setRouteTarget('/hero' as RelativePathString);
          } else {
            setReadyToRoute(true);
            setRouteTarget('/(auth)' as RelativePathString);
          }
        }, 100);
      }
    }
  }, [segments, router]);

  // Loading animations
  useEffect(() => {
    if (isChecking) {
      // 1. Reset the wait state when a check begins

      // 2. Start the Entrance Animation (Finite)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // 4. Start Looping Animations (Infinite)
      // Don't put callbacks on these; they never "finish"
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
      ).start();
    }
  }, [isChecking]);
  useEffect(() => {
    // Only check once globally
    if (globalHasChecked) {
      setIsChecking(false);
      return;
    }

    globalHasChecked = true;
    checkAuth();

    // Listen for token errors - but prevent infinite loops
    const unsubscribe = onTokenError(() => {
      // Only re-check if we're not already checking and not on auth screen with no tokens
      if (!isCheckingRef.current && segments[0] !== '(auth)') {
        globalHasChecked = false; // Reset to allow re-check
        checkAuth();
      }
    });

    return unsubscribe;
  }, [segments, checkAuth]);
  // Redirect if we're on wrong route after auth check
  useEffect(() => {
    if (
      !isChecking &&
      initialRoute &&
      segments[0] &&
      segments[0] !== '(auth)' &&
      segments[0] !== '(home)'
    ) {
      setReadyToRoute(true);
      setRouteTarget(initialRoute as RelativePathString);
    }
  }, [isChecking, initialRoute, segments, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWaitingForAnimation(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Show loading screen while checking auth OR until the minimum 3s animation wait has passed
  if (isChecking || waitingForAnimation) {
    const spin = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View
        style={[styles.loadingContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        {/* Background gradient */}
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 0.1)', 'transparent']}
          style={styles.bgGlow}
        />
        <LinearGradient
          colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
          style={styles.gradientBg}
        />

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Top badge */}
          <View style={styles.topBadge}>
            <Ionicons name="pulse" size={14} color={theme.colors.status.active} />
            <Text style={styles.badgeText}>FORCE PERFORMANCE</Text>
          </View>

          {/* Main title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.title}>
              FORCE
              <Text style={{ color: theme.colors.status.active }}>.</Text>
            </Text>
          </Animated.View>

          {/* Loading indicator */}
          <View style={styles.loadingIndicator}>
            <Animated.View
              style={[
                styles.spinner,
                {
                  transform: [{ rotate: spin }],
                },
              ]}
            >
              <Ionicons name="sync-outline" size={20} color={theme.colors.text.tertiary} />
            </Animated.View>
            <Text style={styles.loadingText}>Authenticating</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  bgGlow: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    width: 300,
    height: 300,
    borderRadius: 9999,
    transform: [{ translateX: -150 }],
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    alignItems: 'center',
    gap: theme.spacing.xl,
    zIndex: 10,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    backgroundColor: theme.colors.ui.glass,
  },
  badgeText: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.wide,
    color: theme.colors.text.tertiary,
  },
  titleContainer: {
    marginVertical: theme.spacing.xxl,
  },
  title: {
    fontSize: 72,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -3,
    color: theme.colors.text.primary,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginTop: theme.spacing.xl,
  },
  spinner: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
  },
});
