import ExerciseSearchModal from '@/components/ExerciseSearchModal';
import WorkoutDetailView from '@/components/shared/workout/WorkoutDetailView';
import { theme } from '@/constants/theme';
import { useActiveWorkoutStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout, useCompleteWorkout, useRestTimerState } from '@/hooks/useWorkout';
import { useAddExerciseToWorkout, useRemoveExerciseFromWorkout, useAddSetToExercise, useDeleteSet } from '@/hooks/useExercises';

export default function ActiveWorkoutScreen() {
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Rest timer state from Zustand
    const { setLastSetTimestamp, setLastExerciseCategory } = useActiveWorkoutStore();

    // Data fetching with React Query
    const { data: activeWorkout, refetch: refetchActiveWorkout } = useActiveWorkout();
    const { data: restTimerState, refetch: refetchRestTimer } = useRestTimerState();
    const completeWorkoutMutation = useCompleteWorkout();
    const addExerciseMutation = useAddExerciseToWorkout();
    const removeExerciseMutation = useRemoveExerciseFromWorkout();
    const addSetMutation = useAddSetToExercise();
    const deleteSetMutation = useDeleteSet();

    // Sync rest timer state to Zustand when it changes
    useEffect(() => {
        if (restTimerState && restTimerState.last_set_timestamp) {
            // Convert ISO string to timestamp
            const timestamp = new Date(restTimerState.last_set_timestamp).getTime();

            // Validate timestamp is not in the future (handle timezone/clock skew)
            const now = Date.now();
            if (timestamp > now) {
                console.warn('Rest timer timestamp is in the future, using current time');
                setLastSetTimestamp(now);
            } else {
                setLastSetTimestamp(timestamp);
            }
            setLastExerciseCategory(restTimerState.last_exercise_category || 'isolation');
        } else {
            // No rest timer state, clear it
            setLastSetTimestamp(null);
            setLastExerciseCategory('isolation');
        }
    }, [restTimerState, setLastSetTimestamp, setLastExerciseCategory]);

    useFocusEffect(
        useCallback(() => {
            refetchActiveWorkout();
            refetchRestTimer();
        }, [refetchActiveWorkout, refetchRestTimer])
    );

    const handleAddExercise = async (exerciseId: number) => {
        if (!activeWorkout?.id) return;

        try {
            await addExerciseMutation.mutateAsync({
                workoutId: activeWorkout.id,
                exerciseId,
            });
            setIsModalVisible(false);
        } catch (error) {
            console.error("Failed to add exercise:", error);
            alert("Failed to add exercise");
        }
    };

    const handleRemoveExercise = async (workoutExerciseId: number) => {
        try {
            await removeExerciseMutation.mutateAsync(workoutExerciseId);
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
            await addSetMutation.mutateAsync({
                workoutExerciseId,
                data: set,
            });
            // Refresh rest timer state from backend after successful set addition
            refetchRestTimer();
        } catch (error: any) {
            // Handle validation errors from the API
            if (error?.response?.data?.validationErrors) {
                const errorMessage = formatValidationErrors(error.response.data.validationErrors);
                Alert.alert('Validation Error', errorMessage);
            } else {
                Alert.alert("Error", error?.message || "Failed to add set");
            }
        }
    };

    const handleDeleteSet = async (setId: number) => {
        try {
            await deleteSetMutation.mutateAsync(setId);
        } catch (error) {
            console.error("Failed to delete set:", error);
            alert("Failed to delete set");
        }
    };

    const handleUpdateSet = async (setId: number, updatedSet: any) => {
        try {
            // Refresh workout from backend to get latest data
            refetchActiveWorkout();
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

                            await completeWorkoutMutation.mutateAsync({
                                workoutId: activeWorkout.id,
                                data: { duration: durationSeconds.toString() },
                            });
                            // Clear rest timer state when workout is completed
                            setLastSetTimestamp(null);
                            setLastExerciseCategory('isolation');
                            // Navigate to workout summary with the workout ID
                            router.replace(`/(workout-summary)/workoutsummary?workoutId=${activeWorkout.id}`);
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
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={styles.gradientBg}
            />
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
            <View style={[styles.WorkoutFooter, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.footerContent}>
                    <Pressable
                        style={styles.completeWorkoutButton}
                        onPress={handleFinishWorkout}
                    >
                        <Ionicons name="checkmark-done" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.completeWorkoutButtonText}>FINISH WORKOUT</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            setIsModalVisible(true);
                        }}
                        style={styles.fabButton}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    WorkoutFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: theme.spacing.m,
        paddingTop: theme.spacing.m,
        backgroundColor: 'transparent',
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    completeWorkoutButton: {
        backgroundColor: theme.colors.status.active,
        flex: 1,
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.status.active,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    completeWorkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    fabButton: {
        backgroundColor: theme.colors.ui.glass,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
});
