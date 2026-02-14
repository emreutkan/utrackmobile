import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, Pressable, View } from 'react-native';

interface ExerciseCardProps {
  exercise: {
    id: number;
    name: string;
    primary_muscle?: string;
    equipment_type?: string;
  };
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Pressable
      style={styles.exerciseCard}
      onPress={() => router.push(`/(exercise-statistics)/${exercise.id}`)}
    >
      <View style={styles.exerciseInfo}>
        <View style={styles.exerciseIcon}>
          <Text style={styles.exerciseInitial}>{exercise.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.exerciseText}>
          <Text style={styles.exerciseName}>{exercise.name.toUpperCase()}</Text>
          <Text style={styles.exerciseDetail}>
            {exercise.primary_muscle?.toUpperCase() || 'MUSCLE'} •{' '}
            {exercise.equipment_type?.toUpperCase() || 'EQUIPMENT'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  exerciseInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  exerciseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  exerciseInitial: {
    color: theme.colors.text.brand,
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  exerciseText: { flex: 1 },
  exerciseName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  exerciseDetail: {
    color: theme.colors.text.tertiary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
