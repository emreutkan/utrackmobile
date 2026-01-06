import { getActiveWorkout } from "@/api/Workout";
import WorkoutModal from "@/components/WorkoutModal";
import { useWorkoutStore } from "@/state/userStore";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ============================================================================
// 1. HELPER COMPONENTS
// ============================================================================

const StatBadge = ({ icon, value, label, color = "#8E8E93" }: any) => (
    <View style={styles.statBadge}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={[styles.statValue, { color }]}>
            {value} <Text style={styles.statLabel}>{label}</Text>
        </Text>
    </View>
);

const IntensityBadge = ({ intensity }: { intensity: string }) => {
    if (!intensity) return null;
    let bg = 'rgba(142, 142, 147, 0.15)';
    let color = '#8E8E93';

    if (intensity === 'high') { bg = 'rgba(255, 59, 48, 0.15)'; color = '#FF3B30'; }
    else if (intensity === 'medium') { bg = 'rgba(255, 159, 10, 0.15)'; color = '#FF9F0A'; }
    else if (intensity === 'low') { bg = 'rgba(48, 209, 88, 0.15)'; color = '#30D158'; }

    return (
        <View style={[styles.intensityBadge, { backgroundColor: bg }]}>
            <Text style={[styles.intensityText, { color }]}>{intensity}</Text>
        </View>
    );
};

// ============================================================================
// 2. MAIN SCREEN
// ============================================================================

export default function Workouts() {
    const { workouts, isLoading, isLoadingMore, hasMore, fetchWorkouts, loadMoreWorkouts } = useWorkoutStore();
    const insets = useSafeAreaInsets();
    
    // State
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [activeWorkout, setActiveWorkout] = useState<any>(null);

    // --- Data Loading ---
    const fetchActive = async () => {
        try {
            const workout = await getActiveWorkout();
            if (workout && typeof workout === 'object' && 'id' in workout) {
                setActiveWorkout(workout);
            } else {
                setActiveWorkout(null);
            }
        } catch (error) { setActiveWorkout(null); }
    };

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                await fetchActive();
                await fetchWorkouts(true);
            };
            load();
        }, [fetchWorkouts])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchActive(), fetchWorkouts(true)]);
        setRefreshing(false);
    }, [fetchWorkouts]);

    // --- Formatters & Sorters ---
    const sortedWorkouts = useMemo(() => {
        const activeId = activeWorkout?.id;
        return [...workouts]
            .filter(w => w.id !== activeId)
            .sort((a, b) => new Date(b.datetime || b.created_at).getTime() - new Date(a.datetime || a.created_at).getTime());
    }, [workouts, activeWorkout]);

    const formatDuration = (s: number) => {
        if (!s) return null;
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // --- Modal Handlers ---
    const handleModalSuccess = async () => {
        await fetchWorkouts(true);
    };

    // --- RENDER ITEMS ---

    const renderWorkoutCard = ({ item, isActive = false }: { item: any, isActive?: boolean }) => {
        const duration = formatDuration(item.duration);
        const exerciseCount = item.exercises?.length || 0;
        const volume = item.total_volume;
        const dateStr = item.datetime || item.created_at;

        return (
            <TouchableOpacity 
                style={[styles.card, isActive && styles.activeCard]} 
                onPress={() => router.push(`/(workouts)/${item.id}`)}
                activeOpacity={0.8}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        {isActive ? (
                            <View style={styles.activeBadge}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.activeText}>IN PROGRESS</Text>
                            </View>
                        ) : (
                            <Text style={styles.dateText}>{formatDate(dateStr)}</Text>
                        )}
                        {!isActive && <IntensityBadge intensity={item.intensity} />}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#545458" />
                </View>

                {/* Title */}
                <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title || 'Untitled Workout'}
                </Text>

                {/* Stats Grid */}
                <View style={styles.statsRow}>
                    {duration && <StatBadge icon="time" value={duration} label="" />}
                    {exerciseCount > 0 && <StatBadge icon="barbell" value={exerciseCount} label="Exercises" />}
                    {volume > 0 && <StatBadge icon="fitness" value={(volume/1000).toFixed(1)} label="tons" />}
                </View>

                {/* Muscle Tags */}
                {item.primary_muscles_worked?.length > 0 && (
                    <View style={styles.tagContainer}>
                        {item.primary_muscles_worked.slice(0, 3).map((m: string, i: number) => (
                            <View key={i} style={styles.muscleTag}>
                                <Text style={styles.tagText}>{m}</Text>
                            </View>
                        ))}
                        {item.primary_muscles_worked.length > 3 && (
                            <Text style={styles.moreTags}>+{item.primary_muscles_worked.length - 3}</Text>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            
            {/* --- LIST --- */}
            <FlatList
                data={sortedWorkouts}
                renderItem={(props) => renderWorkoutCard(props)}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A84FF" />
                }
                ListHeaderComponent={
                    <View>
                        {activeWorkout && (
                            <>
                                <Text style={styles.sectionTitle}>CURRENTLY ACTIVE</Text>
                                {renderWorkoutCard({ item: activeWorkout, isActive: true })}
                            </>
                        )}
                        <Text style={[styles.sectionTitle, { marginTop: activeWorkout ? 2 : 0 }]}>HISTORY</Text>
                    </View>
                }
                ListEmptyComponent={!activeWorkout && !isLoading ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="barbell" size={40} color="#8E8E93" />
                        </View>
                        <Text style={styles.emptyTitle}>No Workouts Yet</Text>
                        <Text style={styles.emptyText}>Start a new workout to track your progress.</Text>
                    </View>
                ) : null}
                onEndReached={() => { if(hasMore && !isLoadingMore) loadMoreWorkouts(); }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{padding: 20}} /> : null}
            />

            {/* --- FAB --- */}
            <View style={[styles.fabContainer, { bottom: insets.bottom + 70 }]}>
                 {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="dark" style={styles.fabBlur}>
                        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                            <Ionicons name="add" size={32} color="#0A84FF" />
                        </TouchableOpacity>
                    </BlurView>
                 ) : (
                    <View style={[styles.fabBlur, { backgroundColor: '#1C1C1E' }]}>
                        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                            <Ionicons name="add" size={32} color="#0A84FF" />
                        </TouchableOpacity>
                    </View>
                 )}
            </View>

            {/* --- LOG PAST WORKOUT MODAL --- */}
            <WorkoutModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                mode="log"
                onSuccess={handleModalSuccess}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    listContent: { padding: 8 },

    // Sections
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#636366', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },

    // Cards
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    activeCard: {
        borderColor: '#30D158',
        borderWidth: 1,
        backgroundColor: '#1C1C1E', // Keep dark, let border do the work
        shadowColor: '#30D158',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    
    // Header
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dateText: { color: '#8E8E93', fontSize: 13, fontWeight: '500' },
    
    // Active Badge
    activeBadge: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(48,209,88,0.1)', 
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 6 
    },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#30D158' },
    activeText: { color: '#30D158', fontSize: 11, fontWeight: '700' },

    // Intensity
    intensityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    intensityText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },

    // Main Content
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 12 },
    
    // Stats
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
    statBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2C2C2E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statValue: { color: '#FFF', fontSize: 13, fontWeight: '600' },
    statLabel: { color: '#8E8E93', fontSize: 13, fontWeight: '400' },

    // Tags
    tagContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    muscleTag: { backgroundColor: '#2C2C2E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#3A3A3C' },
    tagText: { color: '#A1A1A6', fontSize: 11, fontWeight: '500' },
    moreTags: { color: '#545458', fontSize: 11 },

    // Empty State
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 8 },
    emptyText: { fontSize: 15, color: '#8E8E93' },

    // FAB
    fabContainer: { position: 'absolute', right: 12 },
    fabBlur: { borderRadius: 30,  
        
        overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    fab: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(28,28,30,0.6)' },

});