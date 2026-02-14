import { Workout } from '@/api/types/workout';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, Pressable, View } from 'react-native';

interface WorkoutCardProps {
  workout: Workout;
  onOpenMenu: (workout: Workout) => void;
  onViewDetail: (workoutId: number) => void;
}

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  return `${weekday} · ${monthDay}`;
};

const formatVolume = (volume: number) => {
  if (!volume) return '0 kg';
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}t`;
  return `${Math.round(volume)} kg`;
};

const formatDuration = (seconds: number) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function WorkoutCard({ workout, onOpenMenu, onViewDetail }: WorkoutCardProps) {
  const volume = workout.total_volume || 0;
  const dateStr = workout.datetime || workout.created_at;
  const exercises = workout.exercises || [];
  const isRestDay = workout.is_rest_day;
  const totalSets = exercises.reduce((acc: number, ex: any) => acc + (ex.sets?.length || 0), 0);
  const duration = formatDuration(workout.duration || 0);

  if (isRestDay) {
    return (
      <View style={styles.restDayCard}>
        <View style={styles.restDayDot} />
        <Text style={styles.restDayText}>REST DAY</Text>
        <Text style={styles.restDayDate}>{formatDate(dateStr)}</Text>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onViewDetail(workout.id)}
    >
      {/* Header: Date + Menu */}
      <View style={styles.topRow}>
        <Text style={styles.dateText}>{formatDate(dateStr)}</Text>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onOpenMenu(workout);
          }}
          hitSlop={12}
          style={styles.menuButton}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={theme.colors.text.tertiary} />
        </Pressable>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>
        {(workout.title || 'Untitled Workout').toUpperCase()}
      </Text>

      {/* Inline Stats */}
      <View style={styles.statsRow}>
        {duration && (
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={13} color={theme.colors.text.brand} />
            <Text style={styles.statText}>{duration}</Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Ionicons name="barbell-outline" size={13} color={theme.colors.status.warning} />
          <Text style={styles.statText}>{formatVolume(volume)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="layers-outline" size={13} color={theme.colors.status.success} />
          <Text style={styles.statText}>{totalSets} sets</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="fitness-outline" size={13} color={theme.colors.status.rest} />
          <Text style={styles.statText}>{exercises.length} ex</Text>
        </View>
      </View>

      {/* Exercise List Preview */}
      {exercises.length > 0 && (
        <View style={styles.exerciseList}>
          {exercises.slice(0, 3).map((exercise: any, index: number) => {
            const setsCount = exercise.sets?.length || 0;
            const bestWeight = Math.max(...(exercise.sets?.map((s: any) => s.weight || 0) || [0]));
            return (
              <View key={exercise.id || index} style={styles.exerciseRow}>
                <View style={styles.exerciseDot} />
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {exercise.exercise?.name || 'Unknown'}
                </Text>
                <Text style={styles.exerciseStat}>
                  {setsCount} × {bestWeight > 0 ? `${bestWeight}kg` : '—'}
                </Text>
              </View>
            );
          })}
          {exercises.length > 3 && (
            <Text style={styles.moreText}>+{exercises.length - 3} more</Text>
          )}
        </View>
      )}

      {/* Muscle Tags */}
      {workout.primary_muscles_worked && workout.primary_muscles_worked.length > 0 && (
        <View style={styles.muscleRow}>
          {workout.primary_muscles_worked.slice(0, 4).map((muscle: string, idx: number) => (
            <View key={idx} style={styles.muscleChip}>
              <Text style={styles.muscleChipText}>{muscle.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  cardPressed: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
  },
  menuButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
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
  exerciseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.text.tertiary,
    marginRight: 8,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    flex: 1,
    marginRight: 8,
  },
  exerciseStat: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  moreText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    paddingLeft: 12,
    marginTop: 2,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
  },
  muscleChip: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  muscleChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.status.active,
    letterSpacing: 0.8,
  },

  // Rest Day
  restDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  restDayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.text.tertiary,
  },
  restDayText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
  },
  restDayDate: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    marginLeft: 'auto',
  },
});
