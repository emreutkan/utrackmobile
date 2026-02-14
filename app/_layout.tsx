import React, { useEffect, useState } from 'react';
import { getAccessToken, getRefreshToken } from '@/hooks/Storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUser } from '@/hooks/useUser';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min: use cache, no refetch until stale
      gcTime: 1000 * 60 * 10,   // 10 min: keep unused cache
      refetchOnWindowFocus: false,
      refetchOnMount: true,     // refetch when mounting only if data is stale
    },
  },
});

export const unstable_settings = {
  initialRouteName: '(loading)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppNavigator />
          <StatusBar style="light" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

function AppNavigator() {
  const [hasTokens, setHasTokens] = useState<boolean | null>(null);
  const pathname = usePathname();

  const checkTokens = async () => {
    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      const hasAny = !!(accessToken || refreshToken);
      setHasTokens(hasAny);
    } catch (error) {
      console.error('[AUTH] Error checking tokens:', error);
      setHasTokens(false);
    }
  };

  useEffect(() => {
    checkTokens();
  }, [pathname]);

  const { data: user } = useUser({
    enabled: hasTokens === true,
  });

  // Redirect to auth when on protected route without tokens
  useEffect(() => {
    if (hasTokens === false && pathname != null && !pathname.includes('(auth)') && !pathname.includes('(hero)') && !pathname.includes('(loading)')) {
      router.replace('/(auth)');
    }
  }, [hasTokens, pathname]);

  // Redirect to home when logged in and on auth/hero
  useEffect(() => {
    const onUnauthRoute =
      pathname != null &&
      (pathname.includes('(auth)') || pathname.includes('(hero)'));
    if (hasTokens === true && user !== undefined && onUnauthRoute) {
      router.replace('/(tabs)/(home)');
    }
  }, [hasTokens, user, pathname]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'black' },
      }}
    >
      <Stack.Screen name="(loading)" />
      <Stack.Screen name="(hero)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(account)" options={{ headerShown: false }} />
      <Stack.Screen name="(add-exercise)" />
      <Stack.Screen name="(active-workout)" />
      <Stack.Screen name="(add-workout)" />
      <Stack.Screen name="(exercise-statistics)" />
      <Stack.Screen name="(templates)" />
      <Stack.Screen name="(volume-analysis)" />
      <Stack.Screen name="(recovery-status)" />
      <Stack.Screen name="(workout-summary)" />
    </Stack>
  );
}
