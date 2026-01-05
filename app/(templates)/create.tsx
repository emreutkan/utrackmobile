import { createTemplateWorkout } from '@/api/Workout';
import ExerciseSearchModal from '@/components/ExerciseSearchModal';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateTemplateScreen() {
    const [title, setTitle] = useState('');
    const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const insets = useSafeAreaInsets();

    // Animation values
    const createButtonHeight = useSharedValue(0);
    const createButtonOpacity = useSharedValue(0);
    const exercisesButtonScale = useSharedValue(1);

    const toggleExercise = (exerciseId: number) => {
        setSelectedExercises(prev => {
            if (prev.includes(exerciseId)) {
                return prev.filter(id => id !== exerciseId);
            } else {
                return [...prev, exerciseId];
            }
        });
    };

    const moveExercise = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === selectedExercises.length - 1) return;

        const newOrder = [...selectedExercises];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
        setSelectedExercises(newOrder);
    };

    const removeExercise = (index: number) => {
        setSelectedExercises(prev => prev.filter((_, i) => i !== index));
    };

    // Animate create button when form is valid
    useEffect(() => {
        if (title.trim() && selectedExercises.length > 0) {
            createButtonHeight.value = withSpring(70, { damping: 15, stiffness: 150 });
            createButtonOpacity.value = withTiming(1, { duration: 300 });
        } else {
            createButtonHeight.value = withSpring(0, { damping: 15, stiffness: 150 });
            createButtonOpacity.value = withTiming(0, { duration: 300 });
        }
    }, [title, selectedExercises.length]);

    // Animate exercises button on press
    const handleExercisesButtonPress = () => {
        exercisesButtonScale.value = withSpring(0.95, { damping: 10 }, () => {
            exercisesButtonScale.value = withSpring(1, { damping: 10 });
        });
        setIsModalVisible(true);
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert("Error", "Please enter a template name.");
            return;
        }
        if (selectedExercises.length === 0) {
            Alert.alert("Error", "Please select at least one exercise.");
            return;
        }

        setIsCreating(true);
        try {
            const result = await createTemplateWorkout({
                title: title.trim(),
                exercises: selectedExercises
            });
            if (result?.id) {
                Alert.alert("Success", "Template created successfully!", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                Alert.alert("Error", "Failed to create template.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to create template.");
        } finally {
            setIsCreating(false);
        }
    };

    const createButtonStyle = useAnimatedStyle(() => ({
        height: createButtonHeight.value,
        opacity: createButtonOpacity.value,
        marginBottom: createButtonHeight.value > 0 ? 16 : 0,
    }));

    const exercisesButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: exercisesButtonScale.value }],
    }));

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <UnifiedHeader title="Create Template" />

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: 60 + 16, paddingBottom: 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Template Name Input */}
                <View style={styles.inputSection}>
                    {Platform.OS === 'ios' ? (
                        <BlurView intensity={80} tint="dark" style={styles.inputBlur}>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="document-text-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    placeholder="Template Name"
                                    placeholderTextColor="#8E8E93"
                                    value={title}
                                    onChangeText={setTitle}
                                    style={styles.titleInput}
                                />
                            </View>
                        </BlurView>
                    ) : (
                        <View style={[styles.inputBlur, styles.androidInput]}>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="document-text-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    placeholder="Template Name"
                                    placeholderTextColor="#8E8E93"
                                    value={title}
                                    onChangeText={setTitle}
                                    style={styles.titleInput}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Selected Exercises */}
                {selectedExercises.length > 0 && (
                    <View style={styles.selectedSection}>
                        <Text style={styles.sectionTitle}>Selected Exercises ({selectedExercises.length})</Text>
                        {selectedExercises.map((exerciseId, index) => {
                            return (
                                <View key={exerciseId} style={styles.selectedExerciseCard}>
                                    {Platform.OS === 'ios' ? (
                                        <BlurView intensity={80} tint="dark" style={styles.exerciseCardBlur}>
                                            <View style={styles.selectedExerciseContent}>
                                                <View style={styles.selectedExerciseInfo}>
                                                    <View style={styles.exerciseNumberBadge}>
                                                        <Text style={styles.selectedExerciseNumber}>{index + 1}</Text>
                                                    </View>
                                                    <Text style={styles.selectedExerciseName}>
                                                        Exercise {exerciseId}
                                                    </Text>
                                                </View>
                                                <View style={styles.selectedExerciseActions}>
                                                    <TouchableOpacity
                                                        onPress={() => moveExercise(index, 'up')}
                                                        disabled={index === 0}
                                                        style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]}
                                                    >
                                                        <Ionicons name="chevron-up" size={18} color={index === 0 ? "#4A4A4A" : "#0A84FF"} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => moveExercise(index, 'down')}
                                                        disabled={index === selectedExercises.length - 1}
                                                        style={[styles.orderButton, index === selectedExercises.length - 1 && styles.orderButtonDisabled]}
                                                    >
                                                        <Ionicons name="chevron-down" size={18} color={index === selectedExercises.length - 1 ? "#4A4A4A" : "#0A84FF"} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => removeExercise(index)}
                                                        style={styles.removeButton}
                                                    >
                                                        <Ionicons name="close-circle" size={22} color="#FF3B30" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </BlurView>
                                    ) : (
                                        <View style={[styles.exerciseCardBlur, styles.androidExerciseCard]}>
                                            <View style={styles.selectedExerciseContent}>
                                                <View style={styles.selectedExerciseInfo}>
                                                    <View style={styles.exerciseNumberBadge}>
                                                        <Text style={styles.selectedExerciseNumber}>{index + 1}</Text>
                                                    </View>
                                                    <Text style={styles.selectedExerciseName}>
                                                        Exercise {exerciseId}
                                                    </Text>
                                                </View>
                                                <View style={styles.selectedExerciseActions}>
                                                    <TouchableOpacity
                                                        onPress={() => moveExercise(index, 'up')}
                                                        disabled={index === 0}
                                                        style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]}
                                                    >
                                                        <Ionicons name="chevron-up" size={18} color={index === 0 ? "#4A4A4A" : "#0A84FF"} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => moveExercise(index, 'down')}
                                                        disabled={index === selectedExercises.length - 1}
                                                        style={[styles.orderButton, index === selectedExercises.length - 1 && styles.orderButtonDisabled]}
                                                    >
                                                        <Ionicons name="chevron-down" size={18} color={index === selectedExercises.length - 1 ? "#4A4A4A" : "#0A84FF"} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => removeExercise(index)}
                                                        style={styles.removeButton}
                                                    >
                                                        <Ionicons name="close-circle" size={22} color="#FF3B30" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Add Exercises Button */}
                <View style={styles.addExercisesSection}>
                    <Text style={styles.sectionTitle}>Add Exercises</Text>
                    <Animated.View style={exercisesButtonStyle}>
                        {Platform.OS === 'ios' ? (
                            <BlurView intensity={80} tint="dark" style={styles.addExercisesBlur}>
                                <TouchableOpacity
                                    style={styles.addExercisesButton}
                                    onPress={handleExercisesButtonPress}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.addExercisesContent}>
                                        <Ionicons name="add-circle-outline" size={24} color="#0A84FF" />
                                        <Text style={styles.addExercisesButtonText}>
                                            {selectedExercises.length > 0 
                                                ? `${selectedExercises.length} exercise${selectedExercises.length > 1 ? 's' : ''} selected`
                                                : 'Tap to add exercises'}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                                    </View>
                                </TouchableOpacity>
                            </BlurView>
                        ) : (
                            <View style={[styles.addExercisesBlur, styles.androidAddExercises]}>
                                <TouchableOpacity
                                    style={styles.addExercisesButton}
                                    onPress={handleExercisesButtonPress}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.addExercisesContent}>
                                        <Ionicons name="add-circle-outline" size={24} color="#0A84FF" />
                                        <Text style={styles.addExercisesButtonText}>
                                            {selectedExercises.length > 0 
                                                ? `${selectedExercises.length} exercise${selectedExercises.length > 1 ? 's' : ''} selected`
                                                : 'Tap to add exercises'}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                </View>
            </ScrollView>

            {/* Create Button - Animated */}
            <Animated.View style={[styles.createButtonContainer, createButtonStyle, { bottom: insets.bottom + 16 }]}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="dark" style={styles.createButtonBlur}>
                        <TouchableOpacity
                            style={[styles.createButton, isCreating && styles.createButtonLoading]}
                            onPress={handleCreate}
                            disabled={!title.trim() || selectedExercises.length === 0 || isCreating}
                            activeOpacity={0.8}
                        >
                            {isCreating ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.createButtonText}>Create Template</Text>
                            )}
                        </TouchableOpacity>
                    </BlurView>
                ) : (
                    <View style={[styles.createButtonBlur, styles.androidCreateButton]}>
                        <TouchableOpacity
                            style={[styles.createButton, isCreating && styles.createButtonLoading]}
                            onPress={handleCreate}
                            disabled={!title.trim() || selectedExercises.length === 0 || isCreating}
                            activeOpacity={0.8}
                        >
                            {isCreating ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.createButtonText}>Create Template</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>

            <ExerciseSearchModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectExercise={() => {}}
                onToggleExercise={toggleExercise}
                title="Add Exercises"
                mode="multiple"
                selectedExerciseIds={selectedExercises}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    inputSection: {
        marginBottom: 24,
    },
    inputBlur: {
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    androidInput: {
        backgroundColor: '#1C1C1E',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    titleInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '400',
    },
    selectedSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    selectedExerciseCard: {
        marginBottom: 8,
    },
    exerciseCardBlur: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    androidExerciseCard: {
        backgroundColor: '#1C1C1E',
    },
    selectedExerciseContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
    },
    selectedExerciseInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    exerciseNumberBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(10, 132, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    selectedExerciseNumber: {
        color: '#0A84FF',
        fontSize: 14,
        fontWeight: '700',
    },
    selectedExerciseName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    selectedExerciseActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    orderButton: {
        padding: 6,
    },
    orderButtonDisabled: {
        opacity: 0.3,
    },
    removeButton: {
        padding: 4,
    },
    addExercisesSection: {
        marginBottom: 24,
    },
    addExercisesBlur: {
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    androidAddExercises: {
        backgroundColor: '#1C1C1E',
    },
    addExercisesButton: {
        padding: 16,
    },
    addExercisesContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addExercisesButtonText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '500',
    },
    createButtonContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        overflow: 'hidden',
    },
    createButtonBlur: {
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    androidCreateButton: {
        backgroundColor: '#0A84FF',
    },
    createButton: {
        backgroundColor: '#0A84FF',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    createButtonLoading: {
        opacity: 0.7,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
