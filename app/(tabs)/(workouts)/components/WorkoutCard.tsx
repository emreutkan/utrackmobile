import { Workout } from '@/api/types/workout';
import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { formatWorkoutDate, formatWorkoutVolume } from '@/utils/workoutFormatters';

interface WorkoutCardProps {
  workout: Workout;
  onOpenMenu: (workout: Workout) => void;
  onViewDetail: (workoutId: number) => void;
}

export default function WorkoutCard({ workout, onOpenMenu, onViewDetail }: WorkoutCardProps) {
  const volume = workout.total_volume || 0;
  const dateStr = workout.datetime || workout.created_at;
  const exercises = workout.exercises || [];
  const isRestDay = workout.is_rest_day;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
          <Text style={styles.dateText}>{formatWorkoutDate(dateStr)}</Text>
        </View>
        {!isRestDay && (
          <View style={styles.cardTopRight}>
            <Pressable onPress={() => onOpenMenu(workout)} style={styles.moreButton}>
              <Ionicons
                name="ellipsis-horizontal"
                size={20}
                color={theme.colors.text.tertiary}
              />
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.workoutTitle} numberOfLines={1}>
          {isRestDay ? 'rest day' : workout.title || 'Untitled Workout'}
        </Text>
        {!isRestDay && (
          <View style={styles.volumeBadge}>
            <Text style={styles.volumeValue}>{formatWorkoutVolume(volume)}</Text>
          </View>
        )}
      </View>

      {!isRestDay && exercises.length > 0 && (
        <View style={styles.exercisesList}>
          {exercises.slice(0, 3).map((exercise, index) => {
            const setsCount = exercise.sets?.length || 0;
            return (
              <View key={exercise.id || index} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>
                  {exercise.exercise?.name || 'Unknown'}
                </Text>
                <Text style={styles.exerciseSets}>{setsCount} SETS</Text>
              </View>
            );
          })}
          {exercises.length > 3 && (
            <Text style={styles.moreExercises}>+{exercises.length - 3} more exercises</Text>
          )}
        </View>
      )}

      {!isRestDay && (
        <Pressable
          style={styles.viewDetailButton}
          onPress={() => onViewDetail(workout.id)}
        >
          <Text style={styles.viewDetailText}>VIEW DETAIL</Text>
          <Ionicons
            name="arrow-up"
            size={16}
            color={theme.colors.status.active}
            style={{ transform: [{ rotate: '45deg' }] }}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dateText: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    padding: 4,
    marginRight: -4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  workoutTitle: {
    ...typographyStyles.h3,
    fontSize: 20,
    flex: 1,
  },
  volumeBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  volumeValue: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text.brand,
  },
  exercisesList: {
    marginBottom: theme.spacing.m,
    gap: 6,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    flex: 1,
  },
  exerciseSets: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
  },
  moreExercises: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  viewDetailButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: theme.spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui.border,
  },
  viewDetailText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: theme.colors.status.active,
  },
});
