import { getExerciseSetHistory, updateSet } from '@/api/Exercises';
import { stopRestTimer } from '@/api/Workout';
import { theme } from '@/constants/theme';
import { useActiveWorkoutStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useRestTimer } from './RestTimerBar';
import { SwipeAction } from './SwipeAction';
import { formatRestTimeForDisplay, formatRestTimeForInput, formatValidationErrors, formatWeight, parseRestTime, validateSetData } from './shared/ExerciseCardUtils';
import { ExerciseHeader } from './shared/ExerciseHeader';
import { ExerciseMenuModal } from './shared/ExerciseMenuModal';
import { InsightsModal } from './shared/InsightsModal';
import { SetsHeader } from './shared/SetsHeader';


// SetRow Component
const SetRow = ({ set, index, onDelete, isLocked, swipeRef, onOpen, onClose, onUpdate, onInputFocus, onShowStatistics, exerciseId }: any) => {
    const [showInsights, setShowInsights] = useState<boolean>(false);
    const hasBadInsights = set.insights?.bad && Object.keys(set.insights.bad).length > 0;

    const getInitialValues = useCallback(() => ({
        weight: set.weight?.toString() || '',
        reps: set.reps?.toString() || '',
        rir: set.reps_in_reserve?.toString() || '',
        restTime: set.rest_time_before_set ? formatRestTimeForInput(set.rest_time_before_set) : ''
    }), [set.weight, set.reps, set.reps_in_reserve, set.rest_time_before_set]);

    const [localValues, setLocalValues] = useState<any>(getInitialValues());
    const originalValuesRef = React.useRef<any>(getInitialValues());
    const currentValuesRef = React.useRef<any>(getInitialValues());
    const isUpdatingRef = React.useRef<boolean>(false);

    const isEditable = !isLocked;

    const previousSetIdRef = React.useRef<number>(set.id);

    React.useEffect(() => {
        if (isUpdatingRef.current) return;

        if (previousSetIdRef.current !== set.id) {
            previousSetIdRef.current = set.id;
            const newValues = getInitialValues();
            setLocalValues(newValues);
            originalValuesRef.current = newValues;
            currentValuesRef.current = newValues;
            return;
        }

        const newValues = getInitialValues() as any;
        const currentStored = originalValuesRef.current as any;

        const backendChanged =
            newValues.weight !== currentStored.weight ||
            newValues.reps !== currentStored.reps ||
            newValues.rir !== currentStored.rir ||
            newValues.restTime !== currentStored.restTime;

        if (backendChanged) {
            const localMatchesOriginal =
                localValues.weight === currentStored.weight &&
                localValues.reps === currentStored.reps &&
                localValues.rir === currentStored.rir &&
                localValues.restTime === currentStored.restTime;

            if (localMatchesOriginal) {
                setLocalValues(newValues);
            }

            originalValuesRef.current = newValues;
            currentValuesRef.current = newValues;
        }
    }, [set.id, set.weight, set.reps, set.reps_in_reserve, set.rest_time_before_set, getInitialValues, localValues, originalValuesRef, currentValuesRef, isUpdatingRef]);

    const handleBlur = (field: string) => {
        const currentValue = currentValuesRef.current[field as keyof typeof currentValuesRef.current];
        const original = originalValuesRef.current[field as keyof typeof originalValuesRef.current];

        if (currentValue === original) return;

        const updateData: any = {};

        if (field === 'weight') {
            const numValue = currentValue ? parseFloat(currentValue) : null;
            const originalNum = original ? parseFloat(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue) && numValue >= 0 && numValue <= 500) {
                updateData.weight = numValue;
            }
        } else if (field === 'reps') {
            const numValue = currentValue ? parseInt(currentValue) : null;
            const originalNum = original ? parseInt(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue) && numValue >= 1 && numValue <= 100) {
                updateData.reps = numValue;
            }
        } else if (field === 'rir') {
            const numValue = currentValue ? parseInt(currentValue) : null;
            const originalNum = original ? parseInt(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                updateData.reps_in_reserve = numValue;
            }
        } else if (field === 'restTime') {
            const seconds = parseRestTime(currentValue);
            const originalSeconds = parseRestTime(original);
            if (seconds !== originalSeconds) {
                updateData.rest_time_before_set = seconds;
            }
        }

        if (Object.keys(updateData).length > 0) {
            if (onUpdate) {
                isUpdatingRef.current = true;
                originalValuesRef.current = { ...currentValuesRef.current };

                Promise.resolve(onUpdate(set.id, updateData)).then(() => {
                    setTimeout(() => {
                        isUpdatingRef.current = false;
                    }, 1000);
                }).catch((error) => {
                    console.error('Update failed:', error);
                    const revertedValues = getInitialValues();
                    originalValuesRef.current = revertedValues;
                    currentValuesRef.current = revertedValues;
                    setLocalValues(revertedValues);
                    isUpdatingRef.current = false;
                });
            }
        }
    };

    const renderRightActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => {
                swipeRef.current?.close();
                onDelete(set.id);
            }}
            iconName="trash-outline"
        />
    );

    const renderLeftActions = (progress: any, dragX: any) => {
        if (set.insights && (set.insights.good || set.insights.bad)) {
            return (
                <SwipeAction
                    progress={progress}
                    dragX={dragX}
                    onPress={() => {
                        swipeRef.current?.close();
                        setShowInsights(true);
                    }}
                    iconName="bulb-outline"
                />
            );
        }
        if (onShowStatistics && exerciseId) {
            return (
                <SwipeAction
                    progress={progress}
                    dragX={dragX}
                    onPress={() => {
                        swipeRef.current?.close();
                        onShowStatistics(exerciseId);
                    }}
                    iconName="stats-chart-outline"
                />
            );
        }
        return null;
    };


    return (
        <>
            <ReanimatedSwipeable
                ref={swipeRef}
                onSwipeableWillOpen={onOpen}
                onSwipeableWillClose={onClose}
                renderLeftActions={isLocked ? undefined : renderLeftActions}
                renderRightActions={isLocked ? undefined : renderRightActions}
                containerStyle={{ marginBottom: 0 }}
                enabled={!isLocked}
                overshootLeft={false}
                overshootRight={false}
                friction={2}
                enableTrackpadTwoFingerGesture
                leftThreshold={40}
                rightThreshold={40}
            >
                <View style={[styles.setRow, hasBadInsights && styles.setRowWithBadInsights]}>
                    <Text style={[styles.setText, {maxWidth: 30}, set.is_warmup && { color: theme.colors.status.warning, fontWeight: 'bold' }]}>
                        {set.is_warmup ? 'W' : String(index + 1)}
                    </Text>
                    {isEditable ? (
                        <TextInput
                            style={styles.setInput}
                            value={localValues.restTime}
                            onChangeText={(value) => {
                                const numericRegex = /^[0-9]*\.?[0-9]*$/;
                                if (value === '' || numericRegex.test(value)) {
                                    setLocalValues((prev: any) => ({ ...prev, restTime: value }));
                                    currentValuesRef.current.restTime = value;
                                }
                            }}
                            onFocus={() => {
                                if (onInputFocus) onInputFocus();
                            }}
                            onBlur={() => handleBlur('restTime')}
                            keyboardType="numbers-and-punctuation"
                            placeholder="Rest"
                            placeholderTextColor={theme.colors.text.tertiary}
                        />
                    ) : (
                        <Text style={styles.setText}>{formatRestTimeForDisplay(set.rest_time_before_set) || '-'}</Text>
                    )}
                    {isEditable ? (
                        <TextInput
                            style={styles.setInput}
                            value={localValues.weight}
                            onChangeText={(value) => {
                                let sanitized = value.replace(/[:,]/g, '.');
                                const numericRegex = /^[0-9]*\.?[0-9]*$/;
                                if (sanitized === '' || numericRegex.test(sanitized)) {
                                    const num = sanitized === '' ? 0 : parseFloat(sanitized);
                                    if (num <= 500) {
                                        setLocalValues((prev: any) => ({ ...prev, weight: sanitized }));
                                        currentValuesRef.current.weight = sanitized;
                                    }
                                }
                            }}
                            onFocus={() => {
                                if (onInputFocus) onInputFocus();
                            }}
                            onBlur={() => handleBlur('weight')}
                            keyboardType="numeric"
                            placeholder="kg"
                            placeholderTextColor={theme.colors.text.tertiary}
                        />
                    ) : (
                        <Text style={styles.setText}>{formatWeight(set.weight)}</Text>
                    )}
                    {isEditable ? (
                        <TextInput
                            style={styles.setInput}
                            value={localValues.reps}
                            onChangeText={(value) => {
                                const numericRegex = /^[0-9]*$/;
                                if (value === '' || numericRegex.test(value)) {
                                    const num = value === '' ? 0 : parseInt(value);
                                    if (num <= 100) {
                                        setLocalValues((prev: any) => ({ ...prev, reps: value }));
                                        currentValuesRef.current.reps = value;
                                    }
                                }
                            }}
                            onFocus={() => {
                                if (onInputFocus) onInputFocus();
                            }}
                            onBlur={() => handleBlur('reps')}
                            keyboardType="numeric"
                            placeholder="reps"
                            placeholderTextColor={theme.colors.text.tertiary}
                        />
                    ) : (
                        <Text style={styles.setText}>{String(set.reps)}</Text>
                    )}
                    {isEditable ? (
                        <TextInput
                            style={styles.setInput}
                            value={localValues.rir}
                            onChangeText={(value) => {
                                const numericRegex = /^[0-9]*$/;
                                if (value === '' || numericRegex.test(value)) {
                                    const num = value === '' ? 0 : parseInt(value);
                                    if (num <= 100) {
                                        setLocalValues((prev: any) => ({ ...prev, rir: value }));
                                        currentValuesRef.current.rir = value;
                                    }
                                }
                            }}
                            onFocus={() => {
                                if (onInputFocus) onInputFocus();
                            }}
                            onBlur={() => handleBlur('rir')}
                            keyboardType="numeric"
                            placeholder="RIR"
                            placeholderTextColor={theme.colors.text.tertiary}
                        />
                    ) : (
                        <Text style={styles.setText}>{set.reps_in_reserve != null ? set.reps_in_reserve.toString() : '-'}</Text>
                    )}
                </View>
            </ReanimatedSwipeable>

            <InsightsModal
                visible={showInsights}
                onClose={() => setShowInsights(false)}
                set={set}
            />
        </>
    );
};

// AddSetRow Component with TUT tracking
const AddSetRow = ({ lastSet, nextSetNumber, index, onAdd, isLocked, workoutExerciseId, hasSets, onFocus, exerciseIndex, onTrackingChange }: any) => {
    const [inputs, setInputs] = useState({ weight: '', reps: '', rir: '', restTime: '', isWarmup: false });
    const [isTrackingTUT, setIsTrackingTUT] = useState(false);
    const [tutStartTime, setTutStartTime] = useState<number | null>(null);
    const [currentTUT, setCurrentTUT] = useState(0);
    const [hasStopped, setHasStopped] = useState(false);
    const [capturedRestTime, setCapturedRestTime] = useState<number | null>(null);

    const { lastSetTimestamp, lastExerciseCategory } = useActiveWorkoutStore();
    const { timerText, elapsedSeconds } = useRestTimer(lastSetTimestamp, lastExerciseCategory);

    const isInitial = !isTrackingTUT && !hasStopped;
    const isTracking = isTrackingTUT;
    const isStopped = hasStopped && !isTrackingTUT;

    const formatWeightForInput = (weight: number) => {
        if (!weight && weight !== 0) return '';
        const w = Number(weight);
        if (isNaN(w)) return '';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
    };

    useEffect(() => {
        if (lastSet) {
            setInputs((prev: any) => ({
                ...prev,
                weight: prev.weight || (lastSet.weight != null ? formatWeightForInput(lastSet.weight) : ''),
                reps: prev.reps || (lastSet.reps != null ? lastSet.reps.toString() : '')
            }));
        }
    }, [lastSet]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isTrackingTUT && tutStartTime !== null) {
            interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - tutStartTime) / 1000);
                setCurrentTUT(elapsed);
            }, 100);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTrackingTUT, tutStartTime]);

    const formatTUT = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        return `${secs}s`;
    };

    const handleStartSet = async () => {
        try {
            // For first exercise's first set, rest time should be 0
            const isFirstExerciseFirstSet = exerciseIndex === 0 && nextSetNumber === 1;
            const finalRest = isFirstExerciseFirstSet ? 0 : (inputs.restTime ? parseRestTime(inputs.restTime) : elapsedSeconds);
            setCapturedRestTime(finalRest);

            await stopRestTimer();
            setIsTrackingTUT(true);
            onTrackingChange?.(true);
            setTutStartTime(Date.now());
            setCurrentTUT(0);
            setHasStopped(false);
        } catch (error) {
            console.error('Failed to stop rest timer:', error);
        }
    };

    const handleStopSet = async () => {
        if (!isTrackingTUT || tutStartTime === null) return;
        setIsTrackingTUT(false);
        onTrackingChange?.(false);
        const finalTUT = Math.floor((Date.now() - tutStartTime) / 1000);
        setTutStartTime(null);
        setCurrentTUT(finalTUT);
        setHasStopped(true);
    };

    const handleAdd = async () => {
        // For first exercise's first set, rest time should be 0
        const isFirstExerciseFirstSet = exerciseIndex === 0 && nextSetNumber === 1;
        const setData = {
            weight: parseFloat(inputs.weight) || (lastSet?.weight ? Number(lastSet.weight) : 0),
            reps: inputs.reps ? parseInt(inputs.reps) : 0,
            reps_in_reserve: inputs.rir ? parseInt(inputs.rir) : 0,
            is_warmup: inputs.isWarmup,
            rest_time_before_set: isFirstExerciseFirstSet ? 0 : (capturedRestTime ?? 0),
            total_tut: currentTUT > 0 ? currentTUT : undefined
        };

        const validation = validateSetData(setData);
        if (!validation.isValid) {
            Alert.alert('Validation Error', validation.errors.join('\n'));
            return;
        }

        onAdd(setData);

        setInputs({ weight: inputs.weight, reps: '', rir: '', restTime: '', isWarmup: false });
        setCurrentTUT(0);
        setHasStopped(false);
        setCapturedRestTime(null);
        onTrackingChange?.(false);
    };

    if (isLocked) return null;

    return (
        <>
            <View style={styles.statusIndicatorContainer}>

            </View>

            <View style={[styles.setRow, styles.addSetRowContainer, isTracking && styles.addSetRowTracking, isStopped && styles.addSetRowStopped]}>
                <TouchableOpacity
                    onPress={() => !isTracking && setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                    disabled={isTracking}
                    style={{ width: 30, alignItems: 'center', paddingVertical: 10, opacity: isTracking ? 0.4 : 1 }}
                >
                    <Text style={[styles.setText, { color: inputs.isWarmup ? theme.colors.status.warning : theme.colors.text.tertiary, fontWeight: inputs.isWarmup ? 'bold' : 'normal' }]}>
                        {inputs.isWarmup ? 'W' : String(nextSetNumber)}
                    </Text>
                </TouchableOpacity>

                {!(exerciseIndex === 0 && nextSetNumber === 1) && (
                <TextInput
                    style={[styles.setInput, styles.addSetInput, (isTracking || isStopped) && styles.disabledInput]}
                    value={isInitial ? (inputs.restTime || timerText) : formatRestTimeForDisplay(capturedRestTime ?? 0)}
                    onChangeText={(value) => {
                        if (isTracking || isStopped) return;
                        const numericRegex = /^[0-9]*\.?[0-9]*$/;
                        if (value === '' || numericRegex.test(value)) {
                            setInputs(p => ({ ...p, restTime: value }));
                        }
                    }}
                    keyboardType="numbers-and-punctuation"
                    placeholder="Rest"
                    placeholderTextColor={theme.colors.text.tertiary}
                    onFocus={onFocus}
                    editable={isInitial}
                />
                )}
                {exerciseIndex === 0 && nextSetNumber === 1 && (
                    <View style={[styles.setInput, styles.addSetInput]} />
                )}

                <TextInput
                    style={[styles.setInput, styles.addSetInput, isTracking && styles.disabledInput]}
                    value={inputs.weight}
                    onChangeText={(t: string) => {
                        if (isTracking) return;
                        let sanitized = t.replace(/[:,]/g, '.');
                        const numericRegex = /^[0-9]*\.?[0-9]*$/;
                        if (sanitized === '' || numericRegex.test(sanitized)) {
                            const num = sanitized === '' ? 0 : parseFloat(sanitized);
                            if (num <= 500) {
                                setInputs(p => ({ ...p, weight: sanitized }));
                            }
                        }
                    }}
                    keyboardType="numeric"
                    placeholder={lastSet?.weight?.toString() || "kg"}
                    placeholderTextColor={theme.colors.text.tertiary}
                    onFocus={onFocus}
                    editable={!isTracking}
                />

                <TextInput
                    style={[styles.setInput, styles.addSetInput, (isInitial ) && styles.disabledInput, isTracking && styles.trackingInput]}
                    value={inputs.reps}
                    onChangeText={(value) => {
                        if (isInitial || isTracking) return;
                        const numericRegex = /^[0-9]*$/;
                        if (value === '' || numericRegex.test(value)) {
                            const num = value === '' ? 0 : parseInt(value);
                            if (num <= 100) {
                                setInputs(p => ({ ...p, reps: value }));
                            }
                        }
                    }}
                    keyboardType="numeric"
                    placeholder="reps"
                    placeholderTextColor={theme.colors.text.tertiary}
                    onFocus={onFocus}
                    editable={isStopped}
                />

                {isTracking ? (
                    <View style={[styles.setInput, styles.addSetInput, styles.tutRowInput]}>
                        <Text style={styles.tutRowText}>{formatTUT(currentTUT)}</Text>
                    </View>
                ) : (
                    <TextInput
                        style={[styles.setInput, styles.addSetInput, (isInitial || isTracking) && styles.disabledInput]}
                        value={inputs.rir}
                        onChangeText={(value) => {
                            if (isInitial || isTracking) return;
                            const numericRegex = /^[0-9]*$/;
                            if (value === '' || numericRegex.test(value)) {
                                const num = value === '' ? 0 : parseInt(value);
                                if (num <= 100) {
                                    setInputs(p => ({ ...p, rir: value }));
                                }
                            }
                        }}
                        keyboardType="numeric"
                        placeholder="RIR"
                        placeholderTextColor={theme.colors.text.tertiary}
                        onFocus={onFocus}
                        editable={isStopped}
                    />
                )}
            </View>

            {isStopped && (
                <View style={[styles.tutTimerContainer, styles.tutTimerContainerStopped]}>
                    <Text style={styles.tutTimerLabel}>TIME UNDER TENSION</Text>
                    <View style={styles.tutInputContainer}>
                        <TextInput
                            style={styles.tutInput}
                            value={currentTUT.toString()}
                            onChangeText={(text) => {
                                const num = parseInt(text) || 0;
                                if (num >= 0 && num <= 600) {
                                    setCurrentTUT(num);
                                }
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={theme.colors.text.tertiary}
                        />
                        <Text style={styles.tutInputSuffix}>s</Text>
                    </View>
                </View>
            )}

            <TouchableOpacity
                style={[
                    styles.addSetButton,
                    isInitial && styles.startSetButton,
                    isTracking && styles.stopSetButton,
                    isStopped && styles.addSetButtonPrimary
                ]}
                onPress={() => {
                    if (isTracking) {
                        handleStopSet();
                    } else if (isInitial) {
                        handleStartSet();
                    } else if (isStopped) {
                        handleAdd();
                    }
                }}
                disabled={(isStopped && !inputs.reps)}
                activeOpacity={0.8}
            >
                {isInitial && <Ionicons name="play" size={18} color="white" style={{ marginRight: 8 }} />}
                {isTracking && <Ionicons name="stop" size={18} color="white" style={{ marginRight: 8 }} />}
                {isStopped && <Ionicons name="add" size={18} color="white" style={{ marginRight: 8 }} />}
                <Text style={[
                    styles.addSetButtonText,
                    isTracking && styles.stopSetButtonText,
                    isInitial && styles.startSetButtonText
                ]}>
                    {(() => {
                        if (isTracking) return 'STOP PERFORMING SET';
                        if (isInitial) return 'START SET';
                        if (isStopped) return 'ADD SET';
                        return 'ADD SET';
                    })()}
                </Text>
            </TouchableOpacity>
        </>
    );
};

// Main Component
export const ActiveWorkoutExerciseCard = ({ workoutExercise, isLocked, onToggleLock, onRemove, onAddSet, onDeleteSet, swipeControl, onInputFocus, onShowInfo, onShowStatistics, drag, exerciseIndex }: any) => {
    const exercise = workoutExercise.exercise || (workoutExercise.name ? workoutExercise : null);

    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [setHistory, setSetHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
    const [isTrackingTUT, setIsTrackingTUT] = useState<boolean>(false);

    useEffect(() => {
        if (!showHistory || !exercise) return;
        const loadHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const data = await getExerciseSetHistory(exercise.id);
                if (data?.results) {
                    setSetHistory(data.results.slice(0, 5));
                } else if (Array.isArray(data)) {
                    setSetHistory(data.slice(0, 5));
                }
            } catch (error) {
                console.error('Failed to load set history:', error);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        loadHistory();
    }, [showHistory, exercise]);

    if (!exercise) return null;

    const idToLock = workoutExercise.id;
    const exerciseKey = `exercise-${idToLock}`;
    const sets = workoutExercise.sets || [];
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const nextSetNumber = sets.length + 1;

    const handleUpdateSet = async (setId: number, data: any) => {
        const validation = validateSetData(data);
        if (!validation.isValid) {
            Alert.alert('Validation Error', validation.errors.join('\n'));
            return;
        }

        try {
            const result = await updateSet(setId, data);

            if (result && typeof result === 'object' && result.error) {
                if (result.validationErrors) {
                    const errorMessage = formatValidationErrors(result.validationErrors);
                    Alert.alert('Validation Error', errorMessage);
                } else if (result.message) {
                    Alert.alert('Update Failed', result.message);
                } else {
                    Alert.alert('Update Failed', 'An error occurred while updating the set');
                }
                return;
            }
        } catch (error) {
            console.error('Failed to update set - exception:', error);
            Alert.alert('Update Error', 'Failed to update set. Please try again.');
        }
    };

    const renderLeftActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => {
                swipeControl.closeAll();
                onToggleLock(idToLock);
            }}
            iconName={isLocked ? "lock-open-outline" : "lock-closed"}
        />
    );

    const renderRightActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => {
                swipeControl.closeAll();
                onRemove(idToLock);
            }}
            iconName="trash-outline"
        />
    );

    return (
        <ReanimatedSwipeable
            ref={((ref: any) => swipeControl.register(exerciseKey, ref)) as any}
            onSwipeableWillOpen={() => swipeControl.onOpen(exerciseKey)}
            onSwipeableWillClose={() => swipeControl.onClose(exerciseKey)}
            renderLeftActions={renderLeftActions}
            renderRightActions={onRemove ? renderRightActions : undefined}
            enabled={true}
            containerStyle={{ marginBottom: 12 }}
            overshootLeft={false}
            overshootRight={false}
            friction={2}
            enableTrackpadTwoFingerGesture
            leftThreshold={40}
            rightThreshold={40}
        >
            <View style={styles.card}>
                <TouchableOpacity
                    onLongPress={drag}
                    delayLongPress={Platform.OS === 'android' ? 300 : 200}
                    activeOpacity={0.7}
                    style={{ flex: 1 }}
                >
                    <ExerciseHeader
                        exercise={exercise}
                        isLocked={isLocked}
                        onMenuPress={() => setShowMenu(true)}
                        showHistory={showHistory}
                        onHistoryToggle={() => setShowHistory(!showHistory)}
                    />
                </TouchableOpacity>

                {showHistory && (
                    <View style={styles.quickHistoryContainer}>
                        <Text style={styles.quickHistoryTitle}>RECENT PERFORMANCE</Text>
                        {isLoadingHistory ? (
                            <ActivityIndicator size="small" color={theme.colors.text.brand} style={{ marginVertical: 10 }} />
                        ) : setHistory.length > 0 ? (
                            <View style={styles.quickHistoryList}>
                                {setHistory.map((set, i) => (
                                    <View key={i} style={styles.quickHistoryItem}>
                                        <Text style={styles.quickHistoryDate}>
                                            {new Date(set.workout_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </Text>
                                        <Text style={styles.quickHistoryValue}>{set.weight}kg × {set.reps}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyHistoryText}>No past sets found</Text>
                        )}
                    </View>
                )}

                {(sets.length > 0 || !isLocked) && (
                    <View style={styles.setsContainer}>
                        <SetsHeader columns={['SET', 'REST', 'WEIGHT', 'REPS', 'RIR']} showTut={isTrackingTUT} />

                        {sets.map((set: any, index: number) => {
                            const setKey = `set-${set.id || index}`;
                            return (
                                <SetRow
                                    key={set.id || index}
                                    set={set}
                                    index={index}
                                    onDelete={onDeleteSet}
                                    isLocked={isLocked}
                                    onUpdate={handleUpdateSet}
                                    swipeRef={(ref: any) => swipeControl.register(setKey, ref)}
                                    onOpen={() => swipeControl.onOpen(setKey)}
                                    onClose={() => swipeControl.onClose(setKey)}
                                    onInputFocus={() => {
                                        swipeControl.closeAll();
                                        onInputFocus?.();
                                    }}
                                    onShowStatistics={onShowStatistics}
                                    exerciseId={exercise.id}
                                />
                            );
                        })}

                        <AddSetRow
                            lastSet={lastSet}
                            nextSetNumber={nextSetNumber}
                            index={sets.length}
                            onAdd={(data: any) => onAddSet(idToLock, data)}
                            isLocked={isLocked}
                            workoutExerciseId={idToLock}
                            hasSets={sets.length > 0}
                            onFocus={() => {
                                swipeControl.closeAll();
                                onInputFocus?.();
                            }}
                            exerciseIndex={exerciseIndex ?? 0}
                            onTrackingChange={setIsTrackingTUT}
                        />
                    </View>
                )}
            </View>

            <ExerciseMenuModal
                visible={showMenu}
                onClose={() => setShowMenu(false)}
                exercise={exercise}
                isLocked={isLocked}
                setsCount={sets.length}
                onShowInfo={onShowInfo}
                onShowStatistics={onShowStatistics}
                onToggleLock={onToggleLock}
                onDeleteAllSets={async () => {
                    for (const set of sets) {
                        if (set.id) {
                            await onDeleteSet(set.id);
                        }
                    }
                }}
                onRemove={onRemove}
                exerciseId={idToLock}
            />
        </ReanimatedSwipeable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    setsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.ui.border,
    },
    setRow: {
        flexDirection: 'row',
        paddingBottom: 8,
        paddingTop: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    setRowWithBadInsights: {
        borderWidth: 2,
        borderColor: theme.colors.status.error,
        backgroundColor: 'rgba(255, 69, 58, 0.08)',
        borderStyle: 'solid',
    },
    setText: {
        flex: 1,
        color: theme.colors.text.primary,
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
        lineHeight: 20,
    },
    setInput: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        color: theme.colors.text.primary,
        fontSize: 16,
        fontVariant: ['tabular-nums'],
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border,
        paddingVertical: 6,
        paddingBottom: 6,
        marginHorizontal: 6,
        minHeight: 40,
        lineHeight: 18,
    },
    addSetRowContainer: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: 10,
        paddingHorizontal: 10,
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: theme.colors.ui.border,
        borderStyle: 'dashed',
    },
    addSetInput: {
        backgroundColor: theme.colors.ui.glassStrong,
        borderBottomWidth: 1.5,
        borderBottomColor: theme.colors.ui.border,
        borderRadius: 6,
    },
    addSetButton: {
        marginTop: 12,
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    addSetButtonPrimary: {
        backgroundColor: theme.colors.status.active,
        borderColor: theme.colors.status.active,
    },
    startSetButton: {
        backgroundColor: theme.colors.status.active,
        borderColor: theme.colors.status.active,
        shadowColor: theme.colors.status.active,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    stopSetButton: {
        backgroundColor: theme.colors.status.error,
        borderColor: theme.colors.status.error,
        shadowColor: theme.colors.status.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addSetButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    stopSetButtonText: {
        color: '#FFFFFF',
    },
    startSetButtonText: {
        color: '#FFFFFF',
    },
    statusIndicatorContainer: {

        marginTop: theme.spacing.xl,
        borderColor: theme.colors.ui.border,
    },

    disabledInput: {
        display: 'none',
    },
    trackingInput: {
        opacity: 0.4,

        display: 'flex',
    },
    addSetRowTracking: {
        borderStyle: 'solid',
    },
    addSetRowStopped: {
        borderStyle: 'solid',
        borderColor: theme.colors.status.active,
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
    },
    tutTimerContainer: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    tutTimerContainerStopped: {
        borderColor: theme.colors.status.active,
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
    },
    tutTimerLabel: {
        color: theme.colors.text.tertiary,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 6,
    },
    tutInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tutInput: {
        color: theme.colors.status.active,
        fontSize: 22,
        fontWeight: '900',
        fontStyle: 'italic',
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        minWidth: 60,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.status.active,
    },
    tutDisplayText: {
        color: theme.colors.status.active,
        fontSize: 24,
        fontWeight: '900',
        fontStyle: 'italic',
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
    },
    tutInputSuffix: {
        color: theme.colors.text.tertiary,
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 4,
    },
    tutRowInput: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.status.error,
    },
    tutRowText: {
        color: theme.colors.status.error,
        fontSize: 16,
        fontWeight: '900',
        fontStyle: 'italic',
        fontVariant: ['tabular-nums'],
    },
    historyToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    historyToggleButtonActive: {
        borderColor: theme.colors.text.brand,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    historyToggleText: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.5,
    },
    historyToggleTextActive: {
        color: theme.colors.text.brand,
    },
    quickHistoryContainer: {
        marginTop: 10,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    quickHistoryTitle: {
        fontSize: 9,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
        marginBottom: 8,
    },
    quickHistoryList: {
        gap: 6,
    },
    quickHistoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quickHistoryDate: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    quickHistoryValue: {
        fontSize: 12,
        color: theme.colors.text.primary,
        fontWeight: '700',
    },
    emptyHistoryText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 4,
    },
});
