import { CalendarDay } from '@/api/types/index';
import { theme, typographyStyles } from '@/constants/theme';
import { useDateStore } from '@/state/userStore';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CalendarStripProps {
    calendarData: CalendarDay[];
    onPress: () => void;
}

export default function CalendarStrip({ calendarData, onPress }: CalendarStripProps) {
    const today = useDateStore((state) => state.today);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Start on Monday

    // Get current week number and month
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const currentMonth = monthNames[today.getMonth()];
    const weekNumber = Math.ceil((today.getDate() + new Date(today.getFullYear(), today.getMonth(), 1).getDay()) / 7);

    return (
        <View style={styles.calendarStrip}>
            <View style={styles.calendarHeader}>
                <Text style={typographyStyles.labelMuted}>OVERVIEW</Text>
                <Text style={styles.calendarWeek}>{currentMonth}, WEEK {weekNumber.toString().padStart(2, '0')}</Text>
            </View>

            <View style={styles.calendarRow}>
                {Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date(startOfWeek);
                    d.setDate(d.getDate() + i);
                    const isToday = d.toDateString() === today.toDateString();
                    const dateStr = d.toISOString().split('T')[0];
                    const dayData = calendarData.find(cd => cd.date === dateStr);
                    const hasActivity = dayData?.has_workout || dayData?.is_rest_day;

                    return (
                        <TouchableOpacity
                            key={i}
                            style={[styles.dayCell, isToday && styles.dayCellActive]}
                            onPress={onPress}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.dayName, isToday && styles.dayNameActive]}>
                                {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3)}
                            </Text>
                            <Text style={[styles.dayDate, isToday && styles.dayDateActive]}>
                                {d.getDate().toString().padStart(2, '0')}
                            </Text>
                            <View style={styles.dayDotContainer}>
                                {hasActivity && (
                                    <View style={[
                                        styles.dayDot,
                                        isToday ? styles.dayDotActive : (dayData?.has_workout ? styles.dayDotWorkout : styles.dayDotRest)
                                    ]} />
                                )}
                            </View>
                        </TouchableOpacity>
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
    calendarTitle: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
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

