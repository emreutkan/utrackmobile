import { useWorkoutStore } from "@/state/userStore";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Workouts() {
    const { workouts, isLoading, fetchWorkouts } = useWorkoutStore();
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchWorkouts();
        }, [fetchWorkouts])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchWorkouts();
        setRefreshing(false);
    }, [fetchWorkouts]);

    // Sort workouts by datetime (most recent first)
    const sortedWorkouts = useMemo(() => {
        return [...workouts].sort((a, b) => {
            const dateA = a.datetime || a.created_at;
            const dateB = b.datetime || b.created_at;
            // Sort descending (newest first)
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
    }, [workouts]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const workoutDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffTime = today.getTime() - workoutDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        // Show formatted date for older workouts
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return null;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const getExerciseCount = (workout: any) => {
        return workout.exercises?.length || 0;
    };

    const renderItem = ({ item }: { item: any }) => {
        const workoutDate = item.datetime || item.created_at;
        const dateText = workoutDate ? formatDate(workoutDate) : `Workout #${item.id}`;
        const duration = formatDuration(item.duration);
        const exerciseCount = getExerciseCount(item);
        const hasStats = duration || item.total_volume || exerciseCount > 0;

        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => router.push(`/(workouts)/${item.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={styles.cardDate}>{dateText}</Text>
                        {item.intensity && item.intensity !== '' && (
                            <View style={[styles.intensityBadge, styles[`intensity${item.intensity.charAt(0).toUpperCase() + item.intensity.slice(1)}`]]}>
                                <Text style={styles.intensityText}>{item.intensity}</Text>
                            </View>
                        )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </View>
                
                <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title || 'Untitled Workout'}
                </Text>

                {hasStats && (
                    <View style={styles.cardStats}>
                        {duration && (
                            <View style={styles.statItem}>
                                <Ionicons name="time-outline" size={14} color="#8E8E93" />
                                <Text style={styles.statText}>{duration}</Text>
                            </View>
                        )}
                        {exerciseCount > 0 && (
                            <View style={styles.statItem}>
                                <Ionicons name="barbell-outline" size={14} color="#8E8E93" />
                                <Text style={styles.statText}>
                                    {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                                </Text>
                            </View>
                        )}
                        {item.total_volume && item.total_volume > 0 && (
                            <View style={styles.statItem}>
                                <Ionicons name="fitness-outline" size={14} color="#8E8E93" />
                                <Text style={styles.statText}>{item.total_volume.toFixed(0)} kg</Text>
                            </View>
                        )}
                    </View>
                )}

                {item.primary_muscles_worked && item.primary_muscles_worked.length > 0 && (
                    <View style={styles.muscleTagsContainer}>
                        {item.primary_muscles_worked.slice(0, 3).map((muscle: string, idx: number) => (
                            <View key={idx} style={styles.muscleTag}>
                                <Text style={styles.muscleTagText}>{muscle}</Text>
                            </View>
                        ))}
                        {item.primary_muscles_worked.length > 3 && (
                            <Text style={styles.moreMusclesText}>+{item.primary_muscles_worked.length - 3}</Text>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Past Workouts</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : (
                <FlatList
                    data={sortedWorkouts}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[
                        styles.listContent,
                        sortedWorkouts.length === 0 && styles.emptyListContent
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#0A84FF"
                            colors={["#0A84FF"]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="barbell-outline" size={64} color="#2C2C2E" />
                            <Text style={styles.emptyTitle}>No workouts yet</Text>
                            <Text style={styles.emptyText}>
                                Complete your first workout to see it here
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 44,
        marginBottom: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 40,
    },
    backText: {
        color: '#0A84FF',
        fontSize: 17,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 20,
    },
    emptyListContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    cardDate: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    intensityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    intensityLow: {
        backgroundColor: 'rgba(50, 215, 75, 0.15)',
    },
    intensityMedium: {
        backgroundColor: 'rgba(255, 159, 10, 0.15)',
    },
    intensityHigh: {
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
    },
    intensityText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    cardStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '500',
    },
    muscleTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
    },
    muscleTag: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    muscleTagText: {
        color: '#A1A1A6',
        fontSize: 11,
        fontWeight: '500',
    },
    moreMusclesText: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '500',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    }
});
