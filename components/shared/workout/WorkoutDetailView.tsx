import { useActiveWorkoutStore } from '@/state/userStore';
import type { OptimizationCheckResponse } from '@/api/types/workout';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RestTimerBar from './RestTimerBar';
import WorkoutDetailsView from './WorkoutDetailsView';
import WorkoutExerciseDetailsView from './WorkoutExerciseDetailsView';

// --- Main Component ---

interface WorkoutDetailViewProps {
    workout: any;
    elapsedTime: string;
    isActive: boolean;
    isEditMode?: boolean;
    isViewOnly?: boolean;
    onAddExercise?: () => void;
    onRemoveExercise?: (exerciseId: number) => void;
    onAddSet?: (exerciseId: number, data: any) => void;
    onDeleteSet?: (setId: number) => void;
    onUpdateSet?: (setId: number, updatedSet: any) => void;
    onCompleteWorkout?: () => void;
    onShowStatistics?: (exerciseId: number) => void;
    optimizationResults?: Record<number, OptimizationCheckResponse>;
}

export default function WorkoutDetailView({ workout, elapsedTime, isActive, isEditMode = false, isViewOnly = false, onAddExercise, onRemoveExercise, onAddSet, onDeleteSet, onUpdateSet, onCompleteWorkout, onShowStatistics, optimizationResults }: WorkoutDetailViewProps) {
    const insets = useSafeAreaInsets();
    const [exercises, setExercises] = useState(workout?.exercises || []);

    // Use global store for rest timer state (read-only, updated from backend)
    const {
        lastSetTimestamp,
        lastExerciseCategory
    } = useActiveWorkoutStore();

    useEffect(() => {
        if (workout?.exercises) {
            setExercises(workout.exercises);
        }
    }, [workout]);

    const handleAddSet = (exerciseId: number, data: any) => {
        // Backend handles rest timer state, just pass the data through
        onAddSet?.(exerciseId, data);
    };


    if (!workout) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    const handleInputFocus = (index: number) => {
        // This will be handled by WorkoutExerciseDetailsView
    };

    // View-only mode: use ScrollView for the entire content
    if (isViewOnly && !isActive) {
        return (
            <View style={{ flex: 1 }}>
                <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                    >
                        <WorkoutDetailsView
                            workout={workout}
                            elapsedTime={elapsedTime}
                            isActive={isActive}
                        />
                        <WorkoutExerciseDetailsView
                            workout={workout}
                            exercises={exercises}
                            setExercises={setExercises}
                            isActive={false}
                            isEditMode={false}
                            isViewOnly={true}
                            onRemoveExercise={onRemoveExercise}
                            onAddSet={handleAddSet}
                            onDeleteSet={onDeleteSet}
                            onUpdateSet={onUpdateSet}
                            onShowStatistics={onShowStatistics}
                            onInputFocus={handleInputFocus}
                            optimizationResults={optimizationResults}
                        />
                    </ScrollView>
                </View>
            </View>
        );
    }

    // Active / Edit mode: use KeyboardAvoidingView (DraggableFlatList handles its own scroll)
    return (
        <View style={{ flex: 1 }}>
            <View style={[styles.container,
                { paddingBottom: insets.bottom }]}>
                <KeyboardAvoidingView
                    style={{ flex: 1 } }
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
                >
                    {!isEditMode && (
                        <WorkoutDetailsView
                            workout={workout}
                            elapsedTime={elapsedTime}
                            isActive={isActive}
                        />
                    )}

                    {isActive && !isEditMode && (
                        <RestTimerBar lastSetTimestamp={lastSetTimestamp} category={lastExerciseCategory} />
                    )}

                    <WorkoutExerciseDetailsView
                        workout={workout}
                        exercises={exercises}
                        setExercises={setExercises}
                        isActive={isActive}
                        isEditMode={isEditMode}
                        isViewOnly={isViewOnly}
                        onRemoveExercise={onRemoveExercise}
                        onAddSet={handleAddSet}
                        onDeleteSet={onDeleteSet}
                        onUpdateSet={onUpdateSet}
                        onShowStatistics={onShowStatistics}
                        onInputFocus={handleInputFocus}
                        optimizationResults={optimizationResults}
                    />
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 0,
        flex: 1,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
});


