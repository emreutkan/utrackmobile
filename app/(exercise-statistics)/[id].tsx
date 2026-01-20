import { getExerciseRanking } from '@/api/Achievements';
import { getExercise1RMHistory, getExerciseSetHistory } from '@/api/Exercises';
import { Exercise1RMHistory, ExerciseRanking } from '@/api/types';
import UpgradeModal from '@/components/UpgradeModal';
import { commonStyles, theme, typographyStyles } from '@/constants/theme';
import { useUserStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 220;
const CHART_PADDING = 20;
const MIN_POINT_SPACING = 80; // Minimum space between data points for readability

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const NeuralBarChart = ({ data, valueKey, secondaryKey, showPercentage = false, mode = 'timeline' }: { 
    data: any[], 
    valueKey: string, 
    secondaryKey?: string,
    showPercentage?: boolean,
    mode?: 'timeline' | 'reps'
}) => {
    if (!data || data.length === 0) return null;

    const scrollViewRef = useRef<ScrollView>(null);

    // Calculate dynamic width based on number of data points
    const chartWidth = Math.max(SCREEN_WIDTH - 48, data.length * MIN_POINT_SPACING);
    const shouldScroll = chartWidth > SCREEN_WIDTH - 48;

    // Scroll to the end (most recent data) when chart mounts
    useEffect(() => {
        if (shouldScroll && scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
            }, 100);
        }
    }, [shouldScroll, data.length]);

    const values = data.map(entry => entry[valueKey]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    
    // Add padding to range for better visualization
    const padding = range * 0.15;
    const effectiveMin = Math.max(0, minVal - padding);
    const effectiveMax = maxVal + padding;
    const effectiveRange = effectiveMax - effectiveMin;

    const getCoordinates = (index: number, value: number) => {
        const x = (index / (data.length - 1 || 1)) * (chartWidth - 40) + 20;
        const y = CHART_HEIGHT - ((value - effectiveMin) / effectiveRange) * (CHART_HEIGHT - 60) - 30;
        return { x, y };
    };

    // Generate path for the primary line
    let pathD = "";
    data.forEach((entry, i) => {
        const { x, y } = getCoordinates(i, entry[valueKey]);
        if (i === 0) pathD = `M ${x} ${y}`;
        else {
            const prev = getCoordinates(i - 1, data[i - 1][valueKey]);
            const cp1x = prev.x + (x - prev.x) / 2;
            pathD += ` C ${cp1x} ${prev.y}, ${cp1x} ${y}, ${x} ${y}`;
        }
    });

    const fillPathD = data.length > 1 
        ? `${pathD} L ${getCoordinates(data.length - 1, data[data.length-1][valueKey]).x} ${CHART_HEIGHT} L ${getCoordinates(0, data[0][valueKey]).x} ${CHART_HEIGHT} Z`
        : "";

    const chartContent = (
        <View style={[styles.chartContent, { width: chartWidth }]}>
            <Svg width={chartWidth} height={CHART_HEIGHT}>
                <Defs>
                    <SvgLinearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={theme.colors.text.brand} stopOpacity="0.3" />
                        <Stop offset="1" stopColor={theme.colors.text.brand} stopOpacity="0" />
                    </SvgLinearGradient>
                </Defs>

                {/* Grid Lines */}
                {[0, 0.5, 1].map((ratio, i) => {
                    const y = CHART_HEIGHT - (ratio * (CHART_HEIGHT - 60)) - 30;
                    return (
                        <Path 
                            key={i}
                            d={`M 20 ${y} L ${chartWidth - 20} ${y}`}
                            stroke={theme.colors.ui.border}
                            strokeWidth="1"
                            opacity="0.3"
                        />
                    );
                })}

                {/* Fill */}
                {fillPathD && <Path d={fillPathD} fill="url(#lineGradient)" />}

                {/* Main Line */}
                <Path 
                    d={pathD} 
                    stroke={theme.colors.text.brand} 
                    strokeWidth="3" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />

                {/* Points */}
                {data.map((entry, i) => {
                    const { x, y } = getCoordinates(i, entry[valueKey]);
                    return (
                        <View key={i}>
                            <Path 
                                d={`M ${x-1.5} ${y} a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0`} 
                                fill={theme.colors.text.brand}
                                stroke={theme.colors.background}
                                strokeWidth="2"
                            />
                        </View>
                    );
                })}
            </Svg>
            
            {/* Data Point Labels */}
            <View style={[styles.dataLabelsContainer, { width: chartWidth }]}>
                {data.map((entry, i) => {
                    const { x, y } = getCoordinates(i, entry[valueKey]);
                    
                    if (mode === 'timeline') {
                        const date = new Date(entry.workout_date);
                        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                        const weight = entry[valueKey].toFixed(1);
                        
                        return (
                            <View key={i} style={[styles.dataLabel, { left: x - 30, top: y - 45 }]}>
                                <Text style={styles.dataLabelWeight}>{weight}kg</Text>
                                <Text style={styles.dataLabelDate}>{dateStr}</Text>
                            </View>
                        );
                    } else {
                        // For reps mode, show weight
                        const weight = entry[valueKey].toFixed(1);
                        
                        return (
                            <View key={i} style={[styles.dataLabel, { left: x - 30, top: y - 45 }]}>
                                <Text style={styles.dataLabelWeight}>{weight}kg</Text>
                            </View>
                        );
                    }
                })}
            </View>

            {/* X Axis Labels - show reps for weight chart */}
            {mode === 'reps' && (
                <View style={[styles.xAxis, { width: chartWidth - 40 }]}>
                    {data.map((entry, i) => {
                        return (
                            <Text key={i} style={styles.xAxisLabel}>
                                {entry.reps} reps
                            </Text>
                        );
                    })}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.chartWrapper}>
            {shouldScroll ? (
                <ScrollView 
                    ref={scrollViewRef}
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {chartContent}
                </ScrollView>
            ) : (
                chartContent
            )}
        </View>
    );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function ExerciseStatisticsScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useUserStore();
    const [history, setHistory] = useState<Exercise1RMHistory | null>(null);
    const [ranking, setRanking] = useState<ExerciseRanking | null>(null);
    const [recentPerformance, setRecentPerformance] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [rmChartMode, setRmChartMode] = useState<'1RM' | 'PROGRESS'>('1RM');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const insets = useSafeAreaInsets();
    
    const isPro = user?.is_pro || false;

    useEffect(() => {
        if (id) {
            if (!isPro) {
                setShowUpgradeModal(true);
            }
            fetchData();
        }
    }, [id, isPro]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [rmData, sData, rData] = await Promise.all([
                getExercise1RMHistory(Number(id)),
                getExerciseSetHistory(Number(id)),
                getExerciseRanking(Number(id))
            ]);
            
            if (rmData && typeof rmData === 'object' && 'history' in rmData) {
                setHistory(rmData);
            }
            
            if (sData?.results) {
                setRecentPerformance(sData.results);
            } else if (Array.isArray(sData)) {
                setRecentPerformance(sData);
            }

            if (rData) {
                setRanking(rData);
            }
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const best1RM = useMemo(() => {
        if (!history || history.history.length === 0) return 0;
        return Math.max(...history.history.map(h => h.one_rep_max));
    }, [history]);

    const latest1RM = useMemo(() => {
        if (!history || history.history.length === 0) return 0;
        return history.history[0].one_rep_max;
    }, [history]);

    const progressionPct = useMemo(() => {
        if (!history || history.history.length < 2) return 0;
        const oldest = history.history[history.history.length - 1].one_rep_max;
        const newest = history.history[0].one_rep_max;
        return ((newest - oldest) / oldest) * 100;
    }, [history]);

    // Data for 1RM Chart (including progress % if mode is PROGRESS)
    const rmChartData = useMemo(() => {
        if (!history) return [];
        // Reverse to show oldest to newest (left to right)
        const baseHistory = [...history.history].reverse();
        if (rmChartMode === '1RM') return baseHistory;
        
        const firstVal = baseHistory[0]?.one_rep_max || 1;
        return baseHistory.map(entry => ({
            ...entry,
            progress_pct: ((entry.one_rep_max - firstVal) / firstVal) * 100
        }));
    }, [history, rmChartMode]);

    // Data for KG + Reps chart (Highest weight for each rep count)
    const kgRepsData = useMemo(() => {
        if (!recentPerformance || recentPerformance.length === 0) return [];
        
        // Group by rep count and take the highest weight for each rep count
        const repGroups: { [key: number]: any } = {};
        recentPerformance.forEach(set => {
            // Skip warmup sets
            if (set.is_warmup) return;
            
            const reps = set.reps;
            if (!repGroups[reps] || set.weight > repGroups[reps].weight) {
                repGroups[reps] = set;
            }
        });

        // Sort by rep count ascending
        return Object.values(repGroups).sort((a, b) => a.reps - b.reps);
    }, [recentPerformance]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.15)', 'transparent']}
                style={styles.gradientBg}
            />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {history?.exercise_name || 'STATISTICS'}
                    </Text>
                    <Text style={styles.headerSubtitle}>PERFORMANCE ANALYSIS</Text>
                </View>
                <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.status.active} />
                </View>
            ) : history && history.history.length > 0 ? (
                <ScrollView 
                    style={styles.content} 
                    contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 40 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Key Metrics Bento */}
                    <View style={styles.metricsRow}>
                        <View style={[styles.metricCard, { flex: 1.5 }]}>
                            <View style={styles.metricHeader}>
                                <Ionicons name="trophy-outline" size={14} color={theme.colors.status.warning} />
                                <Text style={styles.metricLabel}>PERSONAL BEST</Text>
                            </View>
                            <View style={styles.metricValueContainer}>
                                <Text style={styles.metricValue}>{best1RM.toFixed(1)}</Text>
                                <Text style={styles.metricUnit}>KG</Text>
                            </View>
                        </View>
                        
                        <View style={[styles.metricCard, { flex: 1 }]}>
                            <View style={styles.metricHeader}>
                                <Ionicons 
                                    name={progressionPct >= 0 ? "trending-up" : "trending-down"} 
                                    size={14} 
                                    color={progressionPct >= 0 ? theme.colors.status.success : theme.colors.status.error} 
                                />
                                <Text style={styles.metricLabel}>PROGRESS</Text>
                            </View>
                            <View style={styles.metricValueContainer}>
                                <Text style={[
                                    styles.metricValue, 
                                    { color: progressionPct >= 0 ? theme.colors.status.success : theme.colors.status.error, fontSize: 24 }
                                ]}>
                                    {progressionPct >= 0 ? '+' : ''}{progressionPct.toFixed(1)}
                                </Text>
                                <Text style={[
                                    styles.metricUnit,
                                    { color: progressionPct >= 0 ? theme.colors.status.success : theme.colors.status.error }
                                ]}>%</Text>
                            </View>
                            </View>
                        </View>

                        {/* Ranking Bento */}
                        {ranking && (
                            <View style={styles.rankingCard}>
                                <View style={styles.rankingHeader}>
                                    <View style={styles.rankingBadge}>
                                        <Text style={styles.rankingBadgeText}>TOP {100 - (ranking.one_rm_percentile || 0)}%</Text>
                                    </View>
                                    <Text style={styles.rankingMessage}>{ranking.percentile_message}</Text>
                                </View>
                                <View style={styles.rankingStats}>
                                    <View style={styles.rankingStat}>
                                        <Text style={styles.rankingStatLabel}>GLOBAL RANK</Text>
                                        <Text style={styles.rankingStatValue}>
                                            STRENGTH: {ranking.weight_percentile}%
                                        </Text>
                                    </View>
                                    <View style={styles.rankingStat}>
                                        <Text style={styles.rankingStatLabel}>TOTAL USERS</Text>
                                        <Text style={styles.rankingStatValue}>{ranking.total_users}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Chart Section */}
                            <View style={styles.sectionCard}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionIconContainer}>
                                        <Ionicons name="analytics" size={18} color={theme.colors.text.brand} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sectionTitle}>1RM PROGRESSION</Text>
                                        <Text style={styles.sectionSubtitle}>
                                            {rmChartMode === '1RM' ? 'ESTIMATED MAX OVER TIME' : 'PERCENTAGE CHANGE FROM START'}
                                        </Text>
                                    </View>
                                    
                                    {/* Toggle Buttons */}
                                    <View style={styles.toggleContainer}>
                                        <TouchableOpacity 
                                            onPress={() => setRmChartMode('1RM')}
                                            style={[styles.toggleButton, rmChartMode === '1RM' && styles.toggleButtonActive]}
                                        >
                                            <Text style={[styles.toggleButtonText, rmChartMode === '1RM' && styles.toggleButtonTextActive]}>1RM</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => setRmChartMode('PROGRESS')}
                                            style={[styles.toggleButton, rmChartMode === 'PROGRESS' && styles.toggleButtonActive]}
                                        >
                                            <Text style={[styles.toggleButtonText, rmChartMode === 'PROGRESS' && styles.toggleButtonTextActive]}>PROGRESS</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                
                                <NeuralBarChart 
                                    data={rmChartData} 
                                    valueKey={rmChartMode === '1RM' ? 'one_rep_max' : 'progress_pct'}
                                    mode="timeline"
                                />
                            </View>

                            {/* Weight + Reps Section */}
                            {kgRepsData.length > 0 && (
                                <View style={styles.sectionCard}>
                                    <View style={styles.sectionHeader}>
                                        <View style={styles.sectionIconContainer}>
                                            <Ionicons name="barbell" size={18} color={theme.colors.text.brand} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.sectionTitle}>WEIGHT & REPS</Text>
                                            <Text style={styles.sectionSubtitle}>HIGHEST WEIGHT AT EACH REP COUNT</Text>
                                        </View>
                                    </View>
                                    
                                    <NeuralBarChart 
                                        data={kgRepsData} 
                                        valueKey="weight"
                                        mode="reps"
                                    />
                                </View>
                            )}

                            {/* Set History Section */}
                    {recentPerformance.length > 0 && (
                        <View style={{ marginBottom: 30 }}>
                            <Text style={styles.historySectionTitle}>RECENT PERFORMANCE</Text>
                            <View style={styles.historyList}>
                                {recentPerformance.map((set, idx) => {
                                    const date = new Date(set.workout_date);
                                    return (
                                        <View key={idx} style={styles.historyItem}>
                                            <View style={styles.historyItemMain}>
                                                <View style={styles.dateContainer}>
                                                    <Text style={styles.dateDay}>{date.getDate()}</Text>
                                                    <Text style={styles.dateMonth}>
                                                        {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View style={styles.workoutInfo}>
                                                    <Text style={styles.workoutTitle} numberOfLines={1}>{set.workout_title || 'Workout'}</Text>
                                                    <Text style={styles.workoutYear}>SET {set.set_number} {set.is_warmup ? '• WARMUP' : ''}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.historyItemRight}>
                                                <Text style={styles.historyValue}>{set.weight}</Text>
                                                <Text style={styles.historyUnit}>KG</Text>
                                                <Text style={[styles.historyValue, { marginLeft: 8 }]}>×</Text>
                                                <Text style={[styles.historyValue, { marginLeft: 4 }]}>{set.reps}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* 1RM History (Summary) */}
                    <Text style={styles.historySectionTitle}>1RM HISTORY</Text>
                    <View style={styles.historyList}>
                        {history.history.map((entry, idx) => {
                            const date = new Date(entry.workout_date);
                            const isNewBest = entry.one_rep_max >= best1RM && idx < 3;
                            
                            return (
                                <View key={idx} style={styles.historyItem}>
                                    <View style={styles.historyItemMain}>
                                        <View style={styles.dateContainer}>
                                            <Text style={styles.dateDay}>{date.getDate()}</Text>
                                            <Text style={styles.dateMonth}>
                                                {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.workoutInfo}>
                                            <Text style={styles.workoutTitle} numberOfLines={1}>{entry.workout_title}</Text>
                                            <View style={styles.bestBadgeContainer}>
                                                {isNewBest && (
                                                    <View style={styles.bestBadge}>
                                                        <Ionicons name="star" size={10} color="#000" />
                                                        <Text style={styles.bestBadgeText}>PB</Text>
                                                    </View>
                                                )}
                                                <Text style={styles.workoutYear}>{date.getFullYear()}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.historyItemRight}>
                                        <Text style={styles.historyValue}>{entry.one_rep_max.toFixed(1)}</Text>
                                        <Text style={styles.historyUnit}>KG</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="barbell-outline" size={48} color={theme.colors.text.tertiary} />
                    </View>
                    <Text style={styles.emptyText}>NO DATA YET</Text>
                    <Text style={styles.emptySubtext}>
                        Complete workouts with this exercise to track your performance.
                    </Text>
                    <TouchableOpacity 
                        style={styles.emptyButton}
                        onPress={() => router.replace('/(home)')}
                    >
                        <Text style={styles.emptyButtonText}>START TRAINING</Text>
                    </TouchableOpacity>
                </View>
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
        height: 400,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        ...typographyStyles.h4,
        color: theme.colors.text.primary,
        fontSize: 18,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
    },
    refreshButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    
    // Metrics Bento
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    metricCard: {
        ...commonStyles.glassPanel,
        padding: 16,
        borderRadius: 24,
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.secondary,
        letterSpacing: 0.5,
    },
    metricValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    metricValue: {
        ...typographyStyles.h2,
        fontSize: 32,
        color: theme.colors.text.primary,
    },
    metricUnit: {
        fontSize: 12,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        marginLeft: 4,
    },

    // Ranking Bento
    rankingCard: {
        ...commonStyles.glassPanel,
        padding: 20,
        marginBottom: 20,
        borderRadius: 24,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    rankingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 15,
    },
    rankingBadge: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    rankingBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
    },
    rankingMessage: {
        flex: 1,
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.primary,
        lineHeight: 16,
    },
    rankingStats: {
        flexDirection: 'row',
        gap: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    rankingStat: {
        flex: 1,
    },
    rankingStatLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
        marginBottom: 4,
    },
    rankingStatValue: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.text.secondary,
    },

    // Section Card (Chart)
    sectionCard: {
        ...commonStyles.glassPanel,
        padding: 24,
        marginBottom: 30,
        borderRadius: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    sectionIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: theme.colors.text.primary,
        letterSpacing: 0.5,
    },
    sectionSubtitle: {
        fontSize: 9,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
    },
    
    // Toggle Buttons
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        padding: 3,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    toggleButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    toggleButtonActive: {
        backgroundColor: theme.colors.ui.glassStrong,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    toggleButtonText: {
        fontSize: 9,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.5,
    },
    toggleButtonTextActive: {
        color: theme.colors.text.brand,
    },

    // Chart
    chartWrapper: {
        marginTop: 10,
        overflow: 'hidden',
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    chartContent: {
        position: 'relative',
        alignItems: 'center',
    },
    dataLabelsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: CHART_HEIGHT,
    },
    dataLabel: {
        position: 'absolute',
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glassStrong,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        width: 60,
    },
    dataLabelWeight: {
        fontSize: 11,
        fontWeight: '900',
        color: theme.colors.text.brand,
        fontStyle: 'italic',
    },
    dataLabelDate: {
        fontSize: 8,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        marginTop: 1,
    },
    xAxis: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingHorizontal: 20,
    },
    xAxisLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
    },
    chartLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 15,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    legendText: {
        fontSize: 9,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.5,
    },

    // History
    historySectionTitle: {
        ...typographyStyles.labelMuted,
        marginBottom: 15,
        marginLeft: 4,
    },
    historyList: {
        gap: 12,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.ui.glass,
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    historyItemMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    dateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    dateDay: {
        fontSize: 16,
        fontWeight: '900',
        color: theme.colors.text.primary,
    },
    dateMonth: {
        fontSize: 8,
        fontWeight: '800',
        color: theme.colors.text.brand,
    },
    workoutInfo: {
        flex: 1,
    },
    workoutTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    bestBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bestBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.status.warning,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
        gap: 3,
    },
    bestBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#000',
    },
    workoutYear: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
    },
    historyItemRight: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    historyValue: {
        fontSize: 20,
        fontWeight: '900',
        color: theme.colors.text.brand,
        fontStyle: 'italic',
    },
    historyUnit: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.ui.glass,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    emptyText: {
        ...typographyStyles.h3,
        fontSize: 20,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
    },
    emptyButton: {
        backgroundColor: theme.colors.text.brand,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 20,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
});
