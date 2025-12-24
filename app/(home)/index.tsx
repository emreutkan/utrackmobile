import { checkToday, createWorkout, deleteWorkout, getActiveWorkout, getAvailableYears, getCalendar, getCalendarStats, getRecoveryStatus, getTemplateWorkouts, startTemplateWorkout } from '@/api/Workout';
import { CalendarDay, CalendarStats, MuscleRecovery, RecoveryStatusResponse, TemplateWorkout } from '@/api/types';
import { useWorkoutStore } from '@/state/userStore';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect, usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Keyboard, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView as RNScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    const pathname = usePathname();
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
    const [todayStatus, setTodayStatus] = useState<any>(null);
    const [isLoadingToday, setIsLoadingToday] = useState(true);
    const [recoveryStatus, setRecoveryStatus] = useState<Record<string, MuscleRecovery>>({});
    const [isLoadingRecovery, setIsLoadingRecovery] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showStartWorkoutMenu, setShowStartWorkoutMenu] = useState(false);
    const startWorkoutButtonRef = useRef<View>(null);
    const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const screenWidth = Dimensions.get('window').width;
    const templateCardWidth = screenWidth * 0.6;
    const addTemplateCardWidth = screenWidth * 0.34;


    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                fetchTodayStatus(),
                fetchActiveWorkout(),
                fetchWorkouts(),
                fetchTemplates(),
                fetchAvailableYears(),
                fetchRecoveryStatus(),
            ]);
            const now = new Date();
            await Promise.all([
                fetchCalendar(now.getFullYear(), now.getMonth() + 1),
                fetchCalendarStats(now.getFullYear(), now.getMonth() + 1),
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [fetchWorkouts]);


    
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

    const fetchTodayStatus = async () => {
        setIsLoadingToday(true);
        try {
            const result = await checkToday();
            setTodayStatus(result);
        } catch (error) {
            setTodayStatus(null);
        } finally {
            setIsLoadingToday(false);
        }
    };

    const fetchRecoveryStatus = async () => {
        setIsLoadingRecovery(true);
        try {
            const result: RecoveryStatusResponse = await getRecoveryStatus();
            if (result?.recovery_status) {
                setRecoveryStatus(result.recovery_status);
            }
        } catch (error) {
            setRecoveryStatus({});
        } finally {
            setIsLoadingRecovery(false);
        }
    };

    const formatRecoveryTime = (hours: number): string => {
        if (hours === 0) return 'Recovered';
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        if (hours < 24) return `${Math.round(hours)}h`;
        const days = Math.floor(hours / 24);
        const remainingHours = Math.round(hours % 24);
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    };

    const getRecoveringMuscles = () => {
        return Object.entries(recoveryStatus)
            .filter(([_, status]) => !status.is_recovered && status.fatigue_score > 0)
            .sort(([_, a], [__, b]) => a.hours_until_recovery - b.hours_until_recovery)
            .slice(0, 5);
    };

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


    useFocusEffect(
        useCallback(() => {
            fetchTodayStatus();
            fetchActiveWorkout();
            fetchWorkouts();
            fetchTemplates();
            fetchAvailableYears();
            fetchRecoveryStatus(); // Refresh recovery status when screen comes into focus
            const now = new Date();
            fetchCalendar(now.getFullYear(), now.getMonth() + 1);
            fetchCalendarStats(now.getFullYear(), now.getMonth() + 1);
        }, [fetchWorkouts])
    );

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        return () => showSubscription.remove();
    }, []);



   
    useEffect(() => {
        let interval: any;
        if (todayStatus?.active_workout && activeWorkout?.created_at) {

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
    }, [todayStatus, activeWorkout]);

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
                if (todayStatus?.active_workout_id) {
                    await deleteWorkout(todayStatus.active_workout_id);
                    setActiveWorkout(null);
                    setElapsedTime('00:00:00');
                    fetchTodayStatus();
                    fetchWorkouts();
                }
            }}
        ]);
    };

    const handleDeleteTodaysWorkout = () => {
        Alert.alert("Delete Workout", "This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                if (todayStatus?.workout?.id) {
                    await deleteWorkout(todayStatus.workout.id);
                    fetchTodayStatus();
                    fetchWorkouts();
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
                fetchTodayStatus(); // Refresh to show the new rest day
                fetchRecoveryStatus(); // Refresh recovery status
            }
        } catch (error) {
            Alert.alert("Error", "Failed to add rest day. Please try again.");
        }
    };

    const renderWorkoutSlack = () => {
        return (
            <>
                 {isLoadingToday ? (
                <View style={{ width: '100%', paddingVertical: 20 }}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : todayStatus && (
                <View style={{ width: '100%' }}>
     
                    {todayStatus.active_workout ? (
                        <ReanimatedSwipeable
                            renderRightActions={(progress, dragX) => <SwipeAction progress={progress} dragX={dragX} onPress={handleDeleteActiveWorkout} />}
                            containerStyle={{ width: '100%', marginVertical: 12 }}
                        >
                            <TouchableOpacity style={styles.activeCard} onPress={() => router.push('/(active-workout)')} activeOpacity={0.8}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.liveBadge}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.liveText}>ACTIVE WORKOUT</Text>
                                    </View>
                                    <View style={styles.timerContainer}>
                                        <Text style={styles.timerText}>{elapsedTime}</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                                    </View>
                                </View>
                                <Text style={styles.cardTitle} numberOfLines={1}>{todayStatus.active_workout_title || 'Active Workout'}</Text>
                            </TouchableOpacity>
                        </ReanimatedSwipeable>
                    ) : todayStatus.workout_performed && todayStatus.is_rest ? (
                        // Rest Day
                        <View style={{ width: '100%', marginVertical: 12 }}>
                            <View style={[styles.completedCard, { paddingTop: 12, paddingLeft: 12, paddingRight: 12, paddingBottom: 12 }]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.completedBadge}>
                                        <View style={styles.completedDot} />
                                        <Text style={styles.completedText}>REST DAY</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : todayStatus.workout_performed && todayStatus.workout ? (
                        // Today's Performed Workout
                        <ReanimatedSwipeable
                            renderRightActions={(progress, dragX) => <SwipeAction progress={progress} dragX={dragX} onPress={handleDeleteTodaysWorkout} />}
                            containerStyle={{ width: '100%', marginVertical: 12 }}
                        >
                            <TouchableOpacity 
                                style={styles.completedCard} 
                                onPress={() => router.push(`/(workouts)/${todayStatus.workout.id}`)} 
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.completedBadge}>
                                        <View style={styles.completedDot} />
                                        <Text style={styles.completedText}>WORKOUT PERFORMED</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                                </View>
                                <Text style={styles.cardTitle} numberOfLines={1}>{todayStatus.workout.title || 'Workout'}</Text>
                                {todayStatus.workout.calories_burned && parseFloat(String(todayStatus.workout.calories_burned)) > 0 && (
                                    <View style={styles.caloriesContainer}>
                                        <Ionicons name="flame" size={16} color="#FF9500" />
                                        <Text style={styles.caloriesText}>
                                            {parseFloat(String(todayStatus.workout.calories_burned)).toFixed(0)} kcal burned
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </ReanimatedSwipeable>
                    ) : (
                        // No workout today - show start workout card
                        <>
                            {showStartWorkoutMenu ? (
                                <TouchableOpacity   style={styles.startWorkoutCard}
                                onPress={() => {
                                    setShowStartWorkoutMenu(false);
                                }}
                                >
                                    {Platform.OS === 'ios' ? (
                                        <BlurView intensity={80} tint="dark" style={styles.cardHeader}>
                                            <Text style={styles.contentTitle}>Start your workout for today</Text>
                                            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
                                        </BlurView>
                                    ) : (
                                        <View style={[styles.cardHeader, { backgroundColor: 'rgba(28, 28, 30, 0.95)' }]}>
                                            <Text style={styles.contentTitle}>Start your workout for today</Text>
                                            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    ref={startWorkoutButtonRef}
                                    style={styles.startWorkoutCard} 
                                    onPress={() => {
                                        setShowStartWorkoutMenu(true);
                                    }}
                                    onLayout={(event) => {
                                        const { x, y, width, height } = event.nativeEvent.layout;
                                        startWorkoutButtonRef.current?.measureInWindow((pageX, pageY) => {
                                            setButtonLayout({ x: pageX, y: pageY, width, height });
                                        });
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.contentTitle}>Start your workout for today</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />

                                    </View>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            )}
            </>
        );
    };
    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { paddingTop: insets.top }]}>

            <RNScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#0A84FF"
                        colors={["#0A84FF"]}
                    />
                }
            >
            {renderWorkoutSlack()}

            {/* Calendar Week View */}
            <View style={[styles.WeeklyActivityContainer]}>
                           <TouchableOpacity 
                        onPress={() => setShowCalendarModal(true)}
                    >
   
                <View style={styles.weekCalendarContainer}>
         
                    {(() => {
                        const today = new Date();
                        const currentDay = today.getDay();
                        // Calculate week starting from Saturday (6 = Saturday in JS Date)
                        const startOfWeek = new Date(today);
                        const daysFromSaturday = (currentDay + 1) % 7; // Convert to Saturday-based (0=Sat, 1=Sun, etc.)
                        startOfWeek.setDate(today.getDate() - daysFromSaturday);
                        
                        const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                        
                        return (
                            <>
                                <View style={styles.weekDaysRow}>
                                    {Array.from({ length: 7 }, (_, i) => {
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
                                    })}
                                </View>
                                <View style={styles.weekDaysRow}>
                                    {weekDays.map((day, idx) => (
                                        <View key={idx} style={styles.weekDayHeader}>
                                            <Text style={styles.weekDayHeaderText}>{day}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        );
                    })()}
                 
                </View>
                
                </TouchableOpacity>

            </View>

            {/* Muscle Recovery Status */}
            <View style={{ width: '100%', paddingTop: 12 }}>
                {isLoadingRecovery ? (
                    <View style={styles.recoveryLoadingContainer}>
                        <ActivityIndicator size="small" color="#0A84FF" />
                    </View>
                ) : (
                    <TouchableOpacity 
                        style={styles.recoveryContainer}
                        onPress={() => router.push('/(recovery-status)')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.recoveryHeader}>
                            <Text style={styles.contentTitle}>Recovery Status</Text>
                            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                        </View>
                        {getRecoveringMuscles().length > 0 ? (
                            <>
                                {getRecoveringMuscles().map(([muscle, status]) => (
                                    <View key={muscle} style={styles.recoveryItem}>
                                        <View style={styles.recoveryItemLeft}>
                                            <Text style={styles.recoveryMuscleName}>
                                                {muscle.charAt(0).toUpperCase() + muscle.slice(1).replace('_', ' ')}
                                            </Text>
                                            <View style={styles.recoveryBarContainer}>
                                                <View style={styles.recoveryBarBackground}>
                                                    <View 
                                                        style={[
                                                            styles.recoveryBarFill,
                                                            { 
                                                                width: `${status.recovery_percentage}%`,
                                                                backgroundColor: status.recovery_percentage >= 80 ? '#32D74B' : status.recovery_percentage >= 50 ? '#FF9F0A' : '#FF3B30'
                                                            }
                                                        ]}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.recoveryItemRight}>
                                            <Text style={styles.recoveryTime}>
                                                {formatRecoveryTime(status.hours_until_recovery)}
                                            </Text>
                                            <Text style={styles.recoveryPercentage}>
                                                {status.recovery_percentage.toFixed(0)}%
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </>
                        ) : (
                            <View style={styles.recoveryEmptyContainer}>
                                <Text style={styles.recoveryEmptyText}>All muscles recovered</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            <View style={{ width: '100%', paddingTop: 12 }}>
                <View style={styles.contentContainer}>
                    <Text style={styles.contentTitle}>Templates</Text>
                </View>
                <RNScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                >
                        {templates.map((template) => (
                            <TouchableOpacity
                                key={template.id}
                                style={[styles.templateCard, { width: templateCardWidth }]}
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
                                    <View>
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
                            style={[styles.addTemplateCardSmall, { width: addTemplateCardWidth }]}
                            onPress={() => {
                                router.push('/(templates)/create');
                            }}
                        >
                            <Ionicons name="add" size={24} color="#8E8E93" />
                        </TouchableOpacity>
                </RNScrollView>
                
            </View>
            </RNScrollView>

            {/* Bottom Navigation Bar */}
            {Platform.OS === 'ios' ? (
                <BlurView intensity={80} tint="dark" style={[styles.bottomNavContainer, { bottom: insets.bottom + 12 }]}>
                    <TouchableOpacity 
                        onPress={() => router.push('/(workouts)')} 
                        style={styles.bottomNavButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="reader-outline" size={24} color={pathname.startsWith('/(workouts)') ? "#0A84FF" : "#8E8E93"} />
                        <Text style={[styles.bottomNavLabel, { color: pathname.startsWith('/(workouts)') ? "#0A84FF" : "#8E8E93" }]}>Workouts</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => router.push('/(supplements)')} 
                        style={styles.bottomNavButton}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="medication" size={24} color={pathname.startsWith('/(supplements)') ? "#0A84FF" : "#8E8E93"} />
                        <Text style={[styles.bottomNavLabel, { color: pathname.startsWith('/(supplements)') ? "#0A84FF" : "#8E8E93" }]}>Supplements</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => router.push('/(calculations)')} 
                        style={styles.bottomNavButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="calculator-outline" size={24} color={pathname.startsWith('/(calculations)') ? "#0A84FF" : "#8E8E93"} />
                        <Text style={[styles.bottomNavLabel, { color: pathname.startsWith('/(calculations)') ? "#0A84FF" : "#8E8E93" }]}>Calculations</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => router.push('/(account)')} 
                        style={styles.bottomNavButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-circle-outline" size={24} color={pathname.startsWith('/(account)') ? "#0A84FF" : "#8E8E93"} />
                        <Text style={[styles.bottomNavLabel, { color: pathname.startsWith('/(account)') ? "#0A84FF" : "#8E8E93" }]}>Account</Text>
                    </TouchableOpacity>
                </BlurView>
            ) : (
                <View style={[styles.bottomNavContainer, { bottom: insets.bottom + 12, backgroundColor: 'rgba(28, 28, 30, 0.95)' }]}>
                    <TouchableOpacity 
                        onPress={() => router.push('/(workouts)')} 
                        style={styles.bottomNavButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="reader-outline" size={24} color={pathname.startsWith('/(workouts)') ? "#0A84FF" : "#8E8E93"} />
                        <Text style={[styles.bottomNavLabel, { color: pathname.startsWith('/(workouts)') ? "#0A84FF" : "#8E8E93" }]}>Workouts</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => router.push('/(supplements)')} 
                        style={styles.bottomNavButton}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="medication" size={24} color={pathname.startsWith('/(supplements)') ? "#0A84FF" : "#8E8E93"} />
                        <Text style={[styles.bottomNavLabel, { color: pathname.startsWith('/(supplements)') ? "#0A84FF" : "#8E8E93" }]}>Supplements</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => router.push('/(calculations)')} 
                        style={styles.bottomNavButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="calculator-outline" size={24} color={pathname.startsWith('/(calculations)') ? "#0A84FF" : "#8E8E93"} />
                        <Text style={[styles.bottomNavLabel, { color: pathname.startsWith('/(calculations)') ? "#0A84FF" : "#8E8E93" }]}>Calculations</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => router.push('/(account)')} 
                        style={styles.bottomNavButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-circle-outline" size={24} color={pathname.startsWith('/(account)') ? "#0A84FF" : "#8E8E93"} />
                        <Text style={[styles.bottomNavLabel, { color: pathname.startsWith('/(account)') ? "#0A84FF" : "#8E8E93" }]}>Account</Text>
                    </TouchableOpacity>
                </View>
            )}


            {/* Start Workout Menu Modal */}
            {showStartWorkoutMenu && (
                <>
                    <TouchableOpacity 
                        style={styles.menuBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowStartWorkoutMenu(false)}
                    />
                    <View 
                        style={[
                            styles.startWorkoutMenu,
                            {
                                top: buttonLayout.y + buttonLayout.height + 8,
                                left: buttonLayout.x,
                                width: buttonLayout.width,
                            }
                        ]}
                    >
                        {Platform.OS === 'ios' ? (
                            <BlurView intensity={80} tint="dark" style={styles.menuBlur}>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => {
                                        setShowStartWorkoutMenu(false);
                                        setModalCreateButtonText('Start Workout');
                                        setModalCreateButtonAction('createWorkout');
                                        setModalVisible(true);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.menuItemText}>New workout</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                                </TouchableOpacity>
                                <View style={styles.menuDivider} />
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={async () => {
                                        setShowStartWorkoutMenu(false);
                                        await addRestDay();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.menuItemText}>Rest day</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                                </TouchableOpacity>
                            </BlurView>
                        ) : (
                            <View style={[styles.menuBlur, { backgroundColor: 'rgba(28, 28, 30, 0.95)' }]}>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => {
                                        setShowStartWorkoutMenu(false);
                                        setModalCreateButtonText('Start Workout');
                                        setModalCreateButtonAction('createWorkout');
                                        setModalVisible(true);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.menuItemText}>New workout</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                                </TouchableOpacity>
                                <View style={styles.menuDivider} />
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={async () => {
                                        setShowStartWorkoutMenu(false);
                                        await addRestDay();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.menuItemText}>Rest day</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </>
            )}

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
                            <Text style={styles.statBadgeLabel}>Not Worked</Text>
                            <Text style={styles.statBadgeValue}>{calendarStats.days_not_worked}</Text>
                        </View>
                    </View>
                )}
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
                                    const yearOptions: Array<{ text: string; onPress?: () => void; style?: "cancel" | "default" | "destructive" }> = availableYears.map(year => ({
                                        text: year.toString(),
                                        onPress: () => {
                                            setSelectedYear(year);
                                            fetchCalendar(year, selectedMonth);
                                            fetchCalendarStats(year, selectedMonth);
                                        }
                                    }));
                                    yearOptions.push({ text: "Cancel", style: "cancel" });
                                    Alert.alert("Select Year", "", yearOptions);
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
                                    
                                    const days: React.ReactElement[] = [];
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
    container: { flex: 1, alignItems: 'center', padding: 2, backgroundColor: '#000000' },
    headerContainer: { paddingHorizontal: 4, alignItems: 'flex-end', width: '100%', marginBottom: 8, zIndex: 10, position: 'relative' },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        alignItems: 'center',
        paddingBottom: 100,
    },
    contentContainer: { width: '100%', paddingHorizontal: 0, marginBottom: 8,},
    WeeklyActivityContainer: { width: '100%', backgroundColor: '#1C1C1E', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: '#2C2C2E' },
    contentTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
    activeCard: { width: '100%', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2C2C2E' },
    completedCard: { width: '100%', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2C2C2E' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(50, 215, 75, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#32D74B', marginRight: 6 },
    liveText: { color: '#32D74B', fontSize: 12, fontWeight: '700' },
    completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(138, 92, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    completedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B5CF6', marginRight: 6 },
    completedText: { color: '#8B5CF6', fontSize: 12, fontWeight: '700' },
    timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timerText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
    cardTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
    startWorkoutCard: {  backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2C2C2E', marginVertical: 12 },
    menuBackdrop: {
        position: 'absolute',
        top: 140,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 100,
    },
    startWorkoutMenu: {
        position: 'absolute',
        zIndex: 101,
    },
    menuBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 12,
    },
    menuItemText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '500',
    },
    menuDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#2C2C2E',
        marginHorizontal: 16,
    },
    bottomNavContainer: {
        position: 'absolute',
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        height: 64,
        borderRadius: 16,
        overflow: 'hidden',
        zIndex: 10,
    },
    bottomNavButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    bottomNavLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 4,
    },
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
    templateCard: {
        height: 120,
        marginRight: 12,
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    addTemplateCardSmall: {
        height: 120,
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    templateCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
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
   
    addTemplateText: {
        color: '#8E8E93',
        fontSize: 16,
        fontWeight: '500'
    },
    // Calendar Styles
    weekCalendarContainer: {
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
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
        
    },
    weekDayNumber: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        padding: 12,
        textAlign: 'center',
        textAlignVertical: 'center',
        borderWidth: 2,
        borderColor: '#2C2C2E',
        borderRadius: 100,
    },
    weekDayNumberToday: {
        color: '#0A84FF',
        fontWeight: '700',
        borderColor: '#0A84FF',
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
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
        borderWidth: 1,
        borderColor: '#2C2C2E',
        borderRadius: 16,
        padding: 8,
        marginVertical: 8,
        marginBottom: 16,
    },
    statBadge: {
        alignItems: 'center'
    },
    statBadgeLabel: {
        color: 'white',
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 4
    },
    statBadgeValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700'
    },
    caloriesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    caloriesText: {
        color: '#FF9500',
        fontSize: 14,
        fontWeight: '600',
    },
    recoveryLoadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    recoveryContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        marginBottom: 16,
    },
    recoveryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recoveryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    recoveryItemLeft: {
        flex: 1,
        marginRight: 12,
    },
    recoveryMuscleName: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 6,
        textTransform: 'capitalize',
    },
    recoveryBarContainer: {
        width: '100%',
    },
    recoveryBarBackground: {
        height: 6,
        backgroundColor: '#2C2C2E',
        borderRadius: 3,
        overflow: 'hidden',
    },
    recoveryBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    recoveryItemRight: {
        alignItems: 'flex-end',
    },
    recoveryTime: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    recoveryPercentage: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    recoveryEmptyContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 8,
    },
    recoveryEmptyText: {
        color: '#32D74B',
        fontSize: 14,
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