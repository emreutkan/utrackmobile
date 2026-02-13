import { ExerciseRanking } from '@/api/types/exercise';
import { theme } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

interface RankingCardProps {
  ranking: ExerciseRanking;
}

export default function RankingCard({ ranking }: RankingCardProps) {
  return (
    <View style={styles.rankingCard}>
      <View style={styles.rankingHeader}>
        <View style={styles.rankingBadge}>
          <Text style={styles.rankingBadgeText}>TOP {100 - (ranking.one_rm_percentile || 0)}%</Text>
        </View>
        <Text style={styles.rankingMessage}>{ranking.percentile_message}</Text>
      </View>
      <View style={styles.rankingStats}>
        <View style={styles.rankingStat}>
          <Text style={styles.rankingStatLabel}>GLOBAL RANK</Text>
          <Text style={styles.rankingStatValue}>STRENGTH: {ranking.weight_percentile}%</Text>
        </View>
        <View style={styles.rankingStat}>
          <Text style={styles.rankingStatLabel}>TOTAL USERS</Text>
          <Text style={styles.rankingStatValue}>{ranking.total_users}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rankingCard: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  rankingBadge: {
    backgroundColor: theme.colors.status.warning,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rankingBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    fontStyle: 'italic',
  },
  rankingMessage: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  rankingStats: {
    flexDirection: 'row',
    gap: 20,
  },
  rankingStat: {
    flex: 1,
  },
  rankingStatLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rankingStatValue: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
  },
});
