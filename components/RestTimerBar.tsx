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
            text: "Rest",
            color: '#FF3B30', // Red
            subText: "Catch your breath.",
            goal: phase1Limit,
            maxGoal: phase2Limit
        };
    } else if (elapsed < phase2Limit) {
        return {
            text: "Recharging...",
            color: '#FF9F0A', // Yellow/Orange
            subText: "Wait a little longer for full benefits.",
            goal: phase2Limit,
            maxGoal: phase2Limit
        };
    } else {
        return {
            text: "Ready to Go!",
            color: '#34C759', // Green
            subText: "You are at 100% power.",
            goal: phase2Limit,
            maxGoal: phase2Limit
        };
    }
};

interface RestTimerBarProps {
    lastSetTimestamp: number | null;
    category?: string;
}

export default function RestTimerBar({ lastSetTimestamp, category }: RestTimerBarProps) {
    const [progress, setProgress] = useState(0);
    const [timerText, setTimerText] = useState('');
    const [status, setStatus] = useState({ text: 'Rest', color: '#FF3B30', goal: 90, maxGoal: 180 });

    useEffect(() => {
        if (!lastSetTimestamp) {
            setProgress(0);
            setTimerText('');
            return;
        }

        const update = () => {
            const now = Date.now();
            const elapsed = Math.max(0, Math.floor((now - lastSetTimestamp) / 1000));
            
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

    if (!lastSetTimestamp) return null;

    const formatGoal = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.restTimerContainer}>
            <View style={styles.restTimerBarBg}>
                <View style={[styles.restTimerBarFill, { width: `${progress * 100}%`, backgroundColor: status.color }]} />
            </View>
            <View style={styles.restTimerInfo}>
                <Text style={[styles.restTimerLabel, { color: status.color }]}>{status.text}</Text>
                <Text style={styles.restTimerValue}>{timerText} / {formatGoal(status.goal)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    restTimerContainer: {
        paddingBottom: 16,
        paddingTop: 12,
    },
    restTimerBarBg: {
        height: 6,
        backgroundColor: '#2C2C2E',
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
    },
    restTimerBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    restTimerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    restTimerLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    restTimerValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
});

