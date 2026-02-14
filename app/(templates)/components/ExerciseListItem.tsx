import { Exercise } from '@/api/types/workout';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, Pressable, View } from 'react-native';

interface ExerciseListItemProps {
  exercise: Exercise;
  index: number;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export default function ExerciseListItem({
  exercise,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ExerciseListItemProps) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseIndex}>
        <Text style={styles.exerciseIndexText}>{index + 1}</Text>
      </View>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name.toUpperCase()}</Text>
        <Text style={styles.exerciseTag}>
          {exercise.primary_muscle?.toUpperCase() || 'STRENGTH'}
          {exercise.equipment_type ? ` • ${exercise.equipment_type.toUpperCase()}` : ''}
        </Text>
      </View>
      <View style={styles.exerciseActions}>
        <Pressable
          onPress={onMoveUp}
          disabled={index === 0}
          style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]}
        >
          <Ionicons name="chevron-up" size={20} color={theme.colors.text.secondary} />
        </Pressable>
        <Pressable
          onPress={onMoveDown}
          disabled={index === totalCount - 1}
          style={[styles.orderButton, index === totalCount - 1 && styles.orderButtonDisabled]}
        >
          <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
        </Pressable>
        <Pressable onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={18} color={theme.colors.status.error} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  exerciseIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  exerciseIndexText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text.secondary,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  exerciseTag: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderButton: {
    padding: 6,
  },
  orderButtonDisabled: {
    opacity: 0.2,
  },
  removeButton: {
    padding: 6,
    marginLeft: 4,
  },
});
