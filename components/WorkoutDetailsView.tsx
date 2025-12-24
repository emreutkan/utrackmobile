import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WorkoutDetailsViewProps {
    workout: any;
    elapsedTime: string;
    isActive: boolean;
}

export default function WorkoutDetailsView({ workout, elapsedTime, isActive }: WorkoutDetailsViewProps) {
    return (
        <View style={styles.workoutHeader}>
            <View style={styles.workoutHeaderTop}>
                <View style={styles.workoutTitleContainer}>
                    <Text style={styles.workoutTitle}>
                        {workout?.title 
                            ? workout.title.split(' ').map((word: string) => 
                                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              ).join(' ')
                            : 'Workout'}
                    </Text>
                    <Text style={styles.workoutDate}>
                        {new Date(workout?.datetime || workout?.created_at).toLocaleDateString(undefined, {
                            weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
                        })}
                    </Text>
                </View>
                <Text style={styles.workoutDuration}>
                    {elapsedTime}
                </Text>
            </View>
            
            {/* Workout Stats */}
            {!isActive && (workout?.total_volume || workout?.primary_muscles_worked?.length || workout?.intensity || workout?.notes || workout?.calories_burned) && (
                <View style={styles.workoutStatsContainer}>
                    {/* Calories and Volume in horizontal row */}
                    {(workout.calories_burned && parseFloat(String(workout.calories_burned)) > 0) || (workout.total_volume !== undefined && workout.total_volume > 0) ? (
                        <View style={styles.horizontalStatsRow}>
                            {workout.calories_burned && parseFloat(String(workout.calories_burned)) > 0 && (
                                <View style={styles.horizontalStatItem}>
                                    <Text style={styles.horizontalStatLabel}>Calories</Text>
                                    <Text style={styles.horizontalStatValue}>{parseFloat(String(workout.calories_burned)).toFixed(0)} kcal</Text>
                                </View>
                            )}
                            {workout.total_volume !== undefined && workout.total_volume > 0 && (
                                <View style={styles.horizontalStatItem}>
                                    <Text style={styles.horizontalStatLabel}>Volume</Text>
                                    <Text style={styles.horizontalStatValue}>{workout.total_volume.toFixed(0)} kg</Text>
                                </View>
                            )}
                        </View>
                    ) : null}
                    
                    {/* Primary and Secondary Muscles combined in one row */}
                    {(workout.primary_muscles_worked && workout.primary_muscles_worked.length > 0) || (workout.secondary_muscles_worked && workout.secondary_muscles_worked.length > 0) ? (
                        <View style={styles.compactStatRow}>
                            <Text style={styles.compactStatLabel}>Muscles</Text>
                            <View style={styles.muscleTagsContainer}>
                                {workout.primary_muscles_worked && workout.primary_muscles_worked.map((muscle: string, idx: number) => (
                                    <View key={idx} style={styles.muscleTag}>
                                        <Text style={styles.muscleTagText}>{muscle}</Text>
                                    </View>
                                ))}
                                {workout.secondary_muscles_worked && workout.secondary_muscles_worked.map((muscle: string, idx: number) => (
                                    <View key={idx} style={[styles.muscleTag, styles.secondaryMuscleTag]}>
                                        <Text style={styles.secondaryMuscleTagText}>{muscle}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : null}
                    
                    {workout.intensity && workout.intensity !== '' && (
                        <View style={styles.compactStatRow}>
                            <Text style={styles.compactStatLabel}>Intensity</Text>
                            <View style={[styles.intensityBadge, (styles as any)[`intensity${workout.intensity.charAt(0).toUpperCase() + workout.intensity.slice(1)}`]]}>
                                <Text style={styles.intensityText}>{workout.intensity.toUpperCase()}</Text>
                            </View>
                        </View>
                    )}
                    
                    {workout.notes && (
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Notes</Text>
                            <Text style={styles.notesText}>{workout.notes}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    workoutHeader: {
        paddingBottom: 12,
        borderBottomColor: '#1C1C1E',
    },
    workoutHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    workoutTitleContainer: {
        width: '75%',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 4,
        paddingBottom: 12,
    },
    workoutTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    workoutDate: {
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '400',
    },
    workoutDuration: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8E8E93',
        fontVariant: ['tabular-nums'],
    },
    workoutStatsContainer: {
        gap: 10,
    },
    horizontalStatsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    horizontalStatItem: {
        flex: 1,
    },
    horizontalStatLabel: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    horizontalStatValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    compactStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    compactStatLabel: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        minWidth: 60,
    },
    statItem: {
        marginBottom: 12,
    },
    statLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    muscleTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        flex: 1,
    },
    muscleTag: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    muscleTagText: {
        color: '#A1A1A6',
        fontSize: 12,
        fontWeight: '500',
    },
    secondaryMuscleTag: {
        backgroundColor: '#1C1C1E',
        opacity: 0.8,
    },
    secondaryMuscleTagText: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '400',
    },
    intensityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#2C2C2E',
    },
    intensityText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    intensityLow: {
        backgroundColor: 'rgba(52, 199, 89, 0.2)',
    },
    intensityMedium: {
        backgroundColor: 'rgba(255, 159, 10, 0.2)',
    },
    intensityHigh: {
        backgroundColor: 'rgba(255, 59, 48, 0.2)',
    },
    notesText: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 22,
    },
});

