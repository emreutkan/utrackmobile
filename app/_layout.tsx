import AuthCheck from '@/components/AuthCheck';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(auth)',
}; // This is used to set the anchor for the router. If the user is not logged in, they will be redirected to the login page.

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthCheck>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ 
              headerShown: false,
              contentStyle: { backgroundColor: 'black' }
          }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(home)" />
            <Stack.Screen name="(account)" />
            <Stack.Screen name="(add-exercise)" />
            <Stack.Screen name="(active-workout)" />
            <Stack.Screen name="(add-workout)" />
            <Stack.Screen name="(workouts)" />
            <Stack.Screen name="(supplements)" />
            <Stack.Screen name="(recovery-status)" />

          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </AuthCheck>
  );
}
