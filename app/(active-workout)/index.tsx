import { addExerciseToWorkout, addSetToExercise, deleteSet, getExercises, removeExerciseFromWorkout } from '@/api/Exercises';
import { completeWorkout, getActiveWorkout, getRestTimerState } from '@/api/Workout';
import WorkoutDetailView from '@/components/WorkoutDetailView';
import { useActiveWorkoutStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ActiveWorkoutScreen() {
    const [activeWorkout, setActiveWorkout] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [isModalVisible, setIsModalVisible] = useState(false);
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [exercises, setExercises] = useState<any[]>([]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    
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

    // Load exercises when modal opens or search query changes
    useEffect(() => {
        if (!isModalVisible) return;

        const delayDebounceFn = setTimeout(() => {
            loadExercises();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, isModalVisible]);

    const loadExercises = async () => {
        setIsLoadingExercises(true);
        try {
            const data = await getExercises(searchQuery);
            if (Array.isArray(data)) {
                setExercises(data);
            }
        } catch (error) {
            console.error("Failed to load exercises:", error);
        } finally {
            setIsLoadingExercises(false);
        }
    };

    const handleAddExercise = async (exerciseId: number) => {
        if (!activeWorkout?.id) return;
        
        try {
            await addExerciseToWorkout(activeWorkout.id, exerciseId);
            setIsModalVisible(false);
            // Refresh active workout to show new exercise
            const updatedWorkout = await getActiveWorkout();
            setActiveWorkout(updatedWorkout);
            setSearchQuery(''); // Reset search
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

    const handleAddSet = async (workoutExerciseId: number, set: { weight: number, reps: number, reps_in_reserve?: number }) => {
        try {
            await addSetToExercise(workoutExerciseId, set);
            // Refresh workout
            const updatedWorkout = await getActiveWorkout();
            setActiveWorkout(updatedWorkout);
            // Refresh rest timer state from backend
            fetchRestTimerState();
        } catch (error) {
            console.error("Failed to add set:", error);
            alert("Failed to add set");
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
                            
                            await completeWorkout(activeWorkout.id, { duration: durationSeconds.toString() });
                            // Clear rest timer state when workout is completed
                            setLastSetTimestamp(null);
                            setLastExerciseCategory('isolation');
                            router.replace('/');
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


    const renderAddExerciseModal = () => {
        return (
            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Exercise</Text>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButtonContainer}>
                            <Ionicons name="close-circle" size={28} color="#2C2C2E" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.searchSection}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search exercises..."
                                placeholderTextColor="#8E8E93"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={18} color="#8E8E93" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {isLoadingExercises ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0A84FF" />
                        </View>
                    ) : (
                        <FlatList
                            data={exercises}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.exerciseCard}
                                    onPress={() => handleAddExercise(item.id)}
                                >
                                    <View style={styles.exerciseInfoContainer}>
                                        <View style={styles.exerciseIconPlaceholder}>
                                            <Text style={styles.exerciseInitial}>
                                                {item.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.exerciseTextContent}>
                                            <Text style={styles.exerciseName}>{item.name}</Text>
                                            <Text style={styles.exerciseDetail}>
                                                {item.primary_muscle} {item.equipment_type ? `• ${item.equipment_type}` : ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.addButton}>
                                        <Ionicons name="add" size={24} color="#0A84FF" />
                                    </View>
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={{height: 12}} />}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="barbell-outline" size={48} color="#FFFFFF" />
                                    <Text style={styles.emptyText}>No exercises found</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </Modal>
        );
    }

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
                onCompleteWorkout={handleFinishWorkout}
                onShowStatistics={(exerciseId: number) => router.push(`/(exercise-statistics)/${exerciseId}`)}
            />
            {renderAddExerciseModal()}
        </>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
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
