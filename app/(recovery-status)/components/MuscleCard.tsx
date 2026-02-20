import { MuscleRecoveryItem } from '@/api/types';
import { theme } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import { formatTimeRemaining, getStatusColor } from '@/utils/recoveryStatusHelpers';

interface MuscleCardProps {
  muscle: string;
  data: MuscleRecoveryItem;
}

export default function MuscleCard({ muscle, data }: MuscleCardProps) {
  const pct = Number(data.recovery_percentage);
  const color = getStatusColor(pct);
  const hoursLeft = Number(data.hours_until_recovery);
  const isReady = data.is_recovered || pct >= 90;
  const timeDisplay = isReady ? 'READY' : formatTimeRemaining(hoursLeft);
  const sets = data.total_sets;
  const label = muscle.replace(/_/g, ' ').toUpperCase();

  const badgeBg = isReady
    ? 'rgba(48,209,88,0.12)'
    : pct >= 50
      ? 'rgba(255,159,10,0.12)'
      : 'rgba(255,69,58,0.12)';

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.muscleName}>{label}</Text>
          {sets > 0 && (
            <Text style={styles.setsLabel}>{sets} SETS</Text>
          )}
        </View>
        <View style={styles.right}>
          <Text style={[styles.pct, { color }]}>
            {pct.toFixed(0)}<Text style={styles.pctUnit}>%</Text>
          </Text>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color }]}>{timeDisplay}</Text>
          </View>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  muscleName: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: 0.4,
  },
  setsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.8,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pct: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  pctUnit: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'normal',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  track: {
    height: 5,
    backgroundColor: theme.colors.ui.progressBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
