import { getExercises } from '@/api/Exercises';
import { PaginatedResponse } from '@/api/types/pagination';
import { Exercise } from '@/api/types/index';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExerciseCard from './components/ExerciseCard';
import ExerciseListHeader from './components/ExerciseListHeader';
import SearchBar from './components/SearchBar';

export default function ExerciseListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const insets = useSafeAreaInsets();

  const loadExercises = useCallback(
    async (reset = false) => {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      try {
        const pageToFetch = reset ? 1 : page + 1;
        const data = await getExercises(searchQuery, pageToFetch) as PaginatedResponse<Exercise> | Exercise[] | undefined;

        if (data && typeof data === 'object' && 'results' in data) {
          const paginated = data as PaginatedResponse<Exercise>;
          if (reset) {
            setExercises(paginated.results);
            setPage(1);
          } else {
            setExercises((prev) => [...prev, ...paginated.results]);
            setPage(pageToFetch);
          }
          setHasMore(!!paginated.next);
        } else if (Array.isArray(data)) {
          if (reset) {
            setExercises(data);
            setPage(1);
          } else {
            setExercises((prev) => [...prev, ...data]);
            setPage(pageToFetch);
          }
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to load exercises:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery, page]
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadExercises(true);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, loadExercises]);

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && !isLoading) {
      loadExercises(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.15)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      <ExerciseListHeader paddingTop={insets.top} />
      <View style={{ flex: 1 }}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.text.brand} />
          </View>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ExerciseCard exercise={item} />}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={theme.colors.text.brand} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="barbell-outline" size={48} color={theme.colors.text.zinc800} />
                <Text style={styles.emptyText}>No exercises found</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { paddingHorizontal: 20 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  emptyContainer: { padding: 60, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    color: theme.colors.text.tertiary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    textTransform: 'uppercase',
  },
});
