import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

export default function LoadingScreen() {
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(false);
  const [sessionChecked, setSessionChecked] = React.useState(false);
  const [hasSession, setHasSession] = React.useState(false);

  // Minimum display time to prevent flashing
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Check Supabase session
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasSession(!!session);
      setSessionChecked(true);
    };
    checkSession();
  }, []);

  // Navigate once both checks pass
  useEffect(() => {
    if (!minTimeElapsed || !sessionChecked) return;

    if (hasSession) {
      console.log('[LOADING] Session found, redirecting to home');
      router.replace('/(tabs)/(home)');
    } else {
      console.log('[LOADING] No session, redirecting to auth');
      router.replace('/(auth)');
    }
  }, [minTimeElapsed, sessionChecked, hasSession]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 0.1)', 'transparent']}
        locations={[0, 0.5, 1]}
        style={styles.bgGlow}
      />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>FORCE</Text>
          <View style={styles.dot} />
        </View>
        <Text style={styles.tagline}>WORKOUT TRACKING</Text>
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
