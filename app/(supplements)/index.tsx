import { UserSupplement } from '@/api/types';
import { theme } from '@/constants/theme';
import {
  useInfiniteUserSupplements,
  useLogSupplement,
  useTodaySupplementLogs,
} from '@/hooks/useSupplements';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddSupplementModal from './components/AddSupplementModal';
import HistoryModal from './components/HistoryModal';
import ProgressCard from './components/ProgressCard';
import SupplementCard from './components/SupplementCard';
import SupplementsHeader from './components/SupplementsHeader';

export default function SupplementsScreen() {
  const insets = useSafeAreaInsets();

  // Queries
  const { data, fetchNextPage, hasNextPage, refetch } = useInfiniteUserSupplements(50);
  const { data: todayLogs, refetch: refetchLogs } = useTodaySupplementLogs();
  const logMutation = useLogSupplement();

  // UI State
  const [modals, setModals] = useState({ add: false, history: false });
  const [selectedSupp, setSelectedSupp] = useState<UserSupplement | null>(null);

  const userSupplements = data?.pages.flatMap((page) => page.results) || [];
  const todayLogsMap = new Map(todayLogs?.map((log) => [log.user_supplement, true]) || []);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchLogs();
    }, [refetch, refetchLogs])
  );

  const handleLog = async (item: UserSupplement) => {
    try {
      await logMutation.mutateAsync({ user_supplement_id: item.id });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log supplement');
    }
  };

  const openHistory = (item: UserSupplement) => {
    setSelectedSupp(item);
    setModals((m) => ({ ...m, history: true }));
  };

  const getLoggedCount = (): number => {
    return todayLogsMap.size;
  };

  const loggedCount = getLoggedCount();
  const totalCount = userSupplements.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <SupplementsHeader onAddPress={() => setModals((m) => ({ ...m, add: true }))} />

        <ProgressCard loggedCount={loggedCount} totalCount={totalCount} />

        {userSupplements.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>ACTIVE</Text>
            {userSupplements.map((item) => (
              <SupplementCard
                key={item.id}
                item={item}
                isLogged={todayLogsMap.get(item.id) || false}
                onLog={() => handleLog(item)}
                onPress={() => openHistory(item)}
              />
            ))}
            {hasNextPage && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => fetchNextPage()}
                activeOpacity={0.7}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {userSupplements.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="nutrition" size={32} color="#8E8E93" />
            </View>
            <Text style={styles.emptyTitle}>No Supplements</Text>
            <Text style={styles.emptyText}>Add supplements to track your daily intake.</Text>
          </View>
        )}
      </ScrollView>

      <AddSupplementModal
        visible={modals.add}
        onClose={() => setModals((m) => ({ ...m, add: false }))}
      />

      <HistoryModal
        visible={modals.history}
        onClose={() => setModals((m) => ({ ...m, history: false }))}
        supplement={selectedSupp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: { padding: theme.spacing.m },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: theme.spacing.m,
    marginHorizontal: theme.spacing.l,
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.ui.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.l,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  emptyText: {
    fontSize: theme.typography.sizes.m,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  loadMoreButton: {
    backgroundColor: theme.colors.ui.glass,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    marginTop: theme.spacing.m,
    marginHorizontal: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  loadMoreText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.m,
    fontWeight: '600',
  },
});
