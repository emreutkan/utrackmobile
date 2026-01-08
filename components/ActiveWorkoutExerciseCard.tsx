import { updateSet } from '@/api/Exercises';
import { getRestTimerState, stopRestTimer } from '@/api/Workout';
import { theme } from '@/constants/theme';
import { useActiveWorkoutStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useRestTimer } from './RestTimerBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB_SMALL = Platform.OS === 'web' && SCREEN_WIDTH <= 750;

// Validation functions
const validateSetData = (data: any): { isValid: boolean, errors: string[] } => {
    const errors: string[] = [];

    if (data.reps !== undefined && data.reps !== null) {
        const reps = typeof data.reps === 'string' ? parseInt(data.reps) : data.reps;
        if (isNaN(reps) || reps < 1 || reps > 100) {
            errors.push('Reps must be between 1 and 100');
        }
    }

    if (data.reps_in_reserve !== undefined && data.reps_in_reserve !== null) {
        const rir = typeof data.reps_in_reserve === 'string' ? parseInt(data.reps_in_reserve) : data.reps_in_reserve;
        if (isNaN(rir) || rir < 0 || rir > 100) {
            errors.push('RIR must be between 0 and 100');
        }
    }

    if (data.rest_time_before_set !== undefined && data.rest_time_before_set !== null) {
        const restTime = typeof data.rest_time_before_set === 'string' ? parseInt(data.rest_time_before_set) : data.rest_time_before_set;
        if (isNaN(restTime) || restTime < 0 || restTime > 10800) {
            errors.push('Rest time cannot exceed 3 hours');
        }
    }

    if (data.total_tut !== undefined && data.total_tut !== null) {
        const tut = typeof data.total_tut === 'string' ? parseInt(data.total_tut) : data.total_tut;
        if (isNaN(tut) || tut < 0 || tut > 600) {
            errors.push('Time under tension cannot exceed 10 minutes');
        }
    }

    return { isValid: errors.length === 0, errors };
};

const formatValidationErrors = (validationErrors: any): string => {
    if (!validationErrors || typeof validationErrors !== 'object') {
        return 'Validation failed';
    }

    const messages: string[] = [];
    Object.keys(validationErrors).forEach(field => {
        const fieldErrors = validationErrors[field];
        if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((error: string) => {
                let friendlyMessage = error;
                if (error.includes('less than or equal to 100')) {
                    friendlyMessage = field === 'reps' ? 'Reps must be between 1 and 100' : 'RIR must be between 0 and 100';
                } else if (error.includes('less than or equal to 10800')) {
                    friendlyMessage = 'Rest time cannot exceed 3 hours';
                } else if (error.includes('less than or equal to 600')) {
                    friendlyMessage = 'Time under tension cannot exceed 10 minutes';
                } else if (error.includes('greater than or equal to 0')) {
                    friendlyMessage = `${field} cannot be negative`;
                }
                messages.push(friendlyMessage);
            });
        } else {
            messages.push(fieldErrors);
        }
    });

    return messages.join('\n');
};

// Parse rest time: if contains ".", treat as minutes (X.YY), else as seconds
const parseRestTime = (input: string): number => {
    if (!input || input.trim() === '') return 0;
    
    if (input.includes('.')) {
        // Treat as minutes: X.YY -> convert to seconds
        const minutes = parseFloat(input);
        if (isNaN(minutes)) return 0;
        return Math.round(minutes * 60);
    } else {
        // Treat as seconds
        const seconds = parseInt(input);
        return isNaN(seconds) ? 0 : seconds;
    }
};

// Format rest time for display
const formatRestTimeForDisplay = (seconds: number): string => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}.${s.toString().padStart(2, '0')}` : `${m}`;
};

// Format rest time for input (shows as X.YY for minutes or just number for seconds)
const formatRestTimeForInput = (seconds: number): string => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}.${s.toString().padStart(2, '0')}` : `${m}`;
};

interface SwipeActionProps {
    progress: any;
    dragX: any;
    onPress: () => void;
    iconName: keyof typeof Ionicons.glyphMap;
    color?: string;
}

const SwipeAction = ({ progress, dragX, onPress, iconName, color = "#FFFFFF" }: SwipeActionProps) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);
        return { transform: [{ scale }] };
    });

    return (
        <TouchableOpacity 
            onPress={onPress} 
            activeOpacity={0.7} 
            style={styles.swipeAction}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Animated.View style={[animatedStyle, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name={iconName} size={20} color={color} />
            </Animated.View>
        </TouchableOpacity>
    );
};

// SetRow Component
const SetRow = ({ set, index, onDelete, isLocked, swipeRef, onOpen, onClose, onUpdate, onInputFocus, onShowStatistics, exerciseId }: any) => {
    const [showInsights, setShowInsights] = useState(false);
    const hasBadInsights = set.insights?.bad && Object.keys(set.insights.bad).length > 0;

    const getInitialValues = () => ({
        weight: set.weight?.toString() || '',
        reps: set.reps?.toString() || '',
        rir: set.reps_in_reserve?.toString() || '',
        restTime: set.rest_time_before_set ? formatRestTimeForInput(set.rest_time_before_set) : ''
    });

    const [localValues, setLocalValues] = useState(getInitialValues());
    const originalValuesRef = React.useRef(getInitialValues());
    const currentValuesRef = React.useRef(getInitialValues());
    const isUpdatingRef = React.useRef(false);

    const isEditable = !isLocked;

    const previousSetIdRef = React.useRef(set.id);

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

        const newValues = getInitialValues();
        const currentStored = originalValuesRef.current;
        
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
    }, [set.id, set.weight, set.reps, set.reps_in_reserve, set.rest_time_before_set]);

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
            onPress={() => onDelete(set.id)}
            iconName="trash-outline"
        />
    );

    const renderLeftActions = (progress: any, dragX: any) => {
        if (set.insights && (set.insights.good || set.insights.bad)) {
            return (
                <SwipeAction
                    progress={progress}
                    dragX={dragX}
                    onPress={() => setShowInsights(true)}
                    iconName="bulb-outline"
                />
            );
        }
        if (onShowStatistics && exerciseId) {
            return (
                <SwipeAction
                    progress={progress}
                    dragX={dragX}
                    onPress={() => onShowStatistics(exerciseId)}
                    iconName="stats-chart-outline"
                />
            );
        }
        return null;
    };

    const formatWeight = (weight: number) => {
        if (!weight && weight !== 0) return '-';
        const w = Number(weight);
        if (isNaN(w)) return '-';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
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
                leftThreshold={40}
                rightThreshold={40}
            >
                <View style={[styles.setRow, hasBadInsights && styles.setRowWithBadInsights]}>
                    <Text style={[styles.setText, {maxWidth: 30}, set.is_warmup && { color: '#FF9F0A', fontWeight: 'bold' }]}>
                        {set.is_warmup ? 'W' : String(index + 1)}
                    </Text>
                    {isEditable ? (
                        <TextInput
                            style={styles.setInput}
                            value={localValues.restTime}
                            onChangeText={(value) => {
                                // Allow numbers and one decimal point
                                const numericRegex = /^[0-9]*\.?[0-9]*$/;
                                if (value === '' || numericRegex.test(value)) {
                                    setLocalValues(prev => ({ ...prev, restTime: value }));
                                    currentValuesRef.current.restTime = value;
                                }
                            }}
                            onFocus={() => {
                                if (onInputFocus) onInputFocus();
                            }}
                            onBlur={() => handleBlur('restTime')}
                            keyboardType="numbers-and-punctuation"
                            placeholder="Rest"
                            placeholderTextColor="#8E8E93"
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
                                        setLocalValues(prev => ({ ...prev, weight: sanitized }));
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
                            placeholderTextColor="#8E8E93"
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
                                        setLocalValues(prev => ({ ...prev, reps: value }));
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
                            placeholderTextColor="#8E8E93"
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
                                        setLocalValues(prev => ({ ...prev, rir: value }));
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
                            placeholderTextColor="#8E8E93"
                        />
                    ) : (
                        <Text style={styles.setText}>{set.reps_in_reserve != null ? set.reps_in_reserve.toString() : '-'}</Text>
                    )}
                </View>
            </ReanimatedSwipeable>
            
            <Modal
                visible={showInsights}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInsights(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowInsights(false)}>
                    <View style={styles.insightsModalOverlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={styles.insightsModalContent}>
                                <View style={styles.insightsModalHeader}>
                                    <Text style={styles.insightsModalTitle}>Set {set.set_number} Insights</Text>
                                    <TouchableOpacity onPress={() => setShowInsights(false)}>
                                        <Ionicons name="close" size={24} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                                
                                <ScrollView style={styles.insightsModalBody}>
                                    {set.insights?.good && Object.keys(set.insights.good).length > 0 && (
                                        <View style={styles.insightsSection}>
                                            <View style={styles.insightsSectionHeader}>
                                                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                                                <Text style={styles.insightsSectionTitle}>Good</Text>
                                            </View>
                                            {Object.entries(set.insights.good).map(([key, insight]: [string, any]) => (
                                                <View key={key} style={styles.insightItem}>
                                                    <Text style={styles.insightReason}>{insight.reason}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    
                                    {set.insights?.bad && Object.keys(set.insights.bad).length > 0 && (
                                        <View style={styles.insightsSection}>
                                            <View style={styles.insightsSectionHeader}>
                                                <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                                                <Text style={styles.insightsSectionTitle}>Areas to Improve</Text>
                                            </View>
                                            {Object.entries(set.insights.bad).map(([key, insight]: [string, any]) => (
                                                <View key={key} style={styles.insightItem}>
                                                    <Text style={styles.insightReason}>{insight.reason}</Text>
                                                    {insight.current_reps && (
                                                        <Text style={styles.insightDetail}>
                                                            Current: {insight.current_reps} reps
                                                        </Text>
                                                    )}
                                                    {insight.optimal_range && (
                                                        <Text style={styles.insightDetail}>
                                                            Optimal: {insight.optimal_range}
                                                        </Text>
                                                    )}
                                                    {insight.current_tut && (
                                                        <Text style={styles.insightDetail}>
                                                            Current TUT: {insight.current_tut}s
                                                        </Text>
                                                    )}
                                                    {insight.seconds_per_rep && (
                                                        <Text style={styles.insightDetail}>
                                                            {insight.seconds_per_rep}s per rep
                                                        </Text>
                                                    )}
                                                    {insight.set_position && (
                                                        <Text style={styles.insightDetail}>
                                                            Set Position: {insight.set_position}
                                                        </Text>
                                                    )}
                                                    {insight.total_sets && (
                                                        <Text style={styles.insightDetail}>
                                                            Total Sets: {insight.total_sets}
                                                        </Text>
                                                    )}
                                                    {insight.optimal_sets && (
                                                        <Text style={styles.insightDetail}>
                                                            Optimal: {insight.optimal_sets}
                                                        </Text>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    
                                    {(!set.insights || (Object.keys(set.insights.good || {}).length === 0 && Object.keys(set.insights.bad || {}).length === 0)) && (
                                        <View style={styles.insightsSection}>
                                            <Text style={styles.noInsightsText}>No insights available for this set.</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

// AddSetRow Component with TUT tracking
const AddSetRow = ({ lastSet, nextSetNumber, index, onAdd, isLocked, workoutExerciseId, hasSets, onFocus }: any) => {
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
            setInputs(prev => ({
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
            // Capture current rest time from global timer if not manually entered
            const finalRest = inputs.restTime ? parseRestTime(inputs.restTime) : elapsedSeconds;
            setCapturedRestTime(finalRest);
            
            await stopRestTimer();
            setIsTrackingTUT(true);
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
        const finalTUT = Math.floor((Date.now() - tutStartTime) / 1000);
        setTutStartTime(null);
        setCurrentTUT(finalTUT);
        setHasStopped(true);
    };

    const handleAdd = async () => {
        const setData = {
            weight: parseFloat(inputs.weight) || (lastSet?.weight ? Number(lastSet.weight) : 0),
            reps: inputs.reps ? parseInt(inputs.reps) : 0,
            reps_in_reserve: inputs.rir ? parseInt(inputs.rir) : 0,
            is_warmup: inputs.isWarmup,
            rest_time_before_set: capturedRestTime ?? 0,
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
    };

    if (isLocked) return null;

    return (
        <>
            {/* Status Indicator */}
            <View style={styles.statusIndicatorContainer}>
                <View style={[styles.statusDot, isTracking && { backgroundColor: theme.colors.status.error }, isStopped && { backgroundColor: theme.colors.status.active }]} />
                <Text style={[styles.statusIndicatorText, isTracking && { color: theme.colors.status.error }, isStopped && { color: theme.colors.status.active }]}>
                    {isInitial ? 'PREPARING SET' : isTracking ? 'PERFORMING SET...' : 'SET FINISHED - LOG RESULTS'}
                </Text>
            </View>

            <View style={[styles.setRow, styles.addSetRowContainer, isTracking && styles.addSetRowTracking, isStopped && styles.addSetRowStopped]}>
                <TouchableOpacity
                    onPress={() => !isTracking && setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                    disabled={isTracking}
                    style={{ width: 30, alignItems: 'center', paddingVertical: 10, opacity: isTracking ? 0.4 : 1 }}
                >
                    <Text style={[styles.setText, { color: inputs.isWarmup ? '#FF9F0A' : '#8E8E93', fontWeight: inputs.isWarmup ? 'bold' : 'normal' }]}>
                        {inputs.isWarmup ? 'W' : String(nextSetNumber)}
                    </Text>
                </TouchableOpacity>

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
                    placeholderTextColor="#8E8E93"
                    onFocus={onFocus}
                    editable={isInitial}
                />

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
                    placeholderTextColor="#8E8E93"
                    onFocus={onFocus}
                    editable={!isTracking}
                />

                <TextInput
                    style={[styles.setInput, styles.addSetInput, (isInitial || isTracking) && styles.disabledInput]}
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
                    placeholderTextColor="#8E8E93"
                    onFocus={onFocus}
                    editable={isStopped}
                />

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
                    placeholderTextColor="#8E8E93"
                    onFocus={onFocus}
                    editable={isStopped}
                />
            </View>

            {(isTracking || isStopped) && (
                <View style={[styles.tutTimerContainer, isStopped && styles.tutTimerContainerStopped]}>
                    <Text style={styles.tutTimerLabel}>TIME UNDER TENSION</Text>
                    <View style={styles.tutInputContainer}>
                        {isTracking ? (
                            <Text style={styles.tutDisplayText}>{formatTUT(currentTUT)}</Text>
                        ) : (
                            <>
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
                                    placeholderTextColor="#8E8E93"
                                />
                                <Text style={styles.tutInputSuffix}>s</Text>
                            </>
                        )}
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
export const ActiveWorkoutExerciseCard = ({ workoutExercise, isLocked, onToggleLock, onRemove, onAddSet, onDeleteSet, swipeControl, onInputFocus, onShowInfo, onShowStatistics, drag }: any) => {
    const exercise = workoutExercise.exercise || (workoutExercise.name ? workoutExercise : null);
    if (!exercise) return null;

    const idToLock = workoutExercise.id;
    const exerciseKey = `exercise-${idToLock}`;
    const sets = workoutExercise.sets || [];
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const nextSetNumber = sets.length + 1;
    const [showMenu, setShowMenu] = useState(false);

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
            
            if (result && typeof result === 'object' && !result.error) {
                // Update successful
            } else if (result && typeof result === 'string') {
                Alert.alert('Update Failed', result);
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
            onPress={() => onToggleLock(idToLock)}
            iconName={isLocked ? "lock-open-outline" : "lock-closed"}
        />
    );

    const renderRightActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => onRemove(idToLock)}
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
            leftThreshold={40}
            rightThreshold={40}
        >
            <View style={styles.card}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onLongPress={drag}
                        delayLongPress={Platform.OS === 'android' ? 300 : 200}
                        activeOpacity={0.7}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.exerciseInfo}>
                            <View style={styles.exerciseNameRow}>
                                <Text style={styles.exerciseName}>
                                    {(exercise.name || '').toUpperCase()}
                                    {isLocked && (
                                        <>
                                            {' '}
                                            <Ionicons name="lock-closed" size={14} color="#8E8E93" />
                                        </>
                                    )}
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
                                    {exercise.primary_muscle && typeof exercise.primary_muscle === 'string' && (
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
                                            : typeof exercise.secondary_muscles === 'string' ? (
                                                <View style={styles.exerciseTag}>
                                                    <Text style={styles.secondaryMuscleTagText}>{exercise.secondary_muscles}</Text>
                                                </View>
                                              ) : null
                                    )}
                                </View>
                                {exercise.equipment_type && typeof exercise.equipment_type === 'string' && (
                                    <View style={styles.exerciseTag}>
                                        <Text style={styles.exerciseTagText}>{exercise.equipment_type}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {(sets.length > 0 || !isLocked) && (
                    <View style={styles.setsContainer}>
                        <View style={styles.setsHeader}>
                            <Text style={[styles.setHeaderText, {maxWidth: 30}]}>SET</Text>
                            <Text style={styles.setHeaderText}>REST</Text>
                            <Text style={styles.setHeaderText}>WEIGHT</Text>
                            <Text style={styles.setHeaderText}>REPS</Text>
                            <Text style={styles.setHeaderText}>RIR</Text>
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
                        />
                    </View>
                )}
            </View>
            
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
                                <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" style={Platform.OS === 'web' ? { marginRight: 12 } : {}} />
                                <Text style={styles.menuItemText}>Info</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    onShowStatistics?.(exercise.id);
                                }}
                            >
                                <Ionicons name="stats-chart-outline" size={22} color="#FFFFFF" style={Platform.OS === 'web' ? { marginRight: 12 } : {}} />
                                <Text style={styles.menuItemText}>Statistics</Text>
                            </TouchableOpacity>
                            
                            {onToggleLock && (
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => {
                                        setShowMenu(false);
                                        onToggleLock(idToLock);
                                    }}
                                >
                                    <Ionicons 
                                        name={isLocked ? "lock-open-outline" : "lock-closed-outline"} 
                                        size={22} 
                                        color={isLocked ? "#FF9F0A" : "#FFFFFF"}
                                        style={Platform.OS === 'web' ? { marginRight: 12 } : {}}
                                    />
                                    <Text style={styles.menuItemText}>
                                        {isLocked ? "Unlock" : "Lock"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            
                            {sets.length > 0 && onDeleteSet && (
                                <TouchableOpacity
                                    style={[styles.menuItem, styles.menuItemDelete]}
                                    onPress={() => {
                                        setShowMenu(false);
                                        Alert.alert(
                                            "Delete All Sets",
                                            `Are you sure you want to delete all ${sets.length} set${sets.length > 1 ? 's' : ''}?`,
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                {
                                                    text: "Delete All",
                                                    style: "destructive",
                                                    onPress: async () => {
                                                        for (const set of sets) {
                                                            if (set.id) {
                                                                await onDeleteSet(set.id);
                                                            }
                                                        }
                                                    }
                                                }
                                            ]
                                        );
                                    }}
                                >
                                    <Ionicons name="trash-outline" size={22} color="#FF3B30" style={Platform.OS === 'web' ? { marginRight: 12 } : {}} />
                                    <Text style={[styles.menuItemText, styles.menuItemTextDelete]}>Delete All Sets</Text>
                                </TouchableOpacity>
                            )}
                            
                            {onRemove && (
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
                                    <Ionicons name="trash-outline" size={22} color="#FF3B30" style={Platform.OS === 'web' ? { marginRight: 12 } : {}} />
                                    <Text style={[styles.menuItemText, styles.menuItemTextDelete]}>Delete Exercise</Text>
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
    exerciseInfo: { 
        flex: 1 
    },
    exerciseNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    exerciseName: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        color: theme.colors.text.primary,
        flex: 1,
    },
    exerciseMenuButton: {
        padding: 8,
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
        flex: 1,
        ...Platform.select({
            web: {},
            default: { gap: 8 },
        }),
    },
    exerciseTag: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3A3A3C',
        ...Platform.select({
            web: { marginRight: 6, marginBottom: 6 },
            default: {},
        }),
    },
    primaryMuscleTag: {
        backgroundColor: '#3A3A3C',
        borderColor: '#48484A',
    },
    exerciseTagText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    secondaryMuscleTagText: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '400',
        letterSpacing: 0.1,
    },
    setsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.ui.border,
    },
    setsHeader: {
        flexDirection: 'row',
        marginBottom: 6,
        paddingLeft: 4,
    },
    setHeaderText: {
        flex: 1,
        color: theme.colors.text.secondary,
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
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
        borderColor: '#FF453A',
        backgroundColor: 'rgba(255, 69, 58, 0.08)',
        borderStyle: 'solid',
    },
    setText: {
        flex: 1,
        color: '#FFFFFF',
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
        color: '#FFFFFF',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '#3A3A3C',
        paddingVertical: 6,
        paddingBottom: 6,
        marginHorizontal: 6,
        minHeight: 40,
        lineHeight: 18,
    },
    addSetRowContainer: {
        backgroundColor: '#1E1E20',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: '#3A3A3C',
        borderStyle: 'dashed',
    },
    addSetInput: {
        backgroundColor: '#252528',
        borderBottomWidth: 1.5,
        borderBottomColor: '#48484A',
        borderRadius: 6,
    },
    swipeAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: '100%',
        borderRadius: 0,
    },
    addSetButton: {
        marginTop: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.text.tertiary,
    },
    statusIndicatorText: {
        fontSize: 9,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    disabledInput: {
        opacity: 0.4,
    },
    addSetRowTracking: {
        borderStyle: 'solid',
        borderColor: theme.colors.status.error,
        backgroundColor: 'rgba(255, 59, 48, 0.05)',
    },
    addSetRowStopped: {
        borderStyle: 'solid',
        borderColor: theme.colors.status.active,
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
    },
    tutTimerContainer: {
        backgroundColor: '#1E1E20',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2E',
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
    menuModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuModalContent: {
        backgroundColor: '#1A1A1C',
        borderRadius: 24,
        padding: 8,
        minWidth: 220,
        borderWidth: 1,
        borderColor: '#2A2A2E',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginHorizontal: 4,
        marginVertical: 2,
    },
    menuItemDelete: {
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
        marginTop: 8,
    },
    menuItemText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '500',
        letterSpacing: -0.2,
    },
    menuItemTextDelete: {
        color: '#FF3B30',
    },
    insightsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    insightsModalContent: {
        backgroundColor: '#1A1A1C',
        borderRadius: 24,
        width: '90%',
        maxHeight: '80%',
        borderWidth: 1.5,
        borderColor: '#2A2A2E',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 32,
        elevation: 12,
    },
    insightsModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    insightsModalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    insightsModalBody: {
        padding: 20,
        maxHeight: 500,
    },
    insightsSection: {
        marginBottom: 24,
    },
    insightsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    insightsSectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    insightItem: {
        backgroundColor: '#252528',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#323236',
    },
    insightReason: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 8,
    },
    insightDetail: {
        color: '#8E8E93',
        fontSize: 13,
        marginTop: 4,
    },
    noInsightsText: {
        color: '#8E8E93',
        fontSize: 15,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

