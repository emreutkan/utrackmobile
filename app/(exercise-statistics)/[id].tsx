import { getExercise1RMHistory } from '@/api/Exercises';
import { Exercise1RMHistory } from '@/api/types';
import { theme, typographyStyles, commonStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { 
    ActivityIndicator, 
    Dimensions, 
    ScrollView, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 220;
const CHART_PADDING = 20;
const CHART_WIDTH = SCREEN_WIDTH - 48; // Consistent with other screens

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const NeuralBarChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return null;

    const values = data.map(entry => entry.one_rep_max);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    
    // Add 10% padding to top and bottom of range for better visualization
    const padding = range * 0.15;
    const effectiveMin = Math.max(0, minVal - padding);
    const effectiveMax = maxVal + padding;
    const effectiveRange = effectiveMax - effectiveMin;

    const getCoordinates = (index: number, value: number) => {
        const x = (index / (data.length - 1 || 1)) * (CHART_WIDTH - 40) + 20;
        const y = CHART_HEIGHT - ((value - effectiveMin) / effectiveRange) * (CHART_HEIGHT - 60) - 30;
        return { x, y };
    };

    // Generate path for the line
    let pathD = "";
    data.forEach((entry, i) => {
        const { x, y } = getCoordinates(i, entry.one_rep_max);
        if (i === 0) pathD = `M ${x} ${y}`;
        else {
            const prev = getCoordinates(i - 1, data[i - 1].one_rep_max);
            const cp1x = prev.x + (x - prev.x) / 2;
            pathD += ` C ${cp1x} ${prev.y}, ${cp1x} ${y}, ${x} ${y}`;
        }
    });

    const fillPathD = data.length > 1 
        ? `${pathD} L ${getCoordinates(data.length - 1, data[data.length-1].one_rep_max).x} ${CHART_HEIGHT} L ${getCoordinates(0, data[0].one_rep_max).x} ${CHART_HEIGHT} Z`
        : "";

    return (
        <View style={styles.chartWrapper}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
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
                            d={`M 20 ${y} L ${CHART_WIDTH - 20} ${y}`}
                            stroke={theme.colors.ui.border}
                            strokeWidth="1"
                            opacity="0.3"
                        />
                    );
                })}

                {/* Fill */}
                {fillPathD && <Path d={fillPathD} fill="url(#lineGradient)" />}

                {/* Line Glow */}
                <Path 
                    d={pathD} 
                    stroke={theme.colors.text.brand} 
                    strokeWidth="6" 
                    fill="none" 
                    opacity="0.15" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />

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
                    const { x, y } = getCoordinates(i, entry.one_rep_max);
                    return (
                        <View key={i}>
                            <Path 
                                d={`M ${x-1} ${y} a 1 1 0 1 0 2 0 a 1 1 0 1 0 -2 0`} 
                                fill={theme.colors.text.brand}
                                stroke={theme.colors.background}
                                strokeWidth="2"
                            />
                        </View>
                    );
                })}
            </Svg>
            
            {/* X Axis Labels */}
            <View style={styles.xAxis}>
                {data.map((entry, i) => {
                    if (data.length > 6 && i % 2 !== 0 && i !== data.length - 1) return null;
                    const date = new Date(entry.workout_date);
                    return (
                        <Text key={i} style={styles.xAxisLabel}>
                            {date.getMonth() + 1}/{date.getDate()}
                        </Text>
                    );
                })}
            </View>
        </View>
    );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function ExerciseStatisticsScreen() {
    const { id } = useLocalSearchParams();
    const [history, setHistory] = useState<Exercise1RMHistory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (id) fetchHistory();
    }, [id]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await getExercise1RMHistory(Number(id));
            if (data && typeof data === 'object' && 'history' in data) {
                setHistory(data);
            }
        } catch (error) {
            console.error('Failed to fetch 1RM history:', error);
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
                <TouchableOpacity onPress={fetchHistory} style={styles.refreshButton}>
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

                    {/* Chart Section */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="analytics" size={18} color={theme.colors.text.brand} />
                            </View>
                            <View>
                                <Text style={styles.sectionTitle}>1RM PROGRESSION</Text>
                                <Text style={styles.sectionSubtitle}>ESTIMATED MAX OVER TIME</Text>
                            </View>
                        </View>
                        
                        <NeuralBarChart data={[...history.history].reverse()} />
                    </View>

                    {/* History Section */}
                    <Text style={styles.historySectionTitle}>RECENT HISTORY</Text>
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
                        Complete workouts with this exercise to track your 1RM progression.
                    </Text>
                    <TouchableOpacity 
                        style={styles.emptyButton}
                        onPress={() => router.replace('/(home)')}
                    >
                        <Text style={styles.emptyButtonText}>START TRAINING</Text>
                    </TouchableOpacity>
                </View>
            )}
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
    
    // Chart
    chartWrapper: {
        alignItems: 'center',
        marginTop: 10,
    },
    xAxis: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: CHART_WIDTH - 40,
        marginTop: 10,
    },
    xAxisLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
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
