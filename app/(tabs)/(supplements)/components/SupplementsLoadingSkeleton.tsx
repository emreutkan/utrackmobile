import { theme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SupplementsLoadingSkeleton() {
  const insets = useSafeAreaInsets();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      <View style={styles.scrollContent}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <Animated.View style={[styles.titleSkeleton, { opacity }]} />
          <Animated.View style={[styles.buttonSkeleton, { opacity }]} />
        </View>

        {/* Progress Card Skeleton */}
        <View style={styles.progressCardSkeleton}>
          <View style={styles.progressLeft}>
            <Animated.View style={[styles.labelSkeleton, { opacity }]} />
            <Animated.View style={[styles.numberSkeleton, { opacity }]} />
          </View>
          <Animated.View style={[styles.iconSkeleton, { opacity }]} />
        </View>

        {/* Section Header Skeleton */}
        <Animated.View style={[styles.sectionHeaderSkeleton, { opacity }]} />

        {/* Supplement Cards Skeleton */}
        {[1, 2, 3, 4].map((_, index) => (
          <View key={index} style={styles.cardSkeleton}>
            <Animated.View style={[styles.cardIconSkeleton, { opacity }]} />
            <View style={styles.cardInfo}>
              <Animated.View style={[styles.cardTitleSkeleton, { opacity }]} />
              <Animated.View style={[styles.cardSubtitleSkeleton, { opacity }]} />
            </View>
            <Animated.View style={[styles.cardButtonSkeleton, { opacity }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.l,
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  titleSkeleton: {
    width: 200,
    height: 30,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 8,
  },
  buttonSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.ui.glass,
  },

  // Progress Card
  progressCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  progressLeft: {
    flex: 1,
    gap: theme.spacing.s,
  },
  labelSkeleton: {
    width: 120,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  numberSkeleton: {
    width: 80,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  iconSkeleton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Section Header
  sectionHeaderSkeleton: {
    width: 140,
    height: 12,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 4,
    marginBottom: theme.spacing.m,
    marginLeft: 4,
  },

  // Card
  cardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  cardIconSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: theme.spacing.m,
  },
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  cardTitleSkeleton: {
    width: 140,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  cardSubtitleSkeleton: {
    width: 100,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
  },
  cardButtonSkeleton: {
    width: 60,
    height: 32,
    borderRadius: theme.borderRadius.m,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
