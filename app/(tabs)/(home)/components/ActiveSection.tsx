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
      {/* Backdrop overlay - positioned absolutely */}
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsExpanded(false)} />
      </Animated.View>

      {/* Start workout card */}
      <View style={styles.cardContainer}>
        {/* Hidden measurement view - positioned absolutely to measure at natural size */}
        <View
          style={styles.measurementContainer}
          onLayout={(e) => {
            if (optionsHeight === 0) {
              setOptionsHeight(e.nativeEvent.layout.height);
            }
          }}
        >
          <View style={styles.optionButton}>
            <Text style={styles.optionText}>Start Workout</Text>
          </View>
          <View style={styles.optionDivider} />
          <View style={styles.optionButton}>
            <Text style={styles.optionText}>Log Past Workout</Text>
          </View>
          <View style={styles.optionDivider} />
          <View style={styles.optionButton}>
            <Text style={styles.optionText}>Add Rest Day</Text>
          </View>
        </View>

        <Pressable onPress={() => setIsExpanded(!isExpanded)}>
          <Animated.View
            style={[styles.startCard, cardStyle, isExpanded && styles.startCardExpanded]}
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
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'add-circle-outline'}
                  size={24}
                  color={theme.colors.status.active}
                />
              </View>
            </View>

            <Animated.View style={[styles.expandedOptions, optionsContainerStyle]}>
              <Animated.View style={option1Style}>
                <Pressable
                  style={({ pressed }) => [
                    styles.optionButton,
                    pressed && styles.optionButtonPressed,
                  ]}
                  onPress={() => {
                    setIsExpanded(false);
                    onNewWorkout();
                  }}
                >
                  <Text style={styles.optionText}>Start Workout</Text>
                </Pressable>
              </Animated.View>

              <View style={styles.optionDivider} />

              <Animated.View style={option2Style}>
                <Pressable
                  style={({ pressed }) => [
                    styles.optionButton,
                    pressed && styles.optionButtonPressed,
                  ]}
                  onPress={() => {
                    setIsExpanded(false);
                    onLogPrevious();
                  }}
                >
                  <Text style={styles.optionText}>Log Past Workout</Text>
                </Pressable>
              </Animated.View>

              <View style={styles.optionDivider} />

              <Animated.View style={option3Style}>
                <Pressable
                  style={({ pressed }) => [
                    styles.optionButton,
                    pressed && styles.optionButtonPressed,
                  ]}
                  onPress={() => {
                    setIsExpanded(false);
                    onRestDay();
                  }}
                >
                  <Text style={styles.optionText}>Add Rest Day</Text>
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
    overflow: 'hidden',
  },
  startCardExpanded: {
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
    borderColor: 'rgba(99, 102, 241, 0.5)',
    borderWidth: 1.5,
  },
  expandedOptions: {
    marginTop: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.s,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'transparent',
  },
  optionButtonPressed: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  optionIconSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  optionIconWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  optionIconRest: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  optionTextContainer: {
    flex: 1,
    gap: 2,
  },
  optionText: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  optionSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
  },
  optionDivider: {
    height: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    marginVertical: 4,
    marginHorizontal: theme.spacing.s,
  },
  measurementContainer: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
    marginTop: theme.spacing.m,
    paddingTop: theme.spacing.m,
    width: '100%',
  },
});
