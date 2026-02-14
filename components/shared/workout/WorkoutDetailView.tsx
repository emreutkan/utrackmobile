import { useActiveWorkoutStore } from '@/state/userStore';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
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
}

export default function WorkoutDetailView({ workout, elapsedTime, isActive, isEditMode = false, isViewOnly = false, onAddExercise, onRemoveExercise, onAddSet, onDeleteSet, onUpdateSet, onCompleteWorkout, onShowStatistics }: WorkoutDetailViewProps) {
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

    // Check if there's at least one exercise with at least one set

    return (
        <View style={{ flex: 1, backgroundColor: '#000000',  }}>
            <View style={[styles.container,
                isActive ? { paddingTop: insets.top, paddingBottom: insets.bottom } : { paddingBottom: insets.bottom }]}>
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
                    />
                </KeyboardAvoidingView>
            </View>


        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        flex: 1,
        backgroundColor: '#000000',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
    workoutHeader: {
        paddingBottom: 16,
        borderBottomColor: '#1C1C1E',
    },
    workoutHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    workoutTitleContainer: {
        width: '75%',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 8,
        paddingBottom: 16,
    },
    workoutTitle: {
        color: '#FFFFFF',
        fontSize: 34,
        fontWeight: '700',
    },
    workoutDate: {
        color: '#63666F',
        fontSize: 17,
        fontWeight: '400',
        textTransform: 'none',
    },
    workoutDuration: {
        color: 'orange',
        fontSize: 18,
        fontWeight: '500',
        fontVariant: ['tabular-nums'],
    },
    workoutStatsContainer: {
        gap: 16,
    },
    horizontalStatsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    horizontalStatItem: {
        flex: 1,
    },
    horizontalStatLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '300',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    horizontalStatValue: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '400',
    },
    compactStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    compactStatLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '300',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        minWidth: 64,
    },
    statItem: {
        marginBottom: 16,
    },
    statLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '300',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
    muscleTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        flex: 1,
    },
    muscleTag: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
    },
    muscleTagText: {
        color: '#A1A1A6',
        fontSize: 13,
        fontWeight: '300',
    },
    secondaryMuscleTag: {
        backgroundColor: '#1C1C1E',
        opacity: 0.8,
    },
    secondaryMuscleTagText: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '300',
    },
    intensityBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    intensityLow: {
        backgroundColor: 'rgba(52, 199, 89, 0.15)',
    },
    intensityMedium: {
        backgroundColor: 'rgba(255, 159, 10, 0.15)',
    },
    intensityHigh: {
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
    },
    intensityText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '300',
    },
    notesText: {
        color: '#FFFFFF',
        fontSize: 17,
        lineHeight: 24,
        marginTop: 8,
    },
    content: {
        flex: 1,

    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '300',
        marginBottom: 16,
    },
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: 40,
        paddingTop: 96,
        paddingBottom: 96,
        alignSelf: 'center',
    },
    placeholderText: {
        color: '#FFFFFF',
        fontSize: 17,
        textAlign: 'center',
        marginTop: 16,
        fontWeight: '400',
        opacity: 0.5,
        maxWidth: 200,
        lineHeight: 24,
        paddingHorizontal: 24,
        paddingVertical: 24,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        borderRadius: 22,
        backgroundColor: '#1C1C1E',
    },

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
    exerciseInfo: { flex: 1 },
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
        gap: 16,
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
        gap: 8,
        flex: 1,
    },
    exerciseTag: {
        backgroundColor: '#2C2C2E', // Dark grey background for chip
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    primaryMuscleTag: {
        // Slightly brighter for primary muscle distinction
    },
    exerciseTagText: {
        color: '#A1A1A6', // Slightly brighter for primary muscle/equipment
        fontSize: 12,
        fontWeight: '500',
    },
    lockedTag: {
        opacity: 0.85, // Less dimming for better visibility
        backgroundColor: '#2C2C2E', // Ensure background is visible
    },
    lockedTagText: {
        color: '#A1A1A6', // Lighter grey for better contrast (4.5:1 ratio)
        opacity: 1, // Override parent opacity for text
    },
    addSetButton: {
        marginTop: 12,
        backgroundColor: 'transparent', // Ghost button style
        borderWidth: 1,
        borderColor: '#6366F1', // Muted indigo border
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    addSetButtonText: {
        color: '#6366F1', // Muted indigo text
        fontSize: 15,
        fontWeight: '600',
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
    lockAction: {
        backgroundColor: '#0A84FF',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 12,
        marginRight: 8,
    },
    setsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    setsHeader: {
        flex: 1,
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 4,
    },
    setHeaderText: {
        flex: 1,
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    setRow: {
        flexDirection: 'row',
        paddingBottom: 8,
        paddingTop: 4,
        paddingHorizontal: 0,
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
    },
    setText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
        lineHeight: 20, // Ensure consistent line height for vertical alignment
        ...Platform.select({
            android: { includeFontPadding: false }, // Remove extra padding on Android
        }),
    },
    setInput: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center', // Center text vertically
        color: '#FFFFFF',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
        backgroundColor: 'transparent', // Remove solid background
        borderBottomWidth: 1,
        borderBottomColor: '#3A3A3C', // Light grey underline
        paddingVertical: 8, // Reduced to align text closer to underline
        paddingBottom: 4, // Extra bottom padding to push text down
        marginHorizontal: 4,
        minHeight: 44,
        lineHeight: 20, // Match setText line height
        ...Platform.select({
            android: { includeFontPadding: false }, // Remove extra padding on Android
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
    restTimerContainer: {
        paddingBottom: 16,
        paddingTop: 12,
    },
    restTimerBarBg: {
        height: 6,
        backgroundColor: '#2C2C2E',
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
    },
    restTimerBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    restTimerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    restTimerLabel: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '500',
    },
    restTimerValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    WorkoutFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 50,
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fabButton: {
        backgroundColor: '#0A84FF',
        padding: 10,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completeWorkoutButton: {
        backgroundColor: '#8B5CF6', // Muted purple
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    completeWorkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
    },
    modalCloseButton: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
    },
    modalContentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    infoSection: {
        marginBottom: 24,
    },
    infoSectionTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    infoSectionText: {
        color: '#8E8E93',
        fontSize: 15,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    infoBadge: {
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    infoBadgeLabel: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    infoBadgeValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
});


