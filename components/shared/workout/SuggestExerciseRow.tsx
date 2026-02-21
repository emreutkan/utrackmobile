import type { ExerciseSuggestion } from '@/api/types/workout';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// Color ring based on recovery %
function getRecoveryColor(pct: number): string {
    if (pct >= 90) return theme.colors.status.success;
    if (pct >= 80) return '#a3e635'; // lime — good enough to train
    return theme.colors.status.warning;
}

interface SuggestExerciseRowProps {
    suggestions: ExerciseSuggestion[];
    isLoading?: boolean;
    /** Called when user taps a chip — parent navigates to exercise picker filtered for this muscle */
    onMusclePress: (muscleGroup: string) => void;
}

export default function SuggestExerciseRow({
    suggestions,
    isLoading = false,
    onMusclePress,
}: SuggestExerciseRowProps) {
    if (isLoading) {
        return (
            <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.colors.status.active} />
                <Text style={styles.loadingText}>Finding best muscles...</Text>
            </View>
        );
    }

    if (!suggestions || suggestions.length === 0) {
        return (
            <View style={styles.emptyRow}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.status.success} />
                <Text style={styles.emptyText}>All recovered muscles are already trained today</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Ionicons name="flash" size={12} color={theme.colors.status.warning} />
                <Text style={styles.sectionLabel}>SUGGESTED FOR TODAY</Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
            >
                {suggestions.map((s, i) => {
                    const color = getRecoveryColor(s.recovery_percent);
                    return (
                        <Pressable
                            key={i}
                            style={[
                                styles.chip,
                                s.already_in_workout && styles.chipInWorkout,
                            ]}
                            onPress={() => onMusclePress(s.muscle_group)}
                        >
                            {/* Recovery ring indicator */}
                            <View style={[styles.recoveryRing, { borderColor: color }]}>
                                <Text style={[styles.recoveryPct, { color }]}>
                                    {Math.round(s.recovery_percent)}
                                </Text>
                            </View>

                            <View style={styles.chipText}>
                                <Text style={styles.chipMuscle}>
                                    {s.muscle_group.toUpperCase()}
                                </Text>
                                {s.already_in_workout ? (
                                    <Text style={styles.chipInWorkoutLabel}>
                                        {s.working_sets_logged} sets done
                                    </Text>
                                ) : (
                                    <Text style={styles.chipReadyLabel}>READY</Text>
                                )}
                            </View>

                            {!s.already_in_workout && (
                                <Ionicons
                                    name="add-circle"
                                    size={16}
                                    color={theme.colors.status.active}
                                />
                            )}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 12,
        marginBottom: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    chipScroll: {
        gap: 8,
        paddingRight: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.full,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    chipInWorkout: {
        borderColor: 'rgba(99, 102, 241, 0.25)',
        backgroundColor: 'rgba(99, 102, 241, 0.06)',
    },
    recoveryRing: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recoveryPct: {
        fontSize: 9,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
    },
    chipText: {
        gap: 1,
    },
    chipMuscle: {
        fontSize: 11,
        fontWeight: '900',
        color: theme.colors.text.primary,
        letterSpacing: 0.3,
    },
    chipReadyLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: theme.colors.status.success,
        letterSpacing: 0.5,
    },
    chipInWorkoutLabel: {
        fontSize: 8,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.3,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 12,
        marginBottom: 8,
        paddingVertical: 4,
    },
    loadingText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
    emptyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginHorizontal: 12,
        marginBottom: 8,
        paddingVertical: 4,
    },
    emptyText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
});
