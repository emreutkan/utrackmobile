import { updateSet } from '@/api/Exercises';
import { getRestTimerState, stopRestTimer } from '@/api/Workout';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB_SMALL = Platform.OS === 'web' && SCREEN_WIDTH <= 750;

// Validation functions (shared between AddSetRow and ExerciseCard)
const validateSetData = (data: any): { isValid: boolean, errors: string[] } => {
    const errors: string[] = [];

    // Validate reps (0-100, required)
    if (data.reps !== undefined && data.reps !== null) {
        const reps = typeof data.reps === 'string' ? parseInt(data.reps) : data.reps;
        if (isNaN(reps) || reps < 0 || reps > 100) {
            errors.push('Reps must be between 0 and 100');
        }
    }

    // Validate reps_in_reserve (0-100, required)
    if (data.reps_in_reserve !== undefined && data.reps_in_reserve !== null) {
        const rir = typeof data.reps_in_reserve === 'string' ? parseInt(data.reps_in_reserve) : data.reps_in_reserve;
        if (isNaN(rir) || rir < 0 || rir > 100) {
            errors.push('RIR must be between 0 and 100');
        }
    }

    // Validate rest_time_before_set (0-10800 seconds = 3 hours, required)
    if (data.rest_time_before_set !== undefined && data.rest_time_before_set !== null) {
        const restTime = typeof data.rest_time_before_set === 'string' ? parseInt(data.rest_time_before_set) : data.rest_time_before_set;
        if (isNaN(restTime) || restTime < 0 || restTime > 10800) {
            errors.push('Rest time cannot exceed 3 hours');
        }
    }

    // Validate total_tut (0-600 seconds = 10 minutes, optional)
    if (data.total_tut !== undefined && data.total_tut !== null) {
        const tut = typeof data.total_tut === 'string' ? parseInt(data.total_tut) : data.total_tut;
        if (isNaN(tut) || tut < 0 || tut > 600) {
            errors.push('Time under tension cannot exceed 10 minutes');
        }
    }

    // Validate eccentric_time (0-600 seconds, optional)
    if (data.eccentric_time !== undefined && data.eccentric_time !== null) {
        const ecc = typeof data.eccentric_time === 'string' ? parseInt(data.eccentric_time) : data.eccentric_time;
        if (isNaN(ecc) || ecc < 0 || ecc > 600) {
            errors.push('Eccentric time cannot exceed 10 minutes');
        }
    }

    // Validate concentric_time (0-600 seconds, optional)
    if (data.concentric_time !== undefined && data.concentric_time !== null) {
        const conc = typeof data.concentric_time === 'string' ? parseInt(data.concentric_time) : data.concentric_time;
        if (isNaN(conc) || conc < 0 || conc > 600) {
            errors.push('Concentric time cannot exceed 10 minutes');
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
                // Convert backend messages to user-friendly ones
                let friendlyMessage = error;
                if (error.includes('less than or equal to 100')) {
                    friendlyMessage = field === 'reps' ? 'Reps must be between 0 and 100' : 'RIR must be between 0 and 100';
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

interface SwipeActionProps {
    progress: any;
    dragX: any;
    onPress: () => void;
    drag?: () => void;
    iconSize?: number;
    style?: any;    
    iconName: keyof typeof Ionicons.glyphMap;
    color?: string;
}

const SwipeAction = ({ progress, dragX, onPress, drag, iconSize = 24, style, iconName, color = "#FFFFFF" }: SwipeActionProps) => {
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
const SetRow = ({ set, index, onDelete, isLocked, isViewOnly, isActive, isEditMode, swipeRef, onOpen, onClose, onUpdate }: any) => {
    const formatRestTimeForInput = (seconds: number) => {
        if (!seconds) return '';
        if (seconds < 60) return `${seconds}`;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return s > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${m}`;
    };

    const getInitialValues = () => ({
        weight: set.weight?.toString() || '',
        reps: set.reps?.toString() || '',
        rir: set.reps_in_reserve?.toString() || '',
        restTime: set.rest_time_before_set ? formatRestTimeForInput(set.rest_time_before_set) : ''
    });

    const [localValues, setLocalValues] = useState(getInitialValues());
    const originalValuesRef = React.useRef(getInitialValues());
    const currentValuesRef = React.useRef(getInitialValues());

    // Match AddSetRow visibility condition, but also allow editing when workout is active
    // AddSetRow is visible when: !isViewOnly && (!isLocked || isEditMode)
    // But we also want sets editable when workout is active (isActive = true)
    const isEditable = !isViewOnly && (!isLocked || isEditMode || isActive);

    React.useEffect(() => {
        const newValues = getInitialValues();
        setLocalValues(newValues);
        originalValuesRef.current = newValues;
        currentValuesRef.current = newValues;
    }, [set.weight, set.reps, set.reps_in_reserve, set.rest_time_before_set]);

    const parseRestTime = (input: string): number => {
        if (!input) return 0;
        if (input.includes(':')) {
            const [min, sec] = input.split(':').map(Number);
            return (min || 0) * 60 + (sec || 0);
        }
        return parseInt(input) || 0;
    };

    const handleBlur = (field: string) => {
        const currentValue = currentValuesRef.current[field as keyof typeof currentValuesRef.current];
        const original = originalValuesRef.current[field as keyof typeof originalValuesRef.current];
        
        // Check if value has changed
        if (currentValue === original) {
            return; // No change, don't update
        }

        const updateData: any = {};
        
        if (field === 'weight') {
            const numValue = currentValue ? parseFloat(currentValue) : null;
            const originalNum = original ? parseFloat(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue)) {
                updateData.weight = numValue;
            }
        } else if (field === 'reps') {
            const numValue = currentValue ? parseInt(currentValue) : null;
            const originalNum = original ? parseInt(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue)) {
                updateData.reps = numValue;
            }
        } else if (field === 'rir') {
            const numValue = currentValue ? parseInt(currentValue) : null;
            const originalNum = original ? parseInt(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue)) {
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
                console.log('Calling onUpdate with setId:', set.id, 'updateData:', updateData);
                onUpdate(set.id, updateData);
                // Update original values after successful update
                originalValuesRef.current = { ...currentValuesRef.current };
            } else {
                console.warn('onUpdate is not defined! Set updates will not be saved.');
            }
        } else {
            console.log('No update data to send or values unchanged');
        }
    };

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
                <Text style={[styles.setText, {maxWidth: 30}, set.is_warmup && { color: '#FF9F0A', fontWeight: 'bold' }]}>
                    {set.is_warmup ? 'W' : index + 1}
                </Text>
                {isEditable ? (
                    <TextInput
                        style={[styles.setInput]}
                        value={localValues.weight}
                        onChangeText={(value) => {
                            // Replace : and , with .
                            let sanitized = value.replace(/[:,]/g, '.');
                            
                            // Only allow numbers and one decimal point
                            const numericRegex = /^[0-9]*\.?[0-9]*$/;
                            
                            if (sanitized === '' || numericRegex.test(sanitized)) {
                                setLocalValues(prev => ({ ...prev, weight: sanitized }));
                                currentValuesRef.current.weight = sanitized;
                            } else {
                                // If invalid, clear the input
                                setLocalValues(prev => ({ ...prev, weight: '' }));
                                currentValuesRef.current.weight = '';
                            }
                        }}
                        onBlur={() => handleBlur('weight')}
                        keyboardType="numeric"
                        placeholder="kg"
                        placeholderTextColor="#8E8E93"
                    />
                ) : (
                    <Text style={[styles.setText, {}]}>{formatWeight(set.weight)}</Text>
                )}
                {isEditable ? (
                    <TextInput
                        style={[styles.setInput]}
                        value={localValues.reps}
                        onChangeText={(value) => {
                            setLocalValues(prev => ({ ...prev, reps: value }));
                            currentValuesRef.current.reps = value;
                        }}
                        onBlur={() => handleBlur('reps')}
                        keyboardType="numeric"
                        placeholder="reps"
                        placeholderTextColor="#8E8E93"
                    />
                ) : (
                    <Text style={[styles.setText, {}]}>{set.reps}</Text>
                )}
                {isEditable ? (
                    <TextInput
                        style={[styles.setInput]}
                        value={localValues.rir}
                        onChangeText={(value) => {
                            setLocalValues(prev => ({ ...prev, rir: value }));
                            currentValuesRef.current.rir = value;
                        }}
                        onBlur={() => handleBlur('rir')}
                        keyboardType="numeric"
                        placeholder="RIR"
                        placeholderTextColor="#8E8E93"
                    />
                ) : (
                    <Text style={[styles.setText, {}]}>{set.reps_in_reserve != null ? set.reps_in_reserve.toString() : '-'}</Text>
                )}
                {isEditable ? (
                    <TextInput
                        style={[styles.setInput]}
                        value={localValues.restTime}
                        onChangeText={(value) => {
                            setLocalValues(prev => ({ ...prev, restTime: value }));
                            currentValuesRef.current.restTime = value;
                        }}
                        onBlur={() => handleBlur('restTime')}
                        keyboardType="numbers-and-punctuation"
                        placeholder="Rest"
                        placeholderTextColor="#8E8E93"
                    />
                ) : (
                    <Text style={[styles.setText, {}]}>{formatRestTime(set.rest_time_before_set)}</Text>
                )}
            </View>
        </ReanimatedSwipeable>
    );
};

// AddSetRow Component
// Reps Picker Component
const RepsPicker = ({ value, onValueChange, onFocus }: { value: number | null, onValueChange: (value: number) => void, onFocus: () => void }) => {
    const [showPicker, setShowPicker] = useState(false);
    const repsOptions = Array.from({ length: 100 }, (_, i) => i + 1); // 1-100

    return (
        <>
            <TouchableOpacity
                style={[styles.setInput, styles.addSetInput, styles.pickerInput]}
                onPress={() => {
                    setShowPicker(true);
                    onFocus();
                }}
            >
                <Text style={[styles.setText, { color: value !== null && value !== undefined ? '#FFFFFF' : '#8E8E93' }]}>
                    {value !== null && value !== undefined ? value.toString() : 'reps'}
                </Text>
            </TouchableOpacity>
            <Modal
                visible={showPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPicker(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
                    <View style={styles.pickerModalOverlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={styles.pickerModalContent}>
                                <View style={styles.pickerHeader}>
                                    <Text style={styles.pickerTitle}>Select Reps</Text>
                                    <TouchableOpacity onPress={() => setShowPicker(false)}>
                                        <Ionicons name="close" size={24} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.pickerScrollView}>
                                    {repsOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.pickerOption,
                                                value === option && styles.pickerOptionSelected
                                            ]}
                                            onPress={() => {
                                                onValueChange(option);
                                                setShowPicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.pickerOptionText,
                                                value === option && styles.pickerOptionTextSelected
                                            ]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

// RIR Picker Component
const RIRPicker = ({ value, onValueChange, onFocus }: { value: number | null, onValueChange: (value: number) => void, onFocus: () => void }) => {
    const [showPicker, setShowPicker] = useState(false);
    const rirOptions = Array.from({ length: 11 }, (_, i) => i); // 0-10

    return (
        <>
            <TouchableOpacity
                style={[styles.setInput, styles.addSetInput, styles.pickerInput]}
                onPress={() => {
                    setShowPicker(true);
                    onFocus();
                }}
            >
                <Text style={[styles.setText, { color: value !== null && value !== undefined ? '#FFFFFF' : '#8E8E93' }]}>
                    {value !== null && value !== undefined ? value.toString() : 'RIR'}
                </Text>
            </TouchableOpacity>
            <Modal
                visible={showPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPicker(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
                    <View style={styles.pickerModalOverlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={styles.pickerModalContent}>
                                <View style={styles.pickerHeader}>
                                    <Text style={styles.pickerTitle}>Select RIR</Text>
                                    <TouchableOpacity onPress={() => setShowPicker(false)}>
                                        <Ionicons name="close" size={24} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.pickerScrollView}>
                                    {rirOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.pickerOption,
                                                value === option && styles.pickerOptionSelected
                                            ]}
                                            onPress={() => {
                                                onValueChange(option);
                                                setShowPicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.pickerOptionText,
                                                value === option && styles.pickerOptionTextSelected
                                            ]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

// Rest Time Picker Component
const RestTimePicker = ({ value, onValueChange, onFocus }: { value: { minutes: number, seconds: number } | null, onValueChange: (value: { minutes: number, seconds: number }) => void, onFocus: () => void }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [tempMinutes, setTempMinutes] = useState(value?.minutes || 0);
    const [tempSeconds, setTempSeconds] = useState(value?.seconds || 0);
    
    const minuteOptions = Array.from({ length: 11 }, (_, i) => i); // 0-10
    const secondOptions = Array.from({ length: 61 }, (_, i) => i); // 0-60

    const formatRestTime = (mins: number, secs: number) => {
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.setInput, styles.addSetInput, styles.pickerInput]}
                onPress={() => {
                    setTempMinutes(value?.minutes || 0);
                    setTempSeconds(value?.seconds || 0);
                    setShowPicker(true);
                    onFocus();
                }}
            >
                <Text style={[styles.setText, { color: value ? '#FFFFFF' : '#8E8E93' }]}>
                    {value ? formatRestTime(value.minutes, value.seconds) : 'Rest'}
                </Text>
            </TouchableOpacity>
            <Modal
                visible={showPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPicker(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
                    <View style={styles.pickerModalOverlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={styles.pickerModalContent}>
                                <View style={styles.pickerHeader}>
                                    <Text style={styles.pickerTitle}>Select Rest Time</Text>
                                    <TouchableOpacity onPress={() => setShowPicker(false)}>
                                        <Ionicons name="close" size={24} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.restTimePickerContainer}>
                                    <View style={styles.restTimePickerColumn}>
                                        <Text style={styles.restTimePickerLabel}>Minutes</Text>
                                        <ScrollView style={styles.pickerScrollView}>
                                            {minuteOptions.map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={[
                                                        styles.pickerOption,
                                                        tempMinutes === option && styles.pickerOptionSelected
                                                    ]}
                                                    onPress={() => setTempMinutes(option)}
                                                >
                                                    <Text style={[
                                                        styles.pickerOptionText,
                                                        tempMinutes === option && styles.pickerOptionTextSelected
                                                    ]}>
                                                        {option}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                    <View style={styles.restTimePickerSeparator}>
                                        <Text style={styles.restTimePickerSeparatorText}>:</Text>
                                    </View>
                                    <View style={styles.restTimePickerColumn}>
                                        <Text style={styles.restTimePickerLabel}>Seconds</Text>
                                        <ScrollView style={styles.pickerScrollView}>
                                            {secondOptions.map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={[
                                                        styles.pickerOption,
                                                        tempSeconds === option && styles.pickerOptionSelected
                                                    ]}
                                                    onPress={() => setTempSeconds(option)}
                                                >
                                                    <Text style={[
                                                        styles.pickerOptionText,
                                                        tempSeconds === option && styles.pickerOptionTextSelected
                                                    ]}>
                                                        {option.toString().padStart(2, '0')}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.pickerConfirmButton}
                                    onPress={() => {
                                        onValueChange({ minutes: tempMinutes, seconds: tempSeconds });
                                        setShowPicker(false);
                                    }}
                                >
                                    <Text style={styles.pickerConfirmButtonText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

const AddSetRow = ({ lastSet, nextSetNumber, index, onAdd, isLocked, isEditMode, isViewOnly, onFocus, isActive, workoutExerciseId, hasSets }: any) => {
    const [inputs, setInputs] = useState({ weight: '', reps: null as number | null, rir: null as number | null, restTime: null as { minutes: number, seconds: number } | null, isWarmup: false });
    const [isTrackingTUT, setIsTrackingTUT] = useState(false);
    const [tutStartTime, setTutStartTime] = useState<number | null>(null);
    const [currentTUT, setCurrentTUT] = useState(0);

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
                reps: prev.reps !== null ? prev.reps : (lastSet.reps != null ? lastSet.reps : null)
            }));
        }
    }, [lastSet]);

    // TUT Timer effect
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

    const restTimeToSeconds = (restTime: { minutes: number, seconds: number } | null): number => {
        if (!restTime) return 0;
        return restTime.minutes * 60 + restTime.seconds;
    };

    const handleStartSet = async () => {
        if (!isActive) {
            // If not active workout, just add set normally
            handleAdd();
            return;
        }

        try {
            // Stop rest timer
            await stopRestTimer();
            
            // Start TUT tracking
            setIsTrackingTUT(true);
            setTutStartTime(Date.now());
            setCurrentTUT(0);
        } catch (error) {
            console.error('Failed to stop rest timer:', error);
        }
    };

    const handleStopSet = async () => {
        if (!isTrackingTUT || tutStartTime === null) return;

        // Stop TUT tracking
        setIsTrackingTUT(false);
        const finalTUT = Math.floor((Date.now() - tutStartTime) / 1000);
        setTutStartTime(null);
        // Update currentTUT with the calculated value (user can still edit it)
        setCurrentTUT(finalTUT);

        // Get rest time - use user input if provided, otherwise use global rest timer
        let restTimeSeconds = 0;
        if (nextSetNumber === 1 && index === 0) {
            restTimeSeconds = 0;
        } else if (inputs.restTime) {
            // User has manually entered rest time, use that
            restTimeSeconds = restTimeToSeconds(inputs.restTime);
        } else {
            // Use global rest timer
            const restTime: any = await getRestTimerState();
            restTimeSeconds = restTime.elapsed_seconds || 0;
        }

        // Prepare set data - use currentTUT (which may have been manually edited)
        const setData = {
            weight: parseFloat(inputs.weight) || 0,
            reps: inputs.reps !== null ? inputs.reps : 0,
            reps_in_reserve: inputs.rir !== null ? inputs.rir : 0,
            is_warmup: inputs.isWarmup,
            rest_time_before_set: restTimeSeconds,
            total_tut: currentTUT > 0 ? currentTUT : undefined
        };

        // Validate before sending
        const validation = validateSetData(setData);
        if (!validation.isValid) {
            Alert.alert('Validation Error', validation.errors.join('\n'));
            // Restart TUT tracking since validation failed
            setIsTrackingTUT(true);
            setTutStartTime(Date.now());
            return;
        }

        // Add set with TUT data
        onAdd(setData);

        // Reset inputs but keep weight and reps
        setInputs({ weight: inputs.weight, reps: inputs.reps, rir: null, restTime: null, isWarmup: false });
        // Reset TUT after adding set
        setCurrentTUT(0);
    };

    const handleAdd = async () => {
        // Get rest time - use user input if provided, otherwise use global rest timer
        let restTimeSeconds = 0;
        if (nextSetNumber === 1 && index === 0) {
            restTimeSeconds = 0;
        } else if (inputs.restTime) {
            // User has manually entered rest time, use that
            restTimeSeconds = restTimeToSeconds(inputs.restTime);
        } else {
            // Use global rest timer
            const restTime: any = await getRestTimerState();
            restTimeSeconds = restTime.elapsed_seconds || 0;
        }
        
        // Prepare set data - include TUT if available (user may have manually edited it)
        const setData = {
            weight: parseFloat(inputs.weight) || 0,
            reps: inputs.reps !== null ? inputs.reps : 0,
            reps_in_reserve: inputs.rir !== null ? inputs.rir : 0,
            is_warmup: inputs.isWarmup,
            rest_time_before_set: restTimeSeconds,
            total_tut: currentTUT > 0 ? currentTUT : undefined
        };

        // Validate before sending
        const validation = validateSetData(setData);
        if (!validation.isValid) {
            Alert.alert('Validation Error', validation.errors.join('\n'));
            return;
        }
        
        onAdd(setData);

        setInputs({ weight: inputs.weight, reps: inputs.reps, rir: null, restTime: null, isWarmup: false });
        // Reset TUT after adding set
        setCurrentTUT(0);
    };

    if ((isLocked && !isEditMode ) || isViewOnly) return null;

    return (
        <>
            <View style={[styles.setRow, styles.addSetRowContainer]}>
                <TouchableOpacity
                    onPress={() => setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                    style={{ width: 30, alignItems: 'center', paddingVertical: 10, }}
                >
                    <Text style={[styles.setText, { color: inputs.isWarmup ? '#FF9F0A' : '#8E8E93', fontWeight: inputs.isWarmup ? 'bold' : 'normal' }]}>
                        {inputs.isWarmup ? 'W' : nextSetNumber}
                    </Text>
                </TouchableOpacity>

                <TextInput
                    style={[styles.setInput, styles.addSetInput]}
                    value={inputs.weight}
                    onChangeText={(t: string) => {
                        // Replace : and , with .
                        let sanitized = t.replace(/[:,]/g, '.');
                        
                        // Only allow numbers and one decimal point
                        const numericRegex = /^[0-9]*\.?[0-9]*$/;
                        
                        if (sanitized === '' || numericRegex.test(sanitized)) {
                            setInputs(p => ({ ...p, weight: sanitized }));
                        } else {
                            // If invalid, clear the input
                            setInputs(p => ({ ...p, weight: '' }));
                        }
                    }}
                    keyboardType="numeric"
                    placeholder={lastSet?.weight?.toString() || "kg"}
                    placeholderTextColor="#8E8E93"
                    onFocus={onFocus}
                />
                <RepsPicker
                    value={inputs.reps}
                    onValueChange={(value) => setInputs(p => ({ ...p, reps: value }))}
                    onFocus={onFocus}
                />
                <RIRPicker
                    value={inputs.rir}
                    onValueChange={(value) => setInputs(p => ({ ...p, rir: value }))}
                    onFocus={onFocus}
                />
                <RestTimePicker
                    value={inputs.restTime}
                    onValueChange={(value) => setInputs(p => ({ ...p, restTime: value }))}
                    onFocus={onFocus}
                />
            </View>

            {inputs.weight && inputs.reps !== null && (
                <>
                    {(isTrackingTUT || currentTUT > 0) && (
                        <View style={styles.tutTimerContainer}>
                            <Text style={styles.tutTimerLabel}>Time Under Tension:</Text>
                            <View style={styles.tutInputContainer}>
                                {isTrackingTUT ? (
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
                            (!inputs.weight || inputs.reps === null) && { opacity: 0.5 },
                            isActive && hasSets && !isTrackingTUT && styles.startSetButton,
                            isTrackingTUT && styles.stopSetButton
                        ]}
                        onPress={isTrackingTUT ? handleStopSet : (isActive && hasSets ? handleStartSet : handleAdd)}
                        disabled={!inputs.weight || inputs.reps === null}
                    >
                        <Text style={[
                            styles.addSetButtonText,
                            isTrackingTUT && styles.stopSetButtonText,
                            isActive && hasSets && !isTrackingTUT && styles.startSetButtonText
                        ]}>
                            {(() => {
                                if (isTrackingTUT) return 'Stop Performing Set';
                                if (isActive && hasSets) return 'Start Set';
                                return 'Add Set';
                            })()}
                        </Text>
                    </TouchableOpacity>
                </>
            )}
        </>
    );
};

// ExerciseCard Component
export const ExerciseCard = ({ workoutExercise, isLocked, isEditMode, isViewOnly, onToggleLock, onRemove, onAddSet, onDeleteSet, swipeControl, onInputFocus, onShowInfo, onShowStatistics, isActive, drag, onUpdateSet }: any) => {
    const exercise = workoutExercise.exercise || (workoutExercise.name ? workoutExercise : null);
    if (!exercise) return null;

    const idToLock = workoutExercise.id;
    const exerciseKey = `exercise-${idToLock}`;
    const sets = workoutExercise.sets || [];
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const nextSetNumber = sets.length + 1;
    const [showMenu, setShowMenu] = useState(false);

    const handleUpdateSet = async (setId: number, data: any) => {
        console.log('handleUpdateSet called with setId:', setId, 'data:', data);
        
        // Validate before sending (only validate fields that are being updated)
        const validation = validateSetData(data);
        if (!validation.isValid) {
            Alert.alert('Validation Error', validation.errors.join('\n'));
            return;
        }

        try {
            const result = await updateSet(setId, data);
            console.log('updateSet API response:', result, 'type:', typeof result);
            
            // Check if result has validation errors
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
            
            // Success - result is an object with set data
            if (result && typeof result === 'object' && !result.error) {
                console.log('Update successful, calling onUpdateSet callback');
                if (onUpdateSet) {
                    onUpdateSet(setId, result);
                }
            } else if (result && typeof result === 'string') {
                // Error - result is an error message string
                console.error('Update failed with error message:', result);
                Alert.alert('Update Failed', result);
            } else if (result) {
                // Unexpected format but might be valid - try to use it
                console.log('Update result in unexpected format, but attempting callback');
                if (onUpdateSet) {
                    onUpdateSet(setId, result);
                }
            } else {
                console.warn('Update returned null/undefined result');
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
                <TouchableOpacity
                    onLongPress={isViewOnly ? undefined : drag}
                    disabled={isActive || isViewOnly} 
                    delayLongPress={Platform.OS === 'android' ? 300 : 200}
                    activeOpacity={0.7}
                    
                    style={{ flex: 1 }}

                >
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
                    </TouchableOpacity>
                </View>

                {(sets.length > 0 || !isLocked) && (
                        <View 
                        style={styles.setsContainer}
                        onStartShouldSetResponder={() => true}
                        onMoveShouldSetResponder={() => false}
                        onResponderGrant={() => {
                            // Stop drag from activating when touching sets area
                        }}
>                        <View style={styles.setsHeader}>
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
                                    isActive={isActive}
                                    isEditMode={isEditMode}
                                    onUpdate={handleUpdateSet}
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
                            isActive={isActive}
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
                            
                            {!isViewOnly && onToggleLock && (
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
                            
                            {!isViewOnly && sets.length > 0 && onDeleteSet && (
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
                                                        // Delete all sets
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
    exerciseCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
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
        fontWeight: '400',
        flex: 1,
    },
    exerciseMenuButton: {
        padding: 8,
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
        borderRadius: 22,
        padding: 16,
        minWidth: 200,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    menuItemDelete: {
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
        marginTop: 8,
    },
    menuItemText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '400',
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
        flex: 1,
        ...Platform.select({
            web: {},
            default: { gap: 8 },
        }),
    },
    exerciseTag: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 6,
        ...Platform.select({
            web: { marginRight: 8, marginBottom: 8 },
            default: {},
        }),
    },
    primaryMuscleTag: {
        // Slightly brighter for primary muscle distinction
    },
    exerciseTagText: {
        color: '#A1A1A6',
        fontSize: 13,
        fontWeight: '300',
    },
    secondaryMuscleTagText: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '300',
    },
    setsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    setsHeader: {
        flex: 1,
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 8,
        ...Platform.select({
            web: {
                display: 'flex',
                width: '100%',
            },
        }),
    },
    setHeaderText: {
        flex: 1,
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '300',
        textAlign: 'center',
        ...Platform.select({
            web: {
                ...(IS_WEB_SMALL && {
                    fontSize: 10,
                    paddingHorizontal: 2,
                    maxWidth: 70,
                    flex: 0,
                    minWidth: 60,
                }),
            },
        }),
    },
    setRow: {
        flexDirection: 'row',
        paddingBottom: 8,
        paddingTop: 8,
        paddingHorizontal: 0,
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        ...Platform.select({
            web: {
                display: 'flex',
                width: '100%',
                ...(IS_WEB_SMALL && {
                    paddingBottom: 8,
                    paddingTop: 8,
                }),
            },
        }),
    },
    setText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 17,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
        lineHeight: 20,
        ...Platform.select({
            android: { includeFontPadding: false },
            web: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...(IS_WEB_SMALL && {
                    fontSize: 13,
                    lineHeight: 16,
                    paddingHorizontal: 2,
                    maxWidth: 70,
                    flexShrink: 1,
                    minWidth: 55,
                }),
            },
        }),
    },
    setInput: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        color: '#FFFFFF',
        fontSize: 17,
        fontVariant: ['tabular-nums'],
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '#3A3A3C',
        paddingVertical: 8,
        paddingBottom: 8,
        marginHorizontal: 8,
        minHeight: 48,
        lineHeight: 20,
        ...Platform.select({
            android: { includeFontPadding: false },
            web: {
                outline: 'none',
                borderTopWidth: 0,
                borderLeftWidth: 0,
                borderRightWidth: 0,
                borderTopColor: 'transparent',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                ...(IS_WEB_SMALL && {
                    fontSize: 13,
                    lineHeight: 16,
                    paddingVertical: 8,
                    paddingBottom: 8,
                    marginHorizontal: 8,
                    minHeight: 40,
                    maxWidth: 72,
                    flex: 0,
                    minWidth: 64,
                }),
            },
        }),
    },
    setRowInput: {
        backgroundColor: '#2C2C2E',
        borderBottomWidth: 2,
        borderBottomColor: '#0A84FF',
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    addSetRowContainer: {
        backgroundColor: '#1A1A1C',
        borderRadius: 8,
        paddingHorizontal: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    addSetInput: {
        backgroundColor: '#2C2C2E',
        borderBottomWidth: 1,
        borderBottomColor: '#6366F1',
        borderRadius: 4,
        ...Platform.select({
            web: {
                outline: 'none',
                borderTopWidth: 0,
                borderLeftWidth: 0,
                borderRightWidth: 0,
                borderTopColor: 'transparent',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
            },
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
        marginTop: 16,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#6366F1',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    startSetButton: {
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
    },
    stopSetButton: {
        backgroundColor: '#FF9500',
        borderColor: '#FF9500',
    },
    addSetButtonText: {
        color: '#6366F1',
        fontSize: 17,
        fontWeight: '400',
    },
    stopSetButtonText: {
        color: '#FFFFFF',
    },
    tutTimerContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    tutTimerLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '400',
        marginBottom: 8,
    },
    tutInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tutInput: {
        color: '#0A84FF',
        fontSize: 24,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        minWidth: 60,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    tutDisplayText: {
        color: '#0A84FF',
        fontSize: 24,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
    },
    tutInputSuffix: {
        color: '#8E8E93',
        fontSize: 18,
        fontWeight: '400',
        marginLeft: 4,
    },
    startSetButtonText: {
        color: '#FFFFFF',
    },
    pickerInput: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pickerModalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    pickerTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
    pickerScrollView: {
        maxHeight: 300,
    },
    pickerOption: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    pickerOptionSelected: {
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
    },
    pickerOptionText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '400',
    },
    pickerOptionTextSelected: {
        color: '#0A84FF',
        fontWeight: '500',
    },
    restTimePickerContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    restTimePickerColumn: {
        flex: 1,
    },
    restTimePickerLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '300',
        textAlign: 'center',
        marginBottom: 16,
    },
    restTimePickerSeparator: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 40,
    },
    restTimePickerSeparatorText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
    pickerConfirmButton: {
        backgroundColor: '#0A84FF',
        borderRadius: 22,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    pickerConfirmButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '400',
    },
    deleteAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 22,
        marginLeft: 8,
    },
    lockAction: {
        backgroundColor: '#0A84FF',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 22,
        marginRight: 8,
    },
});

