import { addExerciseToWorkout, addSetToExercise, deleteSet, removeExerciseFromWorkout } from '@/api/Exercises';
import { completeWorkout, getActiveWorkout, getRestTimerState } from '@/api/Workout';
import ExerciseSearchModal from '@/components/ExerciseSearchModal';
import WorkoutDetailView from '@/components/WorkoutDetailView';
import { useActiveWorkoutStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ActiveWorkoutScreen() {
    const [activeWorkout, setActiveWorkout] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Rest timer state from Zustand
    const { setLastSetTimestamp, setLastExerciseCategory } = useActiveWorkoutStore();

    const fetchActiveWorkout = useCallback(async () => {
        const workout = await getActiveWorkout();
            setActiveWorkout(workout);
            console.log("Active Workout:", workout);
    }, []);

    const fetchRestTimerState = useCallback(async () => {
        try {
            const state = await getRestTimerState();
            if (state && state.last_set_timestamp) {
                // Convert ISO string to timestamp
                const timestamp = new Date(state.last_set_timestamp).getTime();
                
                // Validate timestamp is not in the future (handle timezone/clock skew)
                const now = Date.now();
                if (timestamp > now) {
                    // If timestamp is in the future, use current time instead
                    console.warn('Rest timer timestamp is in the future, using current time');
                    setLastSetTimestamp(now);
                } else {
                    setLastSetTimestamp(timestamp);
                }
                setLastExerciseCategory(state.last_exercise_category || 'isolation');
            } else {
                // No rest timer state, clear it
                setLastSetTimestamp(null);
                setLastExerciseCategory('isolation');
            }
        } catch (error) {
            console.error('Failed to fetch rest timer state:', error);
        }
    }, [setLastSetTimestamp, setLastExerciseCategory]);

    useFocusEffect(
        useCallback(() => {
            fetchActiveWorkout();
            fetchRestTimerState();
        }, [fetchActiveWorkout, fetchRestTimerState])
    );

    const handleAddExercise = async (exerciseId: number) => {
        if (!activeWorkout?.id) return;
        
        try {
            await addExerciseToWorkout(activeWorkout.id, exerciseId);
            setIsModalVisible(false);
            // Refresh active workout to show new exercise
            const updatedWorkout = await getActiveWorkout();
            setActiveWorkout(updatedWorkout);
        } catch (error) {
            console.error("Failed to add exercise:", error);
            alert("Failed to add exercise");
        }
    };

    const handleRemoveExercise = async (exerciseId: number) => {
        if (!activeWorkout?.id) return;
        try {
            await removeExerciseFromWorkout(activeWorkout.id, exerciseId);
            // Refresh active workout to show remaining exercises
            const updatedWorkout = await getActiveWorkout();
            setActiveWorkout(updatedWorkout);
        } catch (error) {
            console.error("Failed to remove exercise:", error);
            alert("Failed to remove exercise");
        }
    };

    const formatValidationErrors = (validationErrors: any): string => {
        if (!validationErrors || typeof validationErrors !== 'object') {
            return 'Validation failed';
        }

        const messages: string[] = [];
        Object.keys(validationErrors).forEach(field => {
            const fieldErrors = validationErrors[field];
            if (Array.isArray(fieldErrors)) {
                fieldErrors.forEach((error: string) => {
                    // Convert backend messages to user-friendly ones
                    let friendlyMessage = error;
                    if (error.includes('less than or equal to 100')) {
                        friendlyMessage = field === 'reps' ? 'Reps must be between 0 and 100' : 'RIR must be between 0 and 100';
                    } else if (error.includes('less than or equal to 10800')) {
                        friendlyMessage = 'Rest time cannot exceed 3 hours';
                    } else if (error.includes('less than or equal to 600')) {
                        friendlyMessage = 'Time under tension cannot exceed 10 minutes';
                    } else if (error.includes('greater than or equal to 0')) {
                        friendlyMessage = `${field} cannot be negative`;
                    }
                    messages.push(friendlyMessage);
                });
            } else {
                messages.push(fieldErrors);
            }
        });

        return messages.join('\n');
    };

    const handleAddSet = async (workoutExerciseId: number, set: { weight: number, reps: number, reps_in_reserve?: number }) => {
        try {
            const result = await addSetToExercise(workoutExerciseId, set);
            
            // Check if result has validation errors
            if (result && typeof result === 'object' && result.error) {
                if (result.validationErrors) {
                    const errorMessage = formatValidationErrors(result.validationErrors);
                    Alert.alert('Validation Error', errorMessage);
                } else if (result.message) {
                    Alert.alert('Error', result.message);
                } else {
                    Alert.alert('Error', 'Failed to add set');
                }
                return;
            }
            
            // Success - refresh workout
            if (result?.id || (typeof result === 'object' && !result.error)) {
                const updatedWorkout = await getActiveWorkout();
                setActiveWorkout(updatedWorkout);
                // Refresh rest timer state from backend
                fetchRestTimerState();
            } else {
                Alert.alert('Error', 'Failed to add set');
            }
        } catch (error: any) {
            console.error("Failed to add set:", error);
            Alert.alert("Error", error?.message || "Failed to add set");
        }
    };

    const handleDeleteSet = async (setId: number) => {
        try {
            const success = await deleteSet(setId);
            if (success) {
                // Refresh workout
                const updatedWorkout = await getActiveWorkout();
                setActiveWorkout(updatedWorkout);
            } else {
                alert("Failed to delete set");
            }
        } catch (error) {
            console.error("Failed to delete set:", error);
            alert("Failed to delete set");
        }
    };

    const handleUpdateSet = async (setId: number, updatedSet: any) => {
        try {
            // Refresh workout from backend to get latest data
            const updatedWorkout = await getActiveWorkout();
            setActiveWorkout(updatedWorkout);
        } catch (error) {
            console.error("Failed to refresh workout after set update:", error);
        }
    };

    const handleFinishWorkout = async () => {
        if (!activeWorkout?.id) return;

        Alert.alert(
            "Finish Workout",
            "Are you sure you want to finish this workout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Finish",
                    style: "default",
                    onPress: async () => {
                        try {
                            // You can pass duration here if you want to save it
                            const now = new Date().getTime();
                            const startTime = new Date(activeWorkout.created_at).getTime();
                            const durationSeconds = Math.floor(Math.max(0, now - startTime) / 1000);
                            
                            const completedWorkout = await completeWorkout(activeWorkout.id, { duration: durationSeconds.toString() });
                            // Clear rest timer state when workout is completed
                            setLastSetTimestamp(null);
                            setLastExerciseCategory('isolation');
                            // Navigate to workout summary with the workout ID
                            // Use the active workout ID since completeWorkout may not return full workout data
                            router.replace(`/(active-workout)/workoutsummary?workoutId=${activeWorkout.id}`);
                        } catch (error) {
                            console.error("Failed to complete workout:", error);
                            Alert.alert("Error", "Failed to complete workout. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        let interval: any;
        
        // Explicitly check if activeWorkout exists and has created_at
        if (activeWorkout && activeWorkout.created_at) {
            const startTime = new Date(activeWorkout.created_at).getTime();
            
            const updateTimer = () => {
                const now = new Date().getTime();
                const diff = Math.max(0, now - startTime);
                
                const seconds = Math.floor((diff / 1000) % 60);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                const hours = Math.floor((diff / (1000 * 60 * 60)));
                
                const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                setElapsedTime(formattedTime);
            };

            updateTimer(); // Initial call
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsedTime('00:00:00');
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeWorkout]);



    const insets = useSafeAreaInsets();
    return (
        <>
            <WorkoutDetailView 
                workout={activeWorkout} 
                elapsedTime={elapsedTime} 
                isActive={true} 
                onAddExercise={() => setIsModalVisible(true)} 
                onRemoveExercise={handleRemoveExercise}
                onAddSet={handleAddSet}
                onDeleteSet={handleDeleteSet}
                onUpdateSet={handleUpdateSet}
                onCompleteWorkout={handleFinishWorkout}
                onShowStatistics={(exerciseId: number) => router.push(`/(exercise-statistics)/${exerciseId}`)}
            />
            <ExerciseSearchModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectExercise={handleAddExercise}
                title="Add Exercise"
            />
            {Platform.OS === 'ios' ? (
                <BlurView intensity={80} tint="dark" style={[styles.WorkoutFooter, {marginBottom: insets.bottom}]}>
                    <View style={styles.footerContent}>
                        <TouchableOpacity 
                            style={styles.completeWorkoutButton}
                            onPress={handleFinishWorkout}
                        >
                            <Text style={styles.completeWorkoutButtonText}>Finish Workout</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setIsModalVisible(true);
                            }}
                            style={styles.fabButton}
                        >
                            <Ionicons name="add" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                </BlurView>
            ) : (
                <View style={[styles.WorkoutFooter, { backgroundColor: 'rgba(28, 28, 30, 0.95)' }]}>
                    <View style={styles.footerContent}>
                        <TouchableOpacity 
                            style={styles.completeWorkoutButton}
                            onPress={handleFinishWorkout}
                        >
                            <Text style={styles.completeWorkoutButtonText}>Finish Workout</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setIsModalVisible(true);
                            }}
                            style={styles.fabButton}
                        >
                            <Ionicons name="add" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    WorkoutFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 50,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    completeWorkoutButton: {
        backgroundColor: '#8B5CF6', // Muted purple
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    completeWorkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    fabButton: {
        backgroundColor: '#0A84FF',
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#1C1C1E',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
        position: 'relative',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    closeButtonContainer: {
        position: 'absolute',
        right: 16,
        top: 14,
    },
    searchSection: {
        padding: 16,
        backgroundColor: '#000000',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
    },
    exerciseInfoContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    exerciseIconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    exerciseInitial: {
        color: '#8E8E93',
        fontSize: 18,
        fontWeight: '600',
    },
    exerciseTextContent: {
        flex: 1,
    },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    exerciseDetail: {
        color: '#8E8E93',
        fontSize: 13,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(10, 132, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 48,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5,
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 16,
        marginTop: 12,
    }
});
