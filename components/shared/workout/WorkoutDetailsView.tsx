import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WorkoutDetailsViewProps {
    workout: any;
    elapsedTime: string;
    isActive: boolean;
}

export default function WorkoutDetailsView({ workout, elapsedTime, isActive }: WorkoutDetailsViewProps) {
    if (isActive) return null;

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
        const year = d.getFullYear();
        return { weekday, monthDay, year: year.toString() };
    };

    const formatDuration = (timeStr: string) => {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0] || '0');
        const minutes = parseInt(parts[1] || '0');
        if (hours > 0) return { value: `${hours}h ${minutes}m`, raw: hours * 60 + minutes };
        return { value: `${minutes}`, raw: minutes };
    };

    const formatVolume = (volume: number) => {
        if (!volume || volume === 0) return '0';
        if (volume >= 1000) return (volume / 1000).toFixed(1);
        return Math.round(volume).toLocaleString('en-US');
    };

    const getVolumeUnit = (volume: number) => {
        if (volume >= 1000) return 'TONS';
        return 'KG';
    };

    const totalSets = workout?.exercises?.reduce(
        (acc: number, ex: any) => acc + (ex.sets?.length || 0), 0
    ) || 0;

    const totalExercises = workout?.exercises?.length || 0;

    const workoutTitle = workout?.title
        ? workout.title.toUpperCase()
        : 'WORKOUT';

    const dateInfo = formatDate(workout?.datetime || workout?.created_at);
    const durationInfo = formatDuration(elapsedTime);
    const volume = workout?.total_volume || 0;

    return (
        <View style={styles.container}>
            {/* Title & Date Section */}
            <View style={styles.titleSection}>
                <Text style={styles.dateText}>
                    {dateInfo.weekday} · {dateInfo.monthDay}
                </Text>
                <Text style={styles.workoutTitle}>{workoutTitle}</Text>
            </View>

            {/* Metrics Grid - 2x2 */}
            <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                    <View style={styles.metricIconRow}>
                        <View style={[styles.metricIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                            <Ionicons name="time" size={14} color={theme.colors.text.brand} />
                        </View>
                        <Text style={styles.metricLabel}>DURATION</Text>
                    </View>
                    <View style={styles.metricValueRow}>
                        <Text style={[styles.metricValue, { color: theme.colors.text.brand }]}>
                            {durationInfo.value}
                        </Text>
                        {!elapsedTime.startsWith('0') && (
                            <Text style={styles.metricUnit}>MIN</Text>
                        )}
                    </View>
                </View>

                <View style={styles.metricCard}>
                    <View style={styles.metricIconRow}>
                        <View style={[styles.metricIcon, { backgroundColor: 'rgba(255, 159, 10, 0.1)' }]}>
                            <Ionicons name="barbell" size={14} color={theme.colors.status.warning} />
                        </View>
                        <Text style={styles.metricLabel}>VOLUME</Text>
                    </View>
                    <View style={styles.metricValueRow}>
                        <Text style={[styles.metricValue, { color: theme.colors.status.warning }]}>
                            {formatVolume(volume)}
                        </Text>
                        <Text style={styles.metricUnit}>{getVolumeUnit(volume)}</Text>
                    </View>
                </View>

                <View style={styles.metricCard}>
                    <View style={styles.metricIconRow}>
                        <View style={[styles.metricIcon, { backgroundColor: 'rgba(52, 211, 153, 0.1)' }]}>
                            <Ionicons name="layers" size={14} color={theme.colors.status.success} />
                        </View>
                        <Text style={styles.metricLabel}>SETS</Text>
                    </View>
                    <View style={styles.metricValueRow}>
                        <Text style={[styles.metricValue, { color: theme.colors.status.success }]}>
                            {totalSets}
                        </Text>
                        <Text style={styles.metricUnit}>TOTAL</Text>
                    </View>
                </View>

                <View style={styles.metricCard}>
                    <View style={styles.metricIconRow}>
                        <View style={[styles.metricIcon, { backgroundColor: 'rgba(192, 132, 252, 0.1)' }]}>
                            <Ionicons name="flash" size={14} color={theme.colors.status.rest} />
                        </View>
                        <Text style={styles.metricLabel}>EXERCISES</Text>
                    </View>
                    <View style={styles.metricValueRow}>
                        <Text style={[styles.metricValue, { color: theme.colors.status.rest }]}>
                            {totalExercises}
                        </Text>
                        <Text style={styles.metricUnit}>COUNT</Text>
                    </View>
                </View>
            </View>

            {/* Muscle Mapping */}
            {(workout?.primary_muscles_worked?.length > 0 || workout?.secondary_muscles_worked?.length > 0) && (
                <View style={styles.muscleSection}>
                    <View style={styles.muscleSectionHeader}>
                        <View style={styles.muscleSectionIcon}>
                            <Ionicons name="body" size={14} color={theme.colors.text.brand} />
                        </View>
                        <Text style={styles.muscleSectionTitle}>MUSCLE MAPPING</Text>
                    </View>

                    {workout?.primary_muscles_worked?.length > 0 && (
                        <View style={styles.muscleGroup}>
                            <Text style={styles.primaryLabel}>PRIMARY</Text>
                            <View style={styles.tagsRow}>
                                {workout.primary_muscles_worked.map((muscle: string, idx: number) => (
                                    <View key={idx} style={styles.primaryTag}>
                                        <Text style={styles.primaryTagText}>{muscle.toUpperCase()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                    {workout?.secondary_muscles_worked?.length > 0 && (
                        <View style={styles.muscleGroup}>
                            <Text style={styles.synergistLabel}>SYNERGISTS</Text>
                            <View style={styles.tagsRow}>
                                {workout.secondary_muscles_worked.map((muscle: string, idx: number) => (
                                    <View key={idx} style={styles.synergistTag}>
                                        <Text style={styles.synergistTagText}>{muscle.toUpperCase()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        marginBottom: theme.spacing.m,
    },

    // Title Section
    titleSection: {
        marginBottom: 20,
    },
    dateText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
        marginBottom: 8,
    },
    workoutTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.colors.text.primary,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },

    // Metrics Grid
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    metricCard: {
        width: '48%',
        flexGrow: 1,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.m,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    metricIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    metricIcon: {
        width: 24,
        height: 24,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
    },
    metricValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    metricValue: {
        fontSize: 26,
        fontWeight: '900',
        fontStyle: 'italic',
        fontVariant: ['tabular-nums'],
    },
    metricUnit: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
    },

    // Muscle Section
    muscleSection: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.m,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        marginBottom: 8,
    },
    muscleSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    muscleSectionIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    muscleSectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: theme.colors.text.primary,
        letterSpacing: 1,
    },
    muscleGroup: {
        marginBottom: 12,
    },
    primaryLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: theme.colors.status.active,
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    synergistLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    primaryTag: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
    },
    primaryTagText: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.status.active,
        letterSpacing: 0.8,
    },
    synergistTag: {
        backgroundColor: theme.colors.ui.glassStrong,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    synergistTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        letterSpacing: 0.8,
    },
});

