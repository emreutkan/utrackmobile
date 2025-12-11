import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SwipeActionProps {
    progress: any;
    dragX: any;
    onPress: () => void;
    iconSize?: number;
    style?: any;
    iconName: keyof typeof Ionicons.glyphMap;
    color?: string;
}

const SwipeAction = ({ progress, dragX, onPress, iconSize = 24, style, iconName, color = "#FFFFFF" }: SwipeActionProps) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            progress.value,
            [0, 1],
            [0.5, 1],
            Extrapolation.CLAMP
        );
        return {
            transform: [{ scale }],
        };
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={style}>
            <Animated.View style={animatedStyle}>
                <Ionicons name={iconName} size={iconSize} color={color} />
            </Animated.View>
        </TouchableOpacity>
    );
};

interface WorkoutDetailViewProps {
    workout: any;
    elapsedTime: string;
    isActive: boolean;
    onAddExercise?: () => void;
    onRemoveExercise?: (exerciseId: number) => void;
    onAddSet?: (exerciseId: number, data: { weight: number, reps: number, reps_in_reserve?: number, is_warmup?: boolean, rest_time_before_set?: number }) => void;
    onDeleteSet?: (setId: number) => void;
}

export default function WorkoutDetailView({ workout, elapsedTime, isActive, onAddExercise, onRemoveExercise, onAddSet, onDeleteSet }: WorkoutDetailViewProps) {
    const insets = useSafeAreaInsets();
    
    // 1. Add state for locked exercises
    const [lockedExerciseIds, setLockedExerciseIds] = useState<Set<number>>(new Set());
    const [newSetInputs, setNewSetInputs] = useState<Record<number, { weight: string, reps: string, rir: string, isWarmup: boolean, restTime: string }>>({});
    
    // Swipeable refs management
    const swipeableRefs = useRef<Map<string, SwipeableMethods>>(new Map());
    const currentlyOpenSwipeable = useRef<string | null>(null);

    const closeCurrentSwipeable = useCallback(() => {
        if (currentlyOpenSwipeable.current) {
            const ref = swipeableRefs.current.get(currentlyOpenSwipeable.current);
            ref?.close();
            currentlyOpenSwipeable.current = null;
        }
    }, []);

    const onSwipeableOpen = useCallback((key: string) => {
        if (currentlyOpenSwipeable.current && currentlyOpenSwipeable.current !== key) {
            const ref = swipeableRefs.current.get(currentlyOpenSwipeable.current);
            ref?.close();
        }
        currentlyOpenSwipeable.current = key;
    }, []);

    const onSwipeableClose = useCallback((key: string) => {
        if (currentlyOpenSwipeable.current === key) {
            currentlyOpenSwipeable.current = null;
        }
    }, []);

    const handleInputChange = (exerciseId: number, field: 'weight' | 'reps' | 'rir' | 'restTime', value: string) => {
        setNewSetInputs(prev => ({
            ...prev,
            [exerciseId]: {
                ...(prev[exerciseId] || { weight: '', reps: '', rir: '', isWarmup: false, restTime: '' }),
                [field]: value
            }
        }));
    };

    const toggleWarmup = (exerciseId: number) => {
        setNewSetInputs(prev => ({
            ...prev,
            [exerciseId]: {
                ...(prev[exerciseId] || { weight: '', reps: '', rir: '', isWarmup: false, restTime: '' }),
                isWarmup: !(prev[exerciseId]?.isWarmup)
            }
        }));
    };

    const handleAddSetPress = (exerciseId: number) => {
        // Find last set for defaults
        // Need to find the correct workoutExercise object from the workout prop
        // The id passed here is 'idToLock' which seems to correspond to the workout_exercise.id
        // Let's find the exercise in the workout array
        const workoutExercise = workout.exercises.find((ex: any) => (ex.id === exerciseId));
        const lastSet = workoutExercise?.sets?.slice(-1)[0];
        
        const inputs = newSetInputs[exerciseId] || {};
        
        // Auto-fill logic: Use input if present, otherwise copy last set, otherwise empty
        const weightStr = inputs.weight !== undefined && inputs.weight !== '' ? inputs.weight : (lastSet?.weight?.toString() ?? '');
        const repsStr = inputs.reps !== undefined && inputs.reps !== '' ? inputs.reps : (lastSet?.reps?.toString() ?? '');
        // Rest time logic: user said "start counting... if first set of first exercise rest 0"
        // But also "copy fields from last set".
        // Let's assume we copy previous rest time if user doesn't input one.
        // Wait, rest time is usually "rest AFTER set". But the field is "rest_time_before_set"? 
        // Based on "rest_time_before_set" in backend, it means rest taken *before* doing this set.
        // So for set 2, it's the rest after set 1.
        // We will just send what is in the input.
        
        if (!weightStr || !repsStr) return; // Basic validation

        let restTimeSeconds = 0;
        if (inputs.restTime) {
            if (inputs.restTime.includes(':')) {
                const parts = inputs.restTime.split(':');
                const min = parseInt(parts[0]) || 0;
                const sec = parseInt(parts[1]) || 0;
                restTimeSeconds = (min * 60) + sec;
            } else {
                restTimeSeconds = parseInt(inputs.restTime) || 0;
            }
        } else if (lastSet?.rest_time_before_set) {
             // If user didn't input, should we copy last set's rest time? 
             // "copy the fields from the last set". Yes.
             restTimeSeconds = lastSet.rest_time_before_set;
        }

        onAddSet && onAddSet(exerciseId, {
            weight: parseFloat(weightStr),
            reps: parseFloat(repsStr),
            reps_in_reserve: inputs.rir ? parseFloat(inputs.rir) : 0,
            is_warmup: inputs.isWarmup ?? false,
            rest_time_before_set: restTimeSeconds
        });
        
        // Clear inputs after add
        setNewSetInputs(prev => {
            const next = { ...prev };
            delete next[exerciseId];
            return next;
        });
    };
    // 2. Add toggle function
    const toggleLock = (id: number) => {
        closeCurrentSwipeable();
        const newLocked = new Set(lockedExerciseIds);
        if (newLocked.has(id)) {
            newLocked.delete(id);
        } else {
            newLocked.add(id);
        }
        setLockedExerciseIds(newLocked);
    };

    const renderExerciseLeftActions = (progress: any, dragX: any, exerciseId: number, isLocked: boolean) => {
        return (
            <SwipeAction 
                progress={progress}
                dragX={dragX}
                onPress={() => toggleLock(exerciseId)}
                iconSize={24}
                style={[styles.lockAction, { backgroundColor: isLocked ? '#FF9F0A' : '#0A84FF' }]}
                iconName={isLocked ? "lock-open-outline" : "lock-closed"}
            />
        );
    };

    const renderExerciseRightActions = (progress: any, dragX: any, exerciseId: number, isLocked: boolean) => {
        if (!isActive || !onRemoveExercise || isLocked) return null;
        
        return (
            <SwipeAction 
                progress={progress}
                dragX={dragX}
                onPress={() => onRemoveExercise(exerciseId)}
                iconSize={24}
                style={styles.deleteAction}
                iconName="trash-outline"
            />
        );
    };

    const renderSetRightActions = (progress: any, dragX: any, setId: number, isLocked: boolean) => {
        if (!isActive || !onDeleteSet || isLocked) return null;
        
        return (
            <SwipeAction 
                progress={progress}
                dragX={dragX}
                onPress={() => onDeleteSet(setId)}
                iconSize={20}
                style={styles.deleteSetAction}
                iconName="trash-outline"
            />
        );
    };

    useEffect(() => {
        // Trigger hint animation for first exercise
        // Check if refs are populated
        if (workout?.exercises?.length > 0) {
             const firstEx = workout.exercises[0];
             const idToLock = firstEx.id || 0; 
             const key = `exercise-${idToLock}`;
             
             const timeout = setTimeout(() => {
                 const ref = swipeableRefs.current.get(key);
                 if (ref) {
                     ref.openLeft();
                     setTimeout(() => {
                         ref.close();
                         setTimeout(() => {
                             ref.openRight();
                             setTimeout(() => {
                                 ref.close();
                             }, 600);
                         }, 600);
                     }, 600);
                 }
             }, 800);
             return () => clearTimeout(timeout);
        }
    }, [workout]); // Add workout as dependency to re-run when loaded

    if (!workout) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={closeCurrentSwipeable}>
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.workoutHeader}>
                    <View>
                        <Text style={styles.workoutTitle}>{workout.title}</Text>
                        <Text style={styles.workoutDate}>
                            {new Date(workout.created_at).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>
                    <Text style={[styles.workoutDuration, { color: isActive ? 'orange' : '#8E8E93' }]}>
                        {elapsedTime}
                    </Text>
                </View>

                <ScrollView style={styles.content} onScrollBeginDrag={closeCurrentSwipeable}>
                    {workout.notes ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>NOTES</Text>
                            <Text style={styles.notesText}>{workout.notes}</Text>
                        </View>
                    ) : null}

                    {workout.exercises && workout.exercises.length > 0 ? (
                        <View style={styles.section}>
                            {workout.exercises.map((workoutExercise: any, index: number) => {
                                // Handle both wrapped (from WorkoutExercise) and direct exercise objects if necessary
                                // Assuming backend returns a list of WorkoutExercise objects which contain an 'exercise' field
                                // OR if the serializer flattens it, checking for name directly.
                                
                                // Safe access: try workoutExercise.exercise first, fallback to workoutExercise itself if name exists there
                                const exercise = workoutExercise.exercise || (workoutExercise.name ? workoutExercise : null);
                                
                                if (!exercise) return null;

                                // 3. Check if this specific exercise is locked
                                // Use workoutExercise.id (the join table ID) if available to be unique per instance
                                const idToLock = workoutExercise.id || index;
                                const isLocked = lockedExerciseIds.has(idToLock);
                                const exerciseKey = `exercise-${idToLock}`;

                                return (
                                    <ReanimatedSwipeable
                                        key={idToLock}
                                        ref={(ref) => {
                                            if (ref) {
                                                swipeableRefs.current.set(exerciseKey, ref);
                                            } else {
                                                swipeableRefs.current.delete(exerciseKey);
                                            }
                                        }}
                                        onSwipeableWillOpen={() => onSwipeableOpen(exerciseKey)}
                                        onSwipeableWillClose={() => onSwipeableClose(exerciseKey)}
                                        renderLeftActions={(progress, dragX) => renderExerciseLeftActions(progress, dragX, idToLock, isLocked)}
                                        renderRightActions={(progress, dragX) => renderExerciseRightActions(progress, dragX, idToLock, isLocked)}
                                        containerStyle={{ marginBottom: 12 }}
                                    >
                                        <View style={[styles.exerciseCard, { marginBottom: 0 }]}>
                                            <View style={styles.exerciseRow}>
                                                <View style={styles.exerciseInfo}>
                                                    <Text style={styles.exerciseName}>
                                                        {exercise.name} {isLocked && <Ionicons name="lock-closed" size={14} color="#8E8E93" />}
                                                    </Text>
                                                    <Text style={styles.exerciseDetails}>
                                                        {exercise.primary_muscle} {exercise.equipment_type ? `• ${exercise.equipment_type}` : ''}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Sets List */}
                                            {workoutExercise.sets && workoutExercise.sets.length > 0 && (
                                                <View style={styles.setsContainer}>
                                                    <View style={styles.setsHeader}>
                                                        <Text style={[styles.setHeaderText, { width: 30 }]}>Set</Text>
                                                        <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>kg</Text>
                                                        <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>Reps</Text>
                                                        <Text style={[styles.setHeaderText, { width: 40, textAlign: 'right' }]}>RPE</Text>
                                                    </View>
                                                    {workoutExercise.sets.map((set: any, setIndex: number) => {
                                                        const setKey = `set-${set.id || setIndex}`;
                                                        return (
                                                            <ReanimatedSwipeable
                                                                key={set.id || setIndex}
                                                                ref={(ref) => {
                                                                    if (ref) {
                                                                        swipeableRefs.current.set(setKey, ref);
                                                                    } else {
                                                                        swipeableRefs.current.delete(setKey);
                                                                    }
                                                                }}
                                                                onSwipeableWillOpen={() => onSwipeableOpen(setKey)}
                                                                onSwipeableWillClose={() => onSwipeableClose(setKey)}
                                                                renderRightActions={(progress, dragX) => renderSetRightActions(progress, dragX, set.id, isLocked)}
                                                                containerStyle={{ marginBottom: 0 }}
                                                                enabled={!isLocked}
                                                            >
                                                                <View style={styles.setRow}>
                                                                    <Text style={[styles.setText, { width: 30, color: '#8E8E93' }]}>{setIndex + 1}</Text>
                                                                    <Text style={[styles.setText, { flex: 1, textAlign: 'center' }]}>{set.weight}</Text>
                                                                    <Text style={[styles.setText, { flex: 1, textAlign: 'center' }]}>{set.reps}</Text>
                                                                    <Text style={[styles.setText, { width: 40, textAlign: 'right' }]}>{set.reps_in_reserve ?? '-'}</Text>
                                                                </View>
                                                            </ReanimatedSwipeable>
                                                        );
                                                    })}
                                                    
                                                {/* New Set Input Row */}
                                                {!isLocked && (
                                                    <View style={styles.setRow}>
                                                        <TouchableOpacity 
                                                            onPress={() => toggleWarmup(idToLock)}
                                                            style={{ width: 30, alignItems: 'center' }}
                                                        >
                                                            <Text style={[
                                                                styles.setText, 
                                                                { 
                                                                    color: newSetInputs[idToLock]?.isWarmup ? '#FF9F0A' : '#8E8E93',
                                                                    fontWeight: newSetInputs[idToLock]?.isWarmup ? 'bold' : 'normal'
                                                                }
                                                            ]}>
                                                                {newSetInputs[idToLock]?.isWarmup ? 'W' : (workoutExercise.sets.length + 1)}
                                                            </Text>
                                                        </TouchableOpacity>
                                                        
                                                        <TextInput
                                                            style={[styles.setInput, { flex: 1, textAlign: 'center' }]}
                                                            value={newSetInputs[idToLock]?.weight !== undefined ? newSetInputs[idToLock]?.weight : (workoutExercise.sets.slice(-1)[0]?.weight?.toString() ?? '')}
                                                            onChangeText={(val) => handleInputChange(idToLock, 'weight', val)}
                                                            keyboardType="numeric"
                                                            placeholder={workoutExercise.sets.slice(-1)[0]?.weight?.toString() || "kg"}
                                                            placeholderTextColor="#555"
                                                            onFocus={closeCurrentSwipeable}
                                                        />
                                                        <TextInput
                                                            style={[styles.setInput, { flex: 1, textAlign: 'center' }]}
                                                            value={newSetInputs[idToLock]?.reps !== undefined ? newSetInputs[idToLock]?.reps : (workoutExercise.sets.slice(-1)[0]?.reps?.toString() ?? '')}
                                                            onChangeText={(val) => handleInputChange(idToLock, 'reps', val)}
                                                            keyboardType="numeric"
                                                            placeholder={workoutExercise.sets.slice(-1)[0]?.reps?.toString() || "reps"}
                                                            placeholderTextColor="#555"
                                                            onFocus={closeCurrentSwipeable}
                                                        />
                                                        <TextInput
                                                            style={[styles.setInput, { width: 40, textAlign: 'right' }]}
                                                            value={newSetInputs[idToLock]?.rir || ''}
                                                            onChangeText={(val) => handleInputChange(idToLock, 'rir', val)}
                                                            keyboardType="numeric"
                                                            placeholder="RIR"
                                                            placeholderTextColor="#555"
                                                            onFocus={closeCurrentSwipeable}
                                                        />
                                                        <TextInput
                                                            style={[styles.setInput, { width: 50, textAlign: 'right', fontSize: 14 }]}
                                                            value={newSetInputs[idToLock]?.restTime || ''}
                                                            onChangeText={(val) => handleInputChange(idToLock, 'restTime', val)}
                                                            keyboardType="numbers-and-punctuation"
                                                            placeholder="Rest"
                                                            placeholderTextColor="#555"
                                                            onFocus={closeCurrentSwipeable}
                                                        />
                                                    </View>
                                                )}
                                                </View>
                                            )}

                                            {/* 5. Conditionally show Add Set button */}
                                            {!isLocked && (
                                                <TouchableOpacity 
                                                    style={[
                                                        styles.addSetButtonContainer,
                                                        (!newSetInputs[idToLock]?.weight || !newSetInputs[idToLock]?.reps) && { opacity: 0.5 }
                                                    ]}
                                                    onPress={() => handleAddSetPress(idToLock)}
                                                    disabled={!newSetInputs[idToLock]?.weight || !newSetInputs[idToLock]?.reps}
                                                >
                                                    <Ionicons name="add" size={20} color="#2C2C2E" />
                                                </TouchableOpacity>
                                            )}
                                            
                            
                                        </View>
                                    </ReanimatedSwipeable>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Text style={styles.placeholderText}>No exercises recorded</Text>
                        </View>
                    )}

                </ScrollView>
                
                {isActive && onAddExercise && (
                    <View style={styles.fabContainer}>
                        <TouchableOpacity 
                            onPress={() => {
                                closeCurrentSwipeable();
                                onAddExercise();
                            }}
                            style={styles.fabButton} 
                        >
                            <Ionicons name="add" size={32} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    workoutHeader: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    workoutTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    workoutDate: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    workoutDuration: {
        fontSize: 18,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },

    notesText: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 24,
    },
    placeholderContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: '#2C2C2E',
        fontSize: 16,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.3)',
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
            }
        }),
    },
    fabButton: {
        backgroundColor: '#0A84FF', // iOS Blue or Custom Orange
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exerciseCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
    },
    exerciseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
    },
    exerciseDetails: {
        color: '#8E8E93',
        fontSize: 14,
    },
    addSetButtonContainer   : {
        backgroundColor: 'gray',
        borderRadius: 12,
        padding: 8,
        margin: 0,
        marginTop: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 12,
        marginLeft: 8,
    },
    setsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    setsHeader: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    setHeaderText: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
    },
    setRow: {
        flexDirection: 'row',
        paddingVertical: 8, // Increased for touch target
        paddingHorizontal: 4,
        alignItems: 'center',
        backgroundColor: '#1C1C1E', // Ensure background for swipeable
    },
    setText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
    },
    setInput: {
        color: '#FFFFFF',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
        backgroundColor: '#2C2C2E',
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginHorizontal: 4,
    },
    deleteSetAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: '100%',
        borderRadius: 0, // Should be flush
    },
    lockAction: {
        backgroundColor: '#0A84FF',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 12,
        marginRight: 8,
    },
});

