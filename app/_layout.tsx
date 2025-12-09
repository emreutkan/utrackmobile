import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(auth)',
}; // This is used to set the anchor for the router. If the user is not logged in, they will be redirected to the login page.

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#1C1C1E' }
      }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(account)" />
        <Stack.Screen 
            name="(add-exercise)" 
 
        />
        
        <Stack.Screen name="(active-workout)" />
        
        <Stack.Screen name="(workouts)" />
        <Stack.Screen name="(supplements)" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
