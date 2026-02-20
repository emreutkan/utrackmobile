import { CalendarDay, CalendarStats, Workout } from '@/api/types/index';
import CalendarModal from './components/CalendarModal';
import WorkoutModal from './components/WorkoutModal';
import { theme } from '@/constants/theme';
import { parseLocalDate } from '@/utils/dateTime';
import { useDateStore } from '@/state/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView as RNScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ActiveSection from './components/ActiveSection';
import CalendarStrip from './components/CalendarStrip';
import HomeHeader from './components/HomeHeader';
import MuscleRecoverySection from './components/MuscleRecoverySection';
import StartWorkoutMenu from './components/StartWorkoutMenu';
import TemplatesSection from './components/TemplatesSection';
import { getCalendar, getCalendarStats } from '@/api/Workout';
import { useDeleteWorkout, useSetSelectedDate, useWorkouts, useCreateWorkout, useTodayStatus } from '@/hooks/useWorkout';

export default function Home() {
  const insets = useSafeAreaInsets();
  const today = useDateStore((state) => state.today);
  const setSelectedDate = useSetSelectedDate();

  // UI State
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'log'>('create');

  // Layout Refs
  const startButtonRef = useRef<View>(null);
  const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, width: 0 });

  // Calendar Modal State
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [calendarStats, setCalendarStats] = useState<CalendarStats | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // React Query hooks
  const deleteWorkoutMutation = useDeleteWorkout();
  const createWorkoutMutation = useCreateWorkout();
  const { data: workoutsData, refetch: refetchWorkouts } = useWorkouts(1, 100);
  const { data: todayStatus } = useTodayStatus(today);
  const hasActiveWorkout = todayStatus?.status === 'active';

  const onRefresh = async () => {
    setRefreshing(true);
    // Components handle their own refresh via useFocusEffect
    // Just add a small delay for UX
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleDeleteWorkout = async (id: number) => {
    Alert.alert('Delete Workout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWorkoutMutation.mutateAsync(id);
            onRefresh();
          } catch (error) {
            console.error('Error deleting workout:', error);
            Alert.alert('Error', 'Failed to delete workout');
          }
        },
      },
    ]);
  };

  const handleStartWorkoutPress = () => {
    startButtonRef.current?.measure((x, y, w, h, px, py) => {
      setMenuLayout({ x: px, y: py + h + 8, width: w });
      setShowStartMenu(true);
    });
  };

  const handleNewWorkout = () => {
    if (hasActiveWorkout) {
      setShowStartMenu(false);
      Alert.alert(
        'Active Workout Exists',
        'Cannot create a new active workout. Complete or delete the existing active workout first.'
      );
      return;
    }
    setModalMode('create');
    setModalVisible(true);
  };

  const handleLogPrevious = () => {
    setModalMode('log');
    setModalVisible(true);
  };

  const handleRestDay = async () => {
    try {
      await createWorkoutMutation.mutateAsync({ title: 'Rest Day', is_rest_day: true });
      onRefresh();
    } catch (error) {
      console.error('Error creating rest day:', error);
      Alert.alert('Error', 'Failed to create rest day');
    }
  };

  const fetchCalendar = async (year: number, month?: number) => {
    try {
      const result = await getCalendar(year, month);
      if (result?.calendar) {
        setCalendarData(result.calendar);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
    }
  };

  const fetchCalendarStats = async (year: number, month?: number) => {
    try {
      const result = await getCalendarStats({ year, month });
      if (result) {
        setCalendarStats(result);
      }
    } catch (error) {
      console.error('Error fetching calendar stats:', error);
    }
  };

  const handleCalendarDayClick = async (
    dateStr: string,
    dayData: CalendarDay | undefined | null
  ) => {
    if (!dayData) return;

    // Set overview selected date so active card and header use it; invalidates today-status cache
    setSelectedDate(parseLocalDate(dateStr));

    // Refresh workouts data to ensure we have the latest
    await refetchWorkouts();

    const workouts = workoutsData && 'results' in workoutsData ? workoutsData.results : [];

    // If it's a rest day, show delete alert
    if (dayData.is_rest_day) {
      const restDayWorkout = workouts.find((w: Workout) => {
        const workoutDate = new Date(w.datetime).toISOString().split('T')[0];
        return workoutDate === dateStr && w.is_rest_day;
      });

      if (restDayWorkout) {
        Alert.alert('Delete Rest Day', 'Do you want to delete this rest day?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteWorkoutMutation.mutateAsync(restDayWorkout.id);
                fetchCalendar(selectedYear, selectedMonth);
                fetchCalendarStats(selectedYear, selectedMonth);
              } catch (error) {
                console.error('Error deleting workout:', error);
                Alert.alert('Error', 'Failed to delete workout');
              }
            },
          },
        ]);
      }
      return;
    }

    // If it's a regular workout, navigate to workout detail
    if (dayData.has_workout) {
      const workout = workouts.find((w: Workout) => {
        const workoutDate = new Date(w.datetime).toISOString().split('T')[0];
        return workoutDate === dateStr && !w.is_rest_day;
      });

      if (workout) {
        router.push(`/(workouts)/${workout.id}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />
      <RNScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.status.active}
          />
        }
      >
        <HomeHeader today={today} insets={insets} />

        <ActiveSection
          onDeleteWorkout={handleDeleteWorkout}
          onNewWorkout={handleNewWorkout}
          onLogPrevious={handleLogPrevious}
          onRestDay={handleRestDay}
        />

        <CalendarStrip onPress={() => {
          setShowCalendarModal(true);
          fetchCalendar(selectedYear, selectedMonth);
          fetchCalendarStats(selectedYear, selectedMonth);
        }} />

        <MuscleRecoverySection onPress={() => router.push('/(recovery-status)')} />

        <TemplatesSection />
      </RNScrollView>

      <StartWorkoutMenu
        visible={showStartMenu}
        menuLayout={menuLayout}
        onClose={() => setShowStartMenu(false)}
        onNewWorkout={handleNewWorkout}
        onLogPrevious={handleLogPrevious}
        onRefresh={onRefresh}
      />

      <WorkoutModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        mode={modalMode}
        onSuccess={onRefresh}
      />

      <CalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        calendarData={calendarData}
        calendarStats={calendarStats}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={(year) => {
          setSelectedYear(year);
          fetchCalendar(year, selectedMonth);
          fetchCalendarStats(year, selectedMonth);
        }}
        onMonthChange={(year, month) => {
          setSelectedYear(year);
          setSelectedMonth(month);
          fetchCalendar(year, month);
          fetchCalendarStats(year, month);
        }}
        onDayClick={handleCalendarDayClick}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: { padding: theme.spacing.s, paddingTop: theme.spacing.xl },
});
