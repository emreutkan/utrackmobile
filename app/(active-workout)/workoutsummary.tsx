import { getWorkout, getWorkoutSummary } from '@/api/Workout';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// 1. DESIGN SYSTEM
// ============================================================================
const COLORS = {
    bg: '#000000',
    card: '#1C1C1E',
    primary: '#0A84FF',
    success: '#30D158', // Apple Green
    warning: '#FF9F0A', // Apple Orange
    danger: '#FF453A', // Apple Red
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#2C2C2E',
};

// ============================================================================
// 2. HELPER COMPONENTS
// ============================================================================

const StatBox = ({ icon, value, label, color, delay }: any) => (
    <Animated.View 
        entering={FadeInDown.delay(delay).springify()} 
        style={styles.statBox}
    >
        <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    </Animated.View>
);

const AnalysisRow = ({ message, type }: { message: string, type: 'positive' | 'negative' | 'neutral' }) => {
    const color = type === 'positive' ? COLORS.success : type === 'negative' ? COLORS.danger : COLORS.textSecondary;
    const icon = type === 'positive' ? 'checkmark-circle' : type === 'negative' ? 'alert-circle' : 'information-circle';

    return (
        <View style={styles.analysisRow}>
            <Ionicons name={icon} size={20} color={color} style={{ marginTop: 2 }} />
            <Text style={styles.analysisText}>{message}</Text>
        </View>
    );
};

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export default function WorkoutSummaryScreen() {
    const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
    const insets = useSafeAreaInsets();
    const [workout, setWorkout] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
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
        if (!s) return '0m';
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const getScoreColor = (s: number) => {
        if (s >= 8) return COLORS.success;
        if (s >= 5) return COLORS.warning;
        return COLORS.danger;
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <UnifiedHeader title="Summary" />
                <View style={[styles.center, { marginTop: 58 }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
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
            <UnifiedHeader title="Workout Summary" />
            
            <Animated.ScrollView 
                contentContainerStyle={[styles.scrollContent, { marginTop: 58 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* 1. HERO SCORE CARD */}
                <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.heroCard}>
                    <View style={styles.heroHeader}>
                        <View>
                            <Text style={styles.workoutTitle}>{workout.title}</Text>
                            <Text style={styles.workoutDate}>
                                {new Date(workout.date || workout.created_at).toLocaleDateString(undefined, {
                                    weekday: 'long', month: 'long', day: 'numeric'
                                })}
                            </Text>
                        </View>
                        {/* Score Ring Representation */}
                        <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
                            <Text style={[styles.scoreText, { color: scoreColor }]}>{score.toFixed(1)}</Text>
                        </View>
                    </View>
                    <View style={styles.heroFooter}>
                        <Ionicons name="trophy" size={16} color={COLORS.warning} />
                        <Text style={styles.heroFooterText}>
                            {score >= 8 ? "Excellent Session!" : score >= 5 ? "Solid Effort" : "Recovery Recommended"}
                        </Text>
                    </View>
                </Animated.View>

                {/* 2. STATS GRID (BENTO) */}
                <View style={styles.gridContainer}>
                    <View style={styles.row}>
                        <StatBox 
                            icon="time" 
                            value={formatDuration(workout.duration)} 
                            label="Duration" 
                            color={COLORS.primary} 
                            delay={200}
                        />
                        <StatBox 
                            icon="barbell" 
                            value={(totalVolume / 1000).toFixed(1) + 'k'} 
                            label="Volume (kg)" 
                            color={COLORS.warning} 
                            delay={300}
                        />
                    </View>
                    <View style={styles.row}>
                        <StatBox 
                            icon="layers" 
                            value={workout.exercises?.reduce((acc: number, ex: any) => acc + (ex.sets?.length || 0), 0)} 
                            label="Total Sets" 
                            color={COLORS.success} 
                            delay={400}
                        />
                        <StatBox 
                            icon="flash" 
                            value={workout.exercises?.length} 
                            label="Exercises" 
                            color={COLORS.danger} 
                            delay={500}
                        />
                    </View>
                </View>

                {/* 3. AI ANALYSIS */}
                {summary && (
                    <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
                        <Text style={styles.sectionTitle}>Performance Analysis</Text>
                        
                        {/* Positives */}
                        {summary.positives && Object.values(summary.positives).length > 0 && (
                            <View style={styles.analysisCard}>
                                <Text style={[styles.analysisHeader, { color: COLORS.success }]}>Strengths</Text>
                                {Object.values(summary.positives).map((item: any, i) => (
                                    <AnalysisRow key={i} message={item.message} type="positive" />
                                ))}
                            </View>
                        )}

                        {/* Negatives */}
                        {summary.negatives && Object.values(summary.negatives).length > 0 && (
                            <View style={styles.analysisCard}>
                                <Text style={[styles.analysisHeader, { color: COLORS.danger }]}>Areas to Improve</Text>
                                {Object.values(summary.negatives).map((item: any, i) => (
                                    <AnalysisRow key={i} message={item.message} type="negative" />
                                ))}
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* 4. EXERCISE LIST COMPACT */}
                <Animated.View entering={FadeInDown.delay(700)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Exercise Log</Text>
                    <View style={styles.exerciseCard}>
                        {workout.exercises?.map((ex: any, i: number) => (
                            <View key={i} style={[styles.exerciseRow, i !== workout.exercises.length - 1 && styles.borderBottom]}>
                                <Text style={styles.exerciseName} numberOfLines={1}>
                                    {ex.exercise?.name || ex.name}
                                </Text>
                                <Text style={styles.exerciseDetail}>
                                    {ex.sets?.length} sets • Best: {Math.max(...(ex.sets?.map((s:any) => s.weight) || [0]))}kg
                                </Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* 5. ACTIONS */}
                <Animated.View entering={FadeInDown.delay(800)} style={styles.actions}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(home)')}>
                        <Text style={styles.primaryBtnText}>Done</Text>
                    </TouchableOpacity>
                </Animated.View>

            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16, paddingBottom: 50 },

    // Hero
    heroCard: {
        backgroundColor: COLORS.card,
        borderRadius: 22,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    workoutTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
    workoutDate: { color: COLORS.textSecondary, fontSize: 14, textTransform: 'capitalize' },
    scoreRing: {
        width: 56, height: 56, borderRadius: 28, borderWidth: 4,
        justifyContent: 'center', alignItems: 'center'
    },
    scoreText: { fontSize: 20, fontWeight: '800' },
    heroFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 6, opacity: 0.8 },
    heroFooterText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },

    // Grid
    gridContainer: { gap: 12, marginBottom: 24 },
    row: { flexDirection: 'row', gap: 12 },
    statBox: {
        flex: 1, backgroundColor: COLORS.card, padding: 16, borderRadius: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: COLORS.border,
    },
    iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    statValue: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
    statLabel: { color: COLORS.textSecondary, fontSize: 12 },

    // Analysis
    section: { marginBottom: 24 },
    sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 12, marginLeft: 4 },
    analysisCard: {
        backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: COLORS.border,
    },
    analysisHeader: { fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
    analysisRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    analysisText: { color: COLORS.text, fontSize: 14, lineHeight: 20, flex: 1 },

    // Exercises
    exerciseCard: { backgroundColor: COLORS.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    exerciseName: { color: COLORS.text, fontSize: 16, fontWeight: '600', flex: 1 },
    exerciseDetail: { color: COLORS.textSecondary, fontSize: 13 },

    // Actions
    actions: { marginTop: 8 },
    primaryBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 18, alignItems: 'center' },
    primaryBtnText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
});