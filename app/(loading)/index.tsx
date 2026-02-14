import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { getAccessToken, getRefreshToken } from '@/hooks/Storage';
import { useUser } from '@/hooks/useUser';

export default function LoadingScreen() {
  const [hasTokens, setHasTokens] = React.useState<boolean | null>(null);

  // Check if tokens exist
  useEffect(() => {
    const checkTokens = async () => {
      try {
        const accessToken = await getAccessToken();
        const refreshToken = await getRefreshToken();
        const hasAny = !!(accessToken || refreshToken);
        setHasTokens(hasAny);
      } catch (error) {
        console.error('[LOADING] Error checking tokens:', error);
        setHasTokens(false);
      }
    };

    checkTokens();
  }, []);

  // Fetch user data if tokens exist
  const { data: user, isLoading } = useUser({
    enabled: hasTokens === true,
  });

  // Navigate based on auth state
  useEffect(() => {
    // Still checking tokens
    if (hasTokens === null) return;

    // No tokens → go to auth
    if (hasTokens === false) {
      router.replace('/(auth)');
      return;
    }

    // Has tokens but still loading user data
    if (isLoading) return;

    // Has tokens and user data loaded → go to home
    if (user !== undefined) {
      router.replace('/(tabs)/(home)');
      return;
    }

    // Has tokens but failed to load user → go to auth
    if (!isLoading && user === undefined) {
      router.replace('/(auth)');
    }
  }, [hasTokens, user, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020205',
  },
});
