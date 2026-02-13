import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function WorkoutsEmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="barbell" size={64} color={theme.colors.ui.border} />
      <Text style={styles.emptyTitle}>No Workouts Yet</Text>
      <Text style={styles.emptyText}>Start a new workout to track your progress.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
