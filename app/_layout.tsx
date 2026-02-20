import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { theme } from '@/constants/theme';
import { initializeRevenueCat } from '@/services/revenueCat';
import RevenueCatSync from '@/components/RevenueCatSync';
import MaintenanceOverlay from '@/components/MaintenanceOverlay';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 1.0,
});

// Initialize before any component mounts to avoid singleton errors
initializeRevenueCat();

// Always start from index (loading screen) on app launch — prevents Expo Router
// from restoring the last visited screen (e.g. statistics, upgrade) on cold start
export const unstable_settings = {
  initialRouteName: 'index',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min: use cache, no refetch until stale
      gcTime: 1000 * 60 * 10, // 10 min: keep unused cache
      refetchOnWindowFocus: false,
      refetchOnMount: true, // refetch when mounting only if data is stale
    },
  },
});

// Custom dark theme with app's background color
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background, // #020205
    card: theme.colors.background,
    primary: theme.colors.status.active,
  },
};

const handleResetPasswordUrl = async (url: string) => {
  if (!url.includes('reset-password')) return;

  // PKCE flow: force://reset-password?code=xxx
  const parsed = Linking.parse(url);
  const code = parsed.queryParams?.code as string | undefined;
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    router.replace('/(reset-password)');
    return;
  }

  // Implicit flow: force://reset-password#access_token=xxx&refresh_token=xxx&type=recovery
  const hash = url.split('#')[1];
  if (hash) {
    const params = Object.fromEntries(new URLSearchParams(hash));
    if (params.type === 'recovery' && params.access_token) {
      await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      router.replace('/(reset-password)');
    }
  }
};

function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // App opened from cold start via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleResetPasswordUrl(url);
    });

    // App already open, deep link received
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleResetPasswordUrl(url);
    });

    // Supabase PASSWORD_RECOVERY event (fired after session is set)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(reset-password)');
      }
    });

    return () => {
      sub.remove();
      subscription.unsubscribe();
    };
  }, []);

  return (

    <QueryClientProvider client={queryClient}>
      <RevenueCatSync />
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.background },
              animation: 'fade',
              gestureEnabled: false, // Disable swipe gestures globally to prevent conflicts
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(loading)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(hero)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(active-workout)" options={{ headerShown: false }} />
            <Stack.Screen name="(add-exercise)" options={{ headerShown: false }} />
            <Stack.Screen name="(add-workout)" options={{ headerShown: false }} />
            <Stack.Screen name="(exercise-statistics)" options={{ headerShown: false }} />
            <Stack.Screen name="(templates)" options={{ headerShown: false }} />
            <Stack.Screen name="(volume-analysis)" options={{ headerShown: false }} />
            <Stack.Screen name="(recovery-status)" options={{ headerShown: false }} />
            <Stack.Screen name="(workout-summary)" options={{ headerShown: false }} />
            <Stack.Screen name="(account)" options={{ headerShown: false }} />
            <Stack.Screen name="(reset-password)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
          <MaintenanceOverlay />
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
