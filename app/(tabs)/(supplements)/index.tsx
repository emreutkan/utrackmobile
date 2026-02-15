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
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddSupplementModal from './components/AddSupplementModal';
import HistoryModal from './components/HistoryModal';
import ProgressCard from './components/ProgressCard';
import SupplementCard from './components/SupplementCard';
import SupplementsHeader from './components/SupplementsHeader';
import SupplementsLoadingSkeleton from './components/SupplementsLoadingSkeleton';
import { LogUserSupplementRequest } from '@/api/Supplements';

export default function SupplementsScreen() {
  const insets = useSafeAreaInsets();

  // Queries
  const { data, fetchNextPage, hasNextPage, refetch, isLoading } = useInfiniteUserSupplements(
    1,
    50
  );

  const { data: todayLogs, refetch: refetchLogs } = useTodaySupplementLogs();
  const logMutation = useLogSupplement();

  // UI State
  const [modals, setModals] = useState({ add: false, history: false });
  const [selectedSupp, setSelectedSupp] = useState<UserSupplement | null>(null);

  const userSupplements = data?.pages.flatMap((page) => page.results ?? []) || [];
  const todayLogsMap = new Map(todayLogs?.logs.map((log) => [log.user_supplement_id, true]) || []);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchLogs();
    }, [refetch, refetchLogs])
  );

  const handleLog = async (item: UserSupplement) => {
    const current_date = new Date();
    try {
      const logSupplement: LogUserSupplementRequest = {
        user_supplement_id: item.supplement_details.id,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toISOString().split('T')[1],
        dosage: item.dosage,
      };
      await logMutation.mutateAsync(logSupplement);
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

  if (isLoading) {
    return <SupplementsLoadingSkeleton />;
  }

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
          style={styles.gradientBg}
        />

          <FlatList
            data={userSupplements}
            keyExtractor={(item) => item.supplement_details.id.toString()}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                <SupplementsHeader onAddPress={() => setModals((m) => ({ ...m, add: true }))} />
                <ProgressCard loggedCount={loggedCount} totalCount={totalCount} />
                {userSupplements.length > 0 && (
                  <Text style={styles.sectionHeader}>ACTIVE SUPPLEMENTS</Text>
                )}
              </>
            }
            renderItem={({ item }) => (
              <SupplementCard
                item={item}
                isLogged={todayLogsMap.get(item.supplement_details.id) || false}
                onLog={() => handleLog(item)}
                onPress={() => openHistory(item)}
              />
            )}
            ListFooterComponent={
              <>
                {hasNextPage && (
                  <Pressable
                    style={styles.loadMoreButton}
                    onPress={() => fetchNextPage()}
                  >
                    <Text style={styles.loadMoreText}>Load More</Text>
                  </Pressable>
                )}
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="nutrition" size={32} color="#8E8E93" />
                </View>
                <Text style={styles.emptyTitle}>No Supplements</Text>
                <Text style={styles.emptyText}>Add supplements to track your daily intake.</Text>
              </View>
            }
          />

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
    </>
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
  scrollContent: { paddingHorizontal: 12 },
  sectionHeader: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 3.6,
    marginBottom: theme.spacing.m,
    marginLeft: 4,
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
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
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
