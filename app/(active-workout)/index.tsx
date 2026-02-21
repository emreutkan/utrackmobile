import ExerciseSearchModal from '@/components/ExerciseSearchModal';
import WorkoutDetailView from '@/components/shared/workout/WorkoutDetailView';
import SuggestExerciseRow from '@/components/shared/workout/SuggestExerciseRow';
import { theme } from '@/constants/theme';
import { useActiveWorkoutStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout, useCompleteWorkout, useRestTimerState, useSuggestNextExercise } from '@/hooks/useWorkout';
import { useAddExerciseToWorkout, useRemoveExerciseFromWorkout, useAddSetToExercise, useDeleteSet } from '@/hooks/useExercises';
import { getExerciseOptimizationCheck } from '@/api/Workout';
import type { OptimizationCheckResponse } from '@/api/types/workout';

export default function ActiveWorkoutScreen() {
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalInitialSearch, setModalInitialSearch] = useState('');

    // Optimization check results: keyed by workoutExerciseId
    const [optimizationResults, setOptimizationResults] = useState<Record<number, OptimizationCheckResponse>>({});

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

    // Suggest next exercise — shown above the footer add button
    const { data: suggestions, isLoading: isSuggestLoading, refetch: refetchSuggestions } = useSuggestNextExercise(!!activeWorkout);

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
            const result = await addExerciseMutation.mutateAsync({
                workoutId: activeWorkout.id,
                exerciseId,
            });
            setIsModalVisible(false);
            setModalInitialSearch('');

            // Non-blocking: run optimization check for the newly added exercise
            const workoutExerciseId: number | undefined = (result as any)?.id;
            if (workoutExerciseId) {
                getExerciseOptimizationCheck(workoutExerciseId)
                    .then((data) => {
                        setOptimizationResults((prev) => ({
                            ...prev,
                            [workoutExerciseId]: data,
                        }));
                    })
                    .catch((err) => {
                        // Non-blocking — silently ignore errors
                        console.warn('[OptimizationCheck] failed:', err);
                    });
            }

            // Refresh suggestions after a new exercise is added
            refetchSuggestions();
        } catch (error) {
            console.error("Failed to add exercise:", error);
            alert("Failed to add exercise");
        }
    };

    const handleMusclePress = (muscleGroup: string) => {
        setModalInitialSearch(muscleGroup);
        setIsModalVisible(true);
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
            // Refresh suggestions — logged sets affect recovery-based recommendations
            refetchSuggestions();
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

    const exerciseCount = activeWorkout?.exercises?.length || 0;
    const totalSets = activeWorkout?.exercises?.reduce(
        (acc: number, ex: any) => acc + (ex.sets?.length || 0), 0
    ) || 0;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.15)', 'transparent']}
                style={styles.gradientBg}
            />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
                </Pressable>

                <View style={styles.headerCenter}>
                    <View style={styles.timerPill}>
                        <View style={styles.liveDot} />
                        <Text style={styles.timerText}>{elapsedTime}</Text>
                    </View>
                </View>

                <View style={styles.headerStats}>
                    <Text style={styles.headerStatValue}>{exerciseCount}</Text>
                    <Text style={styles.headerStatLabel}>EX</Text>
                    <View style={styles.headerStatDot} />
                    <Text style={styles.headerStatValue}>{totalSets}</Text>
                    <Text style={styles.headerStatLabel}>SETS</Text>
                </View>
            </View>

            {/* Workout Title */}
            {activeWorkout?.title && (
                <View style={styles.titleBar}>
                    <Text style={styles.workoutTitle} numberOfLines={1}>
                        {activeWorkout.title.toUpperCase()}
                    </Text>
                </View>
            )}

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
                optimizationResults={optimizationResults}
            />
            <ExerciseSearchModal
                visible={isModalVisible}
                onClose={() => {
                    setIsModalVisible(false);
                    setModalInitialSearch('');
                }}
                onSelectExercise={handleAddExercise}
                title="Add Exercise"
                initialSearch={modalInitialSearch}
            />

            {/* Suggest exercise strip — shown just above the footer */}
            <View style={[styles.suggestContainer, { paddingBottom: insets.bottom + 72 }]}>
                <SuggestExerciseRow
                    suggestions={suggestions?.suggestions ?? []}
                    isLoading={isSuggestLoading}
                    onMusclePress={handleMusclePress}
                />
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <Pressable
                    style={styles.finishButton}
                    onPress={handleFinishWorkout}
                >
                    <Ionicons name="checkmark-done" size={18} color="white" />
                    <Text style={styles.finishButtonText}>FINISH</Text>
                </Pressable>
                <Pressable
                    onPress={() => setIsModalVisible(true)}
                    style={styles.addFab}
                >
                    <Ionicons name="add" size={26} color="white" />
                </Pressable>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
    },
    timerText: {
        color: theme.colors.text.primary,
        fontSize: 15,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        letterSpacing: 1,
    },
    headerStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerStatValue: {
        color: theme.colors.text.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    headerStatLabel: {
        color: theme.colors.text.tertiary,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    headerStatDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: theme.colors.text.tertiary,
        marginHorizontal: 4,
    },
    titleBar: {
        paddingHorizontal: 12,
        paddingBottom: 4,
    },
    workoutTitle: {
        color: theme.colors.text.secondary,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    suggestContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        pointerEvents: 'box-none',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingTop: 12,
        gap: 10,
    },
    finishButton: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.status.active,
        shadowColor: theme.colors.status.active,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    finishButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    addFab: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
});
