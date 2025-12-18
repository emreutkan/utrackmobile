import { addSetToExercise, deleteSet, getExercises, removeExerciseFromWorkout } from '@/api/Exercises';
import { Workout } from '@/api/types';
import { addExerciseToPastWorkout, getWorkout } from '@/api/Workout';
import WorkoutDetailView from '@/components/WorkoutDetailView';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkoutDetailScreen() {
    const { id } = useLocalSearchParams();
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [exercises, setExercises] = useState<any[]>([]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const insets = useSafeAreaInsets();

    const fetchWorkout = useCallback(async () => {
        if (id) {
            const data = await getWorkout(Number(id));
            setWorkout(data);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            fetchWorkout();
        }, [fetchWorkout])
    );

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

    const formatDuration = (seconds: number) => {
        if (!seconds) return '00:00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAddExercise = async (exerciseId: number) => {
        if (!workout?.id) return;
        try {
            const result = await addExerciseToPastWorkout(workout.id, { exercise_id: exerciseId });
            if (result?.id) {
                setIsModalVisible(false);
                setSearchQuery('');
                fetchWorkout();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to add exercise.");
        }
    };

    const handleRemoveExercise = async (exerciseId: number) => {
        if (!workout?.id) return;
        try {
            const success = await removeExerciseFromWorkout(exerciseId);
            if (success) {
                fetchWorkout();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to remove exercise.");
        }
    };

    const handleAddSet = async (exerciseId: number, data: any) => {
        try {
            const result = await addSetToExercise(exerciseId, data);
            if (result?.id) {
                fetchWorkout();
            } else if (typeof result === 'string') {
                Alert.alert("Error", result);
            } else {
                Alert.alert("Error", "Failed to add set.");
            }
        } catch (error: any) {
            console.error("Add set error:", error);
            Alert.alert("Error", error?.message || "Failed to add set.");
        }
    };

    const handleDeleteSet = async (setId: number) => {
        try {
            const success = await deleteSet(setId);
            if (success) {
                fetchWorkout();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to delete set.");
        }
    };

    const renderAddExerciseModal = () => {
        return (
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Exercise</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                            <TextInput
                                placeholder="Search exercises..."
                                placeholderTextColor="#8E8E93"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={styles.searchInput}
                            />
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
                                        <View style={styles.exerciseInfo}>
                                            <Text style={styles.exerciseName}>{item.name}</Text>
                                            <Text style={styles.exerciseDetail}>
                                                {item.primary_muscle} {item.equipment_type ? `• ${item.equipment_type}` : ''}
                                            </Text>
                                        </View>
                                        <Ionicons name="add" size={24} color="#0A84FF" />
                                    </TouchableOpacity>
                                )}
                                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                                contentContainerStyle={styles.listContent}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="barbell-outline" size={48} color="#8E8E93" />
                                        <Text style={styles.emptyText}>No exercises found</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                {workout && (
                    <TouchableOpacity
                        onPress={() => setIsEditMode(!isEditMode)}
                        style={styles.editButton}
                    >
                        <Ionicons 
                            name={isEditMode ? "checkmark" : "create-outline"} 
                            size={24} 
                            color={isEditMode ? "#34C759" : "#0A84FF"} 
                        />
                    </TouchableOpacity>
                )}
            </View>
            
            <View style={styles.content}>
                <WorkoutDetailView 
                    workout={workout} 
                    elapsedTime={formatDuration(workout?.duration || 0)} 
                    isActive={false}
                    isEditMode={isEditMode}
                    onAddExercise={isEditMode ? () => setIsModalVisible(true) : undefined}
                    onRemoveExercise={isEditMode ? handleRemoveExercise : undefined}
                    onAddSet={isEditMode ? handleAddSet : undefined}
                    onDeleteSet={isEditMode ? handleDeleteSet : undefined}
                    onShowStatistics={(exerciseId: number) => router.push(`/(exercise-statistics)/${exerciseId}`)}
                />
            </View>
            {renderAddExerciseModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: '#000000',
        zIndex: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: '#0A84FF',
        fontSize: 17,
        marginLeft: -4,
    },
    content: {
        flex: 1,
    },
    editButton: {
        padding: 4,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        color: '#FFFFFF',
        fontSize: 16,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    exerciseCard: {
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    exerciseDetail: {
        color: '#8E8E93',
        fontSize: 14,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 16,
        marginTop: 12,
    },
});
