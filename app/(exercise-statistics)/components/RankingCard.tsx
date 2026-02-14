import { ExerciseRanking } from '@/api/types/exercise';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface RankingCardProps {
  ranking: ExerciseRanking;
}

export default function RankingCard({ ranking }: RankingCardProps) {
  const topPercent = 100 - (ranking.one_rm_percentile || 0);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.badge}>
          <Ionicons name="ribbon" size={12} color="#000" />
          <Text style={styles.badgeText}>TOP {topPercent}%</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{ranking.percentile_message}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>STRENGTH</Text>
          <Text style={styles.statValue}>{ranking.weight_percentile}%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>USERS</Text>
          <Text style={styles.statValue}>{ranking.total_users}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.status.warning,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
  },
  message: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.ui.border,
  },
});
