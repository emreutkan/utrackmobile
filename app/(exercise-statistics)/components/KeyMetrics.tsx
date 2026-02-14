import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface KeyMetricsProps {
  best1RM: number;
  progressionPct: number;
}

export default function KeyMetrics({ best1RM, progressionPct }: KeyMetricsProps) {
  const isPositive = progressionPct >= 0;
  const progressColor = isPositive ? theme.colors.status.success : theme.colors.status.error;

  return (
    <View style={styles.row}>
      {/* Personal Best */}
      <View style={[styles.card, styles.pbCard]}>
        <View style={styles.cardHeader}>
          <Ionicons name="trophy" size={14} color={theme.colors.status.warning} />
          <Text style={styles.cardLabel}>BEST 1RM</Text>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.bigValue}>{best1RM.toFixed(1)}</Text>
          <Text style={styles.unit}>kg</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={progressColor}
          />
          <Text style={styles.cardLabel}>PROGRESS</Text>
        </View>
        <View style={styles.valueRow}>
          <Text style={[styles.bigValue, { color: progressColor, fontSize: 26 }]}>
            {isPositive ? '+' : ''}{progressionPct.toFixed(1)}
          </Text>
          <Text style={[styles.unit, { color: progressColor }]}>%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  pbCard: {
    flex: 1.4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bigValue: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
  },
});
