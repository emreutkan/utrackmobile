import type { OverloadTrendResponse } from '@/api/types/volume';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface Props {
  data: OverloadTrendResponse;
}

const TREND_CONFIG = {
  progressing: {
    icon: 'trending-up' as const,
    color: theme.colors.status.success,
    label: 'PROGRESSING',
  },
  stagnating: {
    icon: 'remove' as const,
    color: theme.colors.status.warning,
    label: 'STAGNATING',
  },
  regressing: {
    icon: 'trending-down' as const,
    color: theme.colors.status.error,
    label: 'REGRESSING',
  },
  insufficient_data: {
    icon: 'help-circle' as const,
    color: theme.colors.text.tertiary,
    label: 'NOT ENOUGH DATA',
  },
} as const;

export default function OverloadTrendCard({ data }: Props) {
  const config = TREND_CONFIG[data.trend];
  const hasPoints = data.data_points.length >= 2;

  // Normalise points for the mini line chart
  const minVal = hasPoints ? Math.min(...data.data_points.map((p) => p.one_rep_max)) : 0;
  const maxVal = hasPoints ? Math.max(...data.data_points.map((p) => p.one_rep_max)) : 1;
  const range = maxVal - minVal || 1;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${config.color}15`, borderColor: `${config.color}30` },
            ]}
          >
            <Ionicons name={config.icon} size={18} color={config.color} />
          </View>
          <View>
            <Text style={styles.cardTitle}>OVERLOAD TREND</Text>
            <Text style={styles.cardSubtitle}>PROGRESSIVE OVERLOAD ANALYSIS</Text>
          </View>
        </View>
        <View style={[styles.trendBadge, { backgroundColor: `${config.color}15`, borderColor: `${config.color}35` }]}>
          <Text style={[styles.trendBadgeText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>

      {/* Stats row */}
      {data.change_kg !== null && data.change_percent !== null && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: data.change_kg >= 0 ? theme.colors.status.success : theme.colors.status.error }]}>
              {data.change_kg >= 0 ? '+' : ''}{data.change_kg.toFixed(1)}
            </Text>
            <Text style={styles.statUnit}>kg</Text>
            <Text style={styles.statLabel}>CHANGE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: data.change_percent >= 0 ? theme.colors.status.success : theme.colors.status.error }]}>
              {data.change_percent >= 0 ? '+' : ''}{data.change_percent.toFixed(1)}
            </Text>
            <Text style={styles.statUnit}>%</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.weeks_analyzed}</Text>
            <Text style={styles.statUnit}>wk</Text>
            <Text style={styles.statLabel}>PERIOD</Text>
          </View>
        </View>
      )}

      {/* Mini bar chart */}
      {hasPoints && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScroll}
        >
          {data.data_points.map((point, i) => {
            const heightPct = ((point.one_rep_max - minVal) / range) * 80 + 10; // 10-90%
            return (
              <View key={i} style={styles.barWrapper}>
                <Text style={styles.barValue}>{point.one_rep_max.toFixed(0)}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${heightPct}%`, backgroundColor: config.color },
                    ]}
                  />
                </View>
                <Text style={styles.barDate}>{formatDate(point.date)}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Message */}
      <Text style={styles.message}>{data.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  trendBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: theme.colors.ui.border },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    marginTop: -2,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.8,
    marginTop: 2,
  },

  // Chart
  chartScroll: { alignItems: 'flex-end', gap: 10, paddingVertical: 4, marginBottom: theme.spacing.s },
  barWrapper: { alignItems: 'center', gap: 4, width: 36 },
  barValue: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 60,
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 3 },
  barDate: {
    fontSize: 8,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    width: 36,
  },

  // Message
  message: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 17,
    fontWeight: '500',
    borderTopWidth: 1,
    borderColor: theme.colors.ui.border,
    paddingTop: theme.spacing.s,
    marginTop: 4,
  },
});
