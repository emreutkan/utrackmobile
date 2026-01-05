import { getRecoveryStatus } from '@/api/Workout';
import { MuscleRecovery, RecoveryStatusResponse } from '@/api/types';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// 1. HELPERS & CONFIG
// ============================================================================

const formatTimeRemaining = (hours: number): string => {
    if (hours <= 0) return 'Ready';
    if (hours < 1) return `${Math.ceil(hours * 60)}m`;
    if (hours < 24) return `${Math.ceil(hours)}h`;
    const days = Math.floor(hours / 24);
    const h = Math.ceil(hours % 24);
    return h > 0 ? `${days}d ${h}h` : `${days}d`;
};

const getStatusColor = (pct: number) => {
    if (pct >= 90) return '#30D158'; // Green (Ready)
    if (pct >= 50) return '#FF9F0A'; // Orange (Recovering)
    return '#FF453A'; // Red (Fatigued)
};

const MUSCLE_CATEGORIES = {
    Upper: ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'lats', 'traps', 'lower_back', 'neck'],
    Lower: ['quads', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'],
    Core: ['abs', 'obliques']
};

const getCategory = (muscle: string) => {
    if (MUSCLE_CATEGORIES.Upper.includes(muscle)) return 'Upper Body';
    if (MUSCLE_CATEGORIES.Lower.includes(muscle)) return 'Lower Body';
    return 'Core';
};

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================

export default function RecoveryStatusScreen() {
    const insets = useSafeAreaInsets();
    
    // --- State ---
    const [statusMap, setStatusMap] = useState<Record<string, MuscleRecovery>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // --- Data ---
    const loadData = async () => {
        try {
            const res: RecoveryStatusResponse = await getRecoveryStatus();
            if (res?.recovery_status) {
                setStatusMap(res.recovery_status);
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

    // --- Stats Calculation ---
    const { stats, groupedData } = useMemo(() => {
        const entries = Object.entries(statusMap);
        const total = entries.length;
        
        // Initialize groups with proper type structure
        const groups: Record<string, typeof entries> = {
            'Upper Body': [], 'Lower Body': [], 'Core': []
        };
        
        if (total === 0) return { stats: null, groupedData: groups };

        let recovered = 0;
        let recovering = 0;
        let totalPct = 0;

        entries.forEach(([m, s]) => {
            if (s.is_recovered) recovered++; else recovering++;
            totalPct += Number(s.recovery_percentage);
            
            const cat = getCategory(m);
            groups[cat].push([m, s]);
        });

        // Sort groups: Recovering first (lowest %), then alphabetical
        Object.keys(groups).forEach(key => {
            groups[key].sort(([, a], [, b]) => {
                const pctA = Number(a.recovery_percentage);
                const pctB = Number(b.recovery_percentage);
                if (Math.abs(pctA - pctB) > 5) return pctA - pctB; // Low % first
                return 0;
            });
        });

        return {
            stats: {
                recovered,
                recovering,
                avg: Math.round(totalPct / total)
            },
            groupedData: groups
        };
    }, [statusMap]);

    // --- Renderers ---

    const renderMuscleCard = (muscle: string, data: MuscleRecovery) => {
        const pct = Number(data.recovery_percentage);
        const color = getStatusColor(pct);
        const hoursLeft = Number(data.hours_until_recovery);
        const isReady = data.is_recovered || pct >= 90;

        return (
            <View style={[styles.card, !isReady && styles.cardActive]} key={muscle}>
                <View style={styles.cardHeader}>
                    <View style={styles.nameContainer}>
                        <View style={[styles.indicatorDot, { backgroundColor: color }]} />
                        <Text style={styles.muscleName}>{muscle.replace(/_/g, ' ')}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: isReady ? 'rgba(48,209,88,0.1)' : 'rgba(255,159,10,0.1)' }]}>
                        <Text style={[styles.badgeText, { color: isReady ? '#30D158' : '#FF9F0A' }]}>
                            {isReady ? 'Ready' : formatTimeRemaining(hoursLeft)}
                        </Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.track}>
                        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.pctText}>{pct.toFixed(0)}% Recovered</Text>
                    {!isReady && Number(data.fatigue_score) > 0 && (
                        <View style={styles.fatigueRow}>
                            <Ionicons name="flash" size={12} color="#8E8E93" />
                            <Text style={styles.fatigueText}>Fatigue: {Number(data.fatigue_score).toFixed(1)}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <UnifiedHeader title="Recovery Status" />

            {isLoading ? (
                <View style={[styles.center, { marginTop: 58 }]}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20, marginTop: 58 }]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A84FF" />}
                >
                    {/* Summary Dashboard */}
                    {stats && (
                        <View style={styles.dashboard}>
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: '#30D158' }]}>{stats.recovered}</Text>
                                <Text style={styles.statLabel}>READY</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: '#FF9F0A' }]}>{stats.recovering}</Text>
                                <Text style={styles.statLabel}>RECOVERING</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{stats.avg}%</Text>
                                <Text style={styles.statLabel}>AVG LEVEL</Text>
                            </View>
                        </View>
                    )}

                    {/* Muscle Groups */}
                    {(['Upper Body', 'Lower Body', 'Core'] as const).map(category => {
                        const items = groupedData[category];
                        if (!items || items.length === 0) return null;

                        return (
                            <View key={category} style={styles.section}>
                                <Text style={styles.sectionTitle}>{category}</Text>
                                <View style={styles.grid}>
                                    {items.map(([m, data]) => renderMuscleCard(m, data))}
                                </View>
                            </View>
                        );
                    })}

                    {(!stats || stats.avg === 0 && stats.recovered === 0) && (
                        <View style={styles.emptyState}>
                            <Ionicons name="fitness-outline" size={64} color="#2C2C2E" />
                            <Text style={styles.emptyText}>No recovery data available.</Text>
                            <Text style={styles.emptySub}>Complete workouts to track muscle fatigue.</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16 },

    // Dashboard
    dashboard: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 4 },
    statLabel: { fontSize: 11, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5 },
    statDivider: { width: 1, backgroundColor: '#2C2C2E', height: '80%', alignSelf: 'center' },

    // Section
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#636366', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' },
    
    // Grid/List
    grid: { gap: 12 },

    // Card
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    cardActive: {
        borderColor: '#3A3A3C', // Slightly lighter border for active items
        backgroundColor: '#232325', // Slightly lighter bg
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    nameContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    indicatorDot: { width: 8, height: 8, borderRadius: 4 },
    muscleName: { fontSize: 17, fontWeight: '600', color: '#FFF', textTransform: 'capitalize' },
    
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 12, fontWeight: '600' },

    // Progress Bar
    progressContainer: { marginBottom: 10 },
    track: { height: 6, backgroundColor: '#2C2C2E', borderRadius: 3, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 3 },

    // Footer
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pctText: { color: '#8E8E93', fontSize: 13, fontWeight: '500' },
    fatigueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    fatigueText: { color: '#8E8E93', fontSize: 12 },

    // Empty
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#FFF', fontSize: 18, fontWeight: '600', marginTop: 16 },
    emptySub: { color: '#8E8E93', fontSize: 14, marginTop: 4 },
});