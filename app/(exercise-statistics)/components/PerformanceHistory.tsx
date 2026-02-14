import { theme } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

interface PerformanceHistoryProps {
  recentPerformance: any[];
}

export default function PerformanceHistory({ recentPerformance }: PerformanceHistoryProps) {
  if (recentPerformance.length === 0) return null;

  return (
    <View>
      <Text style={styles.sectionLabel}>RECENT SETS</Text>
      <View style={styles.list}>
        {recentPerformance.map((set, idx) => {
          const date = new Date(set.workout_date);
          const day = date.getDate();
          const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          return (
            <View key={idx} style={styles.item}>
              <View style={styles.dateBox}>
                <Text style={styles.dateDay}>{day}</Text>
                <Text style={styles.dateMonth}>{month}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.workoutTitle} numberOfLines={1}>
                  {set.workout_title || 'Workout'}
                </Text>
                <Text style={styles.setMeta}>
                  SET {set.set_number}{set.is_warmup ? ' · WARMUP' : ''}
                </Text>
              </View>
              <View style={styles.valueGroup}>
                <Text style={styles.weight}>{set.weight}</Text>
                <Text style={styles.unit}>kg</Text>
                <Text style={styles.times}>×</Text>
                <Text style={styles.reps}>{set.reps}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  list: {
    gap: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    gap: 10,
  },
  dateBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.ui.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  dateDay: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text.primary,
  },
  dateMonth: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    marginTop: -1,
  },
  info: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  setMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  weight: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
  },
  times: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    marginHorizontal: 2,
  },
  reps: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
});
