import { theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ViewOnlyExerciseCardProps {
    exercise: any;
    sets: any[];
}

export const ViewOnlyExerciseCard = ({ exercise, sets }: ViewOnlyExerciseCardProps) => {
    const formatWeight = (weight: number) => {
        if (!weight && weight !== 0) return '0';
        const w = Number(weight);
        if (isNaN(w)) return '0';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.exerciseName}>
                    {(exercise?.name || '').toUpperCase()}
                </Text>
                {sets.length > 0 && (
                    <View style={styles.setsBadge}>
                        <Text style={styles.setsBadgeText}>{sets.length} SETS</Text>
                    </View>
                )}
            </View>

            {sets.map((set: any, index: number) => (
                <View key={set.id || index} style={styles.setRow}>
                    <Text style={styles.setLabel}>SET {index + 1}</Text>
                    <View style={styles.setData}>
                        <Text style={styles.setWeight}>
                            {formatWeight(set.weight || 0)} <Text style={styles.setUnit}>KG</Text>
                        </Text>
                        <View style={styles.divider} />
                        <Text style={styles.setReps}>
                            {set.reps || 0} <Text style={styles.setUnit}>REPS</Text>
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    exerciseName: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        color: theme.colors.text.primary,
        flex: 1,
    },
    setsBadge: {
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.status.rest,
        borderRadius: theme.borderRadius.m,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.xs,
    },
    setsBadgeText: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '700',
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.tight,
    },
    setRow: {
        marginBottom: theme.spacing.m,
    },
    setLabel: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    setData: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
    },
    setWeight: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '800',
        color: theme.colors.status.rest,
    },
    setReps: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    setUnit: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: theme.colors.ui.border,
    },
});


