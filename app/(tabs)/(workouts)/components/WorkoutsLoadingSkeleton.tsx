import { theme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkoutsLoadingSkeleton() {
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
        <Animated.View style={[styles.backButtonSkeleton, { opacity }]} />
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
      </View>

      {/* Workout Cards Skeleton */}
      <View style={styles.listContent}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <View key={index} style={styles.card}>
            {/* Top Row: Date + Menu */}
            <View style={styles.topRow}>
              <Animated.View style={[styles.dateSkeleton, { opacity }]} />
              <Animated.View style={[styles.menuSkeleton, { opacity }]} />
            </View>

            {/* Title */}
            <Animated.View style={[styles.workoutTitleSkeleton, { opacity }]} />

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {[1, 2, 3, 4].map((statIndex) => (
                <View key={statIndex} style={styles.statItem}>
                  <Animated.View style={[styles.statIconSkeleton, { opacity }]} />
                  <Animated.View style={[styles.statTextSkeleton, { opacity }]} />
                </View>
              ))}
            </View>

            {/* Exercise List */}
            <View style={styles.exerciseList}>
              {[1, 2, 3].map((exIndex) => (
                <View key={exIndex} style={styles.exerciseRow}>
                  <Animated.View style={[styles.exerciseDotSkeleton, { opacity }]} />
                  <Animated.View style={[styles.exerciseNameSkeleton, { opacity }]} />
                  <Animated.View style={[styles.exerciseStatSkeleton, { opacity }]} />
                </View>
              ))}
            </View>

            {/* Muscle Chips */}
            <View style={styles.muscleRow}>
              {[1, 2, 3, 4].map((chipIndex) => (
                <Animated.View key={chipIndex} style={[styles.muscleChipSkeleton, { opacity }]} />
              ))}
            </View>
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
    gap: theme.spacing.l,
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  backButtonSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.ui.glass,
  },
  titleSkeleton: {
    width: 120,
    height: 28,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 8,
  },

  // List Content
  listContent: {
    paddingHorizontal: 12,
  },

  // Card
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },

  // Top Row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateSkeleton: {
    width: 80,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  menuSkeleton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Title
  workoutTitleSkeleton: {
    width: '70%',
    height: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 10,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIconSkeleton: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statTextSkeleton: {
    width: 30,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },

  // Exercise List
  exerciseList: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui.border,
    gap: 6,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseDotSkeleton: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  exerciseNameSkeleton: {
    flex: 1,
    height: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    marginRight: 8,
  },
  exerciseStatSkeleton: {
    width: 60,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },

  // Muscle Chips
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
  },
  muscleChipSkeleton: {
    width: 50,
    height: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 5,
  },
});
