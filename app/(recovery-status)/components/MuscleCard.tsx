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
  const timeDisplay = isReady ? 'Ready' : formatTimeRemaining(hoursLeft);

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.nameContainer}>
            <Text style={styles.muscleName}>{muscle.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.percentageText}>{pct.toFixed(0)}%</Text>
          <Text style={styles.timeText}>{timeDisplay}</Text>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
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
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  cardLeft: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text.primary,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  progressContainer: {},
  track: {
    height: 4,
    backgroundColor: theme.colors.ui.progressBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
