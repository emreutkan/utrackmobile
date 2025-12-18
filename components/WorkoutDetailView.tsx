import { updateExerciseOrder } from '@/api/Exercises';
import { useActiveWorkoutStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
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
        if (seconds < 60) return `${seconds}s`;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s > 0 ? s + 's' : ''}`;
    };

    const formatWeight = (weight: number) => {
        if (!weight && weight !== 0) return '-';
        // Parse as number first to handle cases where it might be coming as string
        const w = Number(weight);
        if (isNaN(w)) return '-';
        
        // Round to nearest 0.25 (standard plate increment)
        // Or if you want to be stricter, just strip unnecessary decimals
        
        // If it's effectively an integer (e.g. 12.0 or 12.00)
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        
        // If it has decimals, show up to 2 but strip trailing zeros
        // For 53.22 -> maybe round to 53.25? 
        // User requested: "strip trailing decimals if they aren't necessary"
        // Let's stick to max 2 decimals but remove trailing zeros (e.g. 12.50 -> 12.5)
        return parseFloat(w.toFixed(2)).toString();
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

    // Format weight to remove unnecessary decimals (same logic as formatWeight)
    const formatWeightForInput = (weight: number) => {
        if (!weight && weight !== 0) return '';
        const w = Number(weight);
        if (isNaN(w)) return '';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
    };

    // Auto-fill from lastSet on mount or when lastSet changes, but only if inputs are empty
    useEffect(() => {
        if (lastSet) {
            setInputs(prev => ({
                ...prev,
                weight: prev.weight || (lastSet.weight != null ? formatWeightForInput(lastSet.weight) : ''),
                reps: prev.reps || (lastSet.reps != null ? lastSet.reps.toString() : '')
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
                placeholderTextColor="#8E8E93"
                onFocus={onFocus}
            />
            <TextInput
                style={[styles.setInput]}
                value={inputs.reps}
                onChangeText={t => setInputs(p => ({ ...p, reps: t }))}
                keyboardType="numeric"
                placeholder={lastSet?.reps?.toString() || "reps"}
                placeholderTextColor="#8E8E93"
                onFocus={onFocus}
            />
            <TextInput
                style={[styles.setInput]}
                value={inputs.rir}
                onChangeText={t => setInputs(p => ({ ...p, rir: t }))}
                keyboardType="numeric"
                placeholder="RIR"
                placeholderTextColor="#8E8E93"
                onFocus={onFocus}
            />
            <TextInput
                style={[styles.setInput]}
                value={inputs.restTime}
                onChangeText={t => setInputs(p => ({ ...p, restTime: t }))}
                keyboardType="numbers-and-punctuation"
                placeholder="Rest"
                placeholderTextColor="#8E8E93"
                onFocus={onFocus}
            />
            
       
        </View>

        {inputs.weight && inputs.reps && (
                   <TouchableOpacity
                   style={[styles.addSetButton, (!inputs.weight || !inputs.reps) && { opacity: 0.5 }]}
                   onPress={handleAdd}
                   disabled={!inputs.weight || !inputs.reps}
               >
                   <Text style={styles.addSetButtonText}>Add Set</Text>
               </TouchableOpacity>
        )}

    
      
         
         
         </>
    );
};

const ExerciseCard = ({ workoutExercise, isLocked, onToggleLock, onRemove, onAddSet, onDeleteSet, swipeControl, onInputFocus, onShowInfo }: any) => {
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
                        <View style={styles.exerciseNameRow}>
                            <Text style={styles.exerciseName}>
                                {exercise.name} {isLocked && <Ionicons name="lock-closed" size={14} color="#8E8E93" />}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => onShowInfo?.(exercise)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.exerciseMenuButton}
                            >
                                <Ionicons name="ellipsis-horizontal" size={20} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.exerciseInfoRow}>
                            <View style={styles.exerciseMusclesContainer}>
                                {exercise.primary_muscle && (
                                    <View style={[styles.exerciseTag, styles.primaryMuscleTag]}>
                                        <Text style={styles.exerciseTagText}>{exercise.primary_muscle}</Text>
                                    </View>
                                )}
                                {exercise.secondary_muscles && (
                                    Array.isArray(exercise.secondary_muscles) 
                                        ? exercise.secondary_muscles.map((muscle: string, idx: number) => (
                                            <View key={idx} style={styles.exerciseTag}>
                                                <Text style={styles.secondaryMuscleTagText}>{muscle}</Text>
                                            </View>
                                          ))
                                        : <View style={styles.exerciseTag}>
                                            <Text style={styles.secondaryMuscleTagText}>{exercise.secondary_muscles}</Text>
                                          </View>
                                )}
                            </View>
                            {exercise.equipment_type && (
                                <View style={styles.exerciseTag}>
                                    <Text style={styles.exerciseTagText}>{exercise.equipment_type}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {(sets.length > 0 || !isLocked) && (
                    <View style={styles.setsContainer}>
                        <View style={styles.setsHeader}>
                            <Text style={[styles.setHeaderText, {maxWidth: 30  }]}>Set</Text>
                            <Text style={[styles.setHeaderText, {  }]}>Weight</Text>
                            <Text style={[styles.setHeaderText, {  }]}>Reps</Text>
                            <Text style={[styles.setHeaderText, {  }]}>RIR</Text>
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
                            onFocus={() => {
                                swipeControl.closeAll();
                                onInputFocus?.();
                            }}
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
    onCompleteWorkout?: () => void;
}

export default function WorkoutDetailView({ workout, elapsedTime, isActive, onAddExercise, onRemoveExercise, onAddSet, onDeleteSet, onCompleteWorkout }: WorkoutDetailViewProps) {
    const insets = useSafeAreaInsets();
    const [lockedExerciseIds, setLockedExerciseIds] = useState<Set<number>>(new Set());
    const [exercises, setExercises] = useState(workout?.exercises || []);
    const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<any>(null);
    
    // Use global store for rest timer state
    const { 
        lastSetTimestamp, 
        lastExerciseCategory, 
        setLastSetTimestamp, 
        setLastExerciseCategory 
    } = useActiveWorkoutStore();

    // Move useRef to the top level, before any conditional returns
    const flatListRef = useRef<any>(null);

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

    const handleInputFocus = (index: number) => {
        // Scroll to the item with a slight delay to allow keyboard to appear
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
        }, 100);
    };

    // Check if there's at least one exercise with at least one set
    const hasSets = exercises.some((ex: any) => ex.sets && ex.sets.length > 0);

    const renderItems = ({item, drag, isActive, getIndex}: {item: any, drag: () => void, isActive: boolean, getIndex: () => number | undefined}) => {
    
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
                                    onInputFocus={() => {
                                        const idx = getIndex();
                                        if (idx !== undefined) handleInputFocus(idx);
                                    }}
                                    onShowInfo={(exercise: any) => setSelectedExerciseInfo(exercise)}
                                />
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };
    return (
        <>
        <TouchableWithoutFeedback onPress={closeCurrentSwipeable}>
            <View style={{ flex: 1, backgroundColor: '#000000' }}>
                <KeyboardAvoidingView 
                    style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
                >
                    <View style={styles.workoutHeader}>
                        <View>
                            <Text style={styles.workoutTitle}>
                                {workout.title 
                                    ? workout.title.split(' ').map((word: string) => 
                                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                      ).join(' ')
                                    : 'Workout'}
                            </Text>
                            <Text style={styles.workoutDate}>
                                {new Date(workout.created_at).toLocaleDateString(undefined, {
                                    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
                                })}
                            </Text>
                        </View>
                        <Text style={[styles.workoutDuration, { color: isActive ? 'orange' : '#8E8E93' }]}>
                            {elapsedTime}
                        </Text>
                    </View>
                    
                    <RestTimerBar lastSetTimestamp={lastSetTimestamp} category={lastExerciseCategory} />

                    <View style={styles.content}>
                        <DraggableFlatList
                            ref={flatListRef}
                            data={exercises}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: hasSets && isActive ? 200 : 120 }} // Extra padding when finish button is shown
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

                    <BlurView intensity={15} tint="dark" style={styles.WorkoutFooter}>
                            <>
            
                     {isActive && onCompleteWorkout && hasSets ? (
                                    <TouchableOpacity 
                                        style={styles.completeWorkoutButton}
                                        onPress={onCompleteWorkout}
                                    >
                                        <Text style={styles.completeWorkoutButtonText}>Finish Workout</Text>
                                    </TouchableOpacity>
                                ) : null
                   }
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
                        </>  
                    </BlurView>
        
                
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
            
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
        paddingHorizontal: 10,
        paddingBottom: 8,
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
        color: '#63666F', // Darker grey for less prominence
        fontSize: 15,
        fontWeight: '400',
        textTransform: 'none', // Sentence case instead of all caps
    },
    workoutDuration: {
        fontSize: 18,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    content: {
        flex: 1,
        padding: 2,
        
        paddingHorizontal: 8,
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
    exerciseNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        flex: 1,
    },
    exerciseMenuButton: {
        padding: 4,
        marginLeft: 8,
    },
    exerciseInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exerciseMusclesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        flex: 1,
    },
    exerciseTag: {
        backgroundColor: '#2C2C2E', // Dark grey background for chip
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    primaryMuscleTag: {
        // Slightly brighter for primary muscle distinction
    },
    exerciseTagText: {
        color: '#A1A1A6', // Slightly brighter for primary muscle/equipment
        fontSize: 12,
        fontWeight: '500',
    },
    secondaryMuscleTagText: {
        color: '#8E8E93', // Same as primary but can be distinguished by context
        fontSize: 12,
        fontWeight: '400',
    },
    lockedTag: {
        opacity: 0.85, // Less dimming for better visibility
        backgroundColor: '#2C2C2E', // Ensure background is visible
    },
    lockedTagText: {
        color: '#A1A1A6', // Lighter grey for better contrast (4.5:1 ratio)
        opacity: 1, // Override parent opacity for text
    },
    addSetButton: {
        marginTop: 12,
        backgroundColor: 'transparent', // Ghost button style
        borderWidth: 1,
        borderColor: '#6366F1', // Muted indigo border
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    addSetButtonText: {
        color: '#6366F1', // Muted indigo text
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
        lineHeight: 20, // Ensure consistent line height for vertical alignment
        ...Platform.select({
            android: { includeFontPadding: false }, // Remove extra padding on Android
        }),
    },
    setInput: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center', // Center text vertically
        color: '#FFFFFF',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
        backgroundColor: 'transparent', // Remove solid background
        borderBottomWidth: 1,
        borderBottomColor: '#3A3A3C', // Light grey underline
        paddingVertical: 8, // Reduced to align text closer to underline
        paddingBottom: 4, // Extra bottom padding to push text down
        marginHorizontal: 4,
        minHeight: 44,
        lineHeight: 20, // Match setText line height
        ...Platform.select({
            android: { includeFontPadding: false }, // Remove extra padding on Android
        }),
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
        paddingHorizontal: 10,
        paddingBottom: 16,
        paddingTop: 12,
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
    WorkoutFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 20,
        marginHorizontal: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    fabContainer: {
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
        padding: 10,
        borderRadius: 20,

        alignItems: 'center',
        justifyContent: 'center',
    },
    completeWorkoutButton: {
        backgroundColor: '#8B5CF6', // Muted purple
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    completeWorkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
    },
    modalCloseButton: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
    },
    modalContentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    infoSection: {
        marginBottom: 24,
    },
    infoSectionTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    infoSectionText: {
        color: '#8E8E93',
        fontSize: 15,
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
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    infoBadgeLabel: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    infoBadgeValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
});


