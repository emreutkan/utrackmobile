import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, Pressable, View } from 'react-native';

interface ExerciseHeaderProps {
    exercise: any;
    isLocked: boolean;
    onMenuPress: () => void;
    showHistory?: boolean;
    onHistoryToggle?: () => void;
}

export const ExerciseHeader = ({ exercise, isLocked, onMenuPress, showHistory, onHistoryToggle }: ExerciseHeaderProps) => {
    return (
        <View style={styles.header}>
            <View style={styles.exerciseInfo}>
                <View style={styles.exerciseNameRow}>
                    <Text style={styles.exerciseName}>
                        {(exercise.name || '').toUpperCase()}
                        {isLocked && (
                            <>
                                {' '}
                                <Ionicons name="lock-closed" size={14} color={theme.colors.text.tertiary} />
                            </>
                        )}
                    </Text>
                    <Pressable 
                        onPress={onMenuPress}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.menuButton}
                    >
                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text.tertiary} />
                    </Pressable>
                </View>

                <View style={styles.exerciseInfoRow}>
                    <View style={styles.musclesContainer}>
                        {exercise.primary_muscle && typeof exercise.primary_muscle === 'string' && (
                            <View style={[styles.tag, styles.primaryMuscleTag]}>
                                <Text style={styles.tagText}>{exercise.primary_muscle}</Text>
                            </View>
                        )}
                    </View>
                    {onHistoryToggle && (
                        <Pressable 
                            onPress={onHistoryToggle}
                            style={[styles.historyToggleButton, showHistory && styles.historyToggleButtonActive]}
                        >
                            <Ionicons name="time-outline" size={14} color={showHistory ? theme.colors.text.brand : theme.colors.text.tertiary} />
                            <Text style={[styles.historyToggleText, showHistory && styles.historyToggleTextActive]}>HISTORY</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    exerciseInfo: { 
        flex: 1 
    },
    exerciseNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    exerciseName: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        color: theme.colors.text.primary,
        flex: 1,
    },
    menuButton: {
        padding: 8,
        marginLeft: 8,
    },
    exerciseInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    musclesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        flex: 1,
        gap: 8,
    },
    tag: {
        backgroundColor: theme.colors.ui.glassStrong,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    primaryMuscleTag: {
        backgroundColor: theme.colors.ui.glassStrong,
        borderColor: theme.colors.status.active,
    },
    tagText: {
        color: theme.colors.text.primary,
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    historyToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    historyToggleButtonActive: {
        borderColor: theme.colors.text.brand,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    historyToggleText: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.5,
    },
    historyToggleTextActive: {
        color: theme.colors.text.brand,
    },
});
