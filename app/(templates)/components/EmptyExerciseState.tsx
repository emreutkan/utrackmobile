import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, Pressable, View } from 'react-native';

interface EmptyExerciseStateProps {
  onPress: () => void;
}

export default function EmptyExerciseState({ onPress }: EmptyExerciseStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="barbell-outline" size={32} color={theme.colors.text.zinc700} />
      </View>
      <Text style={styles.emptyText}>NO EXERCISES ADDED</Text>
      <Text style={styles.emptySubtext}>TAP TO START BUILDING YOUR STACK</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderStyle: 'dashed',
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.ui.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text.primary,
    letterSpacing: 1,
  },
  emptySubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
});
