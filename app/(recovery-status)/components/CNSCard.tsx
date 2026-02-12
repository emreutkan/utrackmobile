import { CNSRecoveryItem } from '@/api/types';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { formatTimeRemaining, getStatusColor } from './helpers';

interface CNSCardProps {
  data: CNSRecoveryItem;
}

export default function CNSCard({ data }: CNSCardProps) {
  const pct = Number(data.recovery_percentage);
  const color = getStatusColor(pct);
  const hoursLeft = Number(data.hours_until_recovery);
  const isReady = data.is_recovered || pct >= 90;

  return (
    <View style={[styles.card, styles.cnsCard, !isReady && styles.cardActive]}>
      <View style={styles.cardHeader}>
        <View style={styles.nameContainer}>
          <Ionicons name="pulse" size={16} color={color} />
          <Text style={styles.muscleName}>Central Nervous System</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: isReady ? 'rgba(48,209,88,0.1)' : 'rgba(255,159,10,0.1)' },
          ]}
        >
          <Text style={[styles.badgeText, { color: isReady ? '#30D158' : '#FF9F0A' }]}>
            {isReady ? 'Ready' : formatTimeRemaining(hoursLeft)}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.pctText}>{pct.toFixed(0)}% Recovered</Text>
        {!isReady && data.cns_load > 0 && (
          <View style={styles.fatigueRow}>
            <Ionicons name="flash" size={12} color="#8E8E93" />
            <Text style={styles.fatigueText}>Load: {data.cns_load.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.l,
  },
  cnsCard: {
    borderColor: 'rgba(99,102,241,0.2)',
  },
  cardActive: {
    borderWidth: 2,
    borderColor: theme.colors.status.warning,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  muscleName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  badge: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.m,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressContainer: {
    marginBottom: theme.spacing.s,
  },
  track: {
    height: 6,
    backgroundColor: theme.colors.ui.progressBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pctText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  fatigueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fatigueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  },
});
