import { addSetToExercise, deleteSet, getExercises, removeExerciseFromWorkout } from '@/api/Exercises';
import { Workout } from '@/api/types';
import { addExerciseToPastWorkout, getWorkout } from '@/api/Workout';
import WorkoutDetailView from '@/components/WorkoutDetailView';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkoutDetailScreen() {
    const { id } = useLocalSearchParams();
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [exercises, setExercises] = useState<any[]>([]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [isViewOnly, setIsViewOnly] = useState(false);
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
                                <Ionicons name="close-circle" size={28} color="#48484A" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
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
                                <ActivityIndicator size="small" color="#FFFFFF" />
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
                                        <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                                    </TouchableOpacity>
                                )}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                                contentContainerStyle={styles.listContent}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* COMPACT HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
            

                <TouchableOpacity
                    onPress={() => setIsEditMode(!isEditMode)}
                    style={styles.headerButton}
                >
                    <Text style={[styles.editBtnText, isEditMode && styles.doneBtnText]}>
                        {isEditMode ? "Done" : "Edit"}
                    </Text>
                </TouchableOpacity>
            </View>
            
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <WorkoutDetailView 
                    workout={workout} 
                    elapsedTime={formatDuration(workout?.duration || 0)} 
                    isActive={false}
                    isEditMode={isEditMode}
                    isViewOnly={isViewOnly}
                    onAddExercise={isEditMode ? () => setIsModalVisible(true) : undefined}
                    onRemoveExercise={isEditMode ? handleRemoveExercise : undefined}
                    onAddSet={isEditMode ? handleAddSet : undefined}
                    onDeleteSet={isEditMode ? handleDeleteSet : undefined}
                    onShowStatistics={(exerciseId: number) => router.push(`/(exercise-statistics)/${exerciseId}`)}
                />
                <View style={{ height: insets.bottom + 40 }} />
            </ScrollView>

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
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        backgroundColor: '#000000',
    },
    headerButton: {
        paddingHorizontal: 8,
        justifyContent: 'center',
    },

    editBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'right',
    },
    doneBtnText: {
        color: '#34C759',
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1C1C1E', // Dark gray card
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        height: '85%',
        paddingTop: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        borderRadius: 10,
        marginHorizontal: 20,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        color: '#FFFFFF',
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    exerciseCard: {
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#38383A',
        width: '100%',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    exerciseDetail: {
        color: '#8E8E93',
        fontSize: 13,
    },
});