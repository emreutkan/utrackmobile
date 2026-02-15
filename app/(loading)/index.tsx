import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getAccessToken, getRefreshToken } from '@/hooks/Storage';
import { useUser } from '@/hooks/useUser';
import { theme } from '@/constants/theme';

export default function LoadingScreen() {
  const [hasTokens, setHasTokens] = React.useState<boolean | null>(null);
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(false);

  // Minimum display time to prevent flashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 500); // Show loading screen for at least 500ms
    return () => clearTimeout(timer);
  }, []);

  // Check if tokens exist
  useEffect(() => {
    const checkTokens = async () => {
      try {
        const accessToken = await getAccessToken();
        const refreshToken = await getRefreshToken();
        const hasAny = !!(accessToken || refreshToken);
        console.log('[LOADING] Tokens check result:', hasAny);
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

  // Navigate based on auth state (only after minimum time elapsed)
  useEffect(() => {
    // Wait for minimum display time
    if (!minTimeElapsed) return;

    // Still checking tokens
    if (hasTokens === null) return;

    // No tokens → go to auth
    if (hasTokens === false) {
      console.log('[LOADING] No tokens, redirecting to auth');
      router.replace('/(auth)');
      return;
    }

    // Has tokens but still loading user data
    if (isLoading) return;

    // Has tokens and user data loaded → go to home
    if (user !== undefined) {
      console.log('[LOADING] User loaded, redirecting to home');
      router.replace('/(tabs)/(home)');
      return;
    }

    // Has tokens but failed to load user → go to auth
    if (!isLoading && user === undefined) {
      console.log('[LOADING] Failed to load user, redirecting to auth');
      router.replace('/(auth)');
    }
  }, [hasTokens, user, isLoading, minTimeElapsed]);

  return (
    <View style={styles.container}>
      {/* Top gradient glow */}
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 0.1)', 'transparent']}
        locations={[0, 0.5, 1]}
        style={styles.bgGlow}
      />

      {/* Centered branding */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>FORCE</Text>
          <View style={styles.dot} />
        </View>
        <Text style={styles.tagline}>NEURAL TRAINING PLATFORM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bgGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 108,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -4.8,
    color: theme.colors.text.primary,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.status.active,
    marginLeft: 8,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3.6,
    color: theme.colors.text.tertiary,
  },
});
