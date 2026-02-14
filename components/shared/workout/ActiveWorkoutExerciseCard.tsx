import { getExerciseSetHistory, updateSet } from '@/api/Exercises';
import { theme } from '@/constants/theme';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Pressable, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SwipeAction } from '@/components/shared/SwipeAction';
import { validateSetData, formatValidationErrors } from '@/components/shared/ExerciseCardUtils';
import { ExerciseHeader } from '@/components/shared/ExerciseHeader';
import { ExerciseMenuModal } from '@/components/shared/ExerciseMenuModal';
import { SetsHeader } from '@/components/shared/SetsHeader';
import { SetRow } from '@/components/shared/exercise-cards/SetRow';
import { AddSetRowWithTUT } from '@/components/shared/exercise-cards/AddSetRowWithTUT';
import { HistorySection } from '@/components/shared/exercise-cards/HistorySection';

interface ActiveWorkoutExerciseCardProps {
    workoutExercise: any;
    isLocked: boolean;
    onToggleLock: (id: number) => void;
    onRemove?: (id: number) => void;
    onAddSet: (workoutExerciseId: number, data: any) => void;
    onDeleteSet: (setId: number) => void;
    swipeControl: any;
    onInputFocus?: () => void;
    onShowInfo?: (exercise: any) => void;
    onShowStatistics?: (exerciseId: number) => void;
    drag?: any;
    exerciseIndex?: number;
}

export const ActiveWorkoutExerciseCard = ({
    workoutExercise,
    isLocked,
    onToggleLock,
    onRemove,
    onAddSet,
    onDeleteSet,
    swipeControl,
    onInputFocus,
    onShowInfo,
    onShowStatistics,
    drag,
    exerciseIndex
}: ActiveWorkoutExerciseCardProps) => {
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
                const data = await getExerciseSetHistory(exercise.id) as { results?: unknown[] } | unknown[] | undefined;
                if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as { results: unknown[] }).results)) {
                    setSetHistory((data as { results: unknown[] }).results.slice(0, 5));
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

            const err = result as { error?: boolean; validationErrors?: unknown; message?: string } | null;
            if (err && typeof err === 'object' && err.error) {
                if (err.validationErrors) {
                    const errorMessage = formatValidationErrors(err.validationErrors);
                    Alert.alert('Validation Error', errorMessage);
                } else if (err.message) {
                    Alert.alert('Update Failed', err.message);
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
                onRemove?.(idToLock);
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
                <Pressable
                    onLongPress={drag}
                    delayLongPress={Platform.OS === 'android' ? 300 : 200}
                    style={{ flex: 1 }}
                >
                    <ExerciseHeader
                        exercise={exercise}
                        isLocked={isLocked}
                        onMenuPress={() => setShowMenu(true)}
                        showHistory={showHistory}
                        onHistoryToggle={() => setShowHistory(!showHistory)}
                    />
                </Pressable>

                {showHistory && (
                    <HistorySection
                        setHistory={setHistory}
                        isLoadingHistory={isLoadingHistory}
                    />
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

                        <AddSetRowWithTUT
                            lastSet={lastSet}
                            nextSetNumber={nextSetNumber}
                            onAdd={(data: any) => onAddSet(idToLock, data)}
                            isLocked={isLocked}
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
    setsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.ui.border,
    },
});
