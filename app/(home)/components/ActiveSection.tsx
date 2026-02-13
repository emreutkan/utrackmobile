import { Workout } from '@/api/types/index';
import TrainingIntensityCard from '@/components/TrainingIntensityCard';
import { RestDayCard } from '@/components/WorkoutModal';
import { theme } from '@/constants/theme';
import { useTodayStatus, useActiveWorkout, useWorkoutSummary } from '@/hooks/useWorkout';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { RefObject, useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SwipeAction } from '@/components/SwipeAction';

interface ActiveSectionProps {
  onDeleteWorkout: (id: number) => void;
  startButtonRef: RefObject<View | null>;
  onStartWorkoutPress: () => void;
}

export default function ActiveSection({
  onDeleteWorkout,
  startButtonRef,
  onStartWorkoutPress,
}: ActiveSectionProps) {
  const { data: todayStatus } = useTodayStatus();
  const { data: activeWorkoutData, refetch: refetchActiveWorkout } = useActiveWorkout();

  // Get today's workout ID if it exists and is completed
  const todayWorkoutId =
    todayStatus?.workout_status === 'performed' && todayStatus?.workout
      ? (todayStatus.workout as Workout).id
      : null;

  const { data: workoutSummary } = useWorkoutSummary(todayWorkoutId);

  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Convert active workout data to typed object
  const activeWorkout =
    activeWorkoutData && typeof activeWorkoutData === 'object' && 'id' in activeWorkoutData
      ? (activeWorkoutData as Workout)
      : null;

  // Get today's workout score from summary
  const todayWorkoutScore =
    workoutSummary && typeof workoutSummary === 'object' && 'score' in workoutSummary
      ? (workoutSummary.score as number)
      : null;

  // Initial load and refresh on focus
  useFocusEffect(
    useCallback(() => {
      refetchActiveWorkout();
    }, [refetchActiveWorkout])
  );

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (activeWorkout?.created_at) {
      const start = new Date(activeWorkout.created_at).getTime();
      const tick = () => {
        const diff = Math.max(0, new Date().getTime() - start);
        const s = Math.floor((diff / 1000) % 60)
          .toString()
          .padStart(2, '0');
        const m = Math.floor((diff / 60000) % 60)
          .toString()
          .padStart(2, '0');
        const h = Math.floor(diff / 3600000)
          .toString()
          .padStart(2, '0');
        setElapsedTime(`${h}:${m}:${s}`);
      };
      tick();
      interval = setInterval(tick, 1000);
    } else {
      setElapsedTime('00:00:00');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeWorkout]);

  if (activeWorkout) {
    const exercisesCount = activeWorkout.exercises?.length || 0;
    const setsCount =
      activeWorkout.exercises?.reduce((total, ex) => total + (ex.sets?.length || 0), 0) || 0;

    return (
      <ReanimatedSwipeable
        renderRightActions={(p, d) => (
          <SwipeAction
            progress={p}
            dragX={d}
            onPress={() => onDeleteWorkout(activeWorkout.id)}
            iconName="trash-outline"
          />
        )}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={40}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(active-workout)')}
          activeOpacity={0.9}
        >
          <View style={styles.upperSection}>
            <View style={styles.upperLeft}>
              <View style={styles.intensityHeader}>
                <View style={styles.intensityBars}>
                  {[1, 1, 1].map((opacity, index) => (
                    <View
                      key={index}
                      style={[
                        styles.bar,
                        { opacity, backgroundColor: theme.colors.status.success },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.intensityLabel, { color: theme.colors.status.success }]}>
                  ACTIVE WORKOUT
                </Text>
              </View>
              <View style={styles.intensityTextContainer}>
                <Text style={styles.intensityValue}>{elapsedTime}</Text>
                <Text style={styles.intensitySubtitle} numberOfLines={1}>
                  {activeWorkout.title.toUpperCase()}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.intensityIcon,
                {
                  borderColor: 'rgba(52, 211, 153, 0.3)',
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                },
              ]}
            >
              <Ionicons name="play" size={24} color={theme.colors.status.success} />
            </View>
          </View>

          <View style={styles.lowerSection}>
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <Ionicons name="fitness" size={20} color={theme.colors.status.active} />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>EXERCISES</Text>
                <Text style={styles.metricValue}>{exercisesCount}</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                <Ionicons name="list" size={20} color={theme.colors.status.rest} />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>TOTAL SETS</Text>
                <Text style={styles.metricValue}>{setsCount}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </ReanimatedSwipeable>
    );
  }

  // Check for rest day first (priority)
  if (todayStatus?.workout_status === 'rest_day') {
    return (
      <TouchableOpacity onPress={() => router.push('/(workouts)')} activeOpacity={0.9}>
        <RestDayCard />
      </TouchableOpacity>
    );
  }

  // Also check if rest day is set directly on todayStatus (fallback)
  if (
    todayStatus &&
    typeof todayStatus === 'object' &&
    todayStatus !== null &&
    'is_rest' in todayStatus &&
    todayStatus.is_rest
  ) {
    return (
      <TouchableOpacity onPress={() => router.push('/(workouts)')} activeOpacity={0.9}>
        <RestDayCard />
      </TouchableOpacity>
    );
  }

  // Check for completed workout - Show TrainingIntensityCard instead
  if (todayStatus?.workout_status === 'performed' && todayStatus?.workout) {
    const w = todayStatus.workout;
    return (
      <TouchableOpacity onPress={() => router.push(`/(workouts)/${w.id}`)} activeOpacity={0.9}>
        <TrainingIntensityCard
          intensityScore={todayWorkoutScore ?? 0}
          totalVolume={w.total_volume || 0}
          caloriesBurned={Number(w.calories_burned || 0)}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      ref={startButtonRef}
      style={styles.startCard}
      onPress={onStartWorkoutPress}
      activeOpacity={0.8}
    >
      <View style={styles.upperSection}>
        <View style={styles.upperLeft}>
          <View style={styles.intensityHeader}>
            <View style={styles.intensityBars}>
              {[0.3, 0.5, 0.7].map((opacity, index) => (
                <View key={index} style={[styles.bar, { opacity }]} />
              ))}
            </View>
            <Text style={styles.intensityLabel}>START WORKOUT</Text>
          </View>
          <View style={styles.intensityTextContainer}>
            <Text style={styles.intensitySubtitle}>Tap to begin your session</Text>
          </View>
        </View>
        <View style={styles.intensityIcon}>
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.status.active} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xxl,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    shadowColor: theme.colors.ui.brandGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  upperSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.l,
  },
  upperLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    gap: theme.spacing.s,
  },
  intensityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  intensityBars: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: theme.colors.status.active,
  },
  intensityTextContainer: {
    flex: 1,
  },
  intensityLabel: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  intensityValue: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: '900',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  intensitySubtitle: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  intensityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.ui.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowerSection: {
    flexDirection: 'row',
    gap: theme.spacing.m,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  metricValue: {
    fontSize: theme.typography.sizes.l,
    fontWeight: '900',
    color: theme.colors.text.primary,
  },
  startCard: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xxl,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    shadowColor: theme.colors.ui.brandGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});
