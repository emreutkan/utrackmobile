import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { SwipeAction } from '../SwipeAction';
import { InsightsModal } from '../InsightsModal';
import {
    autoFormatRestInput,
    formatRestTimeForDisplay,
    formatRestTimeForInput,
    formatWeight,
    parseRestTime,
    validateSetData,
    formatValidationErrors
} from '../ExerciseCardUtils';

interface SetRowProps {
    set: any;
    index: number;
    onDelete: (setId: number) => void;
    isLocked: boolean;
    swipeRef: any;
    onOpen: () => void;
    onClose: () => void;
    onUpdate: (setId: number, data: any) => Promise<void>;
    onInputFocus?: () => void;
    onShowStatistics?: (exerciseId: number) => void;
    exerciseId?: number;
    showTut?: boolean;
}

export const SetRow = ({
    set,
    index,
    onDelete,
    isLocked,
    swipeRef,
    onOpen,
    onClose,
    onUpdate,
    onInputFocus,
    onShowStatistics,
    exerciseId,
    showTut = false
}: SetRowProps) => {
    const [showInsights, setShowInsights] = useState(false);
    const hasBadInsights = set.insights?.bad && Object.keys(set.insights.bad).length > 0;

    const getInitialValues = useCallback(() => ({
        weight: set.weight?.toString() || '',
        reps: set.reps?.toString() || '',
        rir: set.reps_in_reserve?.toString() || '',
        restTime: set.rest_time_before_set ? formatRestTimeForInput(set.rest_time_before_set) : '',
        tut: set.total_tut?.toString() || ''
    }), [set.weight, set.reps, set.reps_in_reserve, set.rest_time_before_set, set.total_tut]);

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
            newValues.restTime !== currentStored.restTime ||
            newValues.tut !== currentStored.tut;

        if (backendChanged) {
            const localMatchesOriginal =
                localValues.weight === currentStored.weight &&
                localValues.reps === currentStored.reps &&
                localValues.rir === currentStored.rir &&
                localValues.restTime === currentStored.restTime &&
                localValues.tut === currentStored.tut;

            if (localMatchesOriginal) {
                setLocalValues(newValues);
            }

            originalValuesRef.current = newValues;
            currentValuesRef.current = newValues;
        }
    }, [set.id, set.weight, set.reps, set.reps_in_reserve, set.rest_time_before_set, set.total_tut, localValues, getInitialValues]);

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
        } else if (field === 'tut') {
            const numValue = currentValue ? parseInt(currentValue) : null;
            const originalNum = original ? parseInt(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue) && numValue >= 0 && numValue <= 600) {
                updateData.total_tut = numValue;
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

    const renderRightActions = (progress: any) => (
        <SwipeAction
            progress={progress}
            onPress={() => {
                swipeRef.current?.close();
                onDelete(set.id);
            }}
            iconName="trash-outline"
        />
    );

    const renderLeftActions = (progress: any) => {
        if (set.insights && (set.insights.good || set.insights.bad)) {
            return (
                <SwipeAction
                    progress={progress}
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

    const hasInsights = set.insights && (set.insights.good || set.insights.bad);
    const hasGoodInsights = set.insights?.good && Object.keys(set.insights.good).length > 0;

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
                <View style={styles.setRow}>
                    {/* Set number + insights indicator */}
                    <View style={styles.setNumberCol}>
                        <Text style={[styles.setNumber, set.is_warmup && styles.warmupNumber]}>
                            {set.is_warmup ? 'W' : String(index + 1)}
                        </Text>
                        {hasInsights && (
                            <Pressable onPress={() => setShowInsights(true)} hitSlop={6}>
                                <Ionicons
                                    name="bulb"
                                    size={12}
                                    color={hasBadInsights ? theme.colors.status.warning : theme.colors.status.success}
                                />
                            </Pressable>
                        )}
                    </View>

                    {isEditable ? (
                        <TextInput
                            style={styles.setInput}
                            value={localValues.restTime}
                            onChangeText={(value) => {
                                const filtered = value.replace(/[^0-9:]/g, '');
                                setLocalValues(prev => ({ ...prev, restTime: filtered }));
                                currentValuesRef.current.restTime = filtered;
                            }}
                            onFocus={() => {
                                if (onInputFocus) onInputFocus();
                            }}
                            onBlur={() => {
                                if (localValues.restTime) {
                                    const formatted = autoFormatRestInput(localValues.restTime);
                                    setLocalValues(prev => ({ ...prev, restTime: formatted }));
                                    currentValuesRef.current.restTime = formatted;
                                }
                                handleBlur('restTime');
                            }}
                            keyboardType="numeric"
                            placeholder="0:00"
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
                            placeholderTextColor={theme.colors.text.tertiary}
                        />
                    ) : (
                        <Text style={styles.setText}>{set.reps_in_reserve != null ? set.reps_in_reserve.toString() : '-'}</Text>
                    )}
                    {showTut && (
                        isEditable ? (
                            <TextInput
                                style={styles.setInput}
                                value={localValues.tut}
                                onChangeText={(value) => {
                                    const numericRegex = /^[0-9]*$/;
                                    if (value === '' || numericRegex.test(value)) {
                                        const num = value === '' ? 0 : parseInt(value);
                                        if (num <= 600) {
                                            setLocalValues(prev => ({ ...prev, tut: value }));
                                            currentValuesRef.current.tut = value;
                                        }
                                    }
                                }}
                                onFocus={() => {
                                    if (onInputFocus) onInputFocus();
                                }}
                                onBlur={() => handleBlur('tut')}
                                keyboardType="numeric"
                                placeholder="TUT"
                                placeholderTextColor={theme.colors.text.tertiary}
                            />
                        ) : (
                            <Text style={styles.setText}>{set.total_tut != null ? set.total_tut.toString() : '-'}</Text>
                        )
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

const styles = StyleSheet.create({
    setRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 4,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    setNumberCol: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    setNumber: {
        color: theme.colors.text.secondary,
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    warmupNumber: {
        color: theme.colors.status.warning,
        fontWeight: '800',
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
        fontSize: 15,
        fontVariant: ['tabular-nums'],
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border,
        paddingVertical: 6,
        marginHorizontal: 4,
        minHeight: 38,
    },
});
