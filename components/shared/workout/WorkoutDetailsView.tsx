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
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).toUpperCase();
    };

    const formatDuration = (timeStr: string) => {
        // Convert "00:52:00" to "52m"
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0] || '0');
        const minutes = parseInt(parts[1] || '0');
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatVolume = (volume: number) => {
        if (!volume || volume === 0) return '0KG';
        const formatted = Math.round(volume).toLocaleString('en-US');
        return `${formatted}KG`;
    };

    const workoutTitle = workout?.title
        ? workout.title.toUpperCase()
        : 'WORKOUT';

    return (
        <View style={styles.container}>
            <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.dateText}>
                    {formatDate(workout?.datetime || workout?.created_at)}
                </Text>
            </View>

            <Text style={styles.workoutTitle}>{workoutTitle}</Text>

            <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>DURATION</Text>
                    <Text style={styles.metricValue}>{formatDuration(elapsedTime)}</Text>
                </View>
                <View style={styles.metricCard}>
                    <View style={styles.volumeHeader}>
                        <Ionicons name="flash" size={14} color={theme.colors.status.active} />
                        <Text style={styles.metricLabel}>TOTAL VOLUME</Text>
                    </View>
                    <Text style={[styles.metricValue, styles.volumeValue]}>
                        {formatVolume(workout?.total_volume || 0)}
                    </Text>
                </View>
            </View>

            {(workout?.primary_muscles_worked?.length > 0 || workout?.secondary_muscles_worked?.length > 0) && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>NEURAL MAPPING</Text>
                    <View style={styles.neuralCard}>
                        {workout?.primary_muscles_worked?.length > 0 && (
                            <View style={styles.muscleGroup}>
                                <Text style={styles.primaryLabel}>PRIMARY FOCUS</Text>
                                <View style={styles.tagsRow}>
                                    {workout.primary_muscles_worked.map((muscle: string, idx: number) => (
                                        <View key={idx} style={styles.primaryTag}>
                                            <Text style={styles.tagText}>{muscle.toUpperCase()}</Text>
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
                                            <Text style={styles.tagText}>{muscle.toUpperCase()}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.l,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.m,
    },
    dateText: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.tight,
    },
    workoutTitle: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: '900',
        color: theme.colors.text.primary,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        marginBottom: theme.spacing.l,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: theme.spacing.m,
        marginBottom: theme.spacing.xl,
    },
    metricCard: {
        flex: 1,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    volumeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    metricLabel: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.labelTight,
        marginBottom: theme.spacing.xs,
    },
    metricValue: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    volumeValue: {
        color: theme.colors.status.active,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.labelTight,
        marginBottom: theme.spacing.m,
    },
    neuralCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        gap: theme.spacing.m,
    },
    muscleGroup: {
        gap: theme.spacing.s,
    },
    primaryLabel: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '700',
        color: theme.colors.status.active,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.tight,
        marginBottom: theme.spacing.xs,
    },
    synergistLabel: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.tight,
        marginBottom: theme.spacing.xs,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.s,
    },
    primaryTag: {
        backgroundColor: theme.colors.ui.glassStrong,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.m,
    },
    synergistTag: {
        backgroundColor: theme.colors.ui.glassStrong,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.m,
    },
    tagText: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
});

