import { CNSRecoveryItem } from '@/api/types';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { formatTimeRemaining, getStatusColor } from '@/utils/recoveryStatusHelpers';

interface CNSCardProps {
  data: CNSRecoveryItem;
}

export default function CNSCard({ data }: CNSCardProps) {
  const pct = Number(data.recovery_percentage);
  const color = getStatusColor(pct);
  const hoursLeft = Number(data.hours_until_recovery);
  const isReady = data.is_recovered || pct >= 90;
  const cnsLoad = Number(data.cns_load);

  const cardBorderColor = isReady ? 'rgba(48,209,88,0.2)' : pct >= 50 ? 'rgba(255,159,10,0.25)' : 'rgba(255,69,58,0.25)';
  const badgeBg = isReady ? 'rgba(48,209,88,0.12)' : pct >= 50 ? 'rgba(255,159,10,0.12)' : 'rgba(255,69,58,0.12)';

  return (
    <View style={[styles.card, { borderColor: cardBorderColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}18`, borderColor: `${color}35` }]}>
          <Ionicons name="pulse" size={20} color={color} />
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.title}>CENTRAL NERVOUS SYSTEM</Text>
          <Text style={styles.subtitle}>Neural Fatigue Monitor</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.statusText, { color }]}>
            {isReady ? 'READY' : formatTimeRemaining(hoursLeft)}
          </Text>
        </View>
      </View>

      {/* Metrics row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>RECOVERY</Text>
          <Text style={[styles.metricValue, { color }]}>
            {pct.toFixed(0)}<Text style={styles.metricUnit}>%</Text>
          </Text>
        </View>
        {cnsLoad > 0 && (
          <View style={[styles.metricBlock, styles.metricBorder]}>
            <Text style={styles.metricLabel}>CNS LOAD</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
              {cnsLoad.toFixed(0)}<Text style={styles.metricUnit}>pts</Text>
            </Text>
          </View>
        )}
        <View style={[styles.metricBlock, styles.metricBorder]}>
          <Text style={styles.metricLabel}>HOURS LEFT</Text>
          <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
            {isReady ? '0' : Math.ceil(hoursLeft).toString()}<Text style={styles.metricUnit}>h</Text>
          </Text>
        </View>
      </View>

      {/* Progress bar */}
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
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.l,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.m,
  },
  metricBlock: {
    flex: 1,
    gap: 3,
  },
  metricBorder: {
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.ui.border,
    paddingLeft: theme.spacing.m,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'normal',
    letterSpacing: 0,
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
});
