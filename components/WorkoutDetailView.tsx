import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkoutDetailViewProps {
    workout: any;
    elapsedTime: string;
    isActive: boolean;
    onAddExercise?: () => void;
}

export default function WorkoutDetailView({ workout, elapsedTime, isActive, onAddExercise }: WorkoutDetailViewProps) {
    const insets = useSafeAreaInsets();

    if (!workout) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.workoutHeader}>
                <View>
                    <Text style={styles.workoutTitle}>{workout.title}</Text>
                    <Text style={styles.workoutDate}>
                        {new Date(workout.created_at).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Text>
                </View>
                <Text style={[styles.workoutDuration, { color: isActive ? 'orange' : '#8E8E93' }]}>
                    {elapsedTime}
                </Text>
            </View>

            <ScrollView style={styles.content}>
                {workout.notes ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>NOTES</Text>
                        <Text style={styles.notesText}>{workout.notes}</Text>
                    </View>
                ) : null}

                {workout.exercises && workout.exercises.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>EXERCISES</Text>
                        {workout.exercises.map((workoutExercise: any, index: number) => {
                            // Handle both wrapped (from WorkoutExercise) and direct exercise objects if necessary
                            // Assuming backend returns a list of WorkoutExercise objects which contain an 'exercise' field
                            // OR if the serializer flattens it, checking for name directly.
                            
                            // Safe access: try workoutExercise.exercise first, fallback to workoutExercise itself if name exists there
                            const exercise = workoutExercise.exercise || (workoutExercise.name ? workoutExercise : null);
                            
                            if (!exercise) return null;

                            return (
                                <View key={workoutExercise.id || index} style={styles.exerciseCard}>
                                    <View style={styles.exerciseRow}>
                                        <View style={styles.exerciseInfo}>
                                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                                            <Text style={styles.exerciseDetails}>
                                                {exercise.primary_muscle} {exercise.equipment_type ? `• ${exercise.equipment_type}` : ''}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#2C2C2E" />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>No exercises recorded</Text>
                    </View>
                )}

            </ScrollView>
            
            {isActive && onAddExercise && (
                <View style={styles.fabContainer}>
                    <TouchableOpacity 
                        onPress={onAddExercise}
                        style={styles.fabButton} 
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    workoutHeader: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    workoutTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    workoutDate: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    workoutDuration: {
        fontSize: 18,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 1,
    },
    notesText: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 24,
    },
    placeholderContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: '#2C2C2E',
        fontSize: 16,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    fabButton: {
        backgroundColor: '#0A84FF', // iOS Blue or Custom Orange
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exerciseCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
    },
    exerciseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
    },
    exerciseDetails: {
        color: '#8E8E93',
        fontSize: 14,
    },
});

