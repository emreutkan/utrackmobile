import { getExercises } from '@/api/Exercises';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExerciseSearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectExercise: (exerciseId: number) => void | Promise<void>;
    title?: string;
    mode?: 'single' | 'multiple';
    selectedExerciseIds?: number[];
    onToggleExercise?: (exerciseId: number, exercise?: any) => void;
    excludeExerciseIds?: number[];
    initialSearch?: string;
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
    initialSearch = '',
}: ExerciseSearchModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [exercises, setExercises] = useState<any[]>([]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [isLoadingMoreExercises, setIsLoadingMoreExercises] = useState(false);
    const [hasMoreExercises, setHasMoreExercises] = useState(false);
    const [exercisePage, setExercisePage] = useState(1);
    const insets = useSafeAreaInsets();
 const loadExercises = useCallback(async (reset = false) => {
        if (reset) {
            setIsLoadingExercises(true);
            setExercisePage(1);
        } else {
            setIsLoadingMoreExercises(true);
        }
        try {
            const page = reset ? 1 : exercisePage + 1;
            const data = await getExercises(searchQuery, page) as { results?: unknown[]; next?: string | null } | unknown[] | undefined;
            if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as { results: unknown[] }).results)) {
                const paginated = data as { results: unknown[]; next?: string | null };
                if (reset) {
                    setExercises(paginated.results);
                } else {
                    setExercises(prev => [...prev, ...paginated.results]);
                }
                setHasMoreExercises(!!paginated.next);
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
    }, [searchQuery, exercisePage ]);

    // Load exercises when modal opens or search query changes
    useEffect(() => {
        if (!visible) {
            setExercises([]);
            setExercisePage(1);
            setHasMoreExercises(false);
            setSearchQuery('');
            return;
        }
        // Seed the search with any initial filter (e.g. muscle group from SuggestExerciseRow)
        if (initialSearch) {
            setSearchQuery(initialSearch);
        }

        const delayDebounceFn = setTimeout(() => {
            loadExercises(true);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, visible, loadExercises]);


    const loadMoreExercises = () => {
        if (hasMoreExercises && !isLoadingMoreExercises && !isLoadingExercises) {
            loadExercises(false);
        }
    };

    const handleExercisePress = async (exerciseId: number, exercise?: any) => {
        if (mode === 'multiple' && onToggleExercise) {
            onToggleExercise(exerciseId, exercise);
        } else {
            await onSelectExercise(exerciseId);
        }
    };

    const filteredExercises = exercises.filter(e => !excludeExerciseIds.includes(e.id));
    const isSelected = (exerciseId: number) => selectedExerciseIds.includes(exerciseId);

    const renderHeader = () => (
        <View style={styles.modalHeader}>
            <View>
                <Text style={styles.modalTitle}>{title.toUpperCase()}</Text>
                <Text style={styles.modalSubtitle}>{mode === 'multiple' ? 'SELECT EXERCISES' : 'CHOOSE ONE'}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButtonContainer}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </Pressable>
        </View>
    );

    const renderSearchBar = () => (
        <View style={styles.searchSection}>
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={theme.colors.text.tertiary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search exercises..."
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={theme.colors.text.tertiary} />
                    </Pressable>
                )}
            </View>
        </View>
    );

    const renderContent = () => {
        return (
            <View style={{ flex: 1 }}>
                {renderSearchBar()}
                {isLoadingExercises ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.status.active} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredExercises}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => {
                            const selected = isSelected(item.id);
                            return (
                                <Pressable
                                    style={[styles.exerciseCard, selected && styles.exerciseCardSelected]}
                                    onPress={() => handleExercisePress(item.id, item)}
                                >
                                    <View style={styles.exerciseInfoContainer}>
                                        <View style={[styles.exerciseIconPlaceholder, selected && styles.exerciseIconPlaceholderSelected]}>
                                            <Text style={[styles.exerciseInitial, selected && styles.exerciseInitialSelected]}>
                                                {item.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.exerciseTextContent}>
                                            <Text style={styles.exerciseName}>{item.name.toUpperCase()}</Text>
                                            <Text style={styles.exerciseDetail}>
                                                {item.primary_muscle.toUpperCase()} {item.equipment_type ? `• ${item.equipment_type.toUpperCase()}` : ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.addButton, selected && styles.addButtonSelected]}>
                                        {mode === 'multiple' ? (
                                            <Ionicons
                                                name={selected ? "checkmark" : "add"}
                                                size={20}
                                                color={selected ? "#FFFFFF" : theme.colors.status.active}
                                            />
                                        ) : (
                                            <Ionicons name="add" size={20} color={theme.colors.status.active} />
                                        )}
                                    </View>
                                </Pressable>
                            );
                        }}
                        ItemSeparatorComponent={() => <View style={{height: 12}} />}
                        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
                        onEndReached={loadMoreExercises}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            isLoadingMoreExercises ? (
                                <View style={styles.footerLoader}>
                                    <ActivityIndicator size="small" color={theme.colors.status.active} />
                                </View>
                            ) : null
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="barbell-outline" size={48} color={theme.colors.text.zinc700} />
                                <Text style={styles.emptyText}>No exercises found</Text>
                            </View>
                        }
                    />
                )}
            </View>
        );
    };

    return (
        <Modal
            presentationStyle="formSheet"
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <LinearGradient
                    colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                />
                {renderHeader()}
                {renderContent()}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.l,
        paddingVertical: theme.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border,
    },
    modalTitle: {
        fontSize: theme.typography.sizes.m,
        fontWeight: '900',
        color: theme.colors.text.primary,
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
    modalSubtitle: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
        marginTop: 2,
    },
    closeButtonContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchSection: {
        padding: theme.spacing.m,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glassStrong,
        paddingHorizontal: theme.spacing.m,
        height: 48,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    searchIcon: {
        marginRight: theme.spacing.s,
    },
    searchInput: {
        flex: 1,
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '500',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: theme.spacing.m,
    },
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    exerciseCardSelected: {
        borderColor: theme.colors.status.active,
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
    },
    exerciseInfoContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: theme.spacing.m,
    },
    exerciseIconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.m,
    },
    exerciseIconPlaceholderSelected: {
        borderColor: theme.colors.status.active,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    exerciseInitial: {
        color: theme.colors.text.tertiary,
        fontSize: theme.typography.sizes.l,
        fontWeight: '800',
        fontStyle: 'italic',
    },
    exerciseInitialSelected: {
        color: theme.colors.status.active,
    },
    exerciseTextContent: {
        flex: 1,
    },
    exerciseName: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.s,
        fontWeight: '800',
        fontStyle: 'italic',
        marginBottom: 2,
    },
    exerciseDetail: {
        color: theme.colors.text.tertiary,
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonSelected: {
        backgroundColor: theme.colors.status.active,
        borderColor: theme.colors.status.active,
    },
    footerLoader: {
        paddingVertical: theme.spacing.xl,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: theme.spacing.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: theme.colors.text.tertiary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '600',
        marginTop: theme.spacing.m,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
