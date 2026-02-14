import { Workout } from '@/api/types/workout';
import { theme } from '@/constants/theme';
import { useActiveWorkout, useDeleteWorkout, useInfiniteWorkouts } from '@/hooks/useWorkout';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WorkoutCard from './components/WorkoutCard';
import WorkoutOptionsModal from './components/WorkoutOptionsModal';
import WorkoutsEmptyState from './components/WorkoutsEmptyState';
import WorkoutsHeader from './components/WorkoutsHeader';

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  const {
    data: workoutsPages,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchWorkouts,
  } = useInfiniteWorkouts(20);

  const { data: activeWorkoutData, refetch: refetchActiveWorkout } = useActiveWorkout();
  const deleteWorkoutMutation = useDeleteWorkout();

  const activeWorkoutId =
    activeWorkoutData && typeof activeWorkoutData === 'object' && 'id' in activeWorkoutData
      ? Number(activeWorkoutData.id)
      : null;

  const workouts = useMemo(() => {
    return workoutsPages?.pages.flatMap((page) => page.results ?? []) ?? [];
  }, [workoutsPages]);

  const sortedWorkouts = useMemo(() => {
    return [...workouts]
      .filter((workout) => workout.id !== activeWorkoutId)
      .sort(
        (a, b) =>
          new Date(b.datetime || b.created_at).getTime() -
          new Date(a.datetime || a.created_at).getTime()
      );
  }, [workouts, activeWorkoutId]);

  useFocusEffect(
    useCallback(() => {
      refetchWorkouts();
    }, [refetchWorkouts])
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchActiveWorkout(), refetchWorkouts()]);
  }, [refetchActiveWorkout, refetchWorkouts]);

  const handleOpenMenu = useCallback((workout: Workout) => {
    setSelectedWorkout(workout);
    setIsMenuVisible(true);
  }, []);

  const handleDeleteWorkout = useCallback(
    (workoutId: number) => {
      Alert.alert('Delete Workout', 'Are you sure? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkoutMutation.mutateAsync(workoutId);
              setSelectedWorkout(null);
            } catch {
              Alert.alert('Error', 'Failed to delete workout.');
            }
          },
        },
      ]);
    },
    [deleteWorkoutMutation]
  );


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      <WorkoutsHeader />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.status.active} />
        </View>
      ) : (
        <FlatList
          data={sortedWorkouts}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onOpenMenu={handleOpenMenu}
              onViewDetail={(workoutId) => router.push(`/(workouts)/${workoutId}`)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage}
              onRefresh={handleRefresh}
              tintColor={theme.colors.status.active}
            />
          }
          ListEmptyComponent={<WorkoutsEmptyState />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={{ padding: 20 }} color={theme.colors.status.active} />
            ) : null
          }
        />
      )}


      <WorkoutOptionsModal
        visible={isMenuVisible}
        workoutId={selectedWorkout?.id ?? null}
        onClose={() => setIsMenuVisible(false)}
        onViewSummary={(workoutId) =>
          router.push(`/(workout-summary)/workoutsummary?workoutId=${workoutId}`)
        }
        onEditWorkout={(workoutId) => router.push(`/(workouts)/${workoutId}`)}
        onDeleteWorkout={handleDeleteWorkout}
      />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 0,
  },
});
