import AuthCheck from '@/components/AuthCheck';
import BottomNavigator from '@/components/BottomNavigator';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBackendHealth } from '@/hooks/useBackendHealth';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isBackendDown, isChecking } = useBackendHealth();

  // Show maintenance screen if backend is down
  if (isBackendDown) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MaintenanceScreen />
        <StatusBar style="light" />
      </GestureHandlerRootView>
    );
  }

  return (
    <AuthCheck>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack 
            screenOptions={{ 
              headerShown: false,
              contentStyle: { backgroundColor: 'black' }
            }}
          >
            <Stack.Screen name="hero" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(home)" />
            <Stack.Screen name="(account)" />
            <Stack.Screen name="(add-exercise)" />
            <Stack.Screen name="(active-workout)" />
            <Stack.Screen name="(add-workout)" />
            <Stack.Screen name="(workouts)" />
            <Stack.Screen name="(supplements)" />
            <Stack.Screen name="(recovery-status)" />
            <Stack.Screen name="(calculations)" />
            <Stack.Screen name="(exercise-statistics)" />
            <Stack.Screen name="(knowledge-base)" />
            <Stack.Screen name="(templates)" />
            <Stack.Screen name="(volume-analysis)" />
          </Stack>
          <BottomNavigator />
          <StatusBar style="light" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </AuthCheck>
  );
}
