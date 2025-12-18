import { checkRestDay, createWorkout, deleteWorkout, getActiveWorkout, getAvailableYears, getCalendar, getCalendarStats, getTemplateWorkouts, startTemplateWorkout } from '@/api/Workout';
import { CalendarDay, CalendarStats, TemplateWorkout } from '@/api/types';
import { useWorkoutStore } from '@/state/userStore';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SwipeAction = ({ progress, onPress }: any) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);
        return { transform: [{ scale }] };
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.deleteAction}>
            <Animated.View style={animatedStyle}>
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function Home() {
    const [modalVisible, setModalVisible] = useState(false);
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [activeWorkout, setActiveWorkout] = useState<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const insets = useSafeAreaInsets();
    const [modalCreateButtonText, setModalCreateButtonText] = useState('Create Workout');
    const [modalCreateButtonAction, setModalCreateButtonAction] = useState('createWorkout');
    const [keyboardHeight, setKeyboardHeight] = useState(300);
    const { workouts, fetchWorkouts } = useWorkoutStore();
    const [restDayInfo, setRestDayInfo] = useState<{ is_rest_day: boolean; date: string; rest_day_id: number | null } | null>(null);
    const [templates, setTemplates] = useState<TemplateWorkout[]>([]);
    const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
    const [calendarStats, setCalendarStats] = useState<CalendarStats | null>(null);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [showCalendarModal, setShowCalendarModal] = useState(false);

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

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        return () => showSubscription.remove();
    }, []);

    const fetchRestDayInfo = async () => {
        try {
            const result = await checkRestDay();
            if (result && typeof result === 'object' && 'is_rest_day' in result) {
                setRestDayInfo(result);
            } else {
                setRestDayInfo(null);
            }
        } catch (error) {
            setRestDayInfo(null);
        }
    };

    const fetchTemplates = async () => {
        try {
            const result = await getTemplateWorkouts();
            if (Array.isArray(result)) {
                setTemplates(result);
            } else {
                setTemplates([]);
            }
        } catch (error) {
            setTemplates([]);
        }
    };

    const fetchCalendar = async (year: number, month?: number) => {
        try {
            const result = await getCalendar(year, month);
            if (result?.calendar) {
                setCalendarData(result.calendar);
            } else {
                setCalendarData([]);
            }
        } catch (error) {
            setCalendarData([]);
        }
    };

    const fetchCalendarStats = async (year: number, month?: number) => {
        try {
            const result = await getCalendarStats(year, month);
            if (result) {
                setCalendarStats(result);
            }
        } catch (error) {
            setCalendarStats(null);
        }
    };

    const fetchAvailableYears = async () => {
        try {
            const result = await getAvailableYears();
            if (result?.years) {
                setAvailableYears(result.years);
            }
        } catch (error) {
            setAvailableYears([new Date().getFullYear()]);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchActiveWorkout();
            fetchWorkouts();
            fetchRestDayInfo();
            fetchTemplates();
            fetchAvailableYears();
            const now = new Date();
            fetchCalendar(now.getFullYear(), now.getMonth() + 1);
            fetchCalendarStats(now.getFullYear(), now.getMonth() + 1);
        }, [fetchWorkouts])
    );

    // Get today's completed workout
    const todaysWorkout = useMemo(() => {
        if (activeWorkout?.id) return null; // Don't show if there's an active workout
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return workouts.find((workout: any) => {
            const workoutDate = workout.datetime || workout.created_at;
            if (!workoutDate) return false;
            
            const date = new Date(workoutDate);
            date.setHours(0, 0, 0, 0);
            
            const isToday = date.getTime() === today.getTime();
            const isCompleted = workout.is_done === true;
            
            return isToday && isCompleted;
        });
    }, [workouts, activeWorkout]);

    useEffect(() => {
        let interval: any;
        if (activeWorkout?.created_at) {
            const startTime = new Date(activeWorkout.created_at).getTime();
            const updateTimer = () => {
                const now = new Date().getTime();
                const diff = Math.max(0, now - startTime);
                const seconds = Math.floor((diff / 1000) % 60);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                const hours = Math.floor((diff / (1000 * 60 * 60)));
                setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            };
            updateTimer();
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsedTime('00:00:00');
        }
        return () => { if (interval) clearInterval(interval); };
    }, [activeWorkout]);

    // Handle initial state when modal opens
    useEffect(() => {
        if (modalVisible) {
            if (modalCreateButtonAction === 'createWorkout') {
                const now = new Date();
                const month = now.toLocaleString('default', { month: 'long' });
                setWorkoutTitle(`${month} ${now.getDate()}`);
            } else {
                setWorkoutTitle(''); // Force empty title for previous workout
            }
        }
    }, [modalVisible, modalCreateButtonAction]);

    const closeModal = () => {
        setModalVisible(false);
        setWorkoutTitle('');
        setDate(new Date());
        setShowDatePicker(false);
    };

    const handleCreateWorkout = async () => {
        if (!workoutTitle.trim()) return;

        try {
            const isPrevious = modalCreateButtonAction === 'addPreviousWorkout';
            const payload = isPrevious 
                ? { title: workoutTitle, date: date.toISOString(), is_done: true } 
                : { title: workoutTitle };

            const result = await createWorkout(payload);

            if (result && typeof result === 'object' && result.error === "ACTIVE_WORKOUT_EXISTS") {
                const errorMessage = isPrevious 
                    ? "This date is after your current active workout. Please select an earlier date or finish your active workout first."
                    : "You already have an active workout in progress.";
                
                Alert.alert("Cannot Create Workout", errorMessage, [
                    { text: "Cancel", style: "cancel", onPress: closeModal },
                    { text: "View Active", onPress: () => { closeModal(); router.push('/(active-workout)'); }}
                ]);
                return;
            }

            if (result?.id) {
                closeModal();
                isPrevious ? router.push(`/(workouts)/${result.id}/edit`) : router.push('/(active-workout)');
            }
        } catch (e) {
            Alert.alert("Error", "Failed to communicate with server.");
        }
    };

    const handleDeleteActiveWorkout = () => {
        Alert.alert("Delete Workout", "This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                if (activeWorkout?.id) {
                    await deleteWorkout(activeWorkout.id);
                    setActiveWorkout(null);
                    setElapsedTime('00:00:00');
                    fetchWorkouts(); // Refresh workouts list
                }
            }}
        ]);
    };

    const handleDeleteTodaysWorkout = () => {
        Alert.alert("Delete Workout", "This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                if (todaysWorkout?.id) {
                    await deleteWorkout(todaysWorkout.id);
                    fetchWorkouts();
                }
            }}
        ]);
    };

    const handleDeleteRestDay = () => {
        Alert.alert("Delete Rest Day", "This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                if (restDayInfo?.rest_day_id) {
                    await deleteWorkout(restDayInfo.rest_day_id);
                    fetchRestDayInfo();
                }
            }}
        ]);
    };

    const addRestDay = async () => {
        try {
            const result = await createWorkout({ title: 'Rest Day', is_rest_day: true });
            if (result?.error === "WORKOUT_EXISTS_FOR_DATE") {
                Alert.alert("Cannot Add Rest Day", result.message || "A workout already exists for this date. Cannot create a rest day.");
                return;
            }
            if (result?.id) {
                Alert.alert("Success", "Rest day added successfully.");
                fetchRestDayInfo(); // Refresh to show the new rest day
            }
        } catch (error) {
            Alert.alert("Error", "Failed to add rest day. Please try again.");
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.push('/(account)')} hitSlop={10}>
                    <Ionicons name="person-circle-outline" size={42} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {activeWorkout?.id && (
                <View style={{ width: '100%' }}>
                    <View style={styles.contentContainer}>
                        <Text style={styles.contentTitle}>Active Workout</Text>
                    </View>
                    <ReanimatedSwipeable
                        renderRightActions={(progress, dragX) => <SwipeAction progress={progress} dragX={dragX} onPress={handleDeleteActiveWorkout} />}
                        containerStyle={{ width: '100%', marginVertical: 12 }}
                    >
                        <TouchableOpacity style={styles.activeCard} onPress={() => router.push('/(active-workout)')} activeOpacity={0.8}>
                            <View style={styles.cardHeader}>
                                <View style={styles.liveBadge}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveText}>IN PROGRESS</Text>
                                </View>
                                <View style={styles.timerContainer}>
                                    <Text style={styles.timerText}>{elapsedTime}</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                                </View>
                            </View>
                            <Text style={styles.cardTitle} numberOfLines={1}>{activeWorkout.title}</Text>
                        </TouchableOpacity>
                    </ReanimatedSwipeable>
                </View>
            )}

            {!activeWorkout?.id && restDayInfo?.is_rest_day && (
                <View style={{ width: '100%' }}>
                    <View style={styles.contentContainer}>
                        <Text style={styles.contentTitle}></Text>
                    </View>
                    <ReanimatedSwipeable
                        renderRightActions={(progress, dragX) => <SwipeAction progress={progress} dragX={dragX} onPress={handleDeleteRestDay} />}
                        containerStyle={{ width: '100%', marginVertical: 12 }}
                    >
                        <View 
                            style={[styles.completedCard, { paddingTop: 12, paddingLeft: 12, paddingRight: 12, paddingBottom: 0 }]} 
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.completedBadge}>
                                    <View style={styles.completedDot} />
                                    <Text style={styles.completedText}>REST DAY</Text>
                                </View>
                            </View>
                        </View>
                    </ReanimatedSwipeable>
                </View>
            )}

            {!activeWorkout?.id && !restDayInfo?.is_rest_day && todaysWorkout && (
                <View style={{ width: '100%' }}>
                    <View style={styles.contentContainer}>
                        <Text style={styles.contentTitle}>Workout Done</Text>
                    </View>
                    <ReanimatedSwipeable
                        renderRightActions={(progress, dragX) => <SwipeAction progress={progress} dragX={dragX} onPress={handleDeleteTodaysWorkout} />}
                        containerStyle={{ width: '100%', marginVertical: 12 }}
                    >
                        <TouchableOpacity 
                            style={styles.completedCard} 
                            onPress={() => router.push(`/(workouts)/${todaysWorkout.id}`)} 
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.completedBadge}>
                                    <View style={styles.completedDot} />
                                    <Text style={styles.completedText}>COMPLETED</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                            </View>
                            <Text style={styles.cardTitle} numberOfLines={1}>{todaysWorkout.title}</Text>
                        </TouchableOpacity>
                    </ReanimatedSwipeable>
                </View>
            )}

            {/* Calendar Week View */}
            <View style={{ width: '100%' }}>
                <View style={[styles.contentContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <Text style={styles.contentTitle}>This Week</Text>
                    <TouchableOpacity 
                        onPress={() => setShowCalendarModal(true)}
                        style={styles.calendarExpandButton}
                    >
                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                </View>
                <View style={styles.weekCalendarContainer}>
                    <View style={styles.weekDaysRow}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                            <View key={idx} style={styles.weekDayHeader}>
                                <Text style={styles.weekDayHeaderText}>{day}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.weekDaysRow}>
                        {(() => {
                            const today = new Date();
                            const currentDay = today.getDay();
                            const startOfWeek = new Date(today);
                            startOfWeek.setDate(today.getDate() - currentDay);
                            
                            return Array.from({ length: 7 }, (_, i) => {
                                const date = new Date(startOfWeek);
                                date.setDate(startOfWeek.getDate() + i);
                                const dateStr = date.toISOString().split('T')[0];
                                const dayData = calendarData.find(d => d.date === dateStr);
                                const isToday = date.toDateString() === today.toDateString();
                                
                                return (
                                    <View key={i} style={styles.weekDayCell}>
                                        <Text style={[styles.weekDayNumber, isToday && styles.weekDayNumberToday]}>
                                            {date.getDate()}
                                        </Text>
                                        <View style={styles.weekDayDots}>
                                            {dayData?.has_workout && (
                                                <View style={styles.workoutDot} />
                                            )}
                                            {dayData?.is_rest_day && (
                                                <View style={styles.restDayDot} />
                                            )}
                                        </View>
                                    </View>
                                );
                            });
                        })()}
                    </View>
                    {calendarStats && (
                        <View style={styles.weekStatsRow}>
                            <View style={styles.statBadge}>
                                <Text style={styles.statBadgeLabel}>Workouts</Text>
                                <Text style={styles.statBadgeValue}>{calendarStats.total_workouts}</Text>
                            </View>
                            <View style={styles.statBadge}>
                                <Text style={styles.statBadgeLabel}>Rest Days</Text>
                                <Text style={styles.statBadgeValue}>{calendarStats.total_rest_days}</Text>
                            </View>
                            <View style={styles.statBadge}>
                                <Text style={styles.statBadgeLabel}>Rest</Text>
                                <Text style={styles.statBadgeValue}>{calendarStats.days_not_worked}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Templates Section */}
            <View style={{ width: '100%' }}>
                <View style={styles.contentContainer}>
                    <Text style={styles.contentTitle}>Templates</Text>
                </View>
                {templates.length === 0 ? (
                    <TouchableOpacity 
                        style={styles.addTemplateCard}
                        onPress={() => {
                            router.push('/(templates)/create');
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={48} color="#8E8E93" />
                    </TouchableOpacity>
                ) : (
                    <View>
                        {templates.map((template) => (
                            <TouchableOpacity
                                key={template.id}
                                style={styles.templateCard}
                                onPress={async () => {
                                    try {
                                        const result = await startTemplateWorkout({ template_workout_id: template.id });
                                        if (result?.error === "ACTIVE_WORKOUT_EXISTS") {
                                            Alert.alert("Cannot Start Template", "You already have an active workout. Complete or delete it first.", [
                                                { text: "Cancel", style: "cancel" },
                                                { text: "View Active", onPress: () => router.push('/(active-workout)') }
                                            ]);
                                            return;
                                        }
                                        if (result?.id) {
                                            router.push('/(active-workout)');
                                        }
                                    } catch (error) {
                                        Alert.alert("Error", "Failed to start template workout.");
                                    }
                                }}
                                activeOpacity={0.8}
                            >
                                <View style={styles.templateCardContent}>
                                    <View style={styles.templateInfo}>
                                        <Text style={styles.templateTitle}>{template.title}</Text>
                                        <Text style={styles.templateExercises}>
                                            {template.exercises.length} {template.exercises.length === 1 ? 'exercise' : 'exercises'}
                                        </Text>
                                        {template.primary_muscle_groups.length > 0 && (
                                            <View style={styles.muscleGroupsContainer}>
                                                {template.primary_muscle_groups.slice(0, 3).map((muscle, idx) => (
                                                    <View key={idx} style={styles.muscleTag}>
                                                        <Text style={styles.muscleTagText}>{muscle}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                    <Ionicons name="play-circle-outline" size={28} color="#0A84FF" />
                                </View>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity 
                            style={styles.addTemplateCardSmall}
                            onPress={() => {
                                router.push('/(templates)/create');
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={24} color="#8E8E93" />
                            <Text style={styles.addTemplateText}>Add Template</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Layout Navigation Buttons */}
            <View style={[styles.workoutsButtonContainer, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity onPress={() => router.push('/(workouts)')} style={styles.fabButton}>
                    <Ionicons name="reader-outline" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={[styles.SupplementsButtonContainer, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity onPress={() => router.push('/(supplements)')} style={styles.fabButton}>
                    <MaterialIcons name="medication" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity 
                    style={styles.fabButton} 
                    onPress={() => {
                        Alert.alert("", "", [
                            { text: "Start New Workout", onPress: () => { setModalCreateButtonText('Start Workout'); setModalCreateButtonAction('createWorkout'); setModalVisible(true); }},
                            { text: "Add Previous Workout", onPress: () => { setModalCreateButtonText('Add Workout'); setModalCreateButtonAction('addPreviousWorkout'); setModalVisible(true); }},
                            { text: "Add Rest Day", onPress: () => {
                                Alert.alert("Add Rest Day", "This will create a rest day workout for today's date. You won't be able to add Workouts for today.", [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Add Rest Day", onPress: () => { 
                                        addRestDay();
                                     }}
                                ]);
                            }},
                            { text: "Cancel", style: "cancel" }
                        ]);
                    }}
                >
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Workout Modal */}
            <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={closeModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalInternalTitle}>
                            {modalCreateButtonAction === 'createWorkout' ? 'Start Live Workout' : 'Log Previous Workout'}
                        </Text>
                        
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

                        {modalCreateButtonAction === 'addPreviousWorkout' && (
                            <TouchableOpacity 
                                style={styles.dateSelector} 
                                onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#0A84FF" />
                                <Text style={styles.dateText}>{date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.modalBtnStack}>
                            <TouchableOpacity 
                                style={[styles.primaryBtn, !workoutTitle.trim() && { opacity: 0.5 }]} 
                                onPress={handleCreateWorkout}
                                disabled={!workoutTitle.trim()}
                            >
                                <Text style={styles.primaryBtnText}>{modalCreateButtonText}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryBtn} onPress={closeModal}>
                                <Text style={styles.secondaryBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
                                maximumDate={new Date()} // DATE LOCK: NO FUTURE DATES
                                onChange={(event, selectedDate) => { if (selectedDate) setDate(selectedDate); }}
                                textColor="#FFFFFF"
                                themeVariant="dark"
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                )}
            </Modal>

            {/* Calendar Modal */}
            <Modal
                visible={showCalendarModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCalendarModal(false)}
            >
                <View style={styles.calendarModalContainer}>
                    <View style={styles.calendarModalContent}>
                        <View style={styles.calendarModalHeader}>
                            <Text style={styles.calendarModalTitle}>Calendar</Text>
                            <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Year/Month Selector */}
                        <View style={styles.calendarControls}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedMonth > 1) {
                                        setSelectedMonth(selectedMonth - 1);
                                        fetchCalendar(selectedYear, selectedMonth - 1);
                                        fetchCalendarStats(selectedYear, selectedMonth - 1);
                                    } else {
                                        setSelectedYear(selectedYear - 1);
                                        setSelectedMonth(12);
                                        fetchCalendar(selectedYear - 1, 12);
                                        fetchCalendarStats(selectedYear - 1, 12);
                                    }
                                }}
                                style={styles.calendarNavButton}
                            >
                                <Ionicons name="chevron-back" size={20} color="#0A84FF" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert(
                                        "Select Year",
                                        "",
                                        availableYears.map(year => ({
                                            text: year.toString(),
                                            onPress: () => {
                                                setSelectedYear(year);
                                                fetchCalendar(year, selectedMonth);
                                                fetchCalendarStats(year, selectedMonth);
                                            }
                                        })).concat([{ text: "Cancel", style: "cancel" }])
                                    );
                                }}
                                style={styles.calendarMonthYear}
                            >
                                <Text style={styles.calendarMonthYearText}>
                                    {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedMonth < 12) {
                                        setSelectedMonth(selectedMonth + 1);
                                        fetchCalendar(selectedYear, selectedMonth + 1);
                                        fetchCalendarStats(selectedYear, selectedMonth + 1);
                                    } else {
                                        setSelectedYear(selectedYear + 1);
                                        setSelectedMonth(1);
                                        fetchCalendar(selectedYear + 1, 1);
                                        fetchCalendarStats(selectedYear + 1, 1);
                                    }
                                }}
                                style={styles.calendarNavButton}
                            >
                                <Ionicons name="chevron-forward" size={20} color="#0A84FF" />
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Stats */}
                        {calendarStats && (
                            <View style={styles.calendarStatsContainer}>
                                <View style={styles.calendarStatItem}>
                                    <Text style={styles.calendarStatValue}>{calendarStats.total_workouts}</Text>
                                    <Text style={styles.calendarStatLabel}>Workouts</Text>
                                </View>
                                <View style={styles.calendarStatItem}>
                                    <Text style={styles.calendarStatValue}>{calendarStats.total_rest_days}</Text>
                                    <Text style={styles.calendarStatLabel}>Rest Days</Text>
                                </View>
                                <View style={styles.calendarStatItem}>
                                    <Text style={styles.calendarStatValue}>{calendarStats.days_not_worked}</Text>
                                    <Text style={styles.calendarStatLabel}>Rest</Text>
                                </View>
                            </View>
                        )}

                        {/* Calendar Grid */}
                        <View style={styles.calendarGridContainer}>
                            <View style={styles.calendarWeekHeader}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                                    <View key={idx} style={styles.calendarDayHeader}>
                                        <Text style={styles.calendarDayHeaderText}>{day}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.calendarDaysGrid}>
                                {(() => {
                                    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
                                    const startDate = new Date(firstDay);
                                    startDate.setDate(startDate.getDate() - startDate.getDay());
                                    
                                    const days: JSX.Element[] = [];
                                    const today = new Date();
                                    
                                    for (let i = 0; i < 42; i++) {
                                        const date = new Date(startDate);
                                        date.setDate(startDate.getDate() + i);
                                        const dateStr = date.toISOString().split('T')[0];
                                        const dayData = calendarData.find(d => d.date === dateStr);
                                        const isCurrentMonth = date.getMonth() === selectedMonth - 1;
                                        const isToday = date.toDateString() === today.toDateString();
                                        
                                        days.push(
                                            <TouchableOpacity
                                                key={i}
                                                style={[
                                                    styles.calendarDayCell,
                                                    !isCurrentMonth && styles.calendarDayCellOtherMonth,
                                                    isToday && styles.calendarDayCellToday
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.calendarDayNumber,
                                                    !isCurrentMonth && styles.calendarDayNumberOtherMonth,
                                                    isToday && styles.calendarDayNumberToday
                                                ]}>
                                                    {date.getDate()}
                                                </Text>
                                                <View style={styles.calendarDayDots}>
                                                    {dayData?.has_workout && (
                                                        <View style={styles.calendarWorkoutDot} />
                                                    )}
                                                    {dayData?.is_rest_day && (
                                                        <View style={styles.calendarRestDayDot} />
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    }
                                    return days;
                                })()}
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', padding: 8, backgroundColor: '#000000' },
    headerContainer: { paddingHorizontal: 4, alignItems: 'flex-end', width: '100%', marginBottom: -28, zIndex: 10, position: 'relative' },
    contentContainer: { width: '100%', paddingHorizontal: 4, marginBottom: 8 },
    contentTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
    calendarExpandButton: { padding: 4 },
    activeCard: { width: '100%', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2C2C2E' },
    completedCard: { width: '100%', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2C2C2E' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(50, 215, 75, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#32D74B', marginRight: 6 },
    liveText: { color: '#32D74B', fontSize: 12, fontWeight: '700' },
    completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(138, 92, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    completedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B5CF6', marginRight: 6 },
    completedText: { color: '#8B5CF6', fontSize: 12, fontWeight: '700' },
    timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timerText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
    cardTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
    workoutsButtonContainer: { position: 'absolute', left: 20 },
    SupplementsButtonContainer: { position: 'absolute', left: 90 },
    fabContainer: { position: 'absolute', right: 20 },
    fabButton: { backgroundColor: '#1C1C1E', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2C2C2E' },
    modalInternalTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 24, textAlign: 'center' },
    inputWrapper: { position: 'relative', marginBottom: 16 },
    modalInput: { backgroundColor: '#2C2C2E', borderRadius: 14, padding: 18, color: '#FFFFFF', fontSize: 17, fontWeight: '500' },
    clearIcon: { position: 'absolute', right: 14, top: 18 },
    dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2C2C2E', padding: 16, borderRadius: 14, marginBottom: 24, gap: 10 },
    dateText: { color: '#0A84FF', fontSize: 16, fontWeight: '600' },
    modalBtnStack: { gap: 12 },
    primaryBtn: { backgroundColor: '#0A84FF', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
    primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    secondaryBtn: { paddingVertical: 12, alignItems: 'center' },
    secondaryBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
    sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 9999 },
    sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    bottomSheet: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, width: '100%', overflow: 'hidden' },
    sheetHeader: { height: 50, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
    doneText: { color: '#0A84FF', fontSize: 17, fontWeight: '600' },
    deleteAction: { backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', width: 80, height: '100%', borderRadius: 16 },
    addTemplateCard: { 
        width: '100%', 
        backgroundColor: '#1C1C1E', 
        borderRadius: 16, 
        padding: 60, 
        borderWidth: 1, 
        borderColor: '#2C2C2E',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    templateCard: {
        width: '100%',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        marginBottom: 12
    },
    templateCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    templateInfo: {
        flex: 1
    },
    templateTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4
    },
    templateExercises: {
        color: '#8E8E93',
        fontSize: 14,
        marginBottom: 8
    },
    muscleGroupsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6
    },
    muscleTag: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    muscleTagText: {
        color: '#A1A1A6',
        fontSize: 12,
        fontWeight: '400'
    },
    addTemplateCardSmall: {
        width: '100%',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        borderStyle: 'dashed',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16
    },
    addTemplateText: {
        color: '#8E8E93',
        fontSize: 16,
        fontWeight: '500'
    },
    // Calendar Styles
    weekCalendarContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        marginBottom: 16
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    weekDayHeader: {
        flex: 1,
        alignItems: 'center'
    },
    weekDayHeaderText: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600'
    },
    weekDayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8
    },
    weekDayNumber: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4
    },
    weekDayNumberToday: {
        color: '#0A84FF',
        fontWeight: '700'
    },
    weekDayDots: {
        flexDirection: 'row',
        gap: 3,
        justifyContent: 'center'
    },
    workoutDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0A84FF'
    },
    restDayDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#8B5CF6'
    },
    weekStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E'
    },
    statBadge: {
        alignItems: 'center'
    },
    statBadgeLabel: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 4
    },
    statBadgeValue: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700'
    },
    // Calendar Modal Styles
    calendarModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-end'
    },
    calendarModalContent: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        padding: 20
    },
    calendarModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    calendarModalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700'
    },
    calendarControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    calendarNavButton: {
        padding: 8
    },
    calendarMonthYear: {
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    calendarMonthYearText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600'
    },
    calendarStatsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E'
    },
    calendarStatItem: {
        alignItems: 'center'
    },
    calendarStatValue: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4
    },
    calendarStatLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '500'
    },
    calendarGridContainer: {
        marginTop: 10
    },
    calendarWeekHeader: {
        flexDirection: 'row',
        marginBottom: 8
    },
    calendarDayHeader: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8
    },
    calendarDayHeaderText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600'
    },
    calendarDaysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    calendarDayCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4
    },
    calendarDayCellOtherMonth: {
        opacity: 0.3
    },
    calendarDayCellToday: {
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
        borderRadius: 8
    },
    calendarDayNumber: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500'
    },
    calendarDayNumberOtherMonth: {
        color: '#8E8E93'
    },
    calendarDayNumberToday: {
        color: '#0A84FF',
        fontWeight: '700'
    },
    calendarDayDots: {
        flexDirection: 'row',
        gap: 3,
        marginTop: 2
    },
    calendarWorkoutDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#0A84FF'
    },
    calendarRestDayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#8B5CF6'
    },
});