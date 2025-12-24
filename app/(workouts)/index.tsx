import { createWorkout, getActiveWorkout } from "@/api/Workout";
import UnifiedHeader from "@/components/UnifiedHeader";
import { useWorkoutStore } from "@/state/userStore";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Workouts() {
    const { workouts, isLoading, isLoadingMore, hasMore, fetchWorkouts, loadMoreWorkouts } = useWorkoutStore();
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(300);
    const [activeWorkout, setActiveWorkout] = useState<any>(null);

    const fetchActiveWorkout = async () => {
        try {
            const workout = await getActiveWorkout();
            if (workout && typeof workout === 'object' && 'id' in workout) {
                setActiveWorkout(workout);
            } else {
                setActiveWorkout(null);
            }
        } catch (error) {
            setActiveWorkout(null);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                await fetchActiveWorkout();
                await fetchWorkouts(true);
            };
            loadData();
        }, [fetchWorkouts])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchActiveWorkout();
        await fetchWorkouts(true);
        setRefreshing(false);
    }, [fetchWorkouts]);

    const handleLoadMore = useCallback(() => {
        if (hasMore && !isLoadingMore && !isLoading) {
            loadMoreWorkouts();
        }
    }, [hasMore, isLoadingMore, isLoading, loadMoreWorkouts]);

    // Sort workouts by datetime (most recent first), excluding active workout
    const sortedWorkouts = useMemo(() => {
        const activeWorkoutId = activeWorkout?.id;
        return [...workouts]
            .filter(workout => workout.id !== activeWorkoutId)
            .sort((a, b) => {
                const dateA = a.datetime || a.created_at;
                const dateB = b.datetime || b.created_at;
                // Sort descending (newest first)
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
    }, [workouts, activeWorkout]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const workoutDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffTime = today.getTime() - workoutDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        // Show formatted date for older workouts
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return null;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const getExerciseCount = (workout: any) => {
        return workout.exercises?.length || 0;
    };

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        return () => showSubscription.remove();
    }, []);

    useEffect(() => {
        if (modalVisible) {
            setWorkoutTitle('');
            setDate(new Date());
        }
    }, [modalVisible]);

    const closeModal = () => {
        setModalVisible(false);
        setWorkoutTitle('');
        setDate(new Date());
        setShowDatePicker(false);
    };

    const handleLogPastWorkout = async () => {
        if (!workoutTitle.trim()) return;

        try {
            const result = await createWorkout({ 
                title: workoutTitle, 
                date: date.toISOString(), 
                is_done: true 
            });

            if (result && typeof result === 'object' && result.error === "ACTIVE_WORKOUT_EXISTS") {
                Alert.alert("Cannot Log Workout", "This date is after your current active workout. Please select an earlier date or finish your active workout first.", [
                    { text: "Cancel", style: "cancel", onPress: closeModal },
                    { text: "View Active", onPress: () => { closeModal(); router.push('/(active-workout)'); }}
                ]);
                return;
            }

            if (result?.id) {
                closeModal();
                await fetchWorkouts(true);
                router.push(`/(workouts)/${result.id}/edit`);
            }
        } catch (e) {
            Alert.alert("Error", "Failed to communicate with server.");
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const workoutDate = item.datetime || item.created_at;
        const dateText = workoutDate ? formatDate(workoutDate) : `Workout #${item.id}`;
        const duration = formatDuration(item.duration);
        const exerciseCount = getExerciseCount(item);
        const caloriesBurned = item.calories_burned ? parseFloat(String(item.calories_burned)) : null;
        const hasStats = duration || item.total_volume || exerciseCount > 0 || caloriesBurned;

        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => router.push(`/(workouts)/${item.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={styles.cardDate}>{dateText}</Text>
                        {item.intensity && item.intensity !== '' && (
                            <View style={[styles.intensityBadge, styles[`intensity${item.intensity.charAt(0).toUpperCase() + item.intensity.slice(1)}`]]}>
                                <Text style={styles.intensityText}>{item.intensity}</Text>
                            </View>
                        )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </View>
                
                <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title || 'Untitled Workout'}
                </Text>

                {hasStats && (
                    <View style={styles.cardStats}>
                        {duration && (
                            <View style={styles.statItem}>
                                <Ionicons name="time-outline" size={14} color="#8E8E93" />
                                <Text style={styles.statText}>{duration}</Text>
                            </View>
                        )}
                        {exerciseCount > 0 && (
                            <View style={styles.statItem}>
                                <Ionicons name="barbell-outline" size={14} color="#8E8E93" />
                                <Text style={styles.statText}>
                                    {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                                </Text>
                            </View>
                        )}
                        {item.total_volume && item.total_volume > 0 && (
                            <View style={styles.statItem}>
                                <Ionicons name="fitness-outline" size={14} color="#8E8E93" />
                                <Text style={styles.statText}>{item.total_volume.toFixed(0)} kg</Text>
                            </View>
                        )}
                        {caloriesBurned && caloriesBurned > 0 && (
                            <View style={styles.statItem}>
                                <Ionicons name="flame-outline" size={14} color="#FF9500" />
                                <Text style={styles.statText}>{caloriesBurned.toFixed(0)} kcal</Text>
                            </View>
                        )}
                    </View>
                )}

                {item.primary_muscles_worked && item.primary_muscles_worked.length > 0 && (
                    <View style={styles.muscleTagsContainer}>
                        {item.primary_muscles_worked.slice(0, 3).map((muscle: string, idx: number) => (
                            <View key={idx} style={styles.muscleTag}>
                                <Text style={styles.muscleTagText}>{muscle}</Text>
                            </View>
                        ))}
                        {item.primary_muscles_worked.length > 3 && (
                            <Text style={styles.moreMusclesText}>+{item.primary_muscles_worked.length - 3}</Text>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={[styles.container, {  }]}
        >
            {/* Header */}
            <UnifiedHeader
                title="Past Workouts"
                rightButton={{
                    icon: "add",
                    onPress: () => setModalVisible(true),
                }}
                modalContent={
                    <>
                        <Text style={styles.modalInternalTitle}>Log Previous Workout</Text>
                        
                        <View style={styles.inputWrapper}>
                            <TextInput 
                                placeholder="Workout Name" 
                                placeholderTextColor="#8E8E93"
                                value={workoutTitle} 
                                onChangeText={setWorkoutTitle} 
                                style={styles.modalInput}
                                autoFocus
                            />
                            {workoutTitle.length > 0 && (
                                <TouchableOpacity onPress={() => setWorkoutTitle('')} style={styles.clearIcon}>
                                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity 
                            style={styles.dateSelector} 
                            onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#0A84FF" />
                            <Text style={styles.dateText}>{date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
                        </TouchableOpacity>

                        <View style={styles.modalBtnStack}>
                            <TouchableOpacity 
                                style={[styles.primaryBtn, !workoutTitle.trim() && { opacity: 0.5 }]} 
                                onPress={handleLogPastWorkout}
                                disabled={!workoutTitle.trim()}
                            >
                                <Text style={styles.primaryBtnText}>Log Workout</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryBtn} onPress={closeModal}>
                                <Text style={styles.secondaryBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <View style={styles.sheetOverlay}>
                                <TouchableOpacity style={styles.sheetBackdrop} onPress={() => setShowDatePicker(false)} />
                                <View style={[styles.bottomSheet, { height: keyboardHeight }]}>
                                    <View style={styles.sheetHeader}>
                                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                            <Text style={styles.doneText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <DateTimePicker
                                        value={date}
                                        mode="datetime"
                                        display="spinner"
                                        maximumDate={new Date()}
                                        onChange={(event, selectedDate) => { if (selectedDate) setDate(selectedDate); }}
                                        textColor="#FFFFFF"
                                        themeVariant="dark"
                                        style={{ flex: 1 }}
                                    />
                                </View>
                            </View>
                        )}
                    </>
                }
                modalVisible={modalVisible}
                onModalClose={closeModal}
            />

            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : (
                <FlatList
                    data={sortedWorkouts}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[
                        styles.listContent,
                        sortedWorkouts.length === 0 && !activeWorkout && styles.emptyListContent,
                        { paddingTop: 60 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#0A84FF"
                            colors={["#0A84FF"]}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListHeaderComponent={
                        activeWorkout ? (
                            <TouchableOpacity 
                                style={styles.activeWorkoutCard} 
                                onPress={() => router.push(`/(workouts)/${activeWorkout.id}`)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardHeaderLeft}>
                                        <View style={styles.activeBadge}>
                                            <View style={styles.activeDot} />
                                            <Text style={styles.activeText}>ACTIVE</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                                </View>
                                
                                <Text style={styles.cardTitle} numberOfLines={1}>
                                    {activeWorkout.title || 'Untitled Workout'}
                                </Text>

                                {(() => {
                                    const duration = formatDuration(activeWorkout.duration);
                                    const exerciseCount = getExerciseCount(activeWorkout);
                                    const caloriesBurned = activeWorkout.calories_burned ? parseFloat(String(activeWorkout.calories_burned)) : null;
                                    const hasStats = duration || activeWorkout.total_volume || exerciseCount > 0 || caloriesBurned;

                                    return hasStats ? (
                                        <View style={styles.cardStats}>
                                            {duration && (
                                                <View style={styles.statItem}>
                                                    <Ionicons name="time-outline" size={14} color="#8E8E93" />
                                                    <Text style={styles.statText}>{duration}</Text>
                                                </View>
                                            )}
                                            {exerciseCount > 0 && (
                                                <View style={styles.statItem}>
                                                    <Ionicons name="barbell-outline" size={14} color="#8E8E93" />
                                                    <Text style={styles.statText}>
                                                        {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                                                    </Text>
                                                </View>
                                            )}
                                            {activeWorkout.total_volume && activeWorkout.total_volume > 0 && (
                                                <View style={styles.statItem}>
                                                    <Ionicons name="fitness-outline" size={14} color="#8E8E93" />
                                                    <Text style={styles.statText}>{activeWorkout.total_volume.toFixed(0)} kg</Text>
                                                </View>
                                            )}
                                            {caloriesBurned && caloriesBurned > 0 && (
                                                <View style={styles.statItem}>
                                                    <Ionicons name="flame-outline" size={14} color="#FF9500" />
                                                    <Text style={styles.statText}>{caloriesBurned.toFixed(0)} kcal</Text>
                                                </View>
                                            )}
                                        </View>
                                    ) : null;
                                })()}

                                {activeWorkout.primary_muscles_worked && activeWorkout.primary_muscles_worked.length > 0 && (
                                    <View style={styles.muscleTagsContainer}>
                                        {activeWorkout.primary_muscles_worked.slice(0, 3).map((muscle: string, idx: number) => (
                                            <View key={idx} style={styles.muscleTag}>
                                                <Text style={styles.muscleTagText}>{muscle}</Text>
                                            </View>
                                        ))}
                                        {activeWorkout.primary_muscles_worked.length > 3 && (
                                            <Text style={styles.moreMusclesText}>+{activeWorkout.primary_muscles_worked.length - 3}</Text>
                                        )}
                                    </View>
                                )}
                            </TouchableOpacity>
                        ) : null
                    }
                    ListFooterComponent={
                        isLoadingMore ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color="#0A84FF" />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        !activeWorkout ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="barbell-outline" size={64} color="#2C2C2E" />
                                <Text style={styles.emptyTitle}>No workouts yet</Text>
                                <Text style={styles.emptyText}>
                                    Complete your first workout to see it here
                                </Text>
                            </View>
                        ) : null
                    }
                />
            )}

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 20,
    },
    emptyListContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    activeWorkoutCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#32D74B',
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(50, 215, 75, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#32D74B',
        marginRight: 6,
    },
    activeText: {
        color: '#32D74B',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    cardDate: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    intensityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    intensityLow: {
        backgroundColor: 'rgba(50, 215, 75, 0.15)',
    },
    intensityMedium: {
        backgroundColor: 'rgba(255, 159, 10, 0.15)',
    },
    intensityHigh: {
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
    },
    intensityText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    cardStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '500',
    },
    muscleTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
    },
    muscleTag: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    muscleTagText: {
        color: '#A1A1A6',
        fontSize: 11,
        fontWeight: '500',
    },
    moreMusclesText: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '500',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    modalInternalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    modalInput: {
        backgroundColor: '#2C2C2E',
        borderRadius: 14,
        padding: 18,
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '500',
    },
    clearIcon: {
        position: 'absolute',
        right: 14,
        top: 18,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 14,
        marginBottom: 24,
        gap: 10,
    },
    dateText: {
        color: '#0A84FF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalBtnStack: {
        gap: 12,
    },
    primaryBtn: {
        backgroundColor: '#0A84FF',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    secondaryBtn: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryBtnText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
    sheetOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-end',
        zIndex: 9999,
    },
    sheetBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    bottomSheet: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
        overflow: 'hidden',
    },
    sheetHeader: {
        height: 50,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    doneText: {
        color: '#0A84FF',
        fontSize: 17,
        fontWeight: '600',
    },
});
