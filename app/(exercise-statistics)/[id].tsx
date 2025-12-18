import { getExercise1RMHistory } from '@/api/Exercises';
import { Exercise1RMHistory } from '@/api/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 80;
const chartHeight = 200;

export default function ExerciseStatisticsScreen() {
    const { id } = useLocalSearchParams();
    const [history, setHistory] = useState<Exercise1RMHistory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (id) {
            fetchHistory();
        }
    }, [id]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await getExercise1RMHistory(Number(id));
            if (data && typeof data === 'object' && 'history' in data) {
                setHistory(data);
            }
        } catch (error) {
            console.error('Failed to fetch 1RM history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderChart = () => {
        if (!history || history.history.length === 0) return null;

        const data = history.history.slice().reverse();
        const values = data.map(entry => entry.one_rep_max);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue || 1;
        const barWidth = (chartWidth - 50 - 40) / values.length;

        return (
            <View style={styles.chartWrapper}>
                {/* Y-axis labels */}
                <View style={styles.chartYAxis}>
                    {[maxValue, minValue + range * 0.5, minValue].map((value, idx) => (
                        <Text key={idx} style={styles.chartYLabelText}>
                            {value.toFixed(1)}
                        </Text>
                    ))}
                </View>
                
                {/* Chart area */}
                <View style={styles.chartArea}>
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.gridLine,
                                {
                                    top: ratio * (chartHeight - 40),
                                }
                            ]}
                        />
                    ))}
                    
                    {/* Bars */}
                    <View style={styles.barsContainer}>
                        {values.map((value, index) => {
                            const height = ((value - minValue) / range) * (chartHeight - 40);
                            return (
                                <View key={index} style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: Math.max(height, 4),
                                                width: Math.max(barWidth - 4, 8),
                                            }
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.barPoint,
                                            {
                                                bottom: height - 4,
                                            }
                                        ]}
                                    />
                                </View>
                            );
                        })}
                    </View>
                </View>
                
                {/* X-axis labels */}
                <View style={styles.chartLabels}>
                    {data.map((entry, idx) => {
                        const date = new Date(entry.workout_date);
                        return (
                            <View key={idx} style={[styles.chartLabel, { width: barWidth }]}>
                                <Text style={styles.chartLabelText}>
                                    {date.getMonth() + 1}/{date.getDate()}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {history?.exercise_name || 'Statistics'}
                    </Text>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : history && history.history.length > 0 ? (
                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    <View style={styles.statsCard}>
                        <Text style={styles.statsTitle}>1RM Progression</Text>
                        <Text style={styles.statsSubtitle}>
                            {history.total_workouts} {history.total_workouts === 1 ? 'workout' : 'workouts'}
                        </Text>
                    </View>

                    <View style={styles.chartContainer}>
                        {renderChart()}
                    </View>

                    <View style={styles.historyCard}>
                        <Text style={styles.historyTitle}>History</Text>
                        {history.history.map((entry, idx) => {
                            const date = new Date(entry.workout_date);
                            return (
                                <View key={idx} style={styles.historyItem}>
                                    <View style={styles.historyItemLeft}>
                                        <Text style={styles.historyItemDate}>
                                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </Text>
                                        <Text style={styles.historyItemWorkout}>{entry.workout_title}</Text>
                                    </View>
                                    <Text style={styles.historyItem1RM}>{entry.one_rep_max.toFixed(1)} kg</Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="stats-chart-outline" size={64} color="#8E8E93" />
                    <Text style={styles.emptyText}>No statistics available</Text>
                    <Text style={styles.emptySubtext}>
                        Complete workouts with this exercise to see your 1RM progression
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 44,
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    statsCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    statsTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    statsSubtitle: {
        color: '#8E8E93',
        fontSize: 14,
    },
    chartContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        alignItems: 'center',
    },
    chartWrapper: {
        marginBottom: 20,
        flexDirection: 'row',
    },
    chartYAxis: {
        width: 50,
        height: chartHeight,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingRight: 8,
    },
    chartYLabelText: {
        color: '#8E8E93',
        fontSize: 11,
    },
    chartArea: {
        position: 'relative',
        flex: 1,
        height: chartHeight,
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#2C2C2E',
        opacity: 0.3,
    },
    barsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: chartHeight - 40,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    barWrapper: {
        position: 'relative',
        alignItems: 'center',
    },
    bar: {
        backgroundColor: '#0A84FF',
        borderRadius: 2,
    },
    barPoint: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0A84FF',
        borderWidth: 2,
        borderColor: '#1C1C1E',
    },
    chartLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        marginLeft: 50,
    },
    chartLabel: {
        flex: 1,
        alignItems: 'center',
    },
    chartLabelText: {
        color: '#8E8E93',
        fontSize: 11,
    },
    historyCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    historyTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    historyItemLeft: {
        flex: 1,
    },
    historyItemDate: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    historyItemWorkout: {
        color: '#8E8E93',
        fontSize: 14,
    },
    historyItem1RM: {
        color: '#0A84FF',
        fontSize: 18,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
    },
});
