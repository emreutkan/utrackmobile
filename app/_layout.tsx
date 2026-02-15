import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { theme } from '@/constants/theme';

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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
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
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
