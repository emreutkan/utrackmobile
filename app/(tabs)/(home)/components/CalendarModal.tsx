import { CalendarDay, CalendarStats } from '@/api/types/index';
import { theme } from '@/constants/theme';
import { useDateStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Modal, StyleSheet, Text, Pressable, View } from 'react-native';

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

export default function CalendarModal({
    visible,
    onClose,
    calendarData,
    calendarStats,
    selectedYear,
    selectedMonth,
    onYearChange,
    onMonthChange,
    onDayClick,
}: CalendarModalProps) {
    const today = useDateStore((state) => state.today);

    const handlePreviousMonth = () => {
        if (selectedMonth > 1) {
            onMonthChange(selectedYear, selectedMonth - 1);
        } else {
            onMonthChange(selectedYear - 1, 12);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth < 12) {
            onMonthChange(selectedYear, selectedMonth + 1);
        } else {
            onMonthChange(selectedYear + 1, 1);
        }
    };

    const handleYearSelect = () => {
        const yearsToShow = [new Date().getFullYear()];

        const yearOptions: { text: string; onPress?: () => void; style?: "cancel" | "default" | "destructive" }[] = yearsToShow.map(year => ({
            text: year.toString(),
            onPress: () => {
                onYearChange(year);
            }
        }));
        yearOptions.push({ text: "Cancel", style: "cancel" });
        Alert.alert("Select Year", "", yearOptions);
    };

    return (
        <Modal
            presentationStyle="overFullScreen"
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.calendarModalContainer}>
                <View style={styles.calendarModalContent}>
                    <View style={styles.calendarModalHeader}>
                        <Text style={styles.calendarModalTitle}>Calendar</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                        </Pressable>
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
                    <View style={styles.calendarControls}>
                        <Pressable
                            onPress={handlePreviousMonth}
                            style={styles.calendarNavButton}
                        >
                            <Ionicons name="chevron-back" size={20} color={theme.colors.status.active} />
                        </Pressable>

                        <Pressable
                            onPress={handleYearSelect}
                            style={styles.calendarMonthYear}
                        >
                            <Text style={styles.calendarMonthYearText}>
                                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={handleNextMonth}
                            style={styles.calendarNavButton}
                        >
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.status.active} />
                        </Pressable>
                    </View>

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

                                for (let i = 0; i < 42; i++) {
                                    const date = new Date(startDate);
                                    date.setDate(startDate.getDate() + i);
                                    const dateStr = date.toISOString().split('T')[0];
                                    const dayData = calendarData.find(d => d.date === dateStr);
                                    const isCurrentMonth = date.getMonth() === selectedMonth - 1;
                                    const isToday = date.toDateString() === today.toDateString();

                                    days.push(
                                        <Pressable
                                            key={i}
                                            style={[
                                                styles.calendarDayCell,
                                                !isCurrentMonth && styles.calendarDayCellOtherMonth,
                                                isToday && styles.calendarDayCellToday
                                            ]}
                                            onPress={() => onDayClick(dateStr, dayData)}
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
                                        </Pressable>
                                    );
                                }
                                return days;
                            })()}
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    calendarModalContainer: {
        flex: 1,
        backgroundColor: theme.colors.ui.glassStrong,
        justifyContent: 'flex-end'
    },
    calendarModalContent: {
        backgroundColor: theme.colors.ui.glass,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        maxHeight: '90%',
        padding: theme.spacing.xl
    },
    calendarModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl
    },
    calendarModalTitle: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.xl,
        fontWeight: '700'
    },
    weekStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.xl,
    },
    statBadge: {
        alignItems: 'center'
    },
    statBadgeLabel: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.s,
        fontWeight: '300',
        marginBottom: theme.spacing.s
    },
    statBadgeValue: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.l,
        fontWeight: '500'
    },
    calendarControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl
    },
    calendarNavButton: {
        padding: theme.spacing.s
    },
    calendarMonthYear: {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s
    },
    calendarMonthYearText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.l,
        fontWeight: '500'
    },
    calendarGridContainer: {
        marginTop: theme.spacing.m
    },
    calendarWeekHeader: {
        flexDirection: 'row',
        marginBottom: theme.spacing.m
    },
    calendarDayHeader: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.s
    },
    calendarDayHeaderText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.s,
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
        padding: theme.spacing.s
    },
    calendarDayCellOtherMonth: {
        opacity: 0.3
    },
    calendarDayCellToday: {
        backgroundColor: theme.colors.ui.primaryLight,
        borderRadius: theme.borderRadius.m
    },
    calendarDayNumber: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '400'
    },
    calendarDayNumberOtherMonth: {
        color: theme.colors.text.secondary
    },
    calendarDayNumberToday: {
        color: theme.colors.status.active,
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
        backgroundColor: theme.colors.status.active
    },
    calendarRestDayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.status.rest
    },
});

