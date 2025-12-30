import { getRecoveryStatus } from '@/api/Workout';
import UnifiedHeader from '@/components/UnifiedHeader';
import { MuscleRecovery, RecoveryStatusResponse } from '@/api/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, ScrollView } from 'react-native';
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
        if (hours === 0) return 'Now';
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        if (hours < 24) return `${Math.round(hours)}h`;
        const days = Math.floor(hours / 24);
        const remainingHours = Math.round(hours % 24);
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    };

    const muscleCategories = {
        upper: ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'lats', 'traps', 'lower_back'],
        lower: ['quads', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'],
        core: ['abs', 'obliques']
    };

    const getMuscleCategory = (muscle: string): 'upper' | 'lower' | 'core' => {
        if (muscleCategories.upper.includes(muscle)) return 'upper';
        if (muscleCategories.lower.includes(muscle)) return 'lower';
        return 'core';
    };

    const { groupedMuscles, stats } = useMemo(() => {
        const all = Object.entries(recoveryStatus);
        
        const grouped: Record<'upper' | 'lower' | 'core', {
            recovering: [string, MuscleRecovery][];
            recovered: [string, MuscleRecovery][];
        }> = {
            upper: { recovering: [], recovered: [] },
            lower: { recovering: [], recovered: [] },
            core: { recovering: [], recovered: [] }
        };

        all.forEach(([muscle, status]) => {
            const category = getMuscleCategory(muscle);
            if (!status.is_recovered && Number(status.fatigue_score) > 0) {
                grouped[category].recovering.push([muscle, status]);
            } else {
                grouped[category].recovered.push([muscle, status]);
            }
        });

        // Sort recovering by hours until recovery, recovered alphabetically
        Object.keys(grouped).forEach((cat) => {
            const category = cat as 'upper' | 'lower' | 'core';
            grouped[category].recovering.sort(([_, a], [__, b]) => Number(a.hours_until_recovery) - Number(b.hours_until_recovery));
            grouped[category].recovered.sort(([a], [b]) => a.localeCompare(b));
        });

        const totalMuscles = all.length;
        const recoveredCount = all.filter(([_, s]) => s.is_recovered).length;
        const recoveringCount = all.filter(([_, s]) => !s.is_recovered && Number(s.fatigue_score) > 0).length;
        const avgRecovery = all.length > 0 
            ? all.reduce((sum, [_, s]) => sum + Number(s.recovery_percentage), 0) / all.length 
            : 100;

        return {
            groupedMuscles: grouped,
            stats: {
                total: totalMuscles,
                recovered: recoveredCount,
                recovering: recoveringCount,
                avgRecovery: Math.round(avgRecovery)
            }
        };
    }, [recoveryStatus]);

    const getRecoveryColor = (status: MuscleRecovery): string => {
        if (status.is_recovered) return '#32D74B';
        const percentage = Number(status.recovery_percentage);
        if (percentage >= 80) return '#32D74B';
        if (percentage >= 50) return '#FF9F0A';
        return '#FF3B30';
    };

    const getRecoveryStatusText = (status: MuscleRecovery): string => {
        if (status.is_recovered) return 'Ready';
        const percentage = Number(status.recovery_percentage);
        if (percentage >= 80) return 'Almost Ready';
        if (percentage >= 50) return 'Recovering';
        return 'Needs Rest';
    };

    const renderSummaryCard = () => {
        const hasRecovering = stats.recovering > 0;
        const allRecovered = stats.recovered === stats.total && stats.total > 0;

        return (
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Ionicons 
                        name={allRecovered ? "checkmark-circle" : hasRecovering ? "time-outline" : "body-outline"} 
                        size={24} 
                        color={allRecovered ? "#32D74B" : hasRecovering ? "#FF9F0A" : "#8E8E93"} 
                    />
                    <Text style={styles.summaryTitle}>
                        {allRecovered ? "All Muscles Recovered" : hasRecovering ? `${stats.recovering} Muscle${stats.recovering > 1 ? 's' : ''} Recovering` : "No Recent Activity"}
                    </Text>
                </View>
                <View style={styles.summaryStats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.recovered}</Text>
                        <Text style={styles.statLabel}>Recovered</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: hasRecovering ? '#FF9F0A' : '#8E8E93' }]}>
                            {stats.recovering}
                        </Text>
                        <Text style={styles.statLabel}>Recovering</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.avgRecovery}%</Text>
                        <Text style={styles.statLabel}>Avg Recovery</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderMuscle = (item: [string, MuscleRecovery], isRecovering: boolean) => {
        const [muscle, status] = item;
        const color = getRecoveryColor(status);
        const statusText = getRecoveryStatusText(status);

        return (
            <View style={[styles.muscleItem, isRecovering && styles.muscleItemRecovering]}>
                <View style={styles.muscleItemLeft}>
                    <View style={styles.muscleHeader}>
                        <Text style={styles.muscleName}>
                            {muscle.charAt(0).toUpperCase() + muscle.slice(1).replace(/_/g, ' ')}
                        </Text>
                        {isRecovering && (
                            <View style={[styles.statusBadge, { backgroundColor: `${color}15` }]}>
                                <View style={[styles.statusDot, { backgroundColor: color }]} />
                                <Text style={[styles.statusText, { color }]}>{statusText}</Text>
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.barContainer}>
                        <View style={styles.barBackground}>
                            <View 
                                style={[
                                    styles.barFill,
                                    { 
                                        width: `${Number(status.recovery_percentage)}%`,
                                        backgroundColor: color
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.barPercentage}>{Number(status.recovery_percentage).toFixed(0)}%</Text>
                    </View>

                    {isRecovering && (
                        <View style={styles.muscleDetails}>
                            {status.total_sets > 0 && (
                                <View style={styles.detailRow}>
                                    <Ionicons name="barbell-outline" size={14} color="#8E8E93" />
                                    <Text style={styles.detailText}>{status.total_sets} sets</Text>
                                </View>
                            )}
                            {Number(status.fatigue_score) > 0 && (
                                <View style={styles.detailRow}>
                                    <Ionicons name="flash-outline" size={14} color="#8E8E93" />
                                    <Text style={styles.detailText}>Fatigue: {Number(status.fatigue_score).toFixed(1)}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
                {!status.is_recovered && (
                    <View style={styles.muscleItemRight}>
                        <View style={styles.recoveryInfo}>
                            <Ionicons name="time" size={18} color={color} />
                            <Text style={[styles.recoveryTime, { color }]}>
                                {formatRecoveryTime(Number(status.hours_until_recovery))}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderCategorySection = (
        category: 'upper' | 'lower' | 'core',
        title: string,
        icon: string,
        color: string
    ) => {
        const { recovering, recovered } = groupedMuscles[category];
        const hasAny = recovering.length > 0 || recovered.length > 0;

        if (!hasAny) return null;

        return (
            <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                    <Ionicons name={icon as any} size={22} color={color} />
                    <Text style={[styles.categoryTitle, { color }]}>{title}</Text>
                </View>

                {recovering.length > 0 && (
                    <View style={styles.statusGroup}>
                        <View style={styles.statusGroupHeader}>
                            <Ionicons name="time-outline" size={16} color="#FF9F0A" />
                            <Text style={styles.statusGroupTitle}>Recovering ({recovering.length})</Text>
                        </View>
                        {recovering.map((item) => (
                            <View key={item[0]}>
                                {renderMuscle(item, true)}
                            </View>
                        ))}
                    </View>
                )}

                {recovered.length > 0 && (
                    <View style={styles.statusGroup}>
                        <View style={styles.statusGroupHeader}>
                            <Text style={styles.statusGroupTitle}>Recovered ({recovered.length})</Text>
                        </View>
                        {recovered.map((item) => (
                            <View key={item[0]}>
                                {renderMuscle(item, false)}
                            </View>
                        ))}
                    </View>
                )}
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
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={[styles.content, { paddingTop: 60 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {renderSummaryCard()}
                    
                    {renderCategorySection('upper', 'Upper Body', 'body-outline', '#0A84FF')}
                    {renderCategorySection('lower', 'Lower Body', 'walk-outline', '#32D74B')}
                    {renderCategorySection('core', 'Core', 'diamond-outline', '#FF9F0A')}

                    {stats.total === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="body-outline" size={64} color="#8E8E93" />
                            <Text style={styles.emptyText}>No recovery data available</Text>
                            <Text style={styles.emptySubtext}>Complete a workout to see recovery status</Text>
                        </View>
                    )}
                </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    summaryCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    summaryTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    summaryStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#2C2C2E',
    },
    categorySection: {
        marginBottom: 28,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    statusGroup: {
        marginBottom: 16,
    },
    statusGroupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginLeft: 4,
        gap: 6,
    },
    statusGroupTitle: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    muscleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    muscleItemRecovering: {
        borderLeftWidth: 3,
        borderLeftColor: '#FF9F0A',
    },
    muscleItemLeft: {
        flex: 1,
        marginRight: 12,
    },
    muscleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    muscleName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'capitalize',
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    barContainer: {
        width: '100%',
        marginBottom: 8,
    },
    barBackground: {
        height: 8,
        backgroundColor: '#2C2C2E',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    barPercentage: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '500',
    },
    muscleDetails: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '500',
    },
    muscleItemRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    recoveryInfo: {
        alignItems: 'center',
        gap: 4,
    },
    recoveryTime: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },
    recoveredBadge: {
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    recoveredText: {
        fontSize: 11,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        fontWeight: '400',
        color: '#8E8E93',
        marginTop: 8,
    },
});






