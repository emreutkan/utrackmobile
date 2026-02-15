import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface ProgressCardProps {
  loggedCount: number;
  totalCount: number;
}

export default function ProgressCard({ loggedCount, totalCount }: ProgressCardProps) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressLeft}>
        <Text style={styles.progressLabel}>TODAY&apos;S PROGRESS</Text>
        <View style={styles.progressCount}>
          <Text style={styles.progressNumber}>
            {loggedCount}/{totalCount}
          </Text>
          <Text style={styles.progressText}> LOGGED</Text>
        </View>
      </View>
      <View style={styles.progressIcon}>
        <View style={styles.progressIconContainer}>
          <Ionicons name="sparkles" size={24} color={theme.colors.status.active} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  progressLeft: {
    flex: 1,
  },
  progressLabel: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    marginBottom: theme.spacing.s,
  },
  progressCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    fontVariant: ['tabular-nums'],
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
  },
  progressIcon: {},
  progressIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
});
