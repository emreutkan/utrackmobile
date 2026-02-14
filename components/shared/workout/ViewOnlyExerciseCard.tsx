import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ViewOnlyExerciseCardProps {
    exercise: any;
    sets: any[];
    onShowStatistics?: (exerciseId: number) => void;
}

export const ViewOnlyExerciseCard = ({ exercise, sets, onShowStatistics }: ViewOnlyExerciseCardProps) => {
    const formatWeight = (weight: number) => {
        if (!weight && weight !== 0) return '0';
        const w = Number(weight);
        if (isNaN(w)) return '0';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
    };

    const formatRestTime = (seconds: number) => {
        if (!seconds) return '-';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
        return `${s}s`;
    };

    const bestSet = sets.reduce((best: any, set: any) => {
        const volume = (set.weight || 0) * (set.reps || 0);
        const bestVolume = (best?.weight || 0) * (best?.reps || 0);
        return volume > bestVolume ? set : best;
    }, sets[0]);

    const totalVolume = sets.reduce((acc: number, set: any) =>
        acc + (set.weight || 0) * (set.reps || 0), 0
    );

    const primaryMuscle = exercise?.primary_muscle || exercise?.muscle_group;

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.exerciseName} numberOfLines={2}>
                        {(exercise?.name || '').toUpperCase()}
                    </Text>
                    {primaryMuscle && (
                        <View style={styles.muscleTag}>
                            <Text style={styles.muscleTagText}>{primaryMuscle.toUpperCase()}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerRight}>
                    {onShowStatistics && exercise?.id && (
                        <Pressable
                            style={styles.statsButton}
                            onPress={() => onShowStatistics(exercise.id)}
                        >
                            <Ionicons name="stats-chart" size={14} color={theme.colors.text.brand} />
                        </Pressable>
                    )}
                    <View style={styles.setsBadge}>
                        <Text style={styles.setsBadgeText}>{sets.length}</Text>
                        <Text style={styles.setsBadgeLabel}>SETS</Text>
                    </View>
                </View>
            </View>

            {/* Quick Stats */}
            {bestSet && (
                <View style={styles.quickStats}>
                    <View style={styles.quickStat}>
                        <Ionicons name="trophy-outline" size={12} color={theme.colors.status.warning} />
                        <Text style={styles.quickStatText}>
                            <Text style={styles.quickStatValue}>{formatWeight(bestSet.weight)}</Text>
                            <Text style={styles.quickStatUnit}> kg</Text>
                            <Text style={styles.quickStatDivider}> × </Text>
                            <Text style={styles.quickStatValue}>{bestSet.reps}</Text>
                        </Text>
                    </View>
                    <View style={styles.quickStatDot} />
                    <View style={styles.quickStat}>
                        <Ionicons name="flash-outline" size={12} color={theme.colors.text.tertiary} />
                        <Text style={styles.quickStatText}>
                            <Text style={styles.quickStatValue}>{Math.round(totalVolume).toLocaleString()}</Text>
                            <Text style={styles.quickStatUnit}> kg vol</Text>
                        </Text>
                    </View>
                </View>
            )}

            {/* Sets Table */}
            <View style={styles.setsContainer}>
                <View style={styles.setsHeader}>
                    <Text style={[styles.colHeader, styles.colSet]}>SET</Text>
                    <Text style={[styles.colHeader, styles.colData]}>KG</Text>
                    <Text style={[styles.colHeader, styles.colData]}>REPS</Text>
                    <Text style={[styles.colHeader, styles.colData]}>RIR</Text>
                    <Text style={[styles.colHeader, styles.colData]}>REST</Text>
                    {sets.some((s: any) => s.total_tut) && (
                        <Text style={[styles.colHeader, styles.colData]}>TUT</Text>
                    )}
                </View>

                {sets.map((set: any, index: number) => {
                    const hasTutColumn = sets.some((s: any) => s.total_tut);
                    const isBestSet = set === bestSet && sets.length > 1;
                    return (
                        <View
                            key={set.id || index}
                            style={[
                                styles.setRow,
                                isBestSet && styles.bestSetRow,
                                index === sets.length - 1 && styles.lastSetRow,
                            ]}
                        >
                            <View style={[styles.colSet, styles.setNumberCol]}>
                                {set.is_warmup ? (
                                    <Text style={styles.warmupText}>W</Text>
                                ) : (
                                    <Text style={[styles.setNumber, isBestSet && styles.bestSetNumber]}>
                                        {index + 1}
                                    </Text>
                                )}
                            </View>
                            <Text style={[styles.colData, styles.setValue, styles.weightValue]}>
                                {formatWeight(set.weight || 0)}
                            </Text>
                            <Text style={[styles.colData, styles.setValue]}>
                                {set.reps || 0}
                            </Text>
                            <Text style={[styles.colData, styles.setValue, styles.rirValue]}>
                                {set.reps_in_reserve != null ? set.reps_in_reserve : '-'}
                            </Text>
                            <Text style={[styles.colData, styles.setValue, styles.restValue]}>
                                {formatRestTime(set.rest_time_before_set)}
                            </Text>
                            {hasTutColumn && (
                                <Text style={[styles.colData, styles.setValue, styles.tutValue]}>
                                    {set.total_tut ? `${set.total_tut}s` : '-'}
                                </Text>
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
        marginRight: 12,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        color: theme.colors.text.primary,
        letterSpacing: 0.3,
        marginBottom: 6,
    },
    muscleTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
    },
    muscleTagText: {
        fontSize: 9,
        fontWeight: '800',
        color: theme.colors.status.active,
        letterSpacing: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statsButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    setsBadge: {
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    setsBadgeText: {
        fontSize: 18,
        fontWeight: '900',
        color: theme.colors.text.primary,
        fontVariant: ['tabular-nums'],
    },
    setsBadgeLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
        marginTop: -2,
    },

    // Quick Stats
    quickStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 10,
    },
    quickStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    quickStatText: {
        fontSize: 12,
    },
    quickStatValue: {
        fontWeight: '700',
        color: theme.colors.text.primary,
        fontVariant: ['tabular-nums'],
    },
    quickStatUnit: {
        fontWeight: '600',
        color: theme.colors.text.tertiary,
    },
    quickStatDivider: {
        color: theme.colors.text.tertiary,
    },
    quickStatDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: theme.colors.text.tertiary,
    },

    // Sets Table
    setsContainer: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.ui.border,
        paddingTop: 10,
    },
    setsHeader: {
        flexDirection: 'row',
        marginBottom: 6,
        paddingHorizontal: 2,
    },
    colHeader: {
        fontSize: 9,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        letterSpacing: 1,
    },
    colSet: {
        width: 32,
        textAlign: 'center',
    },
    colData: {
        flex: 1,
        textAlign: 'center',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 2,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.02)',
    },
    bestSetRow: {
        backgroundColor: 'rgba(255, 159, 10, 0.04)',
        borderRadius: 6,
        marginHorizontal: -2,
        paddingHorizontal: 4,
    },
    lastSetRow: {
        borderBottomWidth: 0,
    },
    setNumberCol: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    setNumber: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
        fontVariant: ['tabular-nums'],
    },
    bestSetNumber: {
        color: theme.colors.status.warning,
    },
    warmupText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.status.warning,
    },
    setValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    weightValue: {
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    rirValue: {
        color: theme.colors.text.secondary,
    },
    restValue: {
        color: theme.colors.text.tertiary,
        fontSize: 12,
    },
    tutValue: {
        color: theme.colors.status.active,
        fontSize: 12,
    },
});
