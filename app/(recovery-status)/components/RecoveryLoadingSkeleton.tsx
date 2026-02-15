import { theme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecoveryLoadingSkeleton() {
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

      {/* Header Skeleton */}
      <View style={styles.header}>
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
      </View>

      {/* CNS Card Skeleton */}
      <View style={styles.scrollContent}>
        <View style={styles.cnsCard}>
          <View style={styles.cnsHeader}>
            <Animated.View style={[styles.cnsIconSkeleton, { opacity }]} />
            <View style={styles.cnsHeaderText}>
              <Animated.View style={[styles.cnsTitleSkeleton, { opacity }]} />
              <Animated.View style={[styles.cnsSubtitleSkeleton, { opacity }]} />
            </View>
          </View>
          <View style={styles.cnsContent}>
            <Animated.View style={[styles.cnsPercentageSkeleton, { opacity }]} />
            <Animated.View style={[styles.cnsTextSkeleton, { opacity }]} />
          </View>
        </View>

        {/* Section Header */}
        <Animated.View style={[styles.sectionHeaderSkeleton, { opacity }]} />

        {/* Muscle Cards Skeleton */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
          <View key={index} style={styles.muscleCard}>
            <Animated.View style={[styles.muscleDotSkeleton, { opacity }]} />
            <View style={styles.muscleInfo}>
              <Animated.View style={[styles.muscleNameSkeleton, { opacity }]} />
              <Animated.View style={[styles.muscleTimeSkeleton, { opacity }]} />
            </View>
            <Animated.View style={[styles.musclePercentageSkeleton, { opacity }]} />
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.m,
  },
  titleSkeleton: {
    width: 180,
    height: 28,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 8,
  },

  // Scroll Content
  scrollContent: {
    padding: theme.spacing.m,
  },

  // CNS Card
  cnsCard: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.l,
    marginHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  cnsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  cnsIconSkeleton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  cnsHeaderText: {
    flex: 1,
    gap: 6,
  },
  cnsTitleSkeleton: {
    width: 140,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  cnsSubtitleSkeleton: {
    width: 100,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
  },
  cnsContent: {
    gap: theme.spacing.s,
  },
  cnsPercentageSkeleton: {
    width: '40%',
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  cnsTextSkeleton: {
    width: '70%',
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
  },

  // Section Header
  sectionHeaderSkeleton: {
    width: 100,
    height: 12,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 4,
    marginBottom: theme.spacing.m,
    marginHorizontal: theme.spacing.l,
  },

  // Muscle Cards
  muscleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    marginHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  muscleDotSkeleton: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: theme.spacing.m,
  },
  muscleInfo: {
    flex: 1,
    gap: 4,
  },
  muscleNameSkeleton: {
    width: 100,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  muscleTimeSkeleton: {
    width: 80,
    height: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
  },
  musclePercentageSkeleton: {
    width: 50,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
});
