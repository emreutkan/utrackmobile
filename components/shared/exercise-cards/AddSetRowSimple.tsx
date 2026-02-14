import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { theme } from '@/constants/theme';
import { autoFormatRestInput, parseRestTime, validateSetData } from '../ExerciseCardUtils';

interface AddSetRowSimpleProps {
    lastSet: any;
    nextSetNumber: number;
    onAdd: (data: any) => void;
    isLocked: boolean;
    onFocus?: () => void;
    showTut?: boolean;
}

export const AddSetRowSimple = ({
    lastSet,
    nextSetNumber,
    onAdd,
    isLocked,
    onFocus,
    showTut = false
}: AddSetRowSimpleProps) => {
    const [inputs, setInputs] = useState({
        weight: '',
        reps: '',
        rir: '',
        restTime: '',
        tut: '',
        isWarmup: false
    });

    const formatWeightForInput = (weight: number) => {
        if (!weight && weight !== 0) return '';
        const w = Number(weight);
        if (isNaN(w)) return '';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
    };

    React.useEffect(() => {
        if (lastSet) {
            setInputs(prev => ({
                ...prev,
                weight: prev.weight || (lastSet.weight != null ? formatWeightForInput(lastSet.weight) : ''),
                reps: prev.reps || (lastSet.reps != null ? lastSet.reps.toString() : '')
            }));
        }
    }, [lastSet]);

    const handleAdd = () => {
        const restTimeSeconds = inputs.restTime ? parseRestTime(inputs.restTime) : 0;

        const setData = {
            weight: parseFloat(inputs.weight) || 0,
            reps: inputs.reps ? parseInt(inputs.reps) : 0,
            reps_in_reserve: inputs.rir ? parseInt(inputs.rir) : 0,
            is_warmup: inputs.isWarmup,
            rest_time_before_set: restTimeSeconds,
            total_tut: inputs.tut ? parseInt(inputs.tut) : undefined
        };

        const validation = validateSetData(setData);
        if (!validation.isValid) {
            Alert.alert('Validation Error', validation.errors.join('\n'));
            return;
        }

        onAdd(setData);

        setInputs({
            weight: inputs.weight,
            reps: '',
            rir: '',
            restTime: '',
            tut: '',
            isWarmup: false
        });
    };

    if (isLocked) return null;

    return (
        <>
            <View style={[styles.setRow, styles.addSetRowContainer]}>
                <Pressable
                    onPress={() => setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                    style={{ width: 30, alignItems: 'center', paddingVertical: 10 }}
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

                <TextInput
                    style={[styles.setInput, styles.addSetInput]}
                    value={inputs.restTime}
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

                <TextInput
                    style={[styles.setInput, styles.addSetInput]}
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

                <TextInput
                    style={[styles.setInput, styles.addSetInput]}
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
                    placeholder="reps"
                    placeholderTextColor={theme.colors.text.tertiary}
                    onFocus={onFocus}
                />

                <TextInput
                    style={[styles.setInput, styles.addSetInput]}
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
                    placeholder="RIR"
                    placeholderTextColor={theme.colors.text.tertiary}
                    onFocus={onFocus}
                />

                {showTut && (
                    <TextInput
                        style={[styles.setInput, styles.addSetInput]}
                        value={inputs.tut}
                        onChangeText={(value) => {
                            const numericRegex = /^[0-9]*$/;
                            if (value === '' || numericRegex.test(value)) {
                                const num = value === '' ? 0 : parseInt(value);
                                if (num <= 600) {
                                    setInputs(p => ({ ...p, tut: value }));
                                }
                            }
                        }}
                        keyboardType="numeric"
                        placeholder="TUT"
                        placeholderTextColor={theme.colors.text.tertiary}
                        onFocus={onFocus}
                    />
                )}
            </View>

            {inputs.weight && (
                <Pressable
                    style={[styles.addSetButton, !inputs.weight && { opacity: 0.5 }]}
                    onPress={handleAdd}
                    disabled={!inputs.weight || !inputs.reps}
                >
                    <Text style={styles.addSetButtonText}>Add Set</Text>
                </Pressable>
            )}
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
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.ui.border,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        overflow: 'hidden',
        position: 'relative',
    },
    addSetButtonText: {
        color: theme.colors.text.primary,
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});
