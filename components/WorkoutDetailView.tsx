import { updateExerciseOrder } from '@/api/Exercises';
import { useActiveWorkoutStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// --- Shared Types & Helpers ---

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
        const scale = interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);
        return { transform: [{ scale }] };
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={style}>
            <Animated.View style={animatedStyle}>
                <Ionicons name={iconName} size={iconSize} color={color} />
            </Animated.View>
        </TouchableOpacity>
    );
};

// --- Sub-Components ---

// Helper to determine traffic light status based on exercise type and elapsed time
const getRestStatus = (elapsed: number, category: string) => {
    // Default to isolation if not specified
    const isCompound = category?.toLowerCase() === 'compound';
    
    // Thresholds in seconds
    const phase1Limit = isCompound ? 90 : 60;  // Red light limit
    const phase2Limit = isCompound ? 180 : 90; // Yellow light limit

    if (elapsed < phase1Limit) {
        return {
            text: "Rest",
            color: '#FF3B30', // Red
            subText: "Catch your breath.",
            goal: phase1Limit,
            maxGoal: phase2Limit
        };
    } else if (elapsed < phase2Limit) {
        return {
            text: "Recharging...",
            color: '#FF9F0A', // Yellow/Orange
            subText: "Wait a little longer for full benefits.",
            goal: phase2Limit,
            maxGoal: phase2Limit
        };
    } else {
        return {
            text: "Ready to Go!",
            color: '#34C759', // Green
            subText: "You are at 100% power.",
            goal: phase2Limit,
            maxGoal: phase2Limit
        };
    }
};

const RestTimerBar = ({ lastSetTimestamp, category }: { lastSetTimestamp: number | null, category?: string }) => {
    const [progress, setProgress] = useState(0);
    const [timerText, setTimerText] = useState('');
    const [status, setStatus] = useState({ text: 'Rest', color: '#FF3B30', goal: 90, maxGoal: 180 });

    useEffect(() => {
        if (!lastSetTimestamp) {
            setProgress(0);
            setTimerText('');
            return;
        }

        const update = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - lastSetTimestamp) / 1000);
            
            // Get current status to determine goals
            const currentStatus = getRestStatus(elapsed, category || 'isolation');
            setStatus(currentStatus);

            // Progress bar calc - relative to current goal
            const p = Math.min(elapsed / currentStatus.maxGoal, 1);
            setProgress(p);

            // Timer text
            const m = Math.floor(elapsed / 60);
            const s = elapsed % 60;
            setTimerText(`${m}:${s.toString().padStart(2, '0')}`);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [lastSetTimestamp, category]);

    if (!lastSetTimestamp) return null;

    const formatGoal = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.restTimerContainer}>
            <View style={styles.restTimerBarBg}>
                <View style={[styles.restTimerBarFill, { width: `${progress * 100}%`, backgroundColor: status.color }]} />
            </View>
            <View style={styles.restTimerInfo}>
                <Text style={[styles.restTimerLabel, { color: status.color }]}>{status.text}</Text>
                <Text style={styles.restTimerValue}>{timerText} / {formatGoal(status.goal)}</Text>
            </View>
        </View>
    );
};

const SetRow = ({ set, index, onDelete, isLocked, swipeRef, onOpen, onClose }: any) => {
    const renderRightActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => onDelete(set.id)}
            iconSize={20}
            style={styles.deleteSetAction}
            iconName="trash-outline"
        />
    );

    const formatRestTime = (seconds: number) => {
        if (!seconds) return '-';
        if (seconds < 60) return seconds.toString();
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatWeight = (weight: number) => {
        if (!weight && weight !== 0) return '-';
        // If it's an integer, return as is (e.g. 100 -> "100")
        if (Number.isInteger(weight)) return weight.toString();
        // If it's a decimal, show 1 digit (e.g. 22.50 -> "22.5")
        return weight.toFixed ? weight.toFixed(1) : weight.toString();
    };

    return (
        <ReanimatedSwipeable
            ref={swipeRef}
            onSwipeableWillOpen={onOpen}
            onSwipeableWillClose={onClose}
            renderRightActions={isLocked ? undefined : renderRightActions}
            containerStyle={{ marginBottom: 0 }}
            enabled={!isLocked}
        >
            <View style={styles.setRow}>
                <Text style={[styles.setText, {maxWidth: 30}]}>{index + 1}</Text>
                <Text style={[styles.setText, {}]}>{formatWeight(set.weight)}</Text>
                <Text style={[styles.setText, {}]}>{set.reps}</Text>
                <Text style={[styles.setText, {}]}>{set.reps_in_reserve ?? '-'}</Text>
                <Text style={[styles.setText, {}]}>{formatRestTime(set.rest_time_before_set)}</Text>
            </View>
        </ReanimatedSwipeable>
    );
};

const AddSetRow = ({ lastSet, nextSetNumber, onAdd, isLocked, onFocus }: any) => {
    const [inputs, setInputs] = useState({ weight: '', reps: '', rir: '', restTime: '', isWarmup: false });

    // Auto-fill from lastSet on mount or when lastSet changes, but only if inputs are empty
    useEffect(() => {
        if (lastSet) {
            setInputs(prev => ({
                ...prev,
                weight: prev.weight || lastSet.weight?.toString() || '',
                reps: prev.reps || lastSet.reps?.toString() || ''
            }));
        }
    }, [lastSet]);

    const handleAdd = () => {
        if (!inputs.weight || !inputs.reps) return;

        let restTimeSeconds = 0;
        if (inputs.restTime) {
            if (inputs.restTime.includes(':')) {
                const [min, sec] = inputs.restTime.split(':').map(Number);
                restTimeSeconds = (min || 0) * 60 + (sec || 0);
            } else {
                restTimeSeconds = parseInt(inputs.restTime) || 0;
            }
        } else if (lastSet?.rest_time_before_set) {
            restTimeSeconds = lastSet.rest_time_before_set;
        }

        onAdd({
            weight: parseFloat(inputs.weight),
            reps: parseFloat(inputs.reps),
            reps_in_reserve: inputs.rir ? parseFloat(inputs.rir) : 0,
            is_warmup: inputs.isWarmup,
            rest_time_before_set: restTimeSeconds
        }, !inputs.restTime); // Pass true to use global timer if restTime input is empty

        // Reset fields but keep weight/reps for next set convenience
        setInputs({ weight: inputs.weight, reps: inputs.reps, rir: '', restTime: '', isWarmup: false }); 
    };

    if (isLocked) return null;

    return (
     <>
        <View style={styles.setRow}>
            <TouchableOpacity
                onPress={() => setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                style={{ width: 30, alignItems: 'center', paddingVertical: 10, }}
            >
                <Text style={[styles.setText, {   color: inputs.isWarmup ? '#FF9F0A' : '#8E8E93', fontWeight: inputs.isWarmup ? 'bold' : 'normal' }]}>
                    {inputs.isWarmup ? 'W' : nextSetNumber}
                </Text>
            </TouchableOpacity>

            <TextInput
                style={[styles.setInput]}
                value={inputs.weight}
                onChangeText={t => setInputs(p => ({ ...p, weight: t }))}
                keyboardType="numeric"
                placeholder={lastSet?.weight?.toString() || "kg"}
                placeholderTextColor="#555"
                onFocus={onFocus}
            />
            <TextInput
                style={[styles.setInput]}
                value={inputs.reps}
                onChangeText={t => setInputs(p => ({ ...p, reps: t }))}
                keyboardType="numeric"
                placeholder={lastSet?.reps?.toString() || "reps"}
                placeholderTextColor="#555"
                onFocus={onFocus}
            />
            <TextInput
                style={[styles.setInput]}
                value={inputs.rir}
                onChangeText={t => setInputs(p => ({ ...p, rir: t }))}
                keyboardType="numeric"
                placeholder="RIR"
                placeholderTextColor="#555"
                onFocus={onFocus}
            />
            <TextInput
                style={[styles.setInput]}
                value={inputs.restTime}
                onChangeText={t => setInputs(p => ({ ...p, restTime: t }))}
                keyboardType="numbers-and-punctuation"
                placeholder="Rest"
                placeholderTextColor="#555"
                onFocus={onFocus}
            />
            
       
        </View>
             <TouchableOpacity
             style={[styles.addSetButton, (!inputs.weight || !inputs.reps) && { opacity: 0.5 }]}
             onPress={handleAdd}
             disabled={!inputs.weight || !inputs.reps}
         >
             <Text style={styles.addSetButtonText}>Add Set</Text>
         </TouchableOpacity></>
    );
};

const ExerciseCard = ({ workoutExercise, isLocked, onToggleLock, onRemove, onAddSet, onDeleteSet, swipeControl }: any) => {
    const exercise = workoutExercise.exercise || (workoutExercise.name ? workoutExercise : null);
    if (!exercise) return null;

    const idToLock = workoutExercise.id;
    const exerciseKey = `exercise-${idToLock}`;
    const sets = workoutExercise.sets || [];
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const nextSetNumber = sets.length + 1;

    const renderLeftActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => onToggleLock(idToLock)}
            iconSize={24}
            style={[styles.lockAction, { backgroundColor: isLocked ? '#FF9F0A' : '#0A84FF' }]}
            iconName={isLocked ? "lock-open-outline" : "lock-closed"}
        />
    );

    const renderRightActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => onRemove(idToLock)}
            iconSize={24}
            style={styles.deleteAction}
            iconName="trash-outline"
        />
    );

    return (
        <ReanimatedSwipeable
            ref={((ref: any) => swipeControl.register(exerciseKey, ref)) as any}
            onSwipeableWillOpen={() => swipeControl.onOpen(exerciseKey)}
            onSwipeableWillClose={() => swipeControl.onClose(exerciseKey)}
            renderLeftActions={renderLeftActions}
            renderRightActions={!isLocked ? renderRightActions : undefined}
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

                {(sets.length > 0 || !isLocked) && (
                    <View style={styles.setsContainer}>
                        <View style={styles.setsHeader}>
                            <Text style={[styles.setHeaderText, {maxWidth: 30  }]}>Set</Text>
                            <Text style={[styles.setHeaderText, {  }]}>Weight</Text>
                            <Text style={[styles.setHeaderText, {  }]}>Reps</Text>
                            <Text style={[styles.setHeaderText, {  }]}>RPE</Text>
                            <Text style={[styles.setHeaderText, {  }]}>Rest</Text>
                        </View>
                        
                        {sets.map((set: any, index: number) => {
                            const setKey = `set-${set.id || index}`;
                            return (
                                <SetRow
                                    key={set.id || index}
                                    set={set}
                                    index={index}
                                    onDelete={onDeleteSet}
                                    isLocked={isLocked}
                                    swipeRef={(ref: any) => swipeControl.register(setKey, ref)}
                                    onOpen={() => swipeControl.onOpen(setKey)}
                                    onClose={() => swipeControl.onClose(setKey)}
                                />
                            );
                        })}

                        <AddSetRow 
                            lastSet={lastSet}
                            nextSetNumber={nextSetNumber}
                            onAdd={(data: any, useGlobalTimer: boolean) => onAddSet(idToLock, data, useGlobalTimer)}
                            isLocked={isLocked}
                            onFocus={swipeControl.closeAll}
                        />
                    </View>
                )}
            </View>
        </ReanimatedSwipeable>
    );
};

// --- Main Component ---

interface WorkoutDetailViewProps {
    workout: any;
    elapsedTime: string;
    isActive: boolean;
    onAddExercise?: () => void;
    onRemoveExercise?: (exerciseId: number) => void;
    onAddSet?: (exerciseId: number, data: any) => void;
    onDeleteSet?: (setId: number) => void;
}

export default function WorkoutDetailView({ workout, elapsedTime, isActive, onAddExercise, onRemoveExercise, onAddSet, onDeleteSet }: WorkoutDetailViewProps) {
    const insets = useSafeAreaInsets();
    const [lockedExerciseIds, setLockedExerciseIds] = useState<Set<number>>(new Set());
    const [exercises, setExercises] = useState(workout?.exercises || []);
    
    // Use global store for rest timer state
    const { 
        lastSetTimestamp, 
        lastExerciseCategory, 
        setLastSetTimestamp, 
        setLastExerciseCategory 
    } = useActiveWorkoutStore();

    useEffect(() => {
        if (workout?.exercises) {
            setExercises(workout.exercises);
        }
    }, [workout]);

    const handleAddSet = (exerciseId: number, data: any, useGlobalTimer: boolean) => {
        const now = Date.now();
        let finalData = { ...data };
        
        // Only use global timer if user didn't enter a custom rest time
        if (useGlobalTimer && lastSetTimestamp) {
             const elapsedSeconds = Math.floor((now - lastSetTimestamp) / 1000);
             finalData.rest_time_before_set = elapsedSeconds;
        }

        onAddSet?.(exerciseId, finalData);
        // Reset global timer
        setLastSetTimestamp(now);
        
        // Update category for the new timer
        const currentExercise = exercises.find((e: any) => e.id === exerciseId);
        const category = currentExercise?.exercise?.category || currentExercise?.category || 'isolation';
        setLastExerciseCategory(category);
    };
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
            if (ref) swipeableRefs.current.set(key, ref);
            else swipeableRefs.current.delete(key);
        },
        onOpen: (key: string) => {
            if (currentlyOpenSwipeable.current && currentlyOpenSwipeable.current !== key) {
                swipeableRefs.current.get(currentlyOpenSwipeable.current)?.close();
            }
            currentlyOpenSwipeable.current = key;
        },
        onClose: (key: string) => {
            if (currentlyOpenSwipeable.current === key) currentlyOpenSwipeable.current = null;
        },
        closeAll: closeCurrentSwipeable
    };

    const toggleLock = (id: number) => {
        closeCurrentSwipeable();
        setLockedExerciseIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (!workout) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    const renderItems = ({item, drag, isActive}: {item: any, drag: () => void, isActive: boolean}) => {
    
        return (
            <ScaleDecorator activeScale={0.8}>
                <TouchableOpacity
                    onLongPress={drag} // Long press to start dragging
                    disabled={isActive} 
                    delayLongPress={100}
                >
                                    <ExerciseCard
                                    key={item.order}
                                    workoutExercise={item}
                                    isLocked={lockedExerciseIds.has(item.id)}
                                    onToggleLock={toggleLock}
                                    onRemove={onRemoveExercise}
                                    onAddSet={handleAddSet}
                                    onDeleteSet={onDeleteSet}
                                    swipeControl={swipeControl}
                                />
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };
    return (
        <TouchableWithoutFeedback onPress={closeCurrentSwipeable}>
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.workoutHeader}>
                    <View>
                        <Text style={styles.workoutTitle}>{workout.title}</Text>
                        <Text style={styles.workoutDate}>
                            {new Date(workout.created_at).toLocaleDateString(undefined, {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </Text>
                    </View>
                    <Text style={[styles.workoutDuration, { color: isActive ? 'orange' : '#8E8E93' }]}>
                        {elapsedTime}
                    </Text>
                </View>
                
                <RestTimerBar lastSetTimestamp={lastSetTimestamp} category={lastExerciseCategory} />


                            <View                 style={styles.content}
                            >
              <DraggableFlatList
                data={exercises}
                onDragEnd={async ({ data }: { data: any }) => {
                    setExercises(data); // Update UI immediately
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
        
            />
                            </View>
  
                
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
    sectionTitle: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    notesText: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 24,
    },
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: 40,
        paddingTop: 100,
        paddingBottom: 100, 
        alignSelf: 'center',
    },
    placeholderText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 12,
        fontWeight: '600',
        opacity: 0.5,
        maxWidth: 200,
        lineHeight: 24,
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        borderRadius: 12,
        backgroundColor: '#1C1C1E',
        
    },
    fabContainer: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        ...Platform.select({
            web: { boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.3)' },
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
        backgroundColor: '#0A84FF',
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
    exerciseInfo: { flex: 1 },
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
    addSetButton: {
        marginTop: 12,
        backgroundColor: '#0A84FF',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    addSetButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
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
    lockAction: {
        backgroundColor: '#0A84FF',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 12,
        marginRight: 8,
    },
    setsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    setsHeader: {
        flex: 1,
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 4,
    },
    setHeaderText: {
        flex: 1,
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    setRow: {
        flexDirection: 'row',
        paddingBottom: 8,
        paddingTop: 4,
        paddingHorizontal: 0,
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
    },
    setText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    setInput: {
        flex: 1,
        textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
        backgroundColor: '#2C2C2E',
        borderRadius: 6,
        paddingVertical: 6,
        marginHorizontal: 4,
    },
    deleteSetAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: '100%',
        borderRadius: 0,
    },
    restTimerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    restTimerBarBg: {
        height: 6,
        backgroundColor: '#2C2C2E',
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
    },
    restTimerBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    restTimerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    restTimerLabel: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '500',
    },
    restTimerValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
});


