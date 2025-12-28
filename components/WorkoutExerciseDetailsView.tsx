import { updateExerciseOrder } from '@/api/Exercises';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from './ExerciseCard';

interface WorkoutExerciseDetailsViewProps {
    workout: any;
    exercises: any[];
    setExercises: (exercises: any[]) => void;
    isActive: boolean;
    isEditMode?: boolean;
    isViewOnly?: boolean;
    onAddExercise?: () => void;
    onRemoveExercise?: (exerciseId: number) => void;
    onAddSet?: (exerciseId: number, data: any) => void;
    onDeleteSet?: (setId: number) => void;
    onShowStatistics?: (exerciseId: number) => void;
    onInputFocus?: (index: number) => void;
}

export default function WorkoutExerciseDetailsView({
    workout,
    exercises,
    setExercises,
    isActive,
    isEditMode = false,
    isViewOnly = false,
    onRemoveExercise,
    onAddSet,
    onDeleteSet,
    onShowStatistics,
    onInputFocus
}: WorkoutExerciseDetailsViewProps) {
    const insets = useSafeAreaInsets();
    const [lockedExerciseIds, setLockedExerciseIds] = useState<Set<number>>(new Set());
    const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<any>(null);

    // Swipe Logic
    const swipeableRefs = useRef<Map<string, SwipeableMethods>>(new Map());
    const currentlyOpenSwipeable = useRef<string | null>(null);

    const closeCurrentSwipeable = useCallback(() => {
        if (currentlyOpenSwipeable.current) {
            const ref = swipeableRefs.current.get(currentlyOpenSwipeable.current);
            ref?.close();
            currentlyOpenSwipeable.current = null;
        }
    }, []);

    const swipeControl = {
        register: (key: string, ref: SwipeableMethods | null) => {
            if (ref) {
                swipeableRefs.current.set(key, ref);
            } else {
                swipeableRefs.current.delete(key);
            }
        },
        onOpen: (key: string) => {
            if (currentlyOpenSwipeable.current && currentlyOpenSwipeable.current !== key) {
                const ref = swipeableRefs.current.get(currentlyOpenSwipeable.current);
                ref?.close();
            }
            currentlyOpenSwipeable.current = key;
        },
        onClose: (key: string) => {
            if (currentlyOpenSwipeable.current === key) {
                currentlyOpenSwipeable.current = null;
            }
        },
        closeAll: () => {
            swipeableRefs.current.forEach(ref => ref.close());
            currentlyOpenSwipeable.current = null;
        }
    };

    const toggleLock = (exerciseId: number) => {
        console.log('toggleLock', exerciseId);
        setLockedExerciseIds(prev => {
            const next = new Set(prev);
            if (next.has(exerciseId)) {
                next.delete(exerciseId);
                console.log('exercise unlocked', exerciseId);
            } else {
                next.add(exerciseId);
                console.log('exercise locked', exerciseId);
            }
            return next;
        });
        closeCurrentSwipeable();
    };

    const handleAddSet = (exerciseId: number, data: any) => {
        onAddSet?.(exerciseId, data);
    };

    // Check if there's at least one exercise with at least one set
    const hasSets = exercises.some((ex: any) => ex.sets && ex.sets.length > 0);

    const renderItems = ({item, drag, isActive, getIndex}: {item: any, drag: () => void, isActive: boolean, getIndex: () => number | undefined}) => {
        return (
            <ScaleDecorator activeScale={0.95}>
                <TouchableOpacity
                    onLongPress={isViewOnly ? undefined : drag}
                    disabled={isActive || isViewOnly} 
                    delayLongPress={Platform.OS === 'android' ? 300 : 200}
                    activeOpacity={0.7}
                    style={{ flex: 1 }}
                >
                    <ExerciseCard
                        key={item.order}
                        workoutExercise={item}
                        isLocked={lockedExerciseIds.has(item.id)}
                        isEditMode={isEditMode}
                        isViewOnly={isViewOnly}
                        onToggleLock={toggleLock}
                        onRemove={onRemoveExercise}
                        onAddSet={handleAddSet}
                        onDeleteSet={onDeleteSet}
                        swipeControl={swipeControl}
                        onInputFocus={() => {
                            onInputFocus?.(getIndex() ?? 0);
                        }}
                        onShowInfo={(exercise: any) => setSelectedExerciseInfo(exercise)}
                        onShowStatistics={onShowStatistics}
                        isActive={isActive}
                    />
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    return (
        <>
            <View style={styles.content}>
                {exercises && exercises.length > 0 ? (
                    <DraggableFlatList
                        data={exercises}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: hasSets && isActive ? 200 : 120 }}
                        onDragEnd={isViewOnly ? undefined : async ({ data }: { data: any }) => {
                            setExercises(data);
                            const exerciseOrders = data.map((item: any, index: number) => ({ id: item.id, order: index + 1 }));
                            const response = await updateExerciseOrder(workout.id, exerciseOrders);
                            if (response) {
                                console.log('Exercise order updated successfully');
                            } else {
                                console.log('Failed to update exercise order');
                            }
                        }}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItems}
                        simultaneousHandlers={[]}
                        activationDistance={Platform.OS === 'android' ? 20 : 10}
                        dragItemOverflow={false}
                    />
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>No exercises yet. Tap the + button to add exercises.</Text>
                    </View>
                )}
            </View>

            {/* Exercise Info Modal */}
            <Modal
                visible={selectedExerciseInfo !== null}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedExerciseInfo(null)}
            >
                {selectedExerciseInfo && (
                    <View style={styles.modalContainer}>
                        <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
                            <Text style={styles.modalTitle}>{selectedExerciseInfo.name}</Text>
                            <TouchableOpacity 
                                onPress={() => setSelectedExerciseInfo(null)}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
                            {selectedExerciseInfo.description && (
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoSectionTitle}>Description</Text>
                                    <Text style={styles.infoSectionText}>{selectedExerciseInfo.description}</Text>
                                </View>
                            )}
                            
                            {selectedExerciseInfo.instructions && (
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoSectionTitle}>Instructions</Text>
                                    <Text style={styles.infoSectionText}>{selectedExerciseInfo.instructions}</Text>
                                </View>
                            )}
                            
                            {selectedExerciseInfo.safety_tips && (
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoSectionTitle}>Safety Tips</Text>
                                    <Text style={styles.infoSectionText}>{selectedExerciseInfo.safety_tips}</Text>
                                </View>
                            )}
                            
                            <View style={styles.infoRow}>
                                {selectedExerciseInfo.category && (
                                    <View style={styles.infoBadge}>
                                        <Text style={styles.infoBadgeLabel}>Category</Text>
                                        <Text style={styles.infoBadgeValue}>{selectedExerciseInfo.category}</Text>
                                    </View>
                                )}
                                
                                {selectedExerciseInfo.difficulty_level && (
                                    <View style={styles.infoBadge}>
                                        <Text style={styles.infoBadgeLabel}>Difficulty</Text>
                                        <Text style={styles.infoBadgeValue}>{selectedExerciseInfo.difficulty_level}</Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                )}
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    placeholderText: {
        color: '#8E8E93',
        fontSize: 16,
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
    },
    modalContentContainer: {
        padding: 16,
    },
    infoSection: {
        marginBottom: 24,
    },
    infoSectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    infoSectionText: {
        fontSize: 15,
        color: '#8E8E93',
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    infoBadge: {
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    infoBadgeLabel: {
        fontSize: 11,
        color: '#8E8E93',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    infoBadgeValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

