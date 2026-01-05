import { addSetToExercise, deleteSet, removeExerciseFromWorkout } from '@/api/Exercises';
import { Workout } from '@/api/types';
import { addExerciseToPastWorkout, deleteWorkout, getWorkout } from '@/api/Workout';
import ExerciseSearchModal from '@/components/ExerciseSearchModal';
import UnifiedHeader from '@/components/UnifiedHeader';
import WorkoutDetailView from '@/components/WorkoutDetailView';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkoutDetailScreen() {
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    
    // --- State ---
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    
    // Modals
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    // --- Data Fetching ---
    const fetchWorkout = useCallback(async () => {
        if (id) {
            try {
                const data = await getWorkout(Number(id));
                setWorkout(data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            fetchWorkout();
        }, [fetchWorkout])
    );

    // --- Helpers ---
    const formatDuration = (seconds: number) => {
        if (!seconds) return '00:00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatValidationErrors = (validationErrors: any): string => {
        if (!validationErrors || typeof validationErrors !== 'object') return 'Validation failed';
        const messages: string[] = [];
        Object.keys(validationErrors).forEach(field => {
            const fieldErrors = validationErrors[field];
            if (Array.isArray(fieldErrors)) {
                fieldErrors.forEach((error: string) => {
                    let friendlyMessage = error;
                    if (error.includes('less than or equal to 100')) friendlyMessage = field === 'reps' ? 'Max 100 reps' : 'Max 100 RIR';
                    else if (error.includes('less than or equal to 10800')) friendlyMessage = 'Max 3 hours rest';
                    else if (error.includes('less than or equal to 600')) friendlyMessage = 'Max 10 min TUT';
                    else if (error.includes('greater than or equal to 0')) friendlyMessage = `${field} cannot be negative`;
                    messages.push(friendlyMessage);
                });
            } else {
                messages.push(fieldErrors);
            }
        });
        return messages.join('\n');
    };

    // --- Handlers: Workout Structure ---
    const handleAddExercise = async (exerciseId: number) => {
        if (!workout?.id) return;
        const result = await addExerciseToPastWorkout(workout.id, { exercise_id: exerciseId });
        if (result?.id) {
            setIsSearchVisible(false);
            fetchWorkout();
        } else {
            Alert.alert("Error", "Failed to add exercise.");
        }
    };

    const handleRemoveExercise = async (exerciseId: number) => {
        if (!workout?.id) return;
        const success = await removeExerciseFromWorkout(workout.id, exerciseId);
        if (success) fetchWorkout();
        else Alert.alert("Error", "Failed to remove exercise.");
    };

    // --- Handlers: Sets ---
    const handleAddSet = async (exerciseId: number, data: any) => {
        try {
            const result = await addSetToExercise(exerciseId, data);
            
            if (result && typeof result === 'object' && result.error) {
                const msg = result.validationErrors ? formatValidationErrors(result.validationErrors) : result.message;
                Alert.alert("Invalid Input", msg || "Failed to add set");
                return;
            }
            
            if (result?.id || (typeof result === 'object' && !result.error)) {
                fetchWorkout();
            } else {
                Alert.alert("Error", typeof result === 'string' ? result : "Failed to add set.");
            }
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Failed to add set.");
        }
    };

    const handleDeleteSet = async (setId: number) => {
        const success = await deleteSet(setId);
        if (success) fetchWorkout();
        else Alert.alert("Error", "Failed to delete set.");
    };

    // --- Handlers: Menu Actions ---
    const handleDeleteWorkout = () => {
        setIsMenuVisible(false);
        Alert.alert(
            "Delete Workout",
            "Are you sure? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        if (workout?.id) {
                            await deleteWorkout(workout.id);
                            router.back();
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            
            <UnifiedHeader
                title={workout?.title || 'Workout Details'}
                // Dynamic Right Button based on Mode
                rightButton={!isEditMode ? {
                    icon: 'ellipsis-horizontal',
                    onPress: () => setIsMenuVisible(true)
                } : undefined}
                // Text Button for "Done" state
                rightButtonText={isEditMode ? "Done" : undefined}
                onRightButtonPress={() => setIsEditMode(false)}
                
                // Menu Modal Content
                modalVisible={isMenuVisible}
                onModalClose={() => setIsMenuVisible(false)}
                modalContent={
                    <View style={styles.menuContainer}>
                        <Text style={styles.menuHeader}>Options</Text>
                        <TouchableOpacity 
                            style={styles.menuItem} 
                            onPress={() => { setIsMenuVisible(false); setIsEditMode(true); }}
                        >
                            <Ionicons name="create-outline" size={22} color="#FFF" />
                            <Text style={styles.menuText}>Edit Workout</Text>
                            <Ionicons name="chevron-forward" size={16} color="#545458" />
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity 
                            style={styles.menuItem} 
                            onPress={handleDeleteWorkout}
                        >
                            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                            <Text style={[styles.menuText, { color: '#FF3B30' }]}>Delete Workout</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
            
            {isLoading ? (
                <View style={[styles.loadingContainer, { marginTop: 58 }]}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : (
                <View style={{ marginTop: 58, flex: 1 }}>
                    <WorkoutDetailView 
                        workout={workout} 
                        elapsedTime={formatDuration(workout?.duration || 0)} 
                        isActive={false}
                        isEditMode={isEditMode}
                        isViewOnly={!isEditMode}
                        onAddExercise={isEditMode ? () => setIsSearchVisible(true) : undefined}
                        onRemoveExercise={isEditMode ? handleRemoveExercise : undefined}
                        onAddSet={isEditMode ? handleAddSet : undefined}
                        onDeleteSet={isEditMode ? handleDeleteSet : undefined}
                        onShowStatistics={(exerciseId: number) => router.push(`/(exercise-statistics)/${exerciseId}`)}
                    />
                </View>
            )}

            <ExerciseSearchModal
                visible={isSearchVisible}
                onClose={() => setIsSearchVisible(false)}
                onSelectExercise={handleAddExercise}
                title="Add Exercise"
            />

            {/* Floating "Add Exercise" Pill (Only in Edit Mode) */}
            {isEditMode && (
                <View style={[styles.floatingBarContainer, { bottom: insets.bottom + 20 }]}>
                    {Platform.OS === 'ios' ? (
                        <BlurView intensity={80} tint="dark" style={styles.blurPill}>
                            <TouchableOpacity 
                                style={styles.addButton}
                                onPress={() => setIsSearchVisible(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="add-circle-outline" size={24} color="#FFF" />
                                <Text style={styles.addButtonText}>Add Exercise</Text>
                            </TouchableOpacity>
                        </BlurView>
                    ) : (
                        <View style={[styles.blurPill, { backgroundColor: '#1C1C1E' }]}>
                            <TouchableOpacity 
                                style={styles.addButton}
                                onPress={() => setIsSearchVisible(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="add-circle-outline" size={24} color="#FFF" />
                                <Text style={styles.addButtonText}>Add Exercise</Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Menu Modal Styles
    menuContainer: {
        paddingVertical: 8,
    },
    menuHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        marginBottom: 16,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        gap: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 17,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    menuDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3A3A3C',
        marginLeft: 38, // Align with text
    },

    // Floating Bar Styles
    floatingBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    blurPill: {
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#0A84FF', // Premium Blue
        gap: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});