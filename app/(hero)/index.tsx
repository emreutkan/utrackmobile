import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HERO_SEEN_KEY = '@force_hero_seen';

export default function HeroScreen() {
  const insets = useSafeAreaInsets();
  const [isNavigating, setIsNavigating] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideTopAnim = React.useRef(new Animated.Value(-20)).current;
  const slideBottomAnim = React.useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Top section animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideTopAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Bottom section animation with delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideBottomAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }, 700);
  });

  const handleStartLogging = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      await AsyncStorage.setItem(HERO_SEEN_KEY, 'true');
      router.replace('/(auth)');
    } catch (error) {
      console.error('Error saving hero seen:', error);
      router.replace('/(auth)');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 0.1)', 'transparent']}
        style={styles.bgGlow}
      />
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      <Animated.View
        style={[
          styles.topSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideTopAnim }],
          },
        ]}
      >
        <Ionicons name="pulse" size={16} color={theme.colors.status.active} />
        <Text style={styles.footerText}>FORCE PERFORMANCE © {new Date().getFullYear()}</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.middleSection,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.titleContainer}>
          <Text style={typographyStyles.hero}>
            FORCE
            <Text style={{ color: theme.colors.status.active }}>.</Text>
          </Text>
        </View>

        <Text style={styles.description}>
          Precision gym tracking engineered with research-backed metrics and advanced recovery
          biometrics.
        </Text>

        <View style={styles.featureContainer}>
          <View style={styles.dividerLine} />
          <View style={styles.featureContent}>
            <Ionicons name="server-outline" size={10} color={theme.colors.text.tertiary} />
            <Text style={styles.featureText}>SCIENCE-BACKED ANALYTICS</Text>
          </View>
          <View style={styles.dividerLine} />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomSection,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable
          style={styles.primaryButton}
          onPress={handleStartLogging}
        >
          <Text style={styles.primaryButtonText}>START LOGGING</Text>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.text.primary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
  },
  bgGlow: {
    position: 'absolute',
    top: '25%',
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
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    justifyContent: 'center',
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl,
    position: 'relative',
    zIndex: 10,
  },
  middleSection: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxxxxl,
    paddingBottom: theme.spacing.xxl,
    zIndex: 10,
    gap: theme.spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  description: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    paddingHorizontal: theme.spacing.l,
  },
  featureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginTop: theme.spacing.xl,
  },
  dividerLine: {
    height: 1,
    width: 32,
    backgroundColor: theme.colors.ui.border,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  featureText: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: theme.colors.text.tertiary,
  },
  bottomSection: {
    width: '100%',
    gap: theme.spacing.m,
    position: 'relative',
    zIndex: 10,
    paddingTop: theme.spacing.xxxxxl,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: theme.colors.status.active,
    borderRadius: theme.borderRadius.xxl,
    paddingVertical: theme.spacing.l,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: theme.spacing.xxl,
  },
  primaryButtonText: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.tracking.wide,
  },
  footerText: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.wide,
    color: theme.colors.text.zinc700,
    textAlign: 'center',
  },
});
