import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

interface HistorySectionProps {
    setHistory: any[];
    isLoadingHistory: boolean;
}

export const HistorySection = ({ setHistory, isLoadingHistory }: HistorySectionProps) => {
    return (
        <View style={styles.quickHistoryContainer}>
            <Text style={styles.quickHistoryTitle}>RECENT PERFORMANCE</Text>
            {isLoadingHistory ? (
                <ActivityIndicator size="small" color={theme.colors.text.brand} style={{ marginVertical: 10 }} />
            ) : setHistory.length > 0 ? (
                <View style={styles.quickHistoryList}>
                    {setHistory.map((set, i) => (
                        <View key={i} style={styles.quickHistoryItem}>
                            <Text style={styles.quickHistoryDate}>
                                {new Date(set.workout_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Text>
                            <Text style={styles.quickHistoryValue}>{set.weight}kg × {set.reps}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.emptyHistoryText}>No past sets found</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    quickHistoryContainer: {
        marginTop: 10,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    quickHistoryTitle: {
        fontSize: 9,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
        marginBottom: 8,
    },
    quickHistoryList: {
        gap: 6,
    },
    quickHistoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quickHistoryDate: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    quickHistoryValue: {
        fontSize: 12,
        color: theme.colors.text.primary,
        fontWeight: '700',
    },
    emptyHistoryText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 4,
    },
});
