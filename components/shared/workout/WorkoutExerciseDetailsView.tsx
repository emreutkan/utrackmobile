import { updateExerciseOrder } from '@/api/Exercises';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActiveWorkoutExerciseCard } from './ActiveWorkoutExerciseCard';
import { EditWorkoutExerciseCard } from './EditWorkoutExerciseCard';
import { ViewOnlyExerciseCard } from './ViewOnlyExerciseCard';

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
    onUpdateSet?: (setId: number, updatedSet: any) => void;
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
    onUpdateSet,
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
        setLockedExerciseIds(prev => {
            const next = new Set(prev);
            if (next.has(exerciseId)) {
                next.delete(exerciseId);
            } else {
                next.add(exerciseId);
            }
            return next;
        });
        closeCurrentSwipeable();
    };

    const handleAddSet = (exerciseId: number, data: any) => {
        onAddSet?.(exerciseId, data);
    };

    const handleUpdateSet = async (setId: number, updatedSet: any) => {
        // updatedSet is the API response from ExerciseCard, which contains the full updated set data
        // Don't update local state optimistically - let the parent refresh handle it
        // This ensures we always have the latest data from the backend
        if (onUpdateSet) {
            onUpdateSet(setId, updatedSet);
        }
    };

    // Check if there's at least one exercise with at least one set
    const hasSets = exercises.some((ex: any) => ex.sets && ex.sets.length > 0);

    const renderItems = ({item, drag, isActive: isDragging, getIndex}: {item: any, drag: () => void, isActive: boolean, getIndex: () => number | undefined}) => {
        const exerciseIndex = getIndex() ?? 0;

        let exerciseCard;

        // Use appropriate card based on mode
        if (isViewOnly || (!isActive && !isEditMode)) {
            // View-only mode
            exerciseCard = (
                <ViewOnlyExerciseCard
                    key={item.order}
                    exercise={item.exercise || item}
                    sets={item.sets || []}
                />
            );
        } else if (isActive) {
            // Active workout mode
            exerciseCard = (
                <ActiveWorkoutExerciseCard
                    key={item.order}
                    workoutExercise={item}
                    isLocked={lockedExerciseIds.has(item.id)}
                    onToggleLock={toggleLock}
                    onRemove={onRemoveExercise}
                    onAddSet={handleAddSet}
                    onDeleteSet={onDeleteSet ?? (() => {})}
                    swipeControl={swipeControl}
                    onInputFocus={() => {
                        onInputFocus?.(exerciseIndex);
                    }}
                    onShowInfo={(exercise: any) => setSelectedExerciseInfo(exercise)}
                    onShowStatistics={onShowStatistics}
                    drag={drag}
                    exerciseIndex={exerciseIndex}
                />
            );
        } else {
            // Edit mode (past workout)
            exerciseCard = (
                <EditWorkoutExerciseCard
                    key={item.order}
                    workoutExercise={item}
                    isLocked={lockedExerciseIds.has(item.id)}
                    onToggleLock={toggleLock}
                    onRemove={onRemoveExercise}
                    onAddSet={handleAddSet}
                    onDeleteSet={onDeleteSet ?? (() => {})}
                    swipeControl={swipeControl}
                    onInputFocus={() => {
                        onInputFocus?.(exerciseIndex);
                    }}
                    onShowInfo={(exercise: any) => setSelectedExerciseInfo(exercise)}
                    onShowStatistics={onShowStatistics}
                    drag={drag}
                />
            );
        }

        // Only use ScaleDecorator when inside DraggableFlatList
        if (isViewOnly && !isActive) {
            return exerciseCard;
        }

        return (
            <ScaleDecorator activeScale={0.95}>
                {exerciseCard}
            </ScaleDecorator>
        );
    };

    return (
        <>
            <View style={styles.content}>
                {exercises && exercises.length > 0 ? (
                    <>
                        {isViewOnly && !isActive && (
                            <Text style={styles.sectionTitle}>RAW OUTPUT</Text>
                        )}
                        {isViewOnly && !isActive ? (
                            <View>
                                {exercises.map((item: any, index: number) => {
                                    const exercise = item.exercise || (item.name ? item : null);
                                    if (!exercise) return null;
                                    return (
                                        <ViewOnlyExerciseCard
                                            key={item.id || index}
                                            exercise={exercise}
                                            sets={item.sets || []}
                                            onShowStatistics={onShowStatistics}
                                        />
                                    );
                                })}
                            </View>
                        ) : (
                            <DraggableFlatList
                                data={exercises}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: hasSets && isActive ? 200 : 120 }}
                                onDragEnd={async ({ data }: { data: any }) => {
                                    setExercises(data);
                                    const exerciseOrders = data.map((item: any, index: number) => ({ id: item.id, order: index + 1 }));
                                    await updateExerciseOrder(workout.id, exerciseOrders);
                                }}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderItems}
                                simultaneousHandlers={[]}
                                activationDistance={Platform.OS === 'android' ? 20 : 10}
                                dragItemOverflow={false}
                            />
                        )}
                    </>
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="barbell-outline" size={48} color={theme.colors.text.tertiary} />
                        </View>
                        <Text style={styles.emptyTitle}>No exercises yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Tap the <Ionicons name="add" size={14} color={theme.colors.status.active} /> button to add your first exercise
                        </Text>
                    </View>
                )}
            </View>

            <Modal
                presentationStyle="formSheet"
                visible={selectedExerciseInfo !== null}
                animationType="slide"
                onRequestClose={() => setSelectedExerciseInfo(null)}
            >
                {selectedExerciseInfo && (
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{selectedExerciseInfo.name?.toUpperCase()}</Text>
                                <Text style={styles.modalSubtitle}>EXERCISE INFO</Text>
                            </View>
                            <Pressable
                                onPress={() => setSelectedExerciseInfo(null)}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={20} color={theme.colors.text.primary} />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
                            {/* Badges row */}
                            <View style={styles.infoRow}>
                                {selectedExerciseInfo.primary_muscle && (
                                    <View style={[styles.infoBadge, { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }]}>
                                        <Text style={[styles.infoBadgeValue, { color: theme.colors.status.active }]}>{selectedExerciseInfo.primary_muscle}</Text>
                                    </View>
                                )}
                                {selectedExerciseInfo.category && (
                                    <View style={styles.infoBadge}>
                                        <Text style={styles.infoBadgeValue}>{selectedExerciseInfo.category}</Text>
                                    </View>
                                )}
                                {selectedExerciseInfo.equipment_type && (
                                    <View style={styles.infoBadge}>
                                        <Text style={styles.infoBadgeValue}>{selectedExerciseInfo.equipment_type}</Text>
                                    </View>
                                )}
                                {selectedExerciseInfo.difficulty_level && (
                                    <View style={styles.infoBadge}>
                                        <Text style={styles.infoBadgeValue}>{selectedExerciseInfo.difficulty_level}</Text>
                                    </View>
                                )}
                            </View>

                            {selectedExerciseInfo.description && (
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoSectionLabel}>DESCRIPTION</Text>
                                    <Text style={styles.infoSectionText}>{selectedExerciseInfo.description}</Text>
                                </View>
                            )}

                            {selectedExerciseInfo.instructions && (
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoSectionLabel}>INSTRUCTIONS</Text>
                                    <Text style={styles.infoSectionText}>{selectedExerciseInfo.instructions}</Text>
                                </View>
                            )}

                            {selectedExerciseInfo.safety_tips && (
                                <View style={styles.infoSection}>
                                    <View style={styles.infoSectionLabelRow}>
                                        <Ionicons name="shield-checkmark" size={14} color={theme.colors.status.warning} />
                                        <Text style={[styles.infoSectionLabel, { color: theme.colors.status.warning }]}>SAFETY</Text>
                                    </View>
                                    <Text style={styles.infoSectionText}>{selectedExerciseInfo.safety_tips}</Text>
                                </View>
                            )}

                            {selectedExerciseInfo.secondary_muscles && selectedExerciseInfo.secondary_muscles.length > 0 && (
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoSectionLabel}>SECONDARY MUSCLES</Text>
                                    <View style={styles.infoRow}>
                                        {selectedExerciseInfo.secondary_muscles.map((muscle: string, i: number) => (
                                            <View key={i} style={styles.infoBadge}>
                                                <Text style={styles.infoBadgeValue}>{muscle}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 12,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.labelTight,
        marginBottom: theme.spacing.m,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 120,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.l,
    },
    emptyTitle: {
        color: theme.colors.text.primary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: theme.spacing.s,
    },
    emptySubtitle: {
        color: theme.colors.text.tertiary,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.l,
        paddingVertical: theme.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border,
    },
    modalTitle: {
        fontSize: theme.typography.sizes.m,
        fontWeight: '900',
        color: theme.colors.text.primary,
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
    modalSubtitle: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
        marginTop: 2,
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        flex: 1,
    },
    modalContentContainer: {
        padding: theme.spacing.l,
        gap: theme.spacing.l,
    },
    infoSection: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    infoSectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
        marginBottom: theme.spacing.s,
    },
    infoSectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: theme.spacing.s,
    },
    infoSectionText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.s,
    },
    infoBadge: {
        backgroundColor: theme.colors.ui.glass,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    infoBadgeValue: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
});

