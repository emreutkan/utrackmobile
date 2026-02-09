import { theme } from '@/constants/theme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Helper to determine traffic light status based on exercise type and elapsed time
const getRestStatus = (elapsed: number, category: string) => {
    // Default to isolation if not specified
    const isCompound = category?.toLowerCase() === 'compound';

    // Thresholds in seconds
    const phase1Limit = isCompound ? 90 : 60;  // Red light limit
    const phase2Limit = isCompound ? 180 : 90; // Yellow light limit

    if (elapsed < phase1Limit) {
        return {
            text: "Resting",
            color: theme.colors.status.error,
            subText: "Recovery in progress",
            goal: phase1Limit,
            maxGoal: phase2Limit
        };
    } else if (elapsed < phase2Limit) {
        return {
            text: "Readying",
            color: theme.colors.status.warning,
            subText: "ATP level rising",
            goal: phase2Limit,
            maxGoal: phase2Limit
        };
    } else {
        return {
            text: "Ready",
            color: theme.colors.status.success,
            subText: "100% capacity",
            goal: phase2Limit,
            maxGoal: phase2Limit
        };
    }
};

// Custom hook to calculate rest timer values - can be used in any component
export const useRestTimer = (lastSetTimestamp: number | null, category?: string) => {
    const [progress, setProgress] = useState(0);
    const [timerText, setTimerText] = useState('');
    const [status, setStatus] = useState({ text: 'Resting', color: theme.colors.status.error, goal: 90, maxGoal: 180 });
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (!lastSetTimestamp) {
            setProgress(0);
            setTimerText('');
            setElapsedSeconds(0);
            return;
        }

        const update = () => {
            const now = Date.now();
            const elapsed = Math.max(0, Math.floor((now - lastSetTimestamp) / 1000));
            setElapsedSeconds(elapsed);

            // Get current status to determine goals
            const currentStatus = getRestStatus(elapsed, category || 'isolation');
            setStatus(currentStatus);

            // Progress bar calc - relative to current goal
            const p = Math.min(elapsed / currentStatus.maxGoal, 1);
            setProgress(p);

            // Timer text
            const m = Math.floor(elapsed / 60);
            const s = elapsed % 60;
            setTimerText(`${m}:${s.toString().padStart(2, '0')}`);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [lastSetTimestamp, category]);

    return {
        timerText,
        progress,
        status,
        elapsedSeconds
    };
};

interface RestTimerBarProps {
    lastSetTimestamp: number | null;
    category?: string;
}

export default function RestTimerBar({ lastSetTimestamp, category }: RestTimerBarProps) {
    const { timerText, progress, status } = useRestTimer(lastSetTimestamp, category);

    if (!lastSetTimestamp) return null;

    const formatGoal = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.statusGroup}>
                    <View style={[styles.dot, { backgroundColor: status.color }]} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.text.toUpperCase()}</Text>
                </View>
                <Text style={styles.timerText}>{timerText}</Text>
            </View>

            <View style={styles.barContainer}>
                <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: status.color }]} />
                </View>
                <Text style={styles.goalText}>TARGET {formatGoal(status.goal)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: theme.spacing.m,
        paddingHorizontal: theme.spacing.m,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        marginBottom: theme.spacing.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    statusGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    timerText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.l,
        fontWeight: '900',
        fontStyle: 'italic',
        fontVariant: ['tabular-nums'],
    },
    barContainer: {
        gap: 6,
    },
    barBg: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 2,
    },
    goalText: {
        color: theme.colors.text.tertiary,
        fontSize: 8,
        fontWeight: '800',
        textAlign: 'right',
        letterSpacing: 0.5,
    },
});

