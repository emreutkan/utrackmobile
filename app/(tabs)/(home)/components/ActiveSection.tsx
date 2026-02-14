import { Workout } from '@/api/types/index';
import TrainingIntensityCard from './TrainingIntensityCard';
import { RestDayCard } from './WorkoutModal';
import { theme } from '@/constants/theme';
import { useDateStore } from '@/state/userStore';
import { useTodayStatus, useActiveWorkout, useWorkoutSummary } from '@/hooks/useWorkout';
import { ActiveSectionSkeleton } from './homeLoadingSkeleton';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SwipeAction } from '@/components/shared/SwipeAction';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ActiveSectionProps {
  onDeleteWorkout: (id: number) => void;
  onNewWorkout: () => void;
  onLogPrevious: () => void;
  onRestDay: () => void;
}

export default function ActiveSection({
  onDeleteWorkout,
  onNewWorkout,
  onLogPrevious,
  onRestDay,
}: ActiveSectionProps) {
  const selectedDate = useDateStore((state) => state.today);
  const { data: todayStatus, isLoading: todayStatusLoading } = useTodayStatus(selectedDate);
  const isSelectedToday = selectedDate.toDateString() === new Date().toDateString();
  const {
    data: activeWorkoutData,
    isLoading: activeWorkoutLoading,
  } = useActiveWorkout();

  // Get today's workout ID if it exists and is completed
  const todayWorkoutId =
    todayStatus?.workout_status === 'performed' && todayStatus?.workout
      ? (todayStatus.workout as Workout).id
      : null;

  const { data: workoutSummary } = useWorkoutSummary(todayWorkoutId);

  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [isExpanded, setIsExpanded] = useState(false);
  const [optionsHeight, setOptionsHeight] = useState(0);

  // Animated value
  const animationProgress = useSharedValue(0);

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
  // No refetch on focus: active-workout is shared cache; mutations invalidate when needed

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

  // Animation effect for expansion
  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    animationProgress.value = withTiming(isExpanded ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isExpanded]);

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(animationProgress.value, [0, 1], [0, 0.75]);
    return {
      opacity,
      pointerEvents: animationProgress.value > 0 ? 'auto' : 'none',
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    const scale = interpolate(animationProgress.value, [0, 1], [1, 1.01]);
    return {
      transform: [{ scale }],
    };
  });

  const optionsContainerStyle = useAnimatedStyle(() => {
    const height =
      optionsHeight > 0 ? interpolate(animationProgress.value, [0, 1], [0, optionsHeight]) : 0;
    const opacity = interpolate(animationProgress.value, [0, 0.3, 1], [0, 0, 1]);
    return {
      height,
      opacity,
      overflow: 'hidden',
    };
  });

  // Staggered animations for each option
  const option1Style = useAnimatedStyle(() => {
    const opacity = interpolate(animationProgress.value, [0, 0.4, 0.7], [0, 0, 1]);
    const translateY = interpolate(animationProgress.value, [0, 0.7], [-15, 0]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const option2Style = useAnimatedStyle(() => {
    const opacity = interpolate(animationProgress.value, [0, 0.5, 0.8], [0, 0, 1]);
    const translateY = interpolate(animationProgress.value, [0, 0.8], [-15, 0]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const option3Style = useAnimatedStyle(() => {
    const opacity = interpolate(animationProgress.value, [0, 0.6, 0.9], [0, 0, 1]);
    const translateY = interpolate(animationProgress.value, [0, 0.9], [-15, 0]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  if (todayStatusLoading || (isSelectedToday && activeWorkoutLoading)) {
    return <ActiveSectionSkeleton />;
  }

  // Only show active workout card when the selected date is actually today
  if (isSelectedToday && activeWorkout) {
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
        <Pressable style={styles.card} onPress={() => router.push('/(active-workout)')}>
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
        </Pressable>
      </ReanimatedSwipeable>
    );
  }

  // Check for rest day first (priority)
  if (todayStatus?.workout_status === 'rest_day') {
    return <RestDayCard />;
  }

  // Also check if rest day is set directly on todayStatus (fallback)
  if (
    todayStatus &&
    typeof todayStatus === 'object' &&
    todayStatus !== null &&
    'is_rest' in todayStatus &&
    todayStatus.is_rest
  ) {
    return <RestDayCard />;
  }

  // Check for completed workout - Show TrainingIntensityCard instead
  if (todayStatus?.workout_status === 'performed' && todayStatus?.workout) {
    const w = todayStatus.workout;
    return (
      <TrainingIntensityCard
        intensityScore={todayWorkoutScore ?? 0}
        totalVolume={w.total_volume || 0}
        caloriesBurned={Number(w.calories_burned || 0)}
      />
    );
  }

  // START WORKOUT BUTTON with expansion effect
  return (
    <>
      {/* Backdrop overlay */}
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsExpanded(false)} />
      </Animated.View>

      <View style={styles.cardContainer}>
        {/* Hidden measurement view for height calculation */}
        <View
          style={styles.measurementContainer}
          onLayout={(e) => {
            if (optionsHeight === 0) {
              setOptionsHeight(e.nativeEvent.layout.height);
            }
          }}
        >
          <View style={styles.optionRow}>
            <View style={styles.optionIconWrap}>
              <Ionicons name="flash" size={14} color={theme.colors.status.success} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Start Workout</Text>
              <Text style={styles.optionSubtext}>Begin a new session</Text>
            </View>
          </View>
          <View style={styles.optionRow}>
            <View style={styles.optionIconWrap}>
              <Ionicons name="time" size={14} color={theme.colors.status.warning} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Log Past Workout</Text>
              <Text style={styles.optionSubtext}>Record a previous session</Text>
            </View>
          </View>
          <View style={styles.optionRow}>
            <View style={styles.optionIconWrap}>
              <Ionicons name="moon" size={14} color={theme.colors.status.rest} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Add Rest Day</Text>
              <Text style={styles.optionSubtext}>Mark today as recovery</Text>
            </View>
          </View>
        </View>

        <Pressable onPress={() => setIsExpanded(!isExpanded)}>
          <Animated.View
            style={[styles.startCard, cardStyle, isExpanded && styles.startCardExpanded]}
          >
            <View style={styles.startHeader}>
              <View style={styles.startHeaderLeft}>
                <View style={styles.intensityBars}>
                  {[0.3, 0.5, 0.7].map((opacity, index) => (
                    <View key={index} style={[styles.bar, { opacity }]} />
                  ))}
                </View>
                <Text style={styles.startLabel}>START WORKOUT</Text>
              </View>
              <View style={[styles.startIcon, isExpanded && styles.startIconActive]}>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'add'}
                  size={18}
                  color={isExpanded ? theme.colors.text.primary : theme.colors.status.active}
                />
              </View>
            </View>

            <Animated.View
              style={[styles.expandedOptions, optionsContainerStyle]}
              pointerEvents={isExpanded ? 'auto' : 'none'}
            >
              <Animated.View style={option1Style}>
                <Pressable
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && styles.optionRowPressed,
                  ]}
                  onPress={() => {
                    setIsExpanded(false);
                    onNewWorkout();
                  }}
                >
                  <View style={[styles.optionIconWrap, styles.optionIconSuccess]}>
                    <Ionicons name="flash" size={14} color={theme.colors.status.success} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionText}>Start Workout</Text>
                    <Text style={styles.optionSubtext}>Begin a new session</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.colors.text.tertiary} />
                </Pressable>
              </Animated.View>

              <Animated.View style={option2Style}>
                <Pressable
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && styles.optionRowPressed,
                  ]}
                  onPress={() => {
                    setIsExpanded(false);
                    onLogPrevious();
                  }}
                >
                  <View style={[styles.optionIconWrap, styles.optionIconWarning]}>
                    <Ionicons name="time" size={14} color={theme.colors.status.warning} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionText}>Log Past Workout</Text>
                    <Text style={styles.optionSubtext}>Record a previous session</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.colors.text.tertiary} />
                </Pressable>
              </Animated.View>

              <Animated.View style={option3Style}>
                <Pressable
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && styles.optionRowPressed,
                  ]}
                  onPress={() => {
                    setIsExpanded(false);
                    onRestDay();
                  }}
                >
                  <View style={[styles.optionIconWrap, styles.optionIconRest]}>
                    <Ionicons name="moon" size={14} color={theme.colors.status.rest} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionText}>Add Rest Day</Text>
                    <Text style={styles.optionSubtext}>Mark today as recovery</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.colors.text.tertiary} />
                </Pressable>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  cardContainer: {
    zIndex: 2,
  },
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xxl,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    elevation: 4,
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

  // Start workout card styles
  startCard: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    overflow: 'hidden',
  },
  startCardExpanded: {
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  startHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    flex: 1,
  },
  startLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  startIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.ui.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startIconActive: {
    backgroundColor: theme.colors.status.active,
    borderColor: theme.colors.status.active,
  },
  expandedOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui.border,
    gap: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: theme.borderRadius.m,
  },
  optionRowPressed: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  optionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionIconSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  optionIconWarning: {
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    borderColor: 'rgba(255, 159, 10, 0.2)',
  },
  optionIconRest: {
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
    borderColor: 'rgba(192, 132, 252, 0.2)',
  },
  optionContent: {
    flex: 1,
    gap: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  optionSubtext: {
    fontSize: 11,
    fontWeight: '400',
    color: theme.colors.text.tertiary,
  },
  measurementContainer: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
    marginTop: 12,
    paddingTop: 12,
    width: '100%',
  },
});
