import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface ComparisonRow {
  feature: string;
  free: string;
  pro: string;
  isFreePartial?: boolean; // true = free gets something but limited
}

const ROWS: ComparisonRow[] = [
  { feature: '1RM HISTORY', free: '30 DAYS', pro: 'FULL', isFreePartial: true },
  { feature: 'VOLUME ANALYSIS', free: '4 WEEKS', pro: '12 WEEKS', isFreePartial: true },
  { feature: 'CNS RECOVERY', free: '—', pro: 'YES' },
  { feature: 'RECOVERY TIPS', free: '—', pro: 'YES' },
  { feature: 'REST & FREQ. TIPS', free: '—', pro: 'YES' },
  { feature: 'TRAINING RESEARCH', free: '—', pro: 'YES' },
  { feature: 'WORKOUT INSIGHTS', free: '—', pro: 'YES' },
];

export default function ComparisonTable() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>FREE VS PRO</Text>
      <View style={styles.card}>
        {/* Column headers */}
        <View style={styles.headerRow}>
          <View style={styles.featureCol} />
          <View style={styles.valueCol}>
            <Text style={styles.colHeaderFree}>FREE</Text>
          </View>
          <View style={styles.valueCol}>
            <Text style={styles.colHeaderPro}>PRO</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Data rows */}
        {ROWS.map((row, index) => (
          <View
            key={index}
            style={[styles.row, index < ROWS.length - 1 && styles.rowBorder]}
          >
            <View style={styles.featureCol}>
              <Text style={styles.featureName}>{row.feature}</Text>
            </View>
            <View style={styles.valueCol}>
              <Text style={[styles.freeVal, row.isFreePartial && styles.freeValPartial]}>
                {row.free}
              </Text>
            </View>
            <View style={[styles.valueCol, styles.proValCol]}>
              {row.pro === 'YES' ? (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={theme.colors.status.success}
                />
              ) : (
                <Text style={styles.proVal}>{row.pro}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3.6,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.m,
    marginLeft: 4,
  },
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.ui.border,
  },
  colHeaderFree: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  colHeaderPro: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.status.rest,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 11,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
  },
  featureCol: {
    flex: 1,
  },
  valueCol: {
    width: 72,
    alignItems: 'center',
  },
  proValCol: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(192, 132, 252, 0.15)',
    backgroundColor: 'rgba(192, 132, 252, 0.04)',
  },
  featureName: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: theme.colors.text.secondary,
  },
  freeVal: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: theme.colors.text.tertiary,
  },
  freeValPartial: {
    color: theme.colors.status.warning,
    opacity: 0.7,
  },
  proVal: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: theme.colors.status.success,
  },
});
