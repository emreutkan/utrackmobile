import { healthService } from '@/api/Health';
import { CalendarDay, CalendarStats, CheckTodayResponse, MuscleRecovery, TemplateWorkout, Workout } from '@/api/types';
import { checkToday, createWorkout, deleteWorkout, getActiveWorkout, getCalendar, getCalendarStats, getRecoveryStatus, getTemplateWorkouts, getWorkouts, startTemplateWorkout } from '@/api/Workout';
import WorkoutModal from '@/components/WorkoutModal';
import { useHomeLoadingStore, useWorkoutStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    RefreshControl,
    ScrollView as RNScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Easing, Extrapolation, interpolate, SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// 1. ANIMATED COMPONENTS
// ============================================================================

interface SwipeActionProps {
    progress: SharedValue<number>;
    onPress: () => void;
}

const SwipeAction = ({ progress, onPress }: SwipeActionProps) => {
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

const LoadingSkeleton = ({ type = 'workout' }: { type?: 'workout' | 'recovery' }) => {
    const opacity = useSharedValue(0.3);
    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            -1, true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

        return (
        <View style={[styles.skeletonContainer, type === 'recovery' && { height: 100 }]}>
            <Animated.View style={[styles.skeletonCard, animatedStyle]} />
        </View>
    );
};

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================

export default function Home() {
    const insets = useSafeAreaInsets();
    const screenWidth = Dimensions.get('window').width;
    
    // --- Store & State ---
    const { workouts } = useWorkoutStore();
    const { 
        isInitialLoadComplete, 
        todayStatus: cachedTodayStatus, 
        recoveryStatus: cachedRecoveryStatus,
        setInitialLoadComplete,
        setTodayStatus: setCachedTodayStatus,
        setRecoveryStatus: setCachedRecoveryStatus
    } = useHomeLoadingStore();

    // Data State
    const [todayStatus, setTodayStatus] = useState<CheckTodayResponse | null>(cachedTodayStatus);
    const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
    const [recoveryStatus, setRecoveryStatus] = useState<Record<string, MuscleRecovery>>(cachedRecoveryStatus || {});
    const [templates, setTemplates] = useState<TemplateWorkout[]>([]);
    const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
    const [calendarStats, setCalendarStats] = useState<CalendarStats | null>(null);
    const [todaySteps, setTodaySteps] = useState<number | null>(null);

    // UI State
    const [isLoading, setIsLoading] = useState(!isInitialLoadComplete);
    const [refreshing, setRefreshing] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    
    // Modals & Inputs
    const [modalVisible, setModalVisible] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showStartMenu, setShowStartMenu] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'log'>('create');
    
    // Layout Refs
    const startButtonRef = useRef<View>(null);
    const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, width: 0 });

    // Calendar State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // ========================================================================
    // 3. DATA FETCHING
    // ========================================================================

    const fetchAllData = useCallback(async () => {
        try {
            const now = new Date();
            const currentWeek = getCurrentWeekNumber(now);

            // Parallel fetching for speed
            const [status, active, tpls, recovery, steps, cal, calStats] = await Promise.all([
                checkToday(),
                getActiveWorkout(),
                getTemplateWorkouts(),
                getRecoveryStatus(),
                fetchSteps(),
                getCalendar(now.getFullYear(), undefined, currentWeek),
                getCalendarStats(now.getFullYear(), undefined, currentWeek)
            ]);

            setTodayStatus(status);
            setCachedTodayStatus(status);
            
            if (active && typeof active === 'object' && 'id' in active) setActiveWorkout(active);
            else setActiveWorkout(null);

            setTemplates(Array.isArray(tpls) ? tpls : []);
            
            if (recovery?.recovery_status) {
                setRecoveryStatus(recovery.recovery_status);
                setCachedRecoveryStatus(recovery.recovery_status);
            }

            setTodaySteps(steps);
            setCalendarData(cal?.calendar || []);
            setCalendarStats(calStats);

        } catch (e) {
            console.error("Home fetch error:", e);
        }
    }, []);

    const fetchSteps = async () => {
        try {
            const init = await healthService.initialize();
            return init ? await healthService.getTodaySteps() : null;
        } catch { return null; }
    };

    const getCurrentWeekNumber = (d: Date) => {
        const start = new Date(d.getFullYear(), 0, 1);
        const days = Math.floor((d.getTime() - start.getTime()) / 86400000);
        return Math.ceil((days + start.getDay() + 1) / 7);
    };

    // Calendar helper functions
    const fetchCalendar = async (year: number, month?: number, week?: number) => {
        try {
            const result = await getCalendar(year, month, week);
            if (result?.calendar) {
                setCalendarData(result.calendar);
            }
        } catch (error) {
            console.error('Error fetching calendar:', error);
        }
    };

    const fetchCalendarStats = async (year: number, month?: number, week?: number) => {
        try {
            const result = await getCalendarStats(year, month, week);
            if (result) {
                setCalendarStats(result);
            }
        } catch (error) {
            console.error('Error fetching calendar stats:', error);
        }
    };

    const fetchAvailableYears = async () => {
        try {
            // For now, generate years from current year back 5 years
            const currentYear = new Date().getFullYear();
            const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
            setAvailableYears(years);
        } catch (error) {
            setAvailableYears([new Date().getFullYear()]);
        }
    };

    // Initial Load
    useFocusEffect(
        useCallback(() => {
            if (!isInitialLoadComplete) {
                fetchAllData().then(() => {
                    setIsLoading(false);
                    setInitialLoadComplete(true);
                });
            } else {
                // Background refresh on focus - refresh templates too to prevent disappearing
                getActiveWorkout().then(w => {
                    if (w && typeof w === 'object' && 'id' in w) setActiveWorkout(w);
                    else setActiveWorkout(null);
                });
                checkToday().then(setTodayStatus);
                getTemplateWorkouts().then(tpls => {
                    setTemplates(Array.isArray(tpls) ? tpls : []);
                });
                fetchSteps().then(setTodaySteps);
            }
        }, [isInitialLoadComplete])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    };

    // Timer Logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (activeWorkout?.created_at) {
            const start = new Date(activeWorkout.created_at).getTime();
            const tick = () => {
                const diff = Math.max(0, new Date().getTime() - start);
                const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
                const m = Math.floor((diff / 60000) % 60).toString().padStart(2, '0');
                const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
                setElapsedTime(`${h}:${m}:${s}`);
            };
            tick();
            interval = setInterval(tick, 1000);
        } else {
            setElapsedTime('00:00:00');
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeWorkout]);

    // ========================================================================
    // 4. ACTIONS
    // ========================================================================

    const handleModalSuccess = async () => {
        await fetchAllData();
    };

    const handleDeleteWorkout = async (id: number, isActive: boolean) => {
        Alert.alert("Delete Workout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                await deleteWorkout(id);
                if (isActive) setActiveWorkout(null);
                fetchAllData();
            }}
        ]);
    };

    const handleCalendarDayClick = async (dateStr: string, dayData: CalendarDay | undefined) => {
        if (!dayData) return;

        // If it's a rest day, show delete alert
        if (dayData.is_rest_day) {
            try {
                // Fetch workouts for this date to find the rest day workout ID
                const workoutsResponse = await getWorkouts();
                if (workoutsResponse && 'results' in workoutsResponse) {
                    const restDayWorkout = workoutsResponse.results.find((w: Workout) => {
                        const workoutDate = new Date(w.datetime).toISOString().split('T')[0];
                        return workoutDate === dateStr && w.is_rest_day;
                    });

                    if (restDayWorkout) {
                        Alert.alert("Delete Rest Day", "Do you want to delete this rest day?", [
                            { text: "Cancel", style: "cancel" },
                            { text: "Delete", style: "destructive", onPress: async () => {
                                await deleteWorkout(restDayWorkout.id);
                                fetchAllData();
                                fetchCalendar(selectedYear, selectedMonth);
                                fetchCalendarStats(selectedYear, selectedMonth);
                            }}
                        ]);
                    }
                }
            } catch (error) {
                console.error("Error fetching workout for rest day:", error);
            }
            return;
        }

        // If it's a regular workout, navigate to workout detail
        if (dayData.has_workout) {
            try {
                const workoutsResponse = await getWorkouts();
                if (workoutsResponse && 'results' in workoutsResponse) {
                    const workout = workoutsResponse.results.find((w: Workout) => {
                        const workoutDate = new Date(w.datetime).toISOString().split('T')[0];
                        return workoutDate === dateStr && !w.is_rest_day;
                    });

                    if (workout) {
                        router.push(`/(workouts)/${workout.id}`);
                    }
                }
            } catch (error) {
                console.error("Error fetching workout:", error);
            }
        }
    };

    // ========================================================================
    // 5. RENDER HELPERS
    // ========================================================================

    const renderActiveSection = () => {
        if (activeWorkout) {
        return (
                <ReanimatedSwipeable renderRightActions={(p, d) => <SwipeAction progress={p} onPress={() => handleDeleteWorkout(activeWorkout.id, true)} />}>
                    <TouchableOpacity style={styles.activeCard} onPress={() => router.push('/(active-workout)')} activeOpacity={0.9}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.liveBadge}>
                                <Text style={styles.liveText}>ACTIVE</Text>
                                    </View>
                                        <Text style={styles.timerText}>{elapsedTime}</Text>
                                    </View>
                        <Text style={styles.activeTitle} numberOfLines={1}>{activeWorkout.title}</Text>
     
                    </TouchableOpacity>
                </ReanimatedSwipeable>
            );
        }

        // Check for rest day first (priority)
        if (todayStatus && 'workout' in todayStatus && todayStatus.workout && 'is_rest_day' in todayStatus.workout && todayStatus.workout.is_rest_day) {
            const w = todayStatus.workout;
            return (
                <ReanimatedSwipeable renderRightActions={(p, d) => <SwipeAction progress={p} onPress={() => handleDeleteWorkout(w.id, false)} />}>
                    <TouchableOpacity style={styles.completedCard} onPress={() => router.push(`/(workouts)/${w.id}`)} activeOpacity={0.9}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.liveBadge, styles.completedBadge]}>
                                <Ionicons name="cafe" size={12} color="#8B5CF6" />
                                <Text style={styles.completedText}>REST DAY</Text>
                            </View>
                        </View>
                        <Text style={styles.activeTitle}>{w.title}</Text>
                    </TouchableOpacity>
                </ReanimatedSwipeable>
            );
        }
        
        // Also check if rest day is set directly on todayStatus (fallback)
        if (todayStatus && 'is_rest' in todayStatus && todayStatus.is_rest) {
            return (
                <View style={styles.completedCard}>
                        <View style={[styles.liveBadge, styles.completedBadge]}>
                            <Ionicons name="cafe" size={12} color="#8B5CF6" />
                            <Text style={styles.completedText}>REST DAY</Text>
                        </View>
                </View>
            );
        }

        // Check for completed workout
        if (todayStatus && 'workout_performed' in todayStatus && todayStatus.workout_performed && 'workout' in todayStatus && todayStatus.workout) {
            const w = todayStatus.workout;
            return (
                <ReanimatedSwipeable renderRightActions={(p, d) => <SwipeAction progress={p} onPress={() => handleDeleteWorkout(w.id, false)} />}>
                    <TouchableOpacity style={styles.completedCard} onPress={() => router.push(`/(workouts)/${w.id}`)} activeOpacity={0.9}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.liveBadge, styles.completedBadge]}>
                                <Ionicons name="checkmark" size={12} color="#8B5CF6" />
                                <Text style={styles.completedText}>COMPLETED</Text>
                            </View>
                            <Text style={styles.timerText}>{w.calories_burned ? `${Math.round(Number(w.calories_burned))} kcal` : ''}</Text>
                        </View>
                        <Text style={styles.activeTitle}>{w.title}</Text>
                    </TouchableOpacity>
                </ReanimatedSwipeable>
            );
        }

        return (
                    <TouchableOpacity 
                ref={startButtonRef}
                style={styles.startCard} 
                                    onPress={() => {
                    startButtonRef.current?.measure((x, y, w, h, px, py) => {
                        setMenuLayout({ x: px, y: py + h + 8, width: w });
                        setShowStartMenu(true);
                                        });
                                    }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.startTitle}>Start Workout</Text>
                <Ionicons name="chevron-down" size={20} color="#545458" />
                    </TouchableOpacity>
        );
    };

    const renderCalendarStrip = () => {
                        const today = new Date();
                        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - ((today.getDay() + 1) % 7)); // Start on Saturday
                        
                        return (
            <TouchableOpacity style={styles.calendarStrip} onPress={() => setShowCalendarModal(true)} activeOpacity={0.9}>
                <View style={styles.calendarRow}>
                    {Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date(startOfWeek);
                        d.setDate(d.getDate() + i);
                        const isToday = d.toDateString() === today.toDateString();
                        const dateStr = d.toISOString().split('T')[0];
                        const dayData = calendarData.find(cd => cd.date === dateStr);
                                        
                                        return (
                            <View key={i} style={styles.dayCell}>
                                <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                                    {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                                                </Text>
                                <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                                    <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{d.getDate()}</Text>
                                    <View style={styles.dotContainer}>
                                        {dayData?.has_workout && <View style={styles.workoutDot} />}
                                        {dayData?.is_rest_day && <View style={styles.restDot} />}
                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
            </TouchableOpacity>
        );
    };

    const renderMetrics = () => {
        const recovering = Object.entries(recoveryStatus)
            .filter(([_, s]) => !s.is_recovered && Number(s.fatigue_score) > 0)
            .sort((a, b) => a[1].hours_until_recovery - b[1].hours_until_recovery)
            .slice(0, 3); // Top 3 most fatigued

        return (
            <View style={styles.metricsRow}>
                {/* Steps Card */}
                {todaySteps !== null && (
                    <View style={styles.metricCard}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="footsteps" size={16} color="#0A84FF" />
                            <Text style={styles.metricTitle}>Steps</Text>
            </View>
                        <Text style={styles.metricValue}>{todaySteps.toLocaleString()}</Text>
                </View>
            )}
                
                {/* Recovery Card */}
                            <TouchableOpacity
                    style={[styles.metricCard, { flex: 2 }]} 
                        onPress={() => router.push('/(recovery-status)')}
                >
                    <View style={styles.metricHeader}>
                        <Text style={styles.metricTitle}>Recovery</Text>
                        <Ionicons name="chevron-forward" size={14} color="#545458" style={{ marginLeft: 'auto' }} />
                        </View>
                    
                    {recovering.length > 0 ? (
                        <View style={styles.recoveryList}>
                            {recovering.map(([muscle, status]) => {
                                const pct = Number(status.recovery_percentage);
                                const hoursLeft = Number(status.hours_until_recovery);
                                const isReady = status.is_recovered || pct >= 90;
                                const color = pct > 80 ? '#30D158' : '#FF9F0A';
                                
                                return (
                                    <View key={muscle} style={styles.recoveryItem}>
                                        <View style={styles.recoveryRow}>
                                            <Text style={styles.recoveryName}>{muscle.replace(/_/g, ' ')}</Text>
                                            <View style={styles.recoveryBar}>
                                                <View style={[
                                                    styles.recoveryFill, 
                                                    { width: `${pct}%`, backgroundColor: color }
                                                ]} />
                                            </View>
                                            <View style={styles.recoveryInfo}>
                                                <Text style={[styles.recoveryPct, { color }]}>{pct.toFixed(0)}%</Text>
                                                <Text style={styles.recoveryTime}>
                                                    {isReady ? 'Ready' : `${Math.round(hoursLeft)}h`}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <Text style={styles.allRecovered}>All muscles recovered</Text>
                    )}
                    </TouchableOpacity>
            </View>
        );
    };
                                        
    if (isLoading && !isInitialLoadComplete) {
                        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <LoadingSkeleton />
                <LoadingSkeleton type="recovery" />
                                    </View>
                                        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
                <RNScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A84FF" />}
            >
                {/* Header Date */}
                <View style={styles.header}>
                    <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                                </View>
            
                {/* 1. Active Workout or Start Button */}
                {renderActiveSection()}

                {/* 2. Calendar Strip */}
                {renderCalendarStrip()}

                {/* 3. Metrics (Steps & Recovery) */}
                {renderMetrics()}

                {/* 4. Templates */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Templates</Text>
                    <TouchableOpacity onPress={() => router.push('/(templates)/create')}>
                        <Ionicons name="add-circle" size={24} color="#0A84FF" />
                            </TouchableOpacity>
                </View>
                <RNScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateList}>
                    {templates.map(tpl => (
                        <TouchableOpacity 
                            key={tpl.id} 
                            style={styles.templateCard} 
                            onPress={() => {
                                startTemplateWorkout({ template_workout_id: tpl.id }).then(res => {
                                    if(res?.id) router.push('/(active-workout)');
                                });
                            }}
                        >
                            <View style={styles.templateIcon}>
                                <Text style={styles.templateIconText}>{tpl.title.charAt(0)}</Text>
                            </View>
                            <Text style={styles.templateName} numberOfLines={2}>{tpl.title}</Text>
                            <Text style={styles.templateCount}>{tpl.exercises.length} Exercises</Text>
                        </TouchableOpacity>
                    ))}
                </RNScrollView>
                
            </RNScrollView>

            {/* --- Start Workout Menu (Popover) --- */}
            {showStartMenu && (
                <>
                    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowStartMenu(false)} />
                    <Animated.View style={[styles.popover, { top: menuLayout.y, left: menuLayout.x, width: menuLayout.width }]}>
                        <BlurView intensity={80} tint="dark" style={styles.popoverBlur}>
                            <TouchableOpacity style={styles.popoverItem} onPress={() => { setShowStartMenu(false); setModalMode('create'); setModalVisible(true); }}>
                                <Text style={styles.popoverText}>New Workout</Text>
                                </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.popoverItem} onPress={() => { setShowStartMenu(false); setModalMode('log'); setModalVisible(true); }}>
                                <Text style={styles.popoverText}>Log Previous</Text>
                                </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.popoverItem} onPress={async () => { 
                                setShowStartMenu(false); 
                                await createWorkout({ title: 'Rest Day', is_rest_day: true }); 
                                onRefresh();
                            }}>
                                <Text style={styles.popoverText}>Rest Day</Text>
                                </TouchableOpacity>
                        </BlurView>
                    </Animated.View>
                </>
            )}

            {/* --- Create Workout Modal --- */}
            <WorkoutModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                mode={modalMode}
                onSuccess={handleModalSuccess}
            />

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
                                    const yearsToShow = availableYears.length > 0 
                                        ? availableYears 
                                        : [new Date().getFullYear()];
                                    
                                    if (!yearsToShow.includes(selectedYear)) {
                                        yearsToShow.push(selectedYear);
                                        yearsToShow.sort((a, b) => b - a);
                                    }
                                    
                                    const yearOptions: Array<{ text: string; onPress?: () => void; style?: "cancel" | "default" | "destructive" }> = yearsToShow.map(year => ({
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
                                                onPress={() => handleCalendarDayClick(dateStr, dayData)}
                                                activeOpacity={0.7}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    scrollContent: { padding: 10 },
    
    // Header
    header: { marginBottom: 12 },
    headerDate: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Active Card
    activeCard: { backgroundColor: '#111111', borderRadius: 20, padding: 12, marginBottom: 12, borderWidth: 0.5, borderColor: '#222222' },
    completedCard: { backgroundColor: '#111111', borderRadius: 20, padding: 12, marginBottom: 12, borderWidth: 0.5, borderColor: '#222222', opacity: 0.8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(48, 209, 88, 0.1)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, gap: 6 },
    completedBadge: { backgroundColor: 'rgba(139, 92, 246, 0.1)' },
    liveText: { color: '#30D158', fontSize: 12, fontWeight: '700' },
    completedText: { color: '#8B5CF6', fontSize: 12, fontWeight: '700' },
    timerText: { color: 'orange', fontSize: 16, fontVariant: ['tabular-nums'], fontWeight: '600' },
    activeTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 8 },
    activeFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    activeSubtext: { color: '#8E8E93', fontSize: 14 },
    deleteAction: { backgroundColor: '#FF453A', justifyContent: 'center', alignItems: 'center', width: 80, height: '100%', borderRadius: 20, marginLeft: 12 },

    // Start Card
    startCard: { backgroundColor: '#111111', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 0.5, borderColor: '#222222' },
    startTitle: { fontSize: 24, fontWeight: '400', color: '#FFF'},

    // Calendar Strip
    calendarStrip: { backgroundColor: '#111111', borderRadius: 20, padding: 12, marginBottom: 12, borderWidth: 0.5, borderColor: '#222222' },
    calendarRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayCell: { alignItems: 'center', flex: 1 },
    dayName: { fontSize: 11, color: '#8E8E93', marginBottom: 6, textTransform: 'uppercase' },
    dayNameToday: { color: '#0A84FF', fontWeight: '700' },
    dayCircle: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
    dayCircleToday: { backgroundColor: '#0A84FF' },
    dayNum: { fontSize: 15, color: '#FFF', fontWeight: '500' },
    dayNumToday: { color: '#FFF', fontWeight: '700' },
    dotContainer: { flexDirection: 'row', gap: 2, position: 'absolute', bottom: -6 },
    workoutDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#0A84FF' },
    restDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#8B5CF6' },

    // Metrics
    metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    metricCard: { flex: 1, backgroundColor: '#111111', borderRadius: 20, padding: 16, borderWidth: 0.5, borderColor: '#222222' },
    metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    metricTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
    metricValue: { fontSize: 22, fontWeight: '700', color: '#FFF' },
    recoveryList: { gap: 12 },
    recoveryItem: { marginBottom: 4 },
    recoveryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    recoveryName: { fontSize: 13, fontWeight: '600', color: '#FFF', textTransform: 'capitalize', minWidth: 70 },
    recoveryBar: { flex: 1, height: 6, backgroundColor: '#1A1A1A', borderRadius: 3, overflow: 'hidden' },
    recoveryFill: { height: '100%', borderRadius: 3 },
    recoveryInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 60 },
    recoveryPct: { fontSize: 12, fontWeight: '700' },
    recoveryTime: { fontSize: 12, fontWeight: '500', color: '#8E8E93' },
    allRecovered: { fontSize: 17, color: '#30D158', fontWeight: '600' },

    // Templates
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    templateList: { paddingRight: 16, gap: 12 },
    templateCard: { width: 140, height: 140, backgroundColor: '#111111', borderRadius: 20, padding: 12, justifyContent: 'space-between', borderWidth: 0.5, borderColor: '#222222' },
    templateIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center' },
    templateIconText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    templateName: { fontSize: 14, fontWeight: '600', color: '#FFF' },
    templateCount: { fontSize: 12, color: '#8E8E93' },

    // Popover
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 },
    popover: { position: 'absolute', zIndex: 101, borderRadius: 14, overflow: 'hidden' },
    popoverBlur: { padding: 0 },
    popoverItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    popoverText: { color: '#FFF', fontSize: 16 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#545458' },

    // Skeleton
    skeletonContainer: { padding: 16, marginBottom: 16 },
    skeletonCard: { width: '100%', height: 120, backgroundColor: '#1C1C1E', borderRadius: 20 },
    
    // Calendar Modal Styles
    calendarModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-end'
    },
    calendarModalContent: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        maxHeight: '90%',
        padding: 24
    },
    calendarModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    calendarModalTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700'
    },
    weekStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        borderRadius: 22,
        padding: 16,
        marginBottom: 24,
    },
    statBadge: {
        alignItems: 'center'
    },
    statBadgeLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '300',
        marginBottom: 8
    },
    statBadgeValue: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '500'
    },
    calendarControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
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
        fontWeight: '500'
    },
    calendarGridContainer: {
        marginTop: 16
    },
    calendarWeekHeader: {
        flexDirection: 'row',
        marginBottom: 16
    },
    calendarDayHeader: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8
    },
    calendarDayHeaderText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '300'
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
        padding: 8
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
        fontSize: 17,
        fontWeight: '400'
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