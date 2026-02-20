import { CalendarDay, CalendarStats } from '@/api/types/index';
import { theme } from '@/constants/theme';
import { useDateStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  calendarData: CalendarDay[];
  calendarStats: CalendarStats | null;
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (year: number, month: number) => void;
  onDayClick: (dateStr: string, dayData: CalendarDay | undefined | null) => void;
}

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const DAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function CalendarModal({
  visible,
  onClose,
  calendarData,
  calendarStats,
  selectedYear,
  selectedMonth,
  onMonthChange,
  onDayClick,
}: CalendarModalProps) {
  const today = useDateStore((state) => state.today);
  const insets = useSafeAreaInsets();

  const handlePreviousMonth = () => {
    if (selectedMonth > 1) onMonthChange(selectedYear, selectedMonth - 1);
    else onMonthChange(selectedYear - 1, 12);
  };

  const handleNextMonth = () => {
    if (selectedMonth < 12) onMonthChange(selectedYear, selectedMonth + 1);
    else onMonthChange(selectedYear + 1, 1);
  };

  const renderGrid = () => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const cells: React.ReactElement[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = calendarData.find((d) => d.date === dateStr);
      const isCurrentMonth = date.getMonth() === selectedMonth - 1;
      const isToday = date.toDateString() === today.toDateString();
      const hasWorkout = dayData?.has_workout;
      const isRestDay = dayData?.is_rest_day;

      cells.push(
        <Pressable
          key={i}
          style={[styles.dayCell, !isCurrentMonth && styles.dayCellOther]}
          onPress={() => onDayClick(dateStr, dayData)}
        >
          <View style={[
            styles.dayInner,
            isToday && styles.dayInnerToday,
            hasWorkout && !isToday && styles.dayInnerWorkout,
            isRestDay && !isToday && styles.dayInnerRest,
          ]}>
            <Text style={[
              styles.dayNumber,
              !isCurrentMonth && styles.dayNumberOther,
              isToday && styles.dayNumberToday,
              (hasWorkout || isRestDay) && !isToday && styles.dayNumberMarked,
            ]}>
              {date.getDate()}
            </Text>
          </View>
          {(hasWorkout || isRestDay) && (
            <View style={[
              styles.dayDot,
              { backgroundColor: hasWorkout ? theme.colors.status.active : theme.colors.status.rest },
            ]} />
          )}
        </Pressable>
      );
    }

    return cells;
  };

  return (
    <Modal
      presentationStyle="overFullScreen"
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <LinearGradient
            colors={['rgba(99,101,241,0.08)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>TRAINING CALENDAR</Text>
              <Text style={styles.subtitle}>{selectedYear}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={theme.colors.text.primary} />
            </Pressable>
          </View>

          {/* Stats row */}
          {calendarStats && (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{calendarStats.total_workouts}</Text>
                <Text style={styles.statLabel}>WORKOUTS</Text>
              </View>
              <View style={[styles.statCard, styles.statCardBorder]}>
                <Text style={[styles.statValue, { color: theme.colors.status.rest }]}>
                  {calendarStats.total_rest_days}
                </Text>
                <Text style={styles.statLabel}>REST DAYS</Text>
              </View>
              <View style={[styles.statCard, styles.statCardBorder]}>
                <Text style={[styles.statValue, { color: theme.colors.text.tertiary }]}>
                  {calendarStats.days_not_worked}
                </Text>
                <Text style={styles.statLabel}>SKIPPED</Text>
              </View>
            </View>
          )}

          {/* Month navigation */}
          <View style={styles.monthNav}>
            <Pressable style={styles.navBtn} onPress={handlePreviousMonth}>
              <Ionicons name="chevron-back" size={18} color={theme.colors.text.primary} />
            </Pressable>
            <Text style={styles.monthText}>{MONTH_NAMES[selectedMonth - 1]}</Text>
            <Pressable style={styles.navBtn} onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.text.primary} />
            </Pressable>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {DAY_HEADERS.map((d) => (
              <View key={d} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {renderGrid()}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.status.active }]} />
              <Text style={styles.legendText}>WORKOUT</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.status.rest }]} />
              <Text style={styles.legendText}>REST DAY</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,2,5,0.7)',
  },
  sheet: {
    backgroundColor: '#0e0e12',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.ui.border,
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.m,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.ui.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.l,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 2,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.l,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    gap: 4,
  },
  statCardBorder: {
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.ui.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    fontVariant: ['tabular-nums'],
    color: theme.colors.status.active,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  // Month nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: 1,
  },
  // Day headers
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 1.5,
  },
  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.m,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayCellOther: {
    opacity: 0.2,
  },
  dayInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInnerToday: {
    backgroundColor: theme.colors.status.active,
  },
  dayInnerWorkout: {
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  dayInnerRest: {
    backgroundColor: 'rgba(192,132,252,0.12)',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  dayNumberOther: {
    color: theme.colors.text.secondary,
  },
  dayNumberToday: {
    color: '#fff',
    fontWeight: '900',
  },
  dayNumberMarked: {
    fontWeight: '800',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.s,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 1.5,
  },
});
