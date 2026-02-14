import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, Pressable, View } from 'react-native';

interface StatisticsHeaderProps {
  exerciseName?: string;
  onRefresh: () => void;
}

export default function StatisticsHeader({ exerciseName, onRefresh }: StatisticsHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
      </Pressable>
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {exerciseName?.toUpperCase() || 'STATISTICS'}
        </Text>
        <Text style={styles.subtitle}>PERFORMANCE ANALYSIS</Text>
      </View>
      <Pressable onPress={onRefresh} style={styles.refreshButton}>
        <Ionicons name="refresh" size={18} color={theme.colors.text.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 2,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
