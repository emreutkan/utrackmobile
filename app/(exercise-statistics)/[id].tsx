import { getExercise1RMHistory, getExerciseSetHistory } from '@/api/Exercises';
import { Exercise1RMHistory, ExerciseRanking } from '@/api/types/exercise';
import UpgradeModal from '@/components/UpgradeModal';
import { theme } from '@/constants/theme';
import { useUser } from '@/hooks/useUser';
import { useSettingsStore } from '@/state/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from './components/EmptyState';
import KeyMetrics from './components/KeyMetrics';
import OneRMHistory from './components/OneRMHistory';
import PerformanceHistory from './components/PerformanceHistory';
import RankingCard from './components/RankingCard';
import RMProgressionChart from './components/RMProgressionChart';
import StatisticsHeader from './components/StatisticsHeader';
import WeightRepsChart from './components/WeightRepsChart';

export default function ExerciseStatisticsScreen() {
  const { id } = useLocalSearchParams();
  const { data: user, isLoading: isLoadingUser } = useUser();
  const { isPro } = useSettingsStore();
  const [history, setHistory] = useState<Exercise1RMHistory | null>(null);
  const [ranking, setRanking] = useState<ExerciseRanking | null>(null);
  const [recentPerformance, setRecentPerformance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rmData, sData] = await Promise.all([
        getExercise1RMHistory(Number(id)),
        getExerciseSetHistory(Number(id)),
      ]);

      if (rmData && typeof rmData === 'object' && 'history' in rmData) {
        setHistory(rmData as Exercise1RMHistory);
      }

      if (
        sData &&
        typeof sData === 'object' &&
        'results' in sData &&
        Array.isArray((sData as { results: unknown }).results)
      ) {
        setRecentPerformance((sData as { results: any[] }).results);
      } else if (Array.isArray(sData)) {
        setRecentPerformance(sData);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const best1RM = useMemo(() => {
    if (!history || history.history.length === 0) return 0;
    return Math.max(...history.history.map((h) => h.one_rep_max));
  }, [history]);

  const progressionPct = useMemo(() => {
    if (!history || history.history.length < 2) return 0;
    const oldest = history.history[history.history.length - 1].one_rep_max;
    const newest = history.history[0].one_rep_max;
    return ((newest - oldest) / oldest) * 100;
  }, [history]);

  const rmChartData = useMemo(() => {
    if (!history) return [];
    const baseHistory = [...history.history].reverse();
    const firstVal = baseHistory[0]?.one_rep_max || 1;
    return baseHistory.map((entry) => ({
      ...entry,
      progress_pct: ((entry.one_rep_max - firstVal) / firstVal) * 100,
    }));
  }, [history]);

  const kgRepsData = useMemo(() => {
    if (!recentPerformance || recentPerformance.length === 0) return [];

    const repGroups: { [key: number]: any } = {};
    recentPerformance.forEach((set) => {
      if (set.is_warmup) return;
      const reps = set.reps;
      if (!repGroups[reps] || set.weight > repGroups[reps].weight) {
        repGroups[reps] = set;
      }
    });

    return Object.values(repGroups).sort((a, b) => a.reps - b.reps);
  }, [recentPerformance]);

  useEffect(() => {
    if (!id) return;

    if (user !== undefined && !isLoadingUser) {
      if (!isPro) {
        setShowUpgradeModal(true);
        setIsLoading(false);
        return;
      }
      fetchData();
    }
  }, [id, user, isLoadingUser, isPro, fetchData]);

  const showLoading = isLoading || isLoadingUser || !user || isPro === null;
  const hasData = history && history.history.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.15)', 'transparent']}
        style={styles.gradientBg}
      />

      <StatisticsHeader exerciseName={history?.exercise_name} onRefresh={fetchData} />

      {showLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.status.active} />
        </View>
      ) : hasData ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <KeyMetrics best1RM={best1RM} progressionPct={progressionPct} />

          {ranking && <RankingCard ranking={ranking} />}

          <RMProgressionChart rmChartData={rmChartData} />

          <WeightRepsChart kgRepsData={kgRepsData} />

          <PerformanceHistory recentPerformance={recentPerformance} />

          <OneRMHistory history={history.history} best1RM={best1RM} />
        </ScrollView>
      ) : (
        <EmptyState />
      )}

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          router.back();
        }}
        feature="Exercise Statistics & Analytics"
        message="Track your 1RM progression, analyze performance over time, and view detailed set history to optimize your training."
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
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
