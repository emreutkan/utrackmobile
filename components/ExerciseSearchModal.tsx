import { getExercises } from '@/api/Exercises';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExerciseSearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectExercise: (exerciseId: number) => void | Promise<void>;
    title?: string;
    mode?: 'single' | 'multiple';
    selectedExerciseIds?: number[];
    onToggleExercise?: (exerciseId: number) => void;
    excludeExerciseIds?: number[];
}

export default function ExerciseSearchModal({
    visible,
    onClose,
    onSelectExercise,
    title = 'Add Exercise',
    mode = 'single',
    selectedExerciseIds = [],
    onToggleExercise,
    excludeExerciseIds = [],
}: ExerciseSearchModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [exercises, setExercises] = useState<any[]>([]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [isLoadingMoreExercises, setIsLoadingMoreExercises] = useState(false);
    const [hasMoreExercises, setHasMoreExercises] = useState(false);
    const [exercisePage, setExercisePage] = useState(1);
    const insets = useSafeAreaInsets();

    // Load exercises when modal opens or search query changes
    useEffect(() => {
        if (!visible) {
            setExercises([]);
            setExercisePage(1);
            setHasMoreExercises(false);
            setSearchQuery('');
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            loadExercises(true);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, visible]);

    const loadExercises = async (reset = false) => {
        if (reset) {
            setIsLoadingExercises(true);
            setExercisePage(1);
        } else {
            setIsLoadingMoreExercises(true);
        }
        try {
            const page = reset ? 1 : exercisePage + 1;
            const data = await getExercises(searchQuery, page);
            if (data?.results) {
                // Paginated response
                if (reset) {
                    setExercises(data.results);
                } else {
                    setExercises(prev => [...prev, ...data.results]);
                }
                setHasMoreExercises(!!data.next);
                setExercisePage(page);
            } else if (Array.isArray(data)) {
                // Fallback for non-paginated response
                if (reset) {
                    setExercises(data);
                } else {
                    setExercises(prev => [...prev, ...data]);
                }
                setHasMoreExercises(false);
            }
        } catch (error) {
            console.error("Failed to load exercises:", error);
        } finally {
            setIsLoadingExercises(false);
            setIsLoadingMoreExercises(false);
        }
    };

    const loadMoreExercises = () => {
        if (hasMoreExercises && !isLoadingMoreExercises && !isLoadingExercises) {
            loadExercises(false);
        }
    };

    const handleExercisePress = async (exerciseId: number) => {
        if (mode === 'multiple' && onToggleExercise) {
            onToggleExercise(exerciseId);
        } else {
            await onSelectExercise(exerciseId);
        }
    };

    const filteredExercises = exercises.filter(e => !excludeExerciseIds.includes(e.id));
    const isSelected = (exerciseId: number) => selectedExerciseIds.includes(exerciseId);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
            transparent={Platform.OS === 'android'}
            onRequestClose={onClose}
        >
            {Platform.OS === 'android' ? (
                <View style={styles.androidModalContainer}>
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
                                <Ionicons name="close-circle" size={28} color="#2C2C2E" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.searchSection}>
                            <View style={styles.searchBar}>
                                <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search exercises..."
                                    placeholderTextColor="#8E8E93"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#8E8E93" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {isLoadingExercises ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#0A84FF" />
                            </View>
                        ) : (
                            <FlatList
                                data={filteredExercises}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => {
                                    const selected = isSelected(item.id);
                                    return (
                                        <TouchableOpacity 
                                            style={styles.exerciseCard}
                                            onPress={() => handleExercisePress(item.id)}
                                        >
                                            <View style={styles.exerciseInfoContainer}>
                                                <View style={styles.exerciseIconPlaceholder}>
                                                    <Text style={styles.exerciseInitial}>
                                                        {item.name.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View style={styles.exerciseTextContent}>
                                                    <Text style={styles.exerciseName}>{item.name}</Text>
                                                    <Text style={styles.exerciseDetail}>
                                                        {item.primary_muscle} {item.equipment_type ? `• ${item.equipment_type}` : ''}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.addButton}>
                                                {mode === 'multiple' ? (
                                                    <Ionicons 
                                                        name={selected ? "checkmark-circle" : "add-circle-outline"} 
                                                        size={24} 
                                                        color={selected ? "#32D74B" : "#0A84FF"} 
                                                    />
                                                ) : (
                                                    <Ionicons name="add" size={24} color="#0A84FF" />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                ItemSeparatorComponent={() => <View style={{height: 12}} />}
                                contentContainerStyle={styles.listContent}
                                onEndReached={loadMoreExercises}
                                onEndReachedThreshold={0.5}
                                ListFooterComponent={
                                    isLoadingMoreExercises ? (
                                        <View style={styles.footerLoader}>
                                            <ActivityIndicator size="small" color="#0A84FF" />
                                        </View>
                                    ) : null
                                }
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="barbell-outline" size={48} color="#FFFFFF" />
                                        <Text style={styles.emptyText}>No exercises found</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                </View>
            ) : (
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
                            <Ionicons name="close-circle" size={28} color="#2C2C2E" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.searchSection}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search exercises..."
                                placeholderTextColor="#8E8E93"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={18} color="#8E8E93" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {isLoadingExercises ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0A84FF" />
                        </View>
                    ) : (
                        <FlatList
                            data={filteredExercises}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => {
                                const selected = isSelected(item.id);
                                return (
                                    <TouchableOpacity 
                                        style={styles.exerciseCard}
                                        onPress={() => handleExercisePress(item.id)}
                                    >
                                        <View style={styles.exerciseInfoContainer}>
                                            <View style={styles.exerciseIconPlaceholder}>
                                                <Text style={styles.exerciseInitial}>
                                                    {item.name.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={styles.exerciseTextContent}>
                                                <Text style={styles.exerciseName}>{item.name}</Text>
                                                <Text style={styles.exerciseDetail}>
                                                    {item.primary_muscle} {item.equipment_type ? `• ${item.equipment_type}` : ''}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.addButton}>
                                            {mode === 'multiple' ? (
                                                <Ionicons 
                                                    name={selected ? "checkmark-circle" : "add-circle-outline"} 
                                                    size={24} 
                                                    color={selected ? "#32D74B" : "#0A84FF"} 
                                                />
                                            ) : (
                                                <Ionicons name="add" size={24} color="#0A84FF" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ItemSeparatorComponent={() => <View style={{height: 12}} />}
                            contentContainerStyle={styles.listContent}
                            onEndReached={loadMoreExercises}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                isLoadingMoreExercises ? (
                                    <View style={styles.footerLoader}>
                                        <ActivityIndicator size="small" color="#0A84FF" />
                                    </View>
                                ) : null
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="barbell-outline" size={48} color="#FFFFFF" />
                                    <Text style={styles.emptyText}>No exercises found</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    androidModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        height: '85%',
        paddingTop: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#1C1C1E',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    closeButtonContainer: {
        padding: 4,
    },
    searchSection: {
        padding: 16,
        backgroundColor: '#000000',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
    },
    exerciseInfoContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    exerciseIconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    exerciseInitial: {
        color: '#8E8E93',
        fontSize: 18,
        fontWeight: '600',
    },
    exerciseTextContent: {
        flex: 1,
    },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    exerciseDetail: {
        color: '#8E8E93',
        fontSize: 13,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(10, 132, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 48,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5,
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 16,
        marginTop: 12,
    },
});


