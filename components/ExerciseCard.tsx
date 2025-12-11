import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { WorkoutExercise } from '../api/types';

interface ExerciseCardProps {
    workoutExercise: WorkoutExercise;
    index: number;
    onRemove: (id: number) => void;
    onAddSet: (id: number, data: any) => Promise<void>;
}

export default function ExerciseCard({ workoutExercise, index, onRemove, onAddSet }: ExerciseCardProps) {
    const exercise = workoutExercise.exercise || (workoutExercise as any).name ? workoutExercise : null;
    
    // Local State for Inputs
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [rir, setRir] = useState('');
    const [rest, setRest] = useState('');
    const [isLocked, setIsLocked] = useState(false);

    if (!exercise) return null;

    const exerciseData = exercise.exercise || exercise;

    const handleAddSet = async () => {
        if (!weight || !reps) return;
        
        await onAddSet(workoutExercise.id, {
            weight: parseFloat(weight),
            reps: parseInt(reps),
            reps_in_reserve: parseInt(rir) || 0,
            rest_time_before_set: parseInt(rest) || 0,
            is_warmup: false
        });

        // Clear inputs after success (optional, or keep last values for easy entry)
        // setWeight('');
        // setReps('');
        // setRir('');
        // setRest('');
    };

    const renderRightActions = (progress: any, dragX: any) => {
        return (
            <TouchableOpacity 
                style={styles.deleteAction}
                onPress={() => onRemove(exerciseData.id)}
            >
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        );
    };

    return (
        <ReanimatedSwipeable
            renderRightActions={renderRightActions}
            containerStyle={{ marginBottom: 12 }}
            enabled={!isLocked}
        >
            <View style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.info}>
                        <Text style={styles.name}>{exerciseData.name}</Text>
                        <Text style={styles.details}>
                            {exerciseData.primary_muscle} {exerciseData.equipment_type ? `• ${exerciseData.equipment_type}` : ''}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsLocked(!isLocked)}>
                        <Ionicons 
                            name={isLocked ? "lock-closed" : "lock-open-outline"} 
                            size={22} 
                            color={isLocked ? "#FF3B30" : "#8E8E93"} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Sets List */}
                {workoutExercise.sets && workoutExercise.sets.length > 0 && (
                    <View style={styles.setsContainer}>
                        {workoutExercise.sets.map((set, idx) => (
                            <View key={set.id || idx} style={styles.setRow}>
                                <Text style={styles.setText}>
                                    <Text style={styles.setNumber}>{idx + 1}</Text>
                                </Text>
                                <Text style={styles.setText}>{set.weight} kg</Text>
                                <Text style={styles.setText}>{set.reps} reps</Text>
                                <Text style={styles.setText}>{set.reps_in_reserve} RIR</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Inline Add Set Form */}
                {!isLocked && (
                    <View style={styles.formContainer}>
                        <View style={styles.inputsRow}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Rest</Text>
                                <TextInput
                                    style={styles.input}
                                    value={rest}
                                    onChangeText={setRest}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#555"
                                />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>kg</Text>
                                <TextInput
                                    style={styles.input}
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#555"
                                />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Reps</Text>
                                <TextInput
                                    style={styles.input}
                                    value={reps}
                                    onChangeText={setReps}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#555"
                                />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>RIR</Text>
                                <TextInput
                                    style={styles.input}
                                    value={rir}
                                    onChangeText={setRir}
                                    keyboardType="numeric"
                                    placeholder="-"
                                    placeholderTextColor="#555"
                                />
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.addButton}
                            onPress={handleAddSet}
                        >
                            <Ionicons name="add" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ReanimatedSwipeable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    info: {
        flex: 1,
    },
    name: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
    },
    details: {
        color: '#8E8E93',
        fontSize: 14,
    },
    setsContainer: {
        marginBottom: 16,
        gap: 8,
    },
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    setText: {
        color: '#FFFFFF',
        fontSize: 14,
        flex: 1,
        textAlign: 'center',
    },
    setNumber: {
        color: '#8E8E93',
        fontSize: 12,
    },
    formContainer: {
        marginTop: 8,
    },
    inputsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    inputWrapper: {
        flex: 1,
    },
    label: {
        color: '#8E8E93',
        fontSize: 10,
        marginBottom: 4,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#2C2C2E',
        color: '#FFFFFF',
        height: 36,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 14,
    },
    addButton: {
        backgroundColor: '#2C2C2E',
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
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
});

