import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { stopRestTimer } from '@/api/Workout';
import { useActiveWorkoutStore, useSettingsStore } from '@/state/userStore';
import { useRestTimer } from '@/components/shared/workout/RestTimerBar';
import { autoFormatRestInput, parseRestTime, validateSetData } from '../ExerciseCardUtils';

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
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isTrackingTUT, setIsTrackingTUT] = useState(false);
    const [tutStartTime, setTutStartTime] = useState<number | null>(null);
    const [currentTUT, setCurrentTUT] = useState(0);
    const [hasStopped, setHasStopped] = useState(false);
    const [capturedRestTime, setCapturedRestTime] = useState<number | null>(null);

    const { lastSetTimestamp, lastExerciseCategory } = useActiveWorkoutStore();
    const { tutCountdown, tutReactionOffset } = useSettingsStore();
    const { timerText, elapsedSeconds } = useRestTimer(lastSetTimestamp, lastExerciseCategory);

    const isCountingDown = countdown !== null;
    const isInitial = !isCountingDown && !isTrackingTUT && !hasStopped;
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

    // Countdown timer
    useEffect(() => {
        if (countdown === null) return;
        if (countdown <= 0) {
            setCountdown(null);
            setIsTrackingTUT(true);
            onTrackingChange?.(true);
            setTutStartTime(Date.now());
            setCurrentTUT(0);
            return;
        }
        const timeout = setTimeout(() => {
            setCountdown(countdown - 1);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [countdown]);

    // TUT tracking timer
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
            const finalRest = inputs.restTime ? parseRestTime(inputs.restTime) : elapsedSeconds;
            setCapturedRestTime(finalRest);

            await stopRestTimer();
            setHasStopped(false);

            if (tutCountdown > 0) {
                setCountdown(tutCountdown);
            } else {
                setIsTrackingTUT(true);
                onTrackingChange?.(true);
                setTutStartTime(Date.now());
                setCurrentTUT(0);
            }
        } catch (error) {
            console.error('Failed to stop rest timer:', error);
        }
    };

    const handleStopSet = async () => {
        if (!isTrackingTUT || tutStartTime === null) return;
        setIsTrackingTUT(false);
        onTrackingChange?.(false);
        const rawTUT = Math.floor((Date.now() - tutStartTime) / 1000);
        const finalTUT = Math.max(0, rawTUT - tutReactionOffset);
        setTutStartTime(null);
        setCurrentTUT(finalTUT);
        setHasStopped(true);
    };

    const handleCancelCountdown = () => {
        setCountdown(null);
        setCapturedRestTime(null);
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
        onTrackingChange?.(false);
    };

    if (isLocked) return null;

    // ── COUNTDOWN STATE ──
    if (isCountingDown) {
        return (
            <View style={styles.countdownContainer}>
                <Text style={styles.countdownLabel}>GET READY</Text>
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Pressable style={styles.cancelButton} onPress={handleCancelCountdown}>
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                </Pressable>
            </View>
        );
    }

    // ── TRACKING STATE: Only show TUT timer ──
    if (isTracking) {
        return (
            <View style={styles.trackingContainer}>
                <View style={styles.trackingPulseRing} />
                <View style={styles.trackingContent}>
                    <Text style={styles.trackingLabel}>TIME UNDER TENSION</Text>
                    <Text style={styles.trackingTimer}>{formatTUT(currentTUT)}</Text>
                </View>
                <Pressable style={styles.stopButton} onPress={handleStopSet}>
                    <Ionicons name="stop" size={18} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>STOP SET</Text>
                </Pressable>
            </View>
        );
    }

    // ── STOPPED STATE: Show KG, REPS, RIR, TUT ──
    if (isStopped) {
        return (
            <View style={styles.stoppedContainer}>
                <View style={styles.stoppedHeader}>
                    <View style={styles.stoppedHeaderLeft}>
                        <Pressable
                            onPress={() => setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                            style={styles.setNumberButton}
                        >
                            <Text style={[
                                styles.setNumberText,
                                inputs.isWarmup && { color: theme.colors.status.warning }
                            ]}>
                                {inputs.isWarmup ? 'W' : `SET ${nextSetNumber}`}
                            </Text>
                        </Pressable>
                    </View>
                    <Pressable
                        style={styles.resetButton}
                        onPress={() => {
                            setCurrentTUT(0);
                            setHasStopped(false);
                            setCapturedRestTime(null);
                            onTrackingChange?.(false);
                        }}
                    >
                        <Ionicons name="refresh" size={14} color={theme.colors.text.tertiary} />
                    </Pressable>
                </View>

                <View style={styles.stoppedFieldsGrid}>
                    <View style={styles.fieldColumn}>
                        <Text style={styles.fieldLabel}>KG</Text>
                        <TextInput
                            style={styles.stoppedInput}
                            value={inputs.weight}
                            onChangeText={(t: string) => {
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
                            placeholder={lastSet?.weight?.toString() || "0"}
                            placeholderTextColor={theme.colors.text.tertiary}
                            onFocus={onFocus}
                        />
                    </View>
                    <View style={styles.fieldColumn}>
                        <Text style={styles.fieldLabel}>REPS</Text>
                        <TextInput
                            style={styles.stoppedInput}
                            value={inputs.reps}
                            onChangeText={(value) => {
                                const numericRegex = /^[0-9]*$/;
                                if (value === '' || numericRegex.test(value)) {
                                    const num = value === '' ? 0 : parseInt(value);
                                    if (num <= 100) {
                                        setInputs(p => ({ ...p, reps: value }));
                                    }
                                }
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={theme.colors.text.tertiary}
                            onFocus={onFocus}
                            autoFocus
                        />
                    </View>
                    <View style={styles.fieldColumn}>
                        <Text style={styles.fieldLabel}>RIR</Text>
                        <TextInput
                            style={styles.stoppedInput}
                            value={inputs.rir}
                            onChangeText={(value) => {
                                const numericRegex = /^[0-9]*$/;
                                if (value === '' || numericRegex.test(value)) {
                                    const num = value === '' ? 0 : parseInt(value);
                                    if (num <= 100) {
                                        setInputs(p => ({ ...p, rir: value }));
                                    }
                                }
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={theme.colors.text.tertiary}
                            onFocus={onFocus}
                        />
                    </View>
                    <View style={styles.fieldColumn}>
                        <Text style={[styles.fieldLabel, { color: theme.colors.status.active }]}>TUT</Text>
                        <TextInput
                            style={[styles.stoppedInput, styles.tutInput]}
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
                        <Text style={styles.tutSuffix}>sec</Text>
                    </View>
                </View>

                <Pressable
                    style={[styles.addButton, !inputs.reps && styles.addButtonDisabled]}
                    onPress={handleAdd}
                    disabled={!inputs.reps}
                >
                    <Ionicons name="checkmark" size={18} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>LOG SET</Text>
                </Pressable>
            </View>
        );
    }

    // ── INITIAL STATE: Rest + Weight + Start button ──
    return (
        <>
            <View style={styles.statusIndicatorContainer} />

            <View style={styles.initialContainer}>
                <View style={styles.initialRow}>
                    <Pressable
                        onPress={() => setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                        style={styles.setNumberButtonInitial}
                    >
                        <Text style={[
                            styles.setNumberTextInitial,
                            inputs.isWarmup && { color: theme.colors.status.warning, fontWeight: 'bold' as const }
                        ]}>
                            {inputs.isWarmup ? 'W' : String(nextSetNumber)}
                        </Text>
                    </Pressable>

                    <View style={styles.initialFieldWrapper}>
                        <Text style={styles.initialFieldLabel}>REST</Text>
                        <TextInput
                            style={styles.initialInput}
                            value={inputs.restTime || timerText}
                            onChangeText={(value) => {
                                const filtered = value.replace(/[^0-9:]/g, '');
                                setInputs(p => ({ ...p, restTime: filtered }));
                            }}
                            onBlur={() => {
                                if (inputs.restTime) {
                                    const formatted = autoFormatRestInput(inputs.restTime);
                                    setInputs(p => ({ ...p, restTime: formatted }));
                                }
                            }}
                            keyboardType="numeric"
                            placeholder="0:00"
                            placeholderTextColor={theme.colors.text.tertiary}
                            onFocus={onFocus}
                        />
                    </View>

                    <View style={styles.initialFieldWrapper}>
                        <Text style={styles.initialFieldLabel}>KG</Text>
                        <TextInput
                            style={styles.initialInput}
                            value={inputs.weight}
                            onChangeText={(t: string) => {
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
                        />
                    </View>
                </View>
            </View>

            <Pressable style={styles.startButton} onPress={handleStartSet}>
                <Ionicons name="play" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>START SET</Text>
            </Pressable>
        </>
    );
};

const styles = StyleSheet.create({
    statusIndicatorContainer: {
        marginTop: theme.spacing.xl,
        borderColor: theme.colors.ui.border,
    },

    // ── Initial State ──
    initialContainer: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: theme.colors.ui.border,
        borderStyle: 'dashed',
    },
    initialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    setNumberButtonInitial: {
        width: 30,
        alignItems: 'center',
        paddingVertical: 6,
    },
    setNumberTextInitial: {
        color: theme.colors.text.tertiary,
        fontSize: 15,
        fontWeight: '500',
        fontVariant: ['tabular-nums'],
    },
    initialFieldWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    initialFieldLabel: {
        color: theme.colors.text.tertiary,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    initialInput: {
        width: '100%',
        textAlign: 'center',
        textAlignVertical: 'center',
        color: theme.colors.text.primary,
        fontSize: 16,
        fontVariant: ['tabular-nums'],
        backgroundColor: theme.colors.ui.glassStrong,
        borderBottomWidth: 1.5,
        borderBottomColor: theme.colors.ui.border,
        borderRadius: 6,
        paddingVertical: 6,
        minHeight: 40,
        lineHeight: 18,
    },
    startButton: {
        marginTop: 12,
        backgroundColor: theme.colors.status.active,
        borderColor: theme.colors.status.active,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: theme.colors.status.active,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },

    // ── Countdown State ──
    countdownContainer: {
        marginTop: theme.spacing.xl,
        alignItems: 'center',
        paddingVertical: 24,
    },
    countdownLabel: {
        color: theme.colors.text.tertiary,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
    },
    countdownNumber: {
        color: theme.colors.status.warning,
        fontSize: 64,
        fontWeight: '900',
        fontStyle: 'italic',
        fontVariant: ['tabular-nums'],
        letterSpacing: -2,
    },
    cancelButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    cancelButtonText: {
        color: theme.colors.text.secondary,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },

    // ── Tracking State ──
    trackingContainer: {
        marginTop: theme.spacing.xl,
        alignItems: 'center',
        overflow: 'hidden',
    },
    trackingPulseRing: {
        position: 'absolute',
        top: 8,
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: 'rgba(255, 69, 58, 0.15)',
    },
    trackingContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    trackingLabel: {
        color: theme.colors.text.tertiary,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
    },
    trackingTimer: {
        color: theme.colors.status.error,
        fontSize: 48,
        fontWeight: '900',
        fontStyle: 'italic',
        fontVariant: ['tabular-nums'],
        letterSpacing: -2,
    },
    stopButton: {
        width: '100%',
        backgroundColor: theme.colors.status.error,
        borderColor: theme.colors.status.error,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: theme.colors.status.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },

    // ── Stopped State ──
    stoppedContainer: {
        marginTop: theme.spacing.xl,
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1.5,
        borderColor: theme.colors.status.active,
    },
    stoppedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    stoppedHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    setNumberButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    setNumberText: {
        color: theme.colors.text.secondary,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    resetButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    stoppedFieldsGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },
    fieldColumn: {
        flex: 1,
        alignItems: 'center',
    },
    fieldLabel: {
        color: theme.colors.text.tertiary,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    stoppedInput: {
        width: '100%',
        textAlign: 'center',
        textAlignVertical: 'center',
        color: theme.colors.text.primary,
        fontSize: 18,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        backgroundColor: theme.colors.ui.glassStrong,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        paddingVertical: 10,
        minHeight: 44,
    },
    tutInput: {
        borderColor: theme.colors.status.active,
        color: theme.colors.status.active,
    },
    tutSuffix: {
        color: theme.colors.text.tertiary,
        fontSize: 9,
        fontWeight: '700',
        marginTop: 3,
        letterSpacing: 0.5,
    },
    addButton: {
        backgroundColor: theme.colors.status.active,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    addButtonDisabled: {
        opacity: 0.4,
    },

    // ── Shared ──
    buttonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 1,
    },
});
