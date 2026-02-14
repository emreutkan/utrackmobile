import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { stopRestTimer } from '@/api/Workout';
import { useActiveWorkoutStore } from '@/state/userStore';
import { useRestTimer } from '@/components/shared/workout/RestTimerBar';
import { formatRestTimeForDisplay, parseRestTime, validateSetData } from '../ExerciseCardUtils';

interface AddSetRowWithTUTProps {
    lastSet: any;
    nextSetNumber: number;
    onAdd: (data: any) => void;
    isLocked: boolean;
    onFocus?: () => void;
    exerciseIndex?: number;
    onTrackingChange?: (isTracking: boolean) => void;
}

export const AddSetRowWithTUT = ({
    lastSet,
    nextSetNumber,
    onAdd,
    isLocked,
    onFocus,
    exerciseIndex = 0,
    onTrackingChange
}: AddSetRowWithTUTProps) => {
    const [inputs, setInputs] = useState({
        weight: '',
        reps: '',
        rir: '',
        restTime: '',
        isWarmup: false
    });
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
            <View style={styles.statusIndicatorContainer} />

            <View style={[
                styles.setRow,
                styles.addSetRowContainer,
                isTracking && styles.addSetRowTracking,
                isStopped && styles.addSetRowStopped
            ]}>
                <Pressable
                    onPress={() => !isTracking && setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                    disabled={isTracking}
                    style={{ width: 30, alignItems: 'center', paddingVertical: 10, opacity: isTracking ? 0.4 : 1 }}
                >
                    <Text style={[
                        styles.setText,
                        {
                            color: inputs.isWarmup ? theme.colors.status.warning : theme.colors.text.tertiary,
                            fontWeight: inputs.isWarmup ? 'bold' : 'normal'
                        }
                    ]}>
                        {inputs.isWarmup ? 'W' : String(nextSetNumber)}
                    </Text>
                </Pressable>

                {!(exerciseIndex === 0 && nextSetNumber === 1) && (
                    <TextInput
                        style={[
                            styles.setInput,
                            styles.addSetInput,
                            (isTracking || isStopped) && styles.disabledInput
                        ]}
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
                    style={[
                        styles.setInput,
                        styles.addSetInput,
                        isTracking && styles.disabledInput
                    ]}
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
                    style={[
                        styles.setInput,
                        styles.addSetInput,
                        isInitial && styles.disabledInput,
                        isTracking && styles.trackingInput
                    ]}
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
                        style={[
                            styles.setInput,
                            styles.addSetInput,
                            (isInitial || isTracking) && styles.disabledInput
                        ]}
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

            <Pressable
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
            </Pressable>
        </>
    );
};

const styles = StyleSheet.create({
    setRow: {
        flexDirection: 'row',
        paddingBottom: 8,
        paddingTop: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: 'transparent',
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
});
