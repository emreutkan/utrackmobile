import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface OneRMHistoryProps {
  history: any[];
  best1RM: number;
}

export default function OneRMHistory({ history, best1RM }: OneRMHistoryProps) {
  return (
    <View>
      <Text style={styles.sectionLabel}>1RM HISTORY</Text>
      <View style={styles.list}>
        {history.map((entry, idx) => {
          const date = new Date(entry.workout_date);
          const day = date.getDate();
          const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          const isPB = entry.one_rep_max >= best1RM && idx < 3;

          return (
            <View key={idx} style={styles.item}>
              <View style={styles.dateBox}>
                <Text style={styles.dateDay}>{day}</Text>
                <Text style={styles.dateMonth}>{month}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.workoutTitle} numberOfLines={1}>
                  {entry.workout_title}
                </Text>
                <View style={styles.badgeRow}>
                  {isPB && (
                    <View style={styles.pbBadge}>
                      <Ionicons name="star" size={8} color="#000" />
                      <Text style={styles.pbText}>PB</Text>
                    </View>
                  )}
                  <Text style={styles.year}>{date.getFullYear()}</Text>
                </View>
              </View>
              <View style={styles.valueGroup}>
                <Text style={styles.rmValue}>{entry.one_rep_max.toFixed(1)}</Text>
                <Text style={styles.unit}>kg</Text>
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.status.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  pbText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
  },
  year: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  rmValue: {
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
});
