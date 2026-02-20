import { getRecoveryStatus } from '@/api/Workout';
import { MuscleRecoveryItem, RecoveryStatusResponse } from '@/api/types';
import { CNSRecoveryItem } from '@/api/types/workout';
import UpgradePrompt from '@/components/UpgradePrompt';
import { theme } from '@/constants/theme';
import { useSettingsStore } from '@/state/stores/settingsStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CNSCard from './components/CNSCard';
import { getCategory, getStatusColor } from '@/utils/recoveryStatusHelpers';
import MuscleCard from './components/MuscleCard';
import RecoveryHeader from './components/RecoveryHeader';
import RecoveryLoadingSkeleton from './components/RecoveryLoadingSkeleton';

export default function RecoveryStatusScreen() {
  const insets = useSafeAreaInsets();
  const isPro = useSettingsStore((s) => s.isPro);
  const [statusMap, setStatusMap] = useState<Record<string, MuscleRecoveryItem>>({});
  const [cnsRecovery, setCnsRecovery] = useState<CNSRecoveryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res: RecoveryStatusResponse = await getRecoveryStatus();
      if (res?.recovery_status) {
        setStatusMap(res.recovery_status);
      }
      if (res?.cns_recovery) {
        const raw = res.cns_recovery;
        setCnsRecovery({
          ...raw,
          cns_load: Number(raw.cns_load),
          recovery_hours: Number(raw.recovery_hours),
          hours_until_recovery: Number(raw.hours_until_recovery),
          recovery_percentage: Number(raw.recovery_percentage),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const { stats, flattenedData } = useMemo(() => {
    const entries = Object.entries(statusMap);
    const total = entries.length;
    const recovered = entries.filter(([_, d]) => d.is_recovered || d.recovery_percentage >= 90).length;
    const sum = entries.reduce((acc, [_, d]) => acc + Number(d.recovery_percentage), 0);
    const avg = total > 0 ? sum / total : 0;
    const fatigued = entries.filter(([_, d]) => Number(d.recovery_percentage) < 50).length;

    const groups: Record<string, typeof entries> = {
      'Upper Body': [],
      'Lower Body': [],
      Core: [],
    };

    entries.forEach(([muscle, data]) => {
      const category = getCategory(muscle);
      groups[category].push([muscle, data]);
    });

    Object.keys(groups).forEach((cat) => {
      groups[cat].sort((a, b) => Number(a[1].recovery_percentage) - Number(b[1].recovery_percentage));
    });

    const flattened: Array<
      | { type: 'section'; category: string }
      | { type: 'muscle'; muscle: string; data: MuscleRecoveryItem }
    > = [];

    (['Upper Body', 'Lower Body', 'Core'] as const).forEach((category) => {
      const items = groups[category];
      if (items && items.length > 0) {
        flattened.push({ type: 'section', category });
        items.forEach(([muscle, data]) => {
          flattened.push({ type: 'muscle', muscle, data });
        });
      }
    });

    return {
      stats: { total, recovered, avg, fatigued },
      flattenedData: flattened,
    };
  }, [statusMap]);

  if (isLoading) {
    return <RecoveryLoadingSkeleton />;
  }

  const hasData = stats.total > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      <RecoveryHeader />

      <FlatList
        data={flattenedData}
        keyExtractor={(item, index) =>
          item.type === 'section' ? `section-${item.category}` : `muscle-${item.muscle}-${index}`
        }
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={({ leadingItem }) =>
          leadingItem?.type === 'muscle' ? <View style={styles.separator} /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.status.active}
          />
        }
        ListHeaderComponent={
          <>
            {/* Stats summary row */}
            {hasData && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>RECOVERED</Text>
                  <Text style={[styles.statValue, { color: '#30D158' }]}>
                    {stats.recovered}
                    <Text style={styles.statDenom}>/{stats.total}</Text>
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>AVG RECOVERY</Text>
                  <Text style={[styles.statValue, { color: getStatusColor(stats.avg) }]}>
                    {stats.avg.toFixed(0)}
                    <Text style={styles.statDenom}>%</Text>
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>FATIGUED</Text>
                  <Text style={[styles.statValue, { color: stats.fatigued > 0 ? '#FF453A' : theme.colors.text.tertiary }]}>
                    {stats.fatigued}
                    <Text style={styles.statDenom}> MG</Text>
                  </Text>
                </View>
              </View>
            )}

            {/* System Recovery (CNS) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SYSTEM RECOVERY</Text>
                <Text style={styles.sectionTag}>CNS</Text>
              </View>
              {isPro ? (
                cnsRecovery ? (
                  <CNSCard data={cnsRecovery} />
                ) : null
              ) : (
                <UpgradePrompt
                  feature="CNS Recovery Tracking"
                  message="Track your Central Nervous System recovery to optimize training"
                />
              )}
            </View>
          </>
        }
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{item.category.toUpperCase()}</Text>
                <Text style={styles.sectionTag}>MUSCLES</Text>
              </View>
            );
          }
          return <MuscleCard muscle={item.muscle} data={item.data} />;
        }}
        ListEmptyComponent={
          !hasData ? (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={64} color={theme.colors.ui.border} />
              <Text style={styles.emptyText}>No recovery data yet.</Text>
              <Text style={styles.emptySub}>Complete a workout to start tracking muscle fatigue.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.m,
  },
  // Stats summary row
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    gap: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  statDenom: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'normal',
    color: theme.colors.text.tertiary,
  },
  // Sections
  section: {
    marginBottom: theme.spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
    marginTop: theme.spacing.s,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionTag: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  separator: {
    height: theme.spacing.s,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.l,
  },
  emptySub: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.s,
    textAlign: 'center',
  },
});
