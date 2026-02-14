import { CalendarDay } from '@/api/types/index';
import { getCalendar } from '@/api/Workout';
import { theme, typographyStyles } from '@/constants/theme';
import { useDateStore } from '@/state/userStore';
import { useSetSelectedDate } from '@/hooks/useWorkout';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { CalendarStripSkeleton } from './homeLoadingSkeleton';

interface CalendarStripProps {
  onPress: () => void;
}

export default function CalendarStrip({ onPress }: CalendarStripProps) {
  const today = useDateStore((state) => state.today);
  const setSelectedDate = useSetSelectedDate();
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const getCurrentWeekNumber = (d: Date) => {
    const start = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - start.getTime()) / 86400000);
    return Math.ceil((days + start.getDay() + 1) / 7);
  };

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const currentWeek = getCurrentWeekNumber(now);
      const result = await getCalendar(now.getFullYear(), undefined, currentWeek);

      if (result?.calendar) {
        setCalendarData(result.calendar);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCalendarData();
    }, [fetchCalendarData])
  );

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Start on Monday

  // Get current week number and month
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const currentMonth = monthNames[today.getMonth()];
  const weekNumber = Math.ceil(
    (today.getDate() + new Date(today.getFullYear(), today.getMonth(), 1).getDay()) / 7
  );

  if (loading) {
    return <CalendarStripSkeleton />;
  }

  return (
    <View style={styles.calendarStrip}>
      <Pressable style={styles.calendarHeader} onPress={onPress}>
        <Text style={typographyStyles.labelMuted}>OVERVIEW</Text>
        <Text style={styles.calendarWeek}>
          {currentMonth}, WEEK {weekNumber.toString().padStart(2, '0')}
        </Text>
      </Pressable>

      <View style={styles.calendarRow}>
        {Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(d.getDate() + i);
          const isSelected = d.toDateString() === today.toDateString();
          const isCalendarToday = d.toDateString() === new Date().toDateString();
          const dateStr = d.toISOString().split('T')[0];
          const dayData = calendarData.find((cd) => cd.date === dateStr);
          const hasActivity = dayData?.has_workout || dayData?.is_rest_day;

          return (
            <Pressable
              key={i}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellActive,
                isCalendarToday && styles.dayCellTodayBorder,
              ]}
              onPress={() => setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3)}
              </Text>
              <Text style={[styles.dayDate, isSelected && styles.dayDateActive]}>
                {d.getDate().toString().padStart(2, '0')}
              </Text>
              <View style={styles.dayDotContainer}>
                {hasActivity && (
                  <View
                    style={[
                      styles.dayDot,
                      isSelected
                        ? styles.dayDotActive
                        : dayData?.has_workout
                        ? styles.dayDotWorkout
                        : styles.dayDotRest,
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarStrip: {
    marginVertical: theme.spacing.l,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  calendarWeek: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '700',
    color: theme.colors.status.rest,
    textTransform: 'uppercase',
  },
  calendarRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  dayCell: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  dayCellActive: {
    backgroundColor: theme.colors.status.rest,
  },
  dayCellTodayBorder: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  dayName: {
    fontSize: theme.typography.sizes.label,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dayNameActive: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  dayDate: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  dayDateActive: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  dayDotContainer: {
    marginTop: theme.spacing.xs,
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dayDotActive: {
    backgroundColor: theme.colors.text.primary,
  },
  dayDotWorkout: {
    backgroundColor: theme.colors.status.rest,
  },
  dayDotRest: {
    backgroundColor: theme.colors.text.tertiary,
  },
});
