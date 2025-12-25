import { addSetToExercise, deleteSet, getExercises, removeExerciseFromWorkout } from '@/api/Exercises';
import { Workout } from '@/api/types';
import { addExerciseToPastWorkout, deleteWorkout, getWorkout } from '@/api/Workout';
import UnifiedHeader from '@/components/UnifiedHeader';
import WorkoutDetailView from '@/components/WorkoutDetailView';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkoutDetailScreen() {
    const { id } = useLocalSearchParams();
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
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
            const success = await removeExerciseFromWorkout(workout.id, exerciseId);
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
                // Note: Recovery status will be recalculated on backend when workout is completed
                // If this is a completed workout being edited, recovery may need backend recalculation
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
                // Note: Recovery status will be recalculated on backend when workout is completed
            }
        } catch (error) {
            Alert.alert("Error", "Failed to delete set.");
        }
    };

    const handleEditPress = () => {
        setIsMenuModalVisible(false);
        setIsEditMode(true);
    };

    const handleDeletePress = () => {
        setIsMenuModalVisible(false);
        Alert.alert(
            "Delete Workout",
            "This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        if (workout?.id) {
                            try {
                                await deleteWorkout(workout.id);
                                router.back();
                            } catch (error) {
                                Alert.alert("Error", "Failed to delete workout.");
                            }
                        }
                    }
                }
            ]
        );
    };

    const handleDonePress = () => {
        setIsEditMode(false);
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
                            />
                        )}
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 70 }]}>
            <UnifiedHeader
                title={workout?.title || 'Workout'}
                rightButton={
                    isEditMode
                        ? undefined
                        : {
                              icon: 'ellipsis-horizontal' as keyof typeof Ionicons.glyphMap,
                              onPress: () => setIsMenuModalVisible(true),
                          }
                }
                rightButtonText={isEditMode ? 'Done' : undefined}
                onRightButtonPress={isEditMode ? handleDonePress : undefined}
                modalContent={
                    <>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleEditPress}
                        >
                            <Ionicons name="create-outline" size={24} color="#FFFFFF" />
                            <Text style={styles.menuItemText}>Edit</Text>
                            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleDeletePress}
                        >
                            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                            <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
                            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                        </TouchableOpacity>
                    </>
                }
                modalVisible={isMenuModalVisible}
                onModalClose={() => setIsMenuModalVisible(false)}
            />
            
            <WorkoutDetailView 
                workout={workout} 
                elapsedTime={formatDuration(workout?.duration || 0)} 
                isActive={false}
                isEditMode={isEditMode}
                isViewOnly={!isEditMode}
                onAddExercise={isEditMode ? () => setIsModalVisible(true) : undefined}
                onRemoveExercise={isEditMode ? handleRemoveExercise : undefined}
                onAddSet={isEditMode ? handleAddSet : undefined}
                onDeleteSet={isEditMode ? handleDeleteSet : undefined}
                onShowStatistics={(exerciseId: number) => router.push(`/(exercise-statistics)/${exerciseId}`)}
            />

            {renderAddExerciseModal()}
            {isEditMode && (
                Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="dark" style={styles.WorkoutFooter}>
                        <View style={styles.footerContent}>
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
                                onPress={() => {
                                    setIsModalVisible(true);
                                }}
                                style={styles.fabButton}
                            >
                                <Ionicons name="add" size={28} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    WorkoutFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 50,
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    fabButton: {
        backgroundColor: '#0A84FF',
        padding: 10,
        borderRadius: 20,

        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    menuItemText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '500',
    },
    deleteText: {
        color: '#FF3B30',
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