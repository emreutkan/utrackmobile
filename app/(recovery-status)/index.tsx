import { getRecoveryStatus } from '@/api/Workout';
import UnifiedHeader from '@/components/UnifiedHeader';
import { MuscleRecovery, RecoveryStatusResponse } from '@/api/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecoveryStatusScreen() {
    const insets = useSafeAreaInsets();
    const [recoveryStatus, setRecoveryStatus] = useState<Record<string, MuscleRecovery>>({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchRecoveryStatus = async () => {
        setIsLoading(true);
        try {
            const result: RecoveryStatusResponse = await getRecoveryStatus();
            if (result?.recovery_status) {
                setRecoveryStatus(result.recovery_status);
            }
        } catch (error) {
            setRecoveryStatus({});
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRecoveryStatus();
        }, [])
    );

    const formatRecoveryTime = (hours: number): string => {
        if (hours === 0) return 'Recovered';
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        if (hours < 24) return `${Math.round(hours)}h`;
        const days = Math.floor(hours / 24);
        const remainingHours = Math.round(hours % 24);
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    };

    const allMuscles = Object.entries(recoveryStatus).sort(([a], [b]) => a.localeCompare(b));

    const renderMuscle = ({ item }: { item: [string, MuscleRecovery] }) => {
        const [muscle, status] = item;
        const isRecovered = status.is_recovered;

        return (
            <View style={styles.muscleItem}>
                <View style={styles.muscleItemLeft}>
                    <Text style={styles.muscleName}>
                        {muscle.charAt(0).toUpperCase() + muscle.slice(1).replace(/_/g, ' ')}
                    </Text>
                    <View style={styles.barContainer}>
                        <View style={styles.barBackground}>
                            <View 
                                style={[
                                    styles.barFill,
                                    { 
                                        width: `${status.recovery_percentage}%`,
                                        backgroundColor: isRecovered ? '#32D74B' : status.recovery_percentage >= 80 ? '#32D74B' : status.recovery_percentage >= 50 ? '#FF9F0A' : '#FF3B30'
                                    }
                                ]}
                            />
                        </View>
                    </View>
                </View>
                <View style={styles.muscleItemRight}>
                    {isRecovered ? (
                        <View style={styles.recoveredBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#32D74B" />
                            <Text style={styles.recoveredText}>Recovered</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.recoveryTime}>
                                {formatRecoveryTime(status.hours_until_recovery)}
                            </Text>
                            <Text style={styles.recoveryPercentage}>
                                {status.recovery_percentage.toFixed(0)}%
                            </Text>
                        </>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <UnifiedHeader title="Recovery Status" />

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : (
                <FlatList
                    data={allMuscles}
                    renderItem={renderMuscle}
                    keyExtractor={([muscle]) => muscle}
                    contentContainerStyle={[styles.listContent, { paddingTop: 60 }]}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="body-outline" size={64} color="#8E8E93" />
                            <Text style={styles.emptyText}>No recovery data available</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    muscleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    muscleItemLeft: {
        flex: 1,
        marginRight: 12,
    },
    muscleName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'capitalize',
    },
    barContainer: {
        width: '100%',
    },
    barBackground: {
        height: 6,
        backgroundColor: '#2C2C2E',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    muscleItemRight: {
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
    recoveredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(50, 215, 75, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    recoveredText: {
        color: '#32D74B',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: 16,
    },
});



