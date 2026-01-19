import { getWorkout, getWorkoutSummary } from '@/api/Workout';
import { WorkoutSummaryResponse } from '@/api/types';
import UpgradePrompt from '@/components/UpgradePrompt';
import { theme, typographyStyles, commonStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const NeuralStatCard = ({ icon, value, label, color, delay, unit }: any) => (
    <Animated.View 
        entering={FadeInDown.delay(delay).springify()} 
        style={styles.neuralStatCard}
    >
        <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
                <Ionicons name={icon} size={16} color={color} />
                <Text style={styles.cardLabel}>{label.toUpperCase()}</Text>
            </View>
            <Ionicons name="pulse" size={18} color={`${color}50`} />
        </View>
        <View style={styles.cardValueRow}>
            <Text style={styles.cardValue}>{value}</Text>
            {unit && <Text style={styles.cardUnit}>{unit.toUpperCase()}</Text>}
        </View>
        <View style={styles.miniGraphWrapper}>
            <Svg width="100%" height="30">
                <Path 
                    d="M 0 15 Q 25 5, 50 20 T 100 15 T 150 25 T 200 10" 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="2" 
                    opacity="0.3" 
                />
            </Svg>
        </View>
    </Animated.View>
);

const AnalysisRow = ({ message, type }: { message: string, type: 'positive' | 'negative' | 'neutral' }) => {
    const color = type === 'positive' ? theme.colors.status.rest : type === 'negative' ? theme.colors.status.error : theme.colors.text.tertiary;
    const icon = type === 'positive' ? 'checkmark-circle' : type === 'negative' ? 'alert-circle' : 'information-circle';

    return (
        <View style={styles.analysisRow}>
            <View style={[styles.analysisIconContainer, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={16} color={color} />
            </View>
            <Text style={styles.analysisText}>{message}</Text>
        </View>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WorkoutSummaryScreen() {
    const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
    const insets = useSafeAreaInsets();
    const [workout, setWorkout] = useState<any>(null);
    const [summary, setSummary] = useState<WorkoutSummaryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (workoutId) fetchData();
    }, [workoutId]);

    const fetchData = async () => {
        try {
            const [wData, sData] = await Promise.all([
                getWorkout(parseInt(workoutId)),
                getWorkoutSummary(parseInt(workoutId))
            ]);
            if (wData && !wData.error) setWorkout(wData);
            if (sData && !sData.error) setSummary(sData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (s: number) => {
        if (!s) return '0';
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}`;
    };

    const getScoreColor = (s: number) => {
        if (s >= 8) return theme.colors.status.rest;
        if (s >= 5) return theme.colors.status.warning;
        return theme.colors.status.error;
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <ExpoLinearGradient colors={['rgba(99, 101, 241, 0.13)', 'transparent']} style={StyleSheet.absoluteFillObject} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.text.brand} />
                </View>
            </View>
        );
    }

    if (!workout) return null;

    const score = summary?.score ?? 0;
    const scoreColor = getScoreColor(score);
    const totalVolume = workout.exercises?.reduce((acc: number, ex: any) => 
        acc + (ex.sets?.reduce((sAcc: number, s: any) => sAcc + (s.weight * s.reps), 0) || 0), 0
    ) || 0;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ExpoLinearGradient
                colors={['rgba(99, 101, 241, 0.15)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
            />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SESSION SUMMARY</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Score Section */}
                <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.heroSection}>
                    <View style={styles.scoreContainer}>
                        <Svg width="160" height="160" viewBox="0 0 100 100">
                            <Defs>
                                <LinearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                                    <Stop offset="0" stopColor={scoreColor} stopOpacity="1" />
                                    <Stop offset="1" stopColor={scoreColor} stopOpacity="0.5" />
                                </LinearGradient>
                            </Defs>
                            <Path
                                d="M 50 10 A 40 40 0 1 1 49.9 10"
                                fill="none"
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="8"
                            />
                            <Path
                                d="M 50 10 A 40 40 0 1 1 49.9 10"
                                fill="none"
                                stroke="url(#scoreGrad)"
                                strokeWidth="8"
                                strokeDasharray={`${(score / 10) * 251.2} 251.2`}
                                strokeLinecap="round"
                            />
                        </Svg>
                        <View style={styles.scoreTextWrapper}>
                            <Text style={[styles.scoreValue, { color: scoreColor }]}>{score.toFixed(1)}</Text>
                            <Text style={styles.scoreLabel}>PERFORMANCE</Text>
                        </View>
                    </View>

                    <View style={styles.workoutInfo}>
                        <Text style={styles.workoutTitle}>{workout.title?.toUpperCase() || 'UNTITLED SESSION'}</Text>
                        <Text style={styles.workoutDate}>
                            {new Date(workout.date || workout.created_at).toLocaleDateString(undefined, {
                                weekday: 'long', month: 'short', day: 'numeric'
                            }).toUpperCase()}
                        </Text>
                    </View>
                </Animated.View>

                {/* Stats Grid */}
                <View style={styles.neuralGrid}>
                    <View style={styles.neuralRow}>
                        <NeuralStatCard 
                            icon="time" 
                            value={formatDuration(workout.duration)} 
                            label="Duration" 
                            unit="MIN"
                            color={theme.colors.text.brand} 
                            delay={200}
                        />
                        <NeuralStatCard 
                            icon="barbell" 
                            value={(totalVolume / 1000).toFixed(1)} 
                            label="Volume" 
                            unit="TONS"
                            color={theme.colors.status.warning} 
                            delay={300}
                        />
                    </View>
                    <View style={styles.neuralRow}>
                        <NeuralStatCard 
                            icon="layers" 
                            value={workout.exercises?.reduce((acc: number, ex: any) => acc + (ex.sets?.length || 0), 0)} 
                            label="Sets" 
                            unit="TOTAL"
                            color={theme.colors.status.rest} 
                            delay={400}
                        />
                        <NeuralStatCard 
                            icon="flash" 
                            value={workout.exercises?.length} 
                            label="Exercises" 
                            unit="COUNT"
                            color={theme.colors.status.error} 
                            delay={500}
                        />
                    </View>
                </View>

                {/* Performance Analysis */}
                {summary && (
                    <Animated.View entering={FadeInDown.delay(600)} style={styles.analysisSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.neuralIconContainer}>
                                <Ionicons name="analytics" size={20} color={theme.colors.text.brand} />
                            </View>
                            <View>
                                <Text style={styles.neuralTitle}>NEURAL ANALYSIS</Text>
                                <Text style={styles.neuralSubtitle}>PERFORMANCE INSIGHTS</Text>
                            </View>
                        </View>
                        
                        <View style={styles.analysisContainer}>
                            {summary.positives && Object.values(summary.positives).length > 0 && (
                                <View style={styles.analysisCard}>
                                    <Text style={[styles.analysisHeader, { color: theme.colors.status.rest }]}>OPTIMIZED</Text>
                                    {Object.values(summary.positives).map((item: any, i) => (
                                        <AnalysisRow key={i} message={item.message} type="positive" />
                                    ))}
                                </View>
                            )}

                            {summary.negatives && Object.values(summary.negatives).length > 0 && (
                                <View style={styles.analysisCard}>
                                    <Text style={[styles.analysisHeader, { color: theme.colors.status.error }]}>CRITICAL</Text>
                                    {Object.values(summary.negatives).map((item: any, i) => (
                                        <AnalysisRow key={i} message={item.message} type="negative" />
                                    ))}
                                </View>
                            )}
                        </View>

                        {!summary.has_advanced_insights && (
                            <UpgradePrompt
                                feature="Advanced Workout Insights"
                                message="Unlock deeper somatic analysis and 1RM tracking"
                            />
                        )}
                    </Animated.View>
                )}

                {/* Exercise Log */}
                <Animated.View entering={FadeInDown.delay(700)} style={styles.logSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.neuralIconContainer}>
                            <Ionicons name="list" size={20} color={theme.colors.text.brand} />
                        </View>
                        <View>
                            <Text style={styles.neuralTitle}>EXERCISE LOG</Text>
                            <Text style={styles.neuralSubtitle}>SESSION BREAKDOWN</Text>
                        </View>
                    </View>
                    
                    <View style={styles.logContainer}>
                        {workout.exercises?.map((ex: any, i: number) => (
                            <View key={i} style={[styles.logRow, i !== workout.exercises.length - 1 && styles.borderBottom]}>
                                <View style={styles.logLeft}>
                                    <Text style={styles.logName} numberOfLines={1}>
                                        {ex.exercise?.name || ex.name}
                                    </Text>
                                    <Text style={styles.logSubtext}>
                                        {ex.sets?.length} SETS • BEST {Math.max(...(ex.sets?.map((s:any) => s.weight) || [0]))}KG
                                    </Text>
                                </View>
                                <View style={styles.logRight}>
                                    <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
                                </View>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Finish Button */}
                <Animated.View entering={FadeInDown.delay(800)} style={styles.footer}>
                    <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/(home)')}>
                        <Text style={styles.doneButtonText}>ACKNOWLEDGE</Text>
                        <Ionicons name="checkmark-done" size={20} color="#FFF" />
                    </TouchableOpacity>
                </Animated.View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16,
        height: 56,
    },
    backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    scrollContent: { padding: 20 },

    // Hero Section
    heroSection: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    scoreContainer: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center' },
    scoreTextWrapper: { position: 'absolute', alignItems: 'center' },
    scoreValue: { fontSize: 42, fontWeight: '900', fontStyle: 'italic' },
    scoreLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.text.tertiary, letterSpacing: 1, marginTop: -4 },
    workoutInfo: { alignItems: 'center', marginTop: 20 },
    workoutTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center' },
    workoutDate: { fontSize: 11, fontWeight: '700', color: theme.colors.text.tertiary, marginTop: 4, letterSpacing: 1 },

    // Neural Grid
    neuralGrid: { gap: 12, marginBottom: 30 },
    neuralRow: { flexDirection: 'row', gap: 12 },
    neuralStatCard: {
        flex: 1, 
        backgroundColor: theme.colors.ui.glass, 
        padding: 16, 
        borderRadius: 24,
        borderWidth: 1, 
        borderColor: theme.colors.ui.border,
        overflow: 'hidden'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.text.secondary, letterSpacing: 0.5 },
    cardValueRow: { flexDirection: 'row', alignItems: 'baseline' },
    cardValue: { fontSize: 24, fontWeight: '900', color: '#FFF' },
    cardUnit: { fontSize: 10, fontWeight: '800', color: theme.colors.text.tertiary, marginLeft: 4 },
    miniGraphWrapper: { position: 'absolute', bottom: -10, left: 0, right: 0, height: 30, opacity: 0.5 },

    // Sections
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    neuralIconContainer: { 
        width: 40, 
        height: 40, 
        borderRadius: 12, 
        backgroundColor: 'rgba(99, 102, 241, 0.1)', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderWidth: 1, 
        borderColor: 'rgba(99, 102, 241, 0.2)' 
    },
    neuralTitle: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    neuralSubtitle: { fontSize: 9, fontWeight: '700', color: theme.colors.text.tertiary, letterSpacing: 1 },

    analysisSection: { marginBottom: 30 },
    analysisContainer: { gap: 12 },
    analysisCard: { 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: 24, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: theme.colors.ui.border 
    },
    analysisHeader: { fontSize: 11, fontWeight: '900', marginBottom: 16, letterSpacing: 1 },
    analysisRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'center' },
    analysisIconContainer: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    analysisText: { color: theme.colors.text.primary, fontSize: 14, lineHeight: 20, flex: 1, fontWeight: '500' },

    logSection: { marginBottom: 30 },
    logContainer: { 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: 30, 
        borderWidth: 1, 
        borderColor: theme.colors.ui.border,
        overflow: 'hidden'
    },
    logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: theme.colors.ui.border },
    logLeft: { flex: 1 },
    logName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    logSubtext: { color: theme.colors.text.tertiary, fontSize: 11, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },
    logRight: { opacity: 0.3 },

    footer: { marginTop: 10 },
    doneButton: { 
        backgroundColor: theme.colors.text.brand, 
        height: 64, 
        borderRadius: 20, 
        flexDirection: 'row',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 12,
        shadowColor: theme.colors.text.brand,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10
    },
    doneButtonText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});
