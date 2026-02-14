import { getRecoveryStatus } from '@/api/Workout';
import { MuscleRecoveryItem, RecoveryStatusResponse } from '@/api/types';
import { CNSRecoveryItem } from '@/api/types/workout';
import UpgradePrompt from '@/components/UpgradePrompt';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CNSCard from './components/CNSCard';
import { getCategory } from '@/utils/recoveryStatusHelpers';
import MuscleCard from './components/MuscleCard';
import RecoveryHeader from './components/RecoveryHeader';

export default function RecoveryStatusScreen() {
  const insets = useSafeAreaInsets();
  const [statusMap, setStatusMap] = useState<Record<string, MuscleRecoveryItem>>({});
  const [cnsRecovery, setCnsRecovery] = useState<CNSRecoveryItem | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res: RecoveryStatusResponse = await getRecoveryStatus();
      if (res?.recovery_status) {
        setStatusMap(res.recovery_status);
      }
      if (res?.cns_recovery) {
        setCnsRecovery(res.cns_recovery);
      }
      if (res?.is_pro !== undefined) {
        setIsPro(res.is_pro);
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

  const { stats, groupedData, flattenedData } = useMemo(() => {
    const entries = Object.entries(statusMap);
    const total = entries.length;
    const recovered = entries.filter(([_, d]) => d.is_recovered || d.recovery_percentage >= 90).length;
    const sum = entries.reduce((acc, [_, d]) => acc + d.recovery_percentage, 0);
    const avg = total > 0 ? sum / total : 0;

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
      groups[cat].sort((a, b) => a[1].recovery_percentage - b[1].recovery_percentage);
    });

    // Flatten data for FlatList
    const flattened: Array<{ type: 'section'; category: string } | { type: 'muscle'; muscle: string; data: MuscleRecoveryItem }> = [];
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
      stats: { total, recovered, avg },
      groupedData: groups,
      flattenedData: flattened,
    };
  }, [statusMap]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      <RecoveryHeader />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.status.active} />
        </View>
      ) : (
        <FlatList
          data={flattenedData}
          keyExtractor={(item, index) =>
            item.type === 'section' ? `section-${item.category}` : `muscle-${item.muscle}-${index}`
          }
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.status.active}
            />
          }
          ListHeaderComponent={
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System Recovery</Text>
              {isPro ? (
                cnsRecovery && !cnsRecovery.is_recovered && cnsRecovery.cns_load > 0 ? (
                  <CNSCard data={cnsRecovery} />
                ) : null
              ) : (
                <UpgradePrompt
                  feature="CNS Recovery Tracking"
                  message="Track your Central Nervous System recovery to optimize training"
                />
              )}
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'section') {
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{item.category}</Text>
                </View>
              );
            }
            return (
              <View style={styles.grid}>
                <MuscleCard muscle={item.muscle} data={item.data} />
              </View>
            );
          }}
          ListEmptyComponent={
            (!stats || (stats.avg === 0 && stats.recovered === 0)) ? (
              <View style={styles.emptyState}>
                <Ionicons name="fitness-outline" size={64} color={theme.colors.ui.border} />
                <Text style={styles.emptyText}>No recovery data available.</Text>
                <Text style={styles.emptySub}>Complete workouts to track muscle fatigue.</Text>
              </View>
            ) : null
          }
        />
      )}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.l,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.m,
  },
  grid: {
    gap: theme.spacing.m,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.l,
  },
  emptySub: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.s,
  },
});
