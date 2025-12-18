import { getExercises } from '@/api/Exercises';
import { createTemplateWorkout } from '@/api/Workout';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateTemplateScreen() {
    const [title, setTitle] = useState('');
    const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [exercises, setExercises] = useState<any[]>([]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadExercises();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadExercises();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const loadExercises = async () => {
        setIsLoadingExercises(true);
        try {
            const data = await getExercises(searchQuery);
            if (Array.isArray(data)) {
                setExercises(data);
            }
        } catch (error) {
            console.error("Failed to load exercises:", error);
        } finally {
            setIsLoadingExercises(false);
        }
    };

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

    const getSelectedExerciseDetails = (exerciseId: number) => {
        return exercises.find(e => e.id === exerciseId);
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={[styles.container, { paddingTop: insets.top }]}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Template</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Template Name Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    placeholder="Template Name"
                    placeholderTextColor="#8E8E93"
                    value={title}
                    onChangeText={setTitle}
                    style={styles.titleInput}
                />
            </View>

            {/* Selected Exercises */}
            {selectedExercises.length > 0 && (
                <View style={styles.selectedContainer}>
                    <Text style={styles.sectionTitle}>Selected Exercises ({selectedExercises.length})</Text>
                    {selectedExercises.map((exerciseId, index) => {
                        const exercise = getSelectedExerciseDetails(exerciseId);
                        return (
                            <View key={exerciseId} style={styles.selectedExerciseCard}>
                                <View style={styles.selectedExerciseInfo}>
                                    <Text style={styles.selectedExerciseNumber}>{index + 1}</Text>
                                    <Text style={styles.selectedExerciseName}>
                                        {exercise?.name || `Exercise ${exerciseId}`}
                                    </Text>
                                </View>
                                <View style={styles.selectedExerciseActions}>
                                    <TouchableOpacity
                                        onPress={() => moveExercise(index, 'up')}
                                        disabled={index === 0}
                                        style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]}
                                    >
                                        <Ionicons name="chevron-up" size={20} color={index === 0 ? "#4A4A4A" : "#0A84FF"} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => moveExercise(index, 'down')}
                                        disabled={index === selectedExercises.length - 1}
                                        style={[styles.orderButton, index === selectedExercises.length - 1 && styles.orderButtonDisabled]}
                                    >
                                        <Ionicons name="chevron-down" size={20} color={index === selectedExercises.length - 1 ? "#4A4A4A" : "#0A84FF"} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => removeExercise(index)}
                                        style={styles.removeButton}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Exercise Search */}
            <View style={styles.searchContainer}>
                <Text style={styles.sectionTitle}>Add Exercises</Text>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search exercises..."
                        placeholderTextColor="#8E8E93"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                    />
                </View>
            </View>

            {/* Exercise List */}
            <FlatList
                data={exercises.filter(e => !selectedExercises.includes(e.id))}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.exerciseCard}
                        onPress={() => toggleExercise(item.id)}
                    >
                        <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseName}>{item.name}</Text>
                            <Text style={styles.exerciseDetail}>
                                {item.primary_muscle} {item.equipment_type ? `• ${item.equipment_type}` : ''}
                            </Text>
                        </View>
                        <Ionicons name="add-circle-outline" size={24} color="#0A84FF" />
                    </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="barbell-outline" size={48} color="#8E8E93" />
                        <Text style={styles.emptyText}>No exercises found</Text>
                    </View>
                }
            />

            {/* Create Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.createButton, (!title.trim() || selectedExercises.length === 0 || isCreating) && styles.createButtonDisabled]}
                    onPress={handleCreate}
                    disabled={!title.trim() || selectedExercises.length === 0 || isCreating}
                >
                    {isCreating ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.createButtonText}>Create Template</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 44,
        marginBottom: 16,
    },
    backButton: {
        width: 40,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    inputContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    titleInput: {
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '500',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    selectedContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    selectedExerciseCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedExerciseInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    selectedExerciseNumber: {
        color: '#0A84FF',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 12,
        minWidth: 24,
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
        padding: 4,
    },
    orderButtonDisabled: {
        opacity: 0.3,
    },
    removeButton: {
        padding: 4,
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        color: '#FFFFFF',
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    exerciseCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    exerciseDetail: {
        color: '#8E8E93',
        fontSize: 14,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 16,
        marginTop: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000000',
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    createButton: {
        backgroundColor: '#0A84FF',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#2C2C2E',
        opacity: 0.5,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
