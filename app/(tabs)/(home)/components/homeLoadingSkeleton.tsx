import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { theme } from '@/constants/theme';

const useShimmer = () => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
};

const SkeletonBox = ({
  animatedStyle,
  style,
}: {
  animatedStyle: ReturnType<typeof useShimmer>;
  style?: object;
}) => (
  <Animated.View
    style={[
      styles.skeletonBase,
      style,
      animatedStyle,
    ]}
  />
);

/** Skeleton for ActiveSection / Start Workout card */
export function ActiveSectionSkeleton() {
  const shimmer = useShimmer();
  return (
    <View style={styles.activeContainer}>
      <View style={styles.activeRow}>
        <View style={styles.activeRowLeft}>
          <SkeletonBox animatedStyle={shimmer} style={styles.activeBars} />
          <SkeletonBox animatedStyle={shimmer} style={styles.activeTitle} />
        </View>
        <SkeletonBox animatedStyle={shimmer} style={styles.activeIcon} />
      </View>
    </View>
  );
}

/** Skeleton for CalendarStrip */
export function CalendarStripSkeleton() {
  const shimmer = useShimmer();
  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <SkeletonBox animatedStyle={shimmer} style={styles.calendarLabel} />
        <SkeletonBox animatedStyle={shimmer} style={styles.calendarWeek} />
      </View>
      <View style={styles.calendarRow}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <SkeletonBox key={i} animatedStyle={shimmer} style={styles.calendarDay} />
        ))}
      </View>
    </View>
  );
}

/** Skeleton for MuscleRecoverySection */
export function MuscleRecoverySkeleton() {
  const shimmer = useShimmer();
  return (
    <View style={styles.recoveryContainer}>
      <View style={styles.recoveryHeader}>
        <SkeletonBox animatedStyle={shimmer} style={styles.recoveryTitle} />
        <SkeletonBox animatedStyle={shimmer} style={styles.recoverySubtitle} />
      </View>
      <View style={styles.recoveryCards}>
        {[1, 2, 3].map((i) => (
          <SkeletonBox key={i} animatedStyle={shimmer} style={styles.recoveryCard} />
        ))}
      </View>
    </View>
  );
}

/** Skeleton for TemplatesSection */
export function TemplatesSectionSkeleton() {
  const shimmer = useShimmer();
  return (
    <View style={styles.templatesContainer}>
      <View style={styles.templatesHeader}>
        <SkeletonBox animatedStyle={shimmer} style={styles.templatesTitle} />
        <SkeletonBox animatedStyle={shimmer} style={styles.templatesButton} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.templatesScroll}
      >
        {[1, 2].map((i) => (
          <SkeletonBox key={i} animatedStyle={shimmer} style={styles.templateCard} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  // Active section
  activeContainer: {
    marginBottom: theme.spacing.m,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.l,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  activeBars: { width: 20, height: 12, borderRadius: 3 },
  activeTitle: { width: 110, height: 12 },
  activeIcon: { width: 36, height: 36, borderRadius: 18 },
  // Calendar strip
  calendarContainer: { marginVertical: theme.spacing.l },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
  },
  calendarLabel: { width: 80, height: 12 },
  calendarWeek: { width: 100, height: 12 },
  calendarRow: { flexDirection: 'row', gap: theme.spacing.xs },
  calendarDay: {
    flex: 1,
    height: 64,
    borderRadius: theme.borderRadius.xxl,
  },
  // Recovery
  recoveryContainer: { marginBottom: theme.spacing.m },
  recoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.xs,
  },
  recoveryTitle: { width: 140, height: 14 },
  recoverySubtitle: { width: 60, height: 12 },
  recoveryCards: { gap: theme.spacing.s },
  recoveryCard: {
    height: 56,
    borderRadius: theme.borderRadius.l,
  },
  // Templates
  templatesContainer: { marginVertical: theme.spacing.m },
  templatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.xs,
  },
  templatesTitle: { width: 160, height: 14 },
  templatesButton: { width: 72, height: 32, borderRadius: 20 },
  templatesScroll: { gap: theme.spacing.m, paddingBottom: 8 },
  templateCard: {
    width: 280,
    height: 120,
    borderRadius: theme.borderRadius.xl,
  },
});

// Legacy default export for loading screen (compose all sections)
export default function LoadingSkeleton({
  type = 'workout',
}: {
  type?: 'workout' | 'recovery' | 'templates' | 'calendar';
}) {
  if (type === 'templates') return <TemplatesSectionSkeleton />;
  if (type === 'recovery') return <MuscleRecoverySkeleton />;
  if (type === 'calendar') return <CalendarStripSkeleton />;
  return <ActiveSectionSkeleton />;
}
