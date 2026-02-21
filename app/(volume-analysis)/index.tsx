import { getVolumeAnalysis } from '@/api/VolumeAnalysis';
import type { BalancePair, MuscleSummary, VolumeAnalysisResponse } from '@/api/types';
import UpgradeModal from '@/components/UpgradeModal';
import UpgradePrompt from '@/components/UpgradePrompt';
import { commonStyles, theme, typographyStyles } from '@/constants/theme';
import { useSettingsStore } from '@/state/stores/settingsStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// CONSTANTS
// ============================================================================

const MUSCLE_COLORS: Record<string, string> = {
    chest: '#FF3B30', shoulders: '#FF9500', biceps: '#FFCC00', triceps: '#32D74B',
    lats: '#0A84FF', traps: '#5E5CE6', quads: '#FF2D55', hamstrings: '#BF5AF2',
    glutes: '#FF375F', calves: '#30D158', abs: '#64D2FF', forearms: '#FF9F0A',
};

const getMuscleColor = (mg: string) => MUSCLE_COLORS[mg.toLowerCase()] || '#8E8E93';

const STATUS_CONFIG = {
    optimal: { color: theme.colors.status.success, label: 'OPTIMAL' },
    undertrained: { color: theme.colors.status.warning, label: 'UNDERTRAINED' },
    overtrained: { color: theme.colors.status.error, label: 'OVERTRAINED' },
    untrained: { color: theme.colors.text.tertiary, label: 'UNTRAINED' },
} as const;

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function VolumeStatusCard({ muscle, data }: { muscle: string; data: MuscleSummary }) {
    const config = STATUS_CONFIG[data.volume_status];
    const hasTarget = data.target_min !== null && data.target_max !== null;
    const fillPct = hasTarget && data.target_max
        ? Math.min((data.sets_per_week / data.target_max) * 100, 110)
        : 0;
    // Show where the target range starts/ends on the bar
    const targetMinPct = hasTarget && data.target_max
        ? (data.target_min! / data.target_max) * 100
        : null;

    return (
        <View style={styles.statusCard}>
            <View style={styles.statusCardHeader}>
                <View style={styles.statusCardLeft}>
                    <View style={[styles.muscleDot, { backgroundColor: getMuscleColor(muscle) }]} />
                    <Text style={styles.statusMuscleName}>{muscle.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${config.color}18`, borderColor: `${config.color}40` }]}>
                    <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
                </View>
            </View>

            <Text style={styles.statusMessage}>{data.volume_status_message}</Text>

            {hasTarget && (
                <View style={styles.rangeBarContainer}>
                    <View style={styles.rangeBarTrack}>
                        {/* Target range highlight */}
                        {targetMinPct !== null && (
                            <View
                                style={[
                                    styles.rangeTargetZone,
                                    { left: `${targetMinPct}%`, right: '0%' },
                                ]}
                            />
                        )}
                        {/* Actual fill */}
                        <View
                            style={[
                                styles.rangeBarFill,
                                {
                                    width: `${Math.min(fillPct, 100)}%`,
                                    backgroundColor: config.color,
                                },
                            ]}
                        />
                    </View>
                    <View style={styles.rangeBarLabels}>
                        <Text style={styles.rangeBarLabelLeft}>
                            {data.sets_per_week.toFixed(1)} sets/wk
                        </Text>
                        <Text style={styles.rangeBarLabelRight}>
                            target: {data.target_min}–{data.target_max}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

function BalanceCard({ pair }: { pair: BalancePair }) {
    const isImbalanced = pair.status === 'imbalanced';
    const isNoData = pair.status === 'no_data';
    const statusColor = isImbalanced
        ? theme.colors.status.error
        : isNoData
        ? theme.colors.text.tertiary
        : theme.colors.status.success;

    const totalSets = pair.sets_a + pair.sets_b;
    const aWidth = totalSets > 0 ? (pair.sets_a / totalSets) * 100 : 50;
    const bWidth = totalSets > 0 ? (pair.sets_b / totalSets) * 100 : 50;

    return (
        <View style={[styles.balanceCard, isImbalanced && styles.balanceCardImbalanced]}>
            <View style={styles.balanceCardHeader}>
                <Text style={styles.balanceLabel}>{pair.label.toUpperCase()}</Text>
                <View style={[
                    styles.balanceStatusDot,
                    { backgroundColor: statusColor },
                ]} />
            </View>

            {!isNoData && (
                <>
                    <View style={styles.balanceMuscleRow}>
                        <Text style={[styles.balanceMuscle, { color: getMuscleColor(pair.muscle_a) }]}>
                            {pair.muscle_a.toUpperCase()}
                        </Text>
                        <Text style={styles.balanceRatio}>
                            {pair.ratio != null ? `${pair.ratio.toFixed(1)}:1` : '—'}
                        </Text>
                        <Text style={[styles.balanceMuscle, { color: getMuscleColor(pair.muscle_b) }]}>
                            {pair.muscle_b.toUpperCase()}
                        </Text>
                    </View>

                    <View style={styles.balanceBarTrack}>
                        <View style={[styles.balanceBarA, { width: `${aWidth}%`, backgroundColor: getMuscleColor(pair.muscle_a) }]} />
                        <View style={[styles.balanceBarB, { width: `${bWidth}%`, backgroundColor: getMuscleColor(pair.muscle_b) }]} />
                    </View>

                    <View style={styles.balanceSetsRow}>
                        <Text style={styles.balanceSetsText}>{pair.sets_a} sets</Text>
                        <Text style={styles.balanceSetsText}>{pair.sets_b} sets</Text>
                    </View>
                </>
            )}

            <Text style={[styles.balanceMessage, { color: isImbalanced ? theme.colors.status.error : theme.colors.text.secondary }]}>
                {pair.message}
            </Text>
        </View>
    );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function VolumeAnalysisScreen() {
    const insets = useSafeAreaInsets();
    const isPro = useSettingsStore((s) => s.isPro);

    const [analysis, setAnalysis] = useState<VolumeAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [filterWeeks, setFilterWeeks] = useState('12');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    // Tab: 'volume' | 'status' | 'balance'
    const [activeTab, setActiveTab] = useState<'volume' | 'status' | 'balance'>('volume');

    const loadAnalysis = async () => {
        setIsLoading(true);
        try {
            const requestedWeeks = parseInt(filterWeeks) || 12;
            const data = await getVolumeAnalysis({ weeks_back: requestedWeeks });
            if (data?.weeks) {
                setAnalysis(data);
                if (!isPro && !data.is_pro && data.weeks_limit && requestedWeeks > data.weeks_limit) {
                    setShowUpgradeModal(true);
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

    // Legacy: compute from weeks if summary not provided
    const legacySummaryStats = useMemo(() => {
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
        const result: { muscle_group: string; average_volume: number; max_volume: number; total_sets: number }[] = [];
        map.forEach((stats, mg) => {
            if (stats.volumes.length > 0) {
                result.push({
                    muscle_group: mg,
                    average_volume: stats.volumes.reduce((a, b) => a + b, 0) / stats.volumes.length,
                    max_volume: Math.max(...stats.volumes),
                    total_sets: stats.sets,
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
            const weekWorkouts = Math.max(...Object.values(week.muscle_groups).map(d => d.workouts), 0);
            totalWorkouts += weekWorkouts;
            Object.values(week.muscle_groups).forEach(d => totalSets += d.sets);
        });
        return { workouts: totalWorkouts, sets: totalSets };
    }, [analysis]);

    const weeklyChartData = useMemo(() => {
        if (!analysis || !selectedMuscle) return [];
        return analysis.weeks.map(week => ({
            date: week.week_start,
            volume: week.muscle_groups[selectedMuscle]?.total_volume || 0,
        })).reverse();
    }, [analysis, selectedMuscle]);

    // New: sorted muscle summaries from API
    const muscleSummaryEntries = useMemo(() => {
        if (!analysis?.summary) return [];
        return Object.entries(analysis.summary).sort((a, b) => {
            // Sort: optimal first, then undertrained/overtrained, then untrained
            const order = { optimal: 0, overtrained: 1, undertrained: 2, untrained: 3 };
            return (order[a[1].volume_status] ?? 4) - (order[b[1].volume_status] ?? 4);
        });
    }, [analysis]);

    // Balance pairs
    const balancePairs = useMemo(() => {
        if (!analysis?.balance) return [];
        return Object.values(analysis.balance);
    }, [analysis]);

    // -------------------------------------------------------------------------
    // RENDER HELPERS
    // -------------------------------------------------------------------------

    const renderChart = () => {
        if (!selectedMuscle || weeklyChartData.length === 0) return null;
        const maxVol = Math.max(...weeklyChartData.map(d => d.volume), 1);
        const color = getMuscleColor(selectedMuscle);
        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <View>
                        <Text style={styles.chartTitle}>{selectedMuscle.toUpperCase()}</Text>
                        <Text style={styles.chartSubtitle}>Weekly Volume History</Text>
                    </View>
                    <Pressable onPress={() => setSelectedMuscle(null)} style={styles.closeChartBtn}>
                        <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
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

    const renderVolumeRow = ({ item }: { item: { muscle_group: string; average_volume: number; max_volume: number; total_sets: number } }) => {
        const color = getMuscleColor(item.muscle_group);
        const maxAvg = legacySummaryStats[0]?.average_volume || 1;
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
                        <Text style={styles.rowTitle}>{item.muscle_group.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.rowValue}>
                        {item.average_volume.toFixed(0)} <Text style={styles.rowUnit}>kg/wk</Text>
                    </Text>
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

    // -------------------------------------------------------------------------
    // TAB CONTENT
    // -------------------------------------------------------------------------

    const renderVolumeTab = () => (
        <FlatList
            data={legacySummaryStats}
            keyExtractor={(item) => item.muscle_group}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
                <>
                    {renderChart()}
                    <Text style={styles.sectionLabel}>MUSCLE GROUPS</Text>
                </>
            }
            renderItem={renderVolumeRow}
        />
    );

    const renderStatusTab = () => {
        if (!analysis?.summary) {
            return (
                <View style={styles.emptyTabContainer}>
                    <Ionicons name="analytics-outline" size={40} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyTabText}>No volume status data</Text>
                    <Text style={styles.emptyTabSubtext}>Ensure your backend returns the enhanced summary field</Text>
                </View>
            );
        }
        return (
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionLabel}>VOLUME STATUS</Text>
                <Text style={styles.sectionDescription}>
                    Evidence-based weekly set targets (Schoenfeld MEV/MAV)
                </Text>
                {muscleSummaryEntries.map(([muscle, data]) => (
                    <VolumeStatusCard key={muscle} muscle={muscle} data={data} />
                ))}
            </ScrollView>
        );
    };

    const renderBalanceTab = () => {
        if (!analysis?.balance || balancePairs.length === 0) {
            return (
                <View style={styles.emptyTabContainer}>
                    <Ionicons name="git-compare-outline" size={40} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyTabText}>No balance data</Text>
                    <Text style={styles.emptyTabSubtext}>Ensure your backend returns the balance field</Text>
                </View>
            );
        }
        const imbalancedCount = balancePairs.filter(p => p.status === 'imbalanced').length;
        return (
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.balanceSummaryRow}>
                    <Text style={styles.sectionLabel}>MUSCLE BALANCE</Text>
                    {imbalancedCount > 0 && (
                        <View style={styles.imbalancedBadge}>
                            <Text style={styles.imbalancedBadgeText}>{imbalancedCount} IMBALANCED</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.sectionDescription}>
                    Antagonist pair ratios — imbalances increase injury risk
                </Text>
                {balancePairs.map((pair, i) => (
                    <BalanceCard key={i} pair={pair} />
                ))}
            </ScrollView>
        );
    };

    // -------------------------------------------------------------------------
    // ROOT RENDER
    // -------------------------------------------------------------------------

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>VOLUME ANALYSIS</Text>
                <Pressable onPress={() => setIsFilterVisible(true)} style={styles.headerButton}>
                    <Ionicons name="options-outline" size={22} color={theme.colors.text.primary} />
                </Pressable>
            </View>

            {isLoading ? (
                <View style={styles.centerFill}>
                    <ActivityIndicator size="large" color={theme.colors.status.active} />
                </View>
            ) : !analysis ? (
                <View style={styles.centerFill}>
                    <Ionicons name="stats-chart" size={48} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyText}>No data found</Text>
                </View>
            ) : (
                <>
                    {/* Stats Row */}
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
                            <Text style={styles.statChipValue}>{analysis.period?.total_weeks || parseInt(filterWeeks)}</Text>
                            <Text style={styles.statChipLabel}>WEEKS</Text>
                        </View>
                    </View>

                    {!isPro && !analysis.is_pro && analysis.weeks_limit && (
                        <View style={styles.upgradeRow}>
                            <UpgradePrompt
                                compact
                                feature={`Viewing last ${analysis.weeks_limit} weeks only`}
                                message="Upgrade to PRO for unlimited history"
                            />
                        </View>
                    )}

                    {/* Tab Bar */}
                    <View style={styles.tabBar}>
                        {(['volume', 'status', 'balance'] as const).map((tab) => (
                            <Pressable
                                key={tab}
                                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                                    {tab === 'volume' ? 'VOLUME' : tab === 'status' ? 'STATUS' : 'BALANCE'}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Tab Content */}
                    {activeTab === 'volume' && renderVolumeTab()}
                    {activeTab === 'status' && renderStatusTab()}
                    {activeTab === 'balance' && renderBalanceTab()}
                </>
            )}

            {/* Filter Modal */}
            <Modal
                visible={isFilterVisible}
                transparent
                animationType="fade"
                presentationStyle="overFullScreen"
                onRequestClose={() => setIsFilterVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>ANALYSIS PERIOD</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={filterWeeks}
                                onChangeText={setFilterWeeks}
                                keyboardType="numeric"
                                placeholder="12"
                                placeholderTextColor={theme.colors.text.tertiary}
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

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.m,
        height: 56,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '900',
        fontStyle: 'italic',
        color: theme.colors.text.primary,
        letterSpacing: -0.3,
    },
    headerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

    // Loading / empty
    centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    emptyText: { color: theme.colors.text.secondary, fontSize: 16, fontWeight: '600' },

    // Stats row
    statsRow: {
        flexDirection: 'row',
        gap: theme.spacing.s,
        paddingHorizontal: theme.spacing.m,
        marginBottom: theme.spacing.s,
    },
    statChip: {
        flex: 1,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    statChipValue: {
        fontSize: 20,
        fontWeight: '900',
        fontStyle: 'italic',
        color: theme.colors.text.primary,
        fontVariant: ['tabular-nums'],
        marginBottom: 2,
    },
    statChipLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    upgradeRow: { paddingHorizontal: theme.spacing.m, marginBottom: theme.spacing.s },

    // Tab bar
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: theme.spacing.m,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        padding: 3,
        marginBottom: theme.spacing.s,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 13,
    },
    tabItemActive: {
        backgroundColor: theme.colors.status.active,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.8,
    },
    tabLabelActive: {
        color: theme.colors.text.primary,
    },

    // Content
    scrollContent: { padding: theme.spacing.m, paddingTop: theme.spacing.s },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    sectionDescription: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.text.tertiary,
        marginBottom: theme.spacing.m,
        lineHeight: 16,
    },

    // Volume tab: Chart card
    chartCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.l,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.l,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '900',
        fontStyle: 'italic',
        color: theme.colors.text.primary,
    },
    chartSubtitle: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
    closeChartBtn: {
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 10,
    },
    chartScroll: { alignItems: 'flex-end', gap: 14, paddingRight: 8 },
    barContainer: { alignItems: 'center', gap: 6, width: 28 },
    barTrack: {
        height: 100,
        width: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 3,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barFill: { width: '100%', borderRadius: 3 },
    barLabel: { fontSize: 9, color: theme.colors.text.tertiary, width: 36, textAlign: 'center' },

    // Volume tab: Muscle rows
    rowCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.s,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    rowCardActive: { borderColor: theme.colors.status.active },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    rowTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    rowTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: theme.colors.text.primary,
        letterSpacing: 0.5,
    },
    rowValue: { fontSize: 15, fontWeight: '900', fontStyle: 'italic', color: theme.colors.text.primary, fontVariant: ['tabular-nums'] },
    rowUnit: { fontSize: 11, color: theme.colors.text.tertiary, fontWeight: '600', fontStyle: 'normal' },
    progressTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: theme.borderRadius.full,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: theme.borderRadius.full },
    rowStats: { flexDirection: 'row', justifyContent: 'space-between' },
    rowStatText: { fontSize: 11, color: theme.colors.text.tertiary, fontWeight: '600' },

    // Volume Status tab
    statusCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.s,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    statusCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    statusCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    muscleDot: { width: 8, height: 8, borderRadius: 4 },
    statusMuscleName: {
        fontSize: 12,
        fontWeight: '900',
        color: theme.colors.text.primary,
        letterSpacing: 0.8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statusMessage: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 17,
        marginBottom: 10,
    },
    rangeBarContainer: { gap: 4 },
    rangeBarTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
        position: 'relative',
        flexDirection: 'row',
    },
    rangeTargetZone: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    rangeBarFill: { height: '100%', borderRadius: theme.borderRadius.full },
    rangeBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    rangeBarLabelLeft: { fontSize: 10, color: theme.colors.text.secondary, fontWeight: '600', fontVariant: ['tabular-nums'] },
    rangeBarLabelRight: { fontSize: 10, color: theme.colors.text.tertiary, fontWeight: '500' },

    // Balance tab
    balanceSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    imbalancedBadge: {
        backgroundColor: `${theme.colors.status.error}20`,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: `${theme.colors.status.error}40`,
    },
    imbalancedBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: theme.colors.status.error,
        letterSpacing: 0.5,
    },
    balanceCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.s,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    balanceCardImbalanced: {
        borderColor: `${theme.colors.status.error}40`,
    },
    balanceCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
    },
    balanceStatusDot: { width: 8, height: 8, borderRadius: 4 },
    balanceMuscleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    balanceMuscle: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    balanceRatio: {
        fontSize: 20,
        fontWeight: '900',
        fontStyle: 'italic',
        color: theme.colors.text.primary,
        fontVariant: ['tabular-nums'],
    },
    balanceBarTrack: {
        flexDirection: 'row',
        height: 6,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
        marginBottom: 4,
    },
    balanceBarA: { height: '100%' },
    balanceBarB: { height: '100%' },
    balanceSetsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    balanceSetsText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        fontVariant: ['tabular-nums'],
    },
    balanceMessage: { fontSize: 12, lineHeight: 17, fontWeight: '500' },

    // Empty tab
    emptyTabContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 8,
    },
    emptyTabText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.secondary,
    },
    emptyTabSubtext: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        lineHeight: 18,
    },

    // Filter Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    modalCard: {
        backgroundColor: theme.colors.ui.glassStrong,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '900',
        fontStyle: 'italic',
        color: theme.colors.text.primary,
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: theme.spacing.xl,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        marginBottom: theme.spacing.xxl,
    },
    input: {
        fontSize: 40,
        fontWeight: '900',
        fontStyle: 'italic',
        color: theme.colors.text.primary,
        minWidth: 60,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    inputUnit: {
        fontSize: 20,
        color: theme.colors.text.secondary,
        fontWeight: '600',
        marginLeft: 8,
    },
    modalActions: { flexDirection: 'row', gap: theme.spacing.s },
    btnCancel: {
        flex: 1,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    btnApply: {
        flex: 1,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.status.active,
        borderRadius: theme.borderRadius.l,
        alignItems: 'center',
    },
    btnTextCancel: { color: theme.colors.text.primary, fontSize: 15, fontWeight: '700' },
    btnTextApply: { color: theme.colors.text.primary, fontSize: 15, fontWeight: '700' },
});
