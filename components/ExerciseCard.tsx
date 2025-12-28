import { getRestTimerState } from '@/api/Workout';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

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
        <TouchableOpacity 
            onPress={onPress} 
            activeOpacity={0.7} 
            style={style}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            delayPressIn={0}
        >
            <Animated.View style={[animatedStyle, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name={iconName} size={iconSize} color={color} />
            </Animated.View>
        </TouchableOpacity>
    );
};

// SetRow Component
const SetRow = ({ set, index, onDelete, isLocked, isViewOnly, swipeRef, onOpen, onClose }: any) => {
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
        const w = Number(weight);
        if (isNaN(w)) return '-';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
    };

    return (
        <ReanimatedSwipeable
            ref={swipeRef}
            onSwipeableWillOpen={onOpen}
            onSwipeableWillClose={onClose}
            renderRightActions={isViewOnly || isLocked ? undefined : renderRightActions}
            containerStyle={{ marginBottom: 0 }}
            enabled={!isViewOnly && !isLocked}
            overshootRight={false}
            friction={2}
            rightThreshold={40}
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

// AddSetRow Component
const AddSetRow = ({ lastSet, nextSetNumber, index, onAdd, isLocked, isEditMode, isViewOnly, onFocus }: any) => {
    const [inputs, setInputs] = useState({ weight: '', reps: '', rir: '', restTime: '', isWarmup: false });

    const formatWeightForInput = (weight: number) => {
        if (!weight && weight !== 0) return '';
        const w = Number(weight);
        if (isNaN(w)) return '';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
    };

    useEffect(() => {
        if (lastSet) {
            setInputs(prev => ({
                ...prev,
                weight: prev.weight || (lastSet.weight != null ? formatWeightForInput(lastSet.weight) : ''),
                reps: prev.reps || (lastSet.reps != null ? lastSet.reps.toString() : '')
            }));
        }
    }, [lastSet]);

    const handleAdd = async () => {
        let restTimeSeconds = 0;
        // if its the first set of first exercise, then rest time should be 0
        if (nextSetNumber === 1 && index === 0) {
            restTimeSeconds = 0;
        } else {
            const restTime: any = await getRestTimerState();
            restTimeSeconds = restTime.elapsed_seconds;
        }
        
        onAdd({
            weight: parseFloat(inputs.weight),
            reps: parseFloat(inputs.reps),
            reps_in_reserve: inputs.rir ? parseFloat(inputs.rir) : 0,
            is_warmup: inputs.isWarmup,
            rest_time_before_set: restTimeSeconds
        });

        setInputs({ weight: inputs.weight, reps: inputs.reps, rir: '', restTime: '', isWarmup: false }); 
    };

    if ((isLocked && !isEditMode ) || isViewOnly) return null;

    return (
        <>
            <View style={styles.setRow}>
                <TouchableOpacity
                    onPress={() => setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                    style={{ width: 30, alignItems: 'center', paddingVertical: 10, }}
                >
                    <Text style={[styles.setText, { color: inputs.isWarmup ? '#FF9F0A' : '#8E8E93', fontWeight: inputs.isWarmup ? 'bold' : 'normal' }]}>
                        {inputs.isWarmup ? 'W' : nextSetNumber}
                    </Text>
                </TouchableOpacity>

                <TextInput
                    style={[styles.setInput]}
                    value={inputs.weight}
                    onChangeText={(t: string) => setInputs(p => ({ ...p, weight: t }))}
                    keyboardType="numeric"
                    placeholder={lastSet?.weight?.toString() || "kg"}
                    placeholderTextColor="#8E8E93"
                    onFocus={onFocus}
                />
                <TextInput
                    style={[styles.setInput]}
                    value={inputs.reps}
                    onChangeText={(t: string) => setInputs(p => ({ ...p, reps: t }))}
                    keyboardType="numeric"
                    placeholder={lastSet?.reps?.toString() || "reps"}
                    placeholderTextColor="#8E8E93"
                    onFocus={onFocus}
                />
                <TextInput
                    style={[styles.setInput]}
                    value={inputs.rir}
                    onChangeText={(t: string) => setInputs(p => ({ ...p, rir: t }))}
                    keyboardType="numeric"
                    placeholder="RIR"
                    placeholderTextColor="#8E8E93"
                    onFocus={onFocus}
                />
                <TextInput
                    style={[styles.setInput]}
                    value={inputs.restTime}
                    onChangeText={(t: string) => setInputs(p => ({ ...p, restTime: t }))}
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

// ExerciseCard Component
export const ExerciseCard = ({ workoutExercise, isLocked, isEditMode, isViewOnly, onToggleLock, onRemove, onAddSet, onDeleteSet, swipeControl, onInputFocus, onShowInfo, onShowStatistics, isActive }: any) => {
    const exercise = workoutExercise.exercise || (workoutExercise.name ? workoutExercise : null);
    if (!exercise) return null;

    const idToLock = workoutExercise.id;
    const exerciseKey = `exercise-${idToLock}`;
    const sets = workoutExercise.sets || [];
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const nextSetNumber = sets.length + 1;
    const [showMenu, setShowMenu] = useState(false);

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
            renderLeftActions={!isViewOnly && !isEditMode ? renderLeftActions : undefined}
            renderRightActions={!isViewOnly && (!isLocked || isEditMode) && onRemove ? renderRightActions : undefined}
            enabled={!isViewOnly}
            containerStyle={{ marginBottom: 12 }}
            overshootLeft={false}
            overshootRight={false}
            friction={2}
            leftThreshold={40}
            rightThreshold={40}
        >
            <View style={[styles.exerciseCard, { marginBottom: 0 }]}>
                <View style={styles.exerciseRow}>
                    <View style={styles.exerciseInfo}>
                        <View style={styles.exerciseNameRow}>
                            <Text style={styles.exerciseName}>
                                {exercise.name} {isLocked && <Ionicons name="lock-closed" size={14} color="#8E8E93" />}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => setShowMenu(true)}
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
                            <Text style={[styles.setHeaderText, {maxWidth: 30}]}>Set</Text>
                            <Text style={[styles.setHeaderText, {}]}>Weight</Text>
                            <Text style={[styles.setHeaderText, {}]}>Reps</Text>
                            <Text style={[styles.setHeaderText, {}]}>RIR</Text>
                            <Text style={[styles.setHeaderText, {}]}>Rest</Text>
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
                                    isViewOnly={isViewOnly}
                                    swipeRef={(ref: any) => swipeControl.register(setKey, ref)}
                                    onOpen={() => swipeControl.onOpen(setKey)}
                                    onClose={() => swipeControl.onClose(setKey)}
                                />
                            );
                        })}

                        <AddSetRow 
                            lastSet={lastSet}
                            nextSetNumber={nextSetNumber}
                            index={sets.length}
                            onAdd={(data: any) => onAddSet(idToLock, data)}
                            isLocked={isLocked}
                            isEditMode={isEditMode}
                            isViewOnly={isViewOnly}
                            onFocus={() => {
                                swipeControl.closeAll();
                                onInputFocus?.();
                            }}
                        />
                    </View>
                )}
            </View>
            
            {/* Exercise Menu Modal */}
            <Modal
                visible={showMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowMenu(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                    <View style={styles.menuModalOverlay}>
                        <View style={styles.menuModalContent}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    onShowInfo?.(exercise);
                                }}
                            >
                                <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
                                <Text style={styles.menuItemText}>Info</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    onShowStatistics?.(exercise.id);
                                }}
                            >
                                <Ionicons name="stats-chart-outline" size={22} color="#FFFFFF" />
                                <Text style={styles.menuItemText}>Statistics</Text>
                            </TouchableOpacity>
                            
                            {(isActive || isEditMode) && onRemove && (
                                <TouchableOpacity
                                    style={[styles.menuItem, styles.menuItemDelete]}
                                    onPress={() => {
                                        setShowMenu(false);
                                        Alert.alert(
                                            "Delete Exercise",
                                            "Are you sure you want to remove this exercise?",
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                {
                                                    text: "Delete",
                                                    style: "destructive",
                                                    onPress: () => onRemove(idToLock)
                                                }
                                            ]
                                        );
                                    }}
                                >
                                    <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                                    <Text style={[styles.menuItemText, styles.menuItemTextDelete]}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </ReanimatedSwipeable>
    );
};

const styles = StyleSheet.create({
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
        flex: 1 
    },
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
    menuModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuModalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 8,
        minWidth: 200,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    menuItemDelete: {
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
        marginTop: 4,
    },
    menuItemText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    menuItemTextDelete: {
        color: '#FF3B30',
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
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    primaryMuscleTag: {
        // Slightly brighter for primary muscle distinction
    },
    exerciseTagText: {
        color: '#A1A1A6',
        fontSize: 12,
        fontWeight: '500',
    },
    secondaryMuscleTagText: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '400',
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
        lineHeight: 20,
        ...Platform.select({
            android: { includeFontPadding: false },
        }),
    },
    setInput: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        color: '#FFFFFF',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '#3A3A3C',
        paddingVertical: 8,
        paddingBottom: 4,
        marginHorizontal: 4,
        minHeight: 44,
        lineHeight: 20,
        ...Platform.select({
            android: { includeFontPadding: false },
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
    addSetButton: {
        marginTop: 12,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#6366F1',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    addSetButtonText: {
        color: '#6366F1',
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
});

