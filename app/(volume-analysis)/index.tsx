import { getVolumeAnalysis } from '@/api/VolumeAnalysis';
import { VolumeAnalysisResponse } from '@/api/types';
import UpgradeModal from '@/components/UpgradeModal';
import UpgradePrompt from '@/components/UpgradePrompt';
import { commonStyles, theme, typographyStyles } from '@/constants/theme';
import { useSettingsStore } from '@/state/stores/settingsStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    Pressable,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// 1. TYPES & HELPERS
// ============================================================================

interface MuscleGroupSummary {
    muscle_group: string;
    average_volume: number;
    max_volume: number;
    total_sets: number;
    total_workouts: number;
}

const MUSCLE_COLORS: Record<string, string> = {
    chest: '#FF3B30', shoulders: '#FF9500', biceps: '#FFCC00', triceps: '#32D74B',
    lats: '#0A84FF', traps: '#5E5CE6', quads: '#FF2D55', hamstrings: '#BF5AF2',
    glutes: '#FF375F', calves: '#30D158', abs: '#64D2FF', forearms: '#FF9F0A'
};

const getMuscleColor = (mg: string) => MUSCLE_COLORS[mg.toLowerCase()] || '#8E8E93';

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================

export default function VolumeAnalysisScreen() {
    const insets = useSafeAreaInsets();
    
    // --- State ---
    const isPro = useSettingsStore((s) => s.isPro);
    const [analysis, setAnalysis] = useState<VolumeAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [filterWeeks, setFilterWeeks] = useState('12');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // --- Data Loading ---
    const loadAnalysis = async () => {
        setIsLoading(true);
        try {
            const requestedWeeks = parseInt(filterWeeks) || 12;
            const data = await getVolumeAnalysis({ weeks_back: requestedWeeks });
            if (data?.weeks) {
                setAnalysis(data);
                // Check if user hit the limit
                if (!isPro && !data.is_pro && data.weeks_limit && requestedWeeks > data.weeks_limit) {
                    setShowUpgradeModal(true);
                    // Auto-limit to max weeks
                    setFilterWeeks(data.weeks_limit.toString());
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadAnalysis();
        }, [])
    );

    // --- Calculations ---
    const summaryStats = useMemo(() => {
        if (!analysis?.weeks) return [];
        const map = new Map<string, { volumes: number[]; sets: number; workouts: number }>();

        analysis.weeks.forEach(week => {
            Object.entries(week.muscle_groups).forEach(([mg, data]) => {
                if (!map.has(mg)) map.set(mg, { volumes: [], sets: 0, workouts: 0 });
                const stats = map.get(mg)!;
                stats.volumes.push(data.total_volume);
                stats.sets += data.sets;
                stats.workouts += data.workouts;
            });
        });

        const result: MuscleGroupSummary[] = [];
        map.forEach((stats, mg) => {
            if (stats.volumes.length > 0) {
                result.push({
                    muscle_group: mg,
                    average_volume: stats.volumes.reduce((a, b) => a + b, 0) / stats.volumes.length,
                    max_volume: Math.max(...stats.volumes),
                    total_sets: stats.sets,
                    total_workouts: stats.workouts,
                });
            }
        });
        return result.sort((a, b) => b.average_volume - a.average_volume);
    }, [analysis]);

    const totalStats = useMemo(() => {
        if (!analysis?.weeks) return { workouts: 0, sets: 0 };
        let totalSets = 0;
        let totalWorkouts = 0;
        
        analysis.weeks.forEach(week => {
            // Rough estimate: Max workouts for any muscle group in a week = workouts that week
            const weekWorkouts = Math.max(...Object.values(week.muscle_groups).map(d => d.workouts), 0);
            totalWorkouts += weekWorkouts;
            Object.values(week.muscle_groups).forEach(d => totalSets += d.sets);
        });

        return { workouts: totalWorkouts, sets: totalSets };
    }, [analysis]);

    const weeklyChartData = useMemo(() => {
        if (!analysis || !selectedMuscle) return [];
        const data = analysis.weeks.map(week => ({
            date: week.week_start,
            volume: week.muscle_groups[selectedMuscle]?.total_volume || 0
        })).reverse(); // Oldest to newest
        return data;
    }, [analysis, selectedMuscle]);

    // --- Renderers ---

    const renderChart = () => {
        if (!selectedMuscle || weeklyChartData.length === 0) return null;
        
        const maxVol = Math.max(...weeklyChartData.map(d => d.volume), 1);
        const color = getMuscleColor(selectedMuscle);

        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <View>
                        <Text style={styles.chartTitle}>{selectedMuscle}</Text>
                        <Text style={styles.chartSubtitle}>Weekly Volume History</Text>
                    </View>
                    <Pressable onPress={() => setSelectedMuscle(null)} style={styles.closeChartBtn}>
                        <Ionicons name="close" size={20} color="#8E8E93" />
                    </Pressable>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
                    {weeklyChartData.map((d, i) => {
                        const heightPct = (d.volume / maxVol) * 100;
                        return (
                            <View key={i} style={styles.barContainer}>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { height: `${Math.max(heightPct, 5)}%`, backgroundColor: color }]} />
                                </View>
                                <Text style={styles.barLabel}>{formatDate(d.date)}</Text>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    const renderMuscleRow = ({ item }: { item: MuscleGroupSummary }) => {
        const color = getMuscleColor(item.muscle_group);
        // Calculate relative width based on the highest average volume in the list
        const maxAvg = summaryStats[0]?.average_volume || 1;
        const widthPct = (item.average_volume / maxAvg) * 100;
        const isSelected = selectedMuscle === item.muscle_group;

        return (
            <Pressable 
                style={[styles.rowCard, isSelected && styles.rowCardActive]} 
                onPress={() => setSelectedMuscle(item.muscle_group)}
            >
                <View style={styles.rowHeader}>
                    <View style={styles.rowTitleContainer}>
                        <View style={[styles.dot, { backgroundColor: color }]} />
                        <Text style={styles.rowTitle}>{item.muscle_group}</Text>
                    </View>
                    <Text style={styles.rowValue}>{item.average_volume.toFixed(0)} <Text style={styles.rowUnit}>kg/wk</Text></Text>
                </View>

                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${widthPct}%`, backgroundColor: color }]} />
                </View>

                <View style={styles.rowStats}>
                    <Text style={styles.rowStatText}>{item.total_sets} Sets</Text>
                    <Text style={styles.rowStatText}>Max: {item.max_volume.toFixed(0)}</Text>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Volume Analysis</Text>
                <Pressable onPress={() => setIsFilterVisible(true)} style={styles.headerButton}>
                    <Ionicons name="filter" size={22} color={theme.colors.text.primary} />
                </Pressable>
            </View>

            {isLoading ? (
                <View style={[styles.centerFill, { marginTop: 58 }]}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : !analysis ? (
                <View style={[styles.centerFill, { marginTop: 58 }]}>
                    <Ionicons name="stats-chart" size={48} color="#2C2C2E" />
                    <Text style={styles.emptyText}>No data found</Text>
                </View>
            ) : (
                <FlatList
                    data={summaryStats}
                    keyExtractor={(item) => item.muscle_group}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20, marginTop: 58 }]}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <>
                            {!isPro && !analysis.is_pro && analysis.weeks_limit && (
                                <UpgradePrompt
                                    compact
                                    feature={`Viewing last ${analysis.weeks_limit} weeks only`}
                                    message="Upgrade to PRO for unlimited history"
                                />
                            )}

                            <View style={styles.statsRow}>
                                <View style={styles.statChip}>
                                    <Text style={styles.statChipValue}>{totalStats.workouts}</Text>
                                    <Text style={styles.statChipLabel}>WORKOUTS</Text>
                                </View>
                                <View style={styles.statChip}>
                                    <Text style={styles.statChipValue}>{totalStats.sets}</Text>
                                    <Text style={styles.statChipLabel}>TOTAL SETS</Text>
                                </View>
                                <View style={styles.statChip}>
                                    <Text style={styles.statChipValue}>{analysis.period?.total_weeks || 12}</Text>
                                    <Text style={styles.statChipLabel}>WEEKS</Text>
                                </View>
                            </View>

                            {renderChart()}

                            <Text style={styles.sectionTitle}>MUSCLE GROUPS</Text>
                        </>
                    }
                    renderItem={renderMuscleRow}
                />
            )}

            <Modal visible={isFilterVisible} transparent animationType="fade" presentationStyle="overFullScreen" onRequestClose={() => setIsFilterVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Analysis Period</Text>
                        <View style={styles.inputContainer}>
                            <TextInput 
                                style={styles.input} 
                                value={filterWeeks} 
                                onChangeText={setFilterWeeks} 
                                keyboardType="numeric" 
                                placeholder="12" 
                                placeholderTextColor="#545458"
                                autoFocus
                            />
                            <Text style={styles.inputUnit}>Weeks</Text>
                        </View>
                        <View style={styles.modalActions}>
                            <Pressable style={styles.btnCancel} onPress={() => setIsFilterVisible(false)}>
                                <Text style={styles.btnTextCancel}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.btnApply} onPress={() => { setIsFilterVisible(false); loadAnalysis(); }}>
                                <Text style={styles.btnTextApply}>Apply</Text>
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <UpgradeModal
                visible={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                feature="Unlimited Volume History"
                message="View volume analysis for any time period"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
    headerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16 },
    emptyText: { color: '#8E8E93', marginTop: 16, fontSize: 16 },

    // Stats Row
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statChip: { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
    statChipValue: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 4 },
    statChipLabel: { fontSize: 11, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5 },

    // Chart Card
    chartCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#2C2C2E' },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    chartTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', textTransform: 'capitalize' },
    chartSubtitle: { fontSize: 13, color: '#8E8E93' },
    closeChartBtn: { padding: 4, backgroundColor: '#2C2C2E', borderRadius: 12 },
    chartScroll: { alignItems: 'flex-end', gap: 16, paddingRight: 20 },
    barContainer: { alignItems: 'center', gap: 8, width: 30 },
    barTrack: { height: 120, width: 6, backgroundColor: '#2C2C2E', borderRadius: 3, justifyContent: 'flex-end', overflow: 'hidden' },
    barFill: { width: '100%', borderRadius: 3 },
    barLabel: { fontSize: 10, color: '#8E8E93', width: 40, textAlign: 'center' },

    // List
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#636366', marginBottom: 12, marginLeft: 4 },
    rowCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2C2C2E' },
    rowCardActive: { borderColor: '#0A84FF', backgroundColor: '#1C1C1E' },
    rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    rowTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    rowTitle: { fontSize: 17, fontWeight: '600', color: '#FFF', textTransform: 'capitalize' },
    rowValue: { fontSize: 17, fontWeight: '600', color: '#FFF' },
    rowUnit: { fontSize: 13, color: '#8E8E93', fontWeight: '400' },
    progressTrack: { height: 6, backgroundColor: '#2C2C2E', borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    rowStats: { flexDirection: 'row', justifyContent: 'space-between' },
    rowStatText: { fontSize: 13, color: '#8E8E93' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2C2C2E' },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', textAlign: 'center', marginBottom: 24 },
    inputContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 32 },
    input: { fontSize: 40, fontWeight: '700', color: '#FFF', minWidth: 60, textAlign: 'center' },
    inputUnit: { fontSize: 20, color: '#8E8E93', fontWeight: '600', marginLeft: 8 },
    modalActions: { flexDirection: 'row', gap: 12 },
    btnCancel: { flex: 1, padding: 16, backgroundColor: '#2C2C2E', borderRadius: 14, alignItems: 'center' },
    btnApply: { flex: 1, padding: 16, backgroundColor: '#0A84FF', borderRadius: 14, alignItems: 'center' },
    btnTextCancel: { color: '#FFF', fontSize: 17, fontWeight: '600' },
    btnTextApply: { color: '#FFF', fontSize: 17, fontWeight: '600' },
});