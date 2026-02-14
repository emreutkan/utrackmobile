import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, Pressable, View } from 'react-native';

export default function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="barbell-outline" size={48} color={theme.colors.text.tertiary} />
      </View>
      <Text style={styles.emptyText}>NO DATA YET</Text>
      <Text style={styles.emptySubtext}>
        Complete workouts with this exercise to track your performance.
      </Text>
      <Pressable style={styles.emptyButton} onPress={() => router.replace('/(home)')}>
        <Text style={styles.emptyButtonText}>START TRAINING</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.colors.text.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    fontStyle: 'italic',
  },
});
