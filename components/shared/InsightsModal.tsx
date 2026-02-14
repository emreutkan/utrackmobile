import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface InsightsModalProps {
    visible: boolean;
    onClose: () => void;
    set: any;
}

export const InsightsModal = ({ visible, onClose, set }: InsightsModalProps) => {
    const flattenedData = useMemo(() => {
        const data: Array<
            | { type: 'section'; title: string; icon: string; color: string }
            | { type: 'item'; insight: any; isGood: boolean }
        > = [];

        if (set.insights?.good && Object.keys(set.insights.good).length > 0) {
            data.push({
                type: 'section',
                title: 'STRENGTHS',
                icon: 'checkmark-circle',
                color: theme.colors.status.success,
            });
            Object.entries(set.insights.good).forEach(([key, insight]: [string, any]) => {
                data.push({ type: 'item', insight, isGood: true });
            });
        }

        if (set.insights?.bad && Object.keys(set.insights.bad).length > 0) {
            data.push({
                type: 'section',
                title: 'IMPROVE',
                icon: 'alert-circle',
                color: theme.colors.status.warning,
            });
            Object.entries(set.insights.bad).forEach(([key, insight]: [string, any]) => {
                data.push({ type: 'item', insight, isGood: false });
            });
        }

        return data;
    }, [set.insights]);

    const hasNoInsights =
        !set.insights ||
        (Object.keys(set.insights.good || {}).length === 0 &&
            Object.keys(set.insights.bad || {}).length === 0);

    const goodCount = set.insights?.good ? Object.keys(set.insights.good).length : 0;
    const badCount = set.insights?.bad ? Object.keys(set.insights.bad).length : 0;

    return (
        <Modal
            presentationStyle="formSheet"
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>SET {set.set_number} INSIGHTS</Text>
                        {!hasNoInsights && (
                            <View style={styles.headerBadges}>
                                {goodCount > 0 && (
                                    <View style={[styles.countBadge, { backgroundColor: 'rgba(52, 211, 153, 0.1)' }]}>
                                        <Ionicons name="checkmark" size={10} color={theme.colors.status.success} />
                                        <Text style={[styles.countText, { color: theme.colors.status.success }]}>{goodCount}</Text>
                                    </View>
                                )}
                                {badCount > 0 && (
                                    <View style={[styles.countBadge, { backgroundColor: 'rgba(255, 159, 10, 0.1)' }]}>
                                        <Ionicons name="alert" size={10} color={theme.colors.status.warning} />
                                        <Text style={[styles.countText, { color: theme.colors.status.warning }]}>{badCount}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={18} color={theme.colors.text.primary} />
                    </Pressable>
                </View>

                {/* Content */}
                <FlatList
                    data={flattenedData}
                    keyExtractor={(item, index) =>
                        item.type === 'section' ? `section-${item.title}` : `item-${index}`
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        if (item.type === 'section') {
                            return (
                                <View style={styles.sectionHeader}>
                                    <Ionicons name={item.icon as any} size={16} color={item.color} />
                                    <Text style={[styles.sectionTitle, { color: item.color }]}>{item.title}</Text>
                                </View>
                            );
                        }

                        const insight = item.insight;
                        const accentColor = item.isGood ? theme.colors.status.success : theme.colors.status.warning;

                        return (
                            <View style={styles.insightCard}>
                                <View style={[styles.insightAccent, { backgroundColor: accentColor }]} />
                                <View style={styles.insightBody}>
                                    <Text style={styles.insightReason}>{insight.reason}</Text>
                                    <View style={styles.insightDetails}>
                                        {insight.current_reps && (
                                            <View style={styles.detailChip}>
                                                <Text style={styles.detailLabel}>Current</Text>
                                                <Text style={styles.detailValue}>{insight.current_reps} reps</Text>
                                            </View>
                                        )}
                                        {insight.optimal_range && (
                                            <View style={styles.detailChip}>
                                                <Text style={styles.detailLabel}>Optimal</Text>
                                                <Text style={styles.detailValue}>{insight.optimal_range}</Text>
                                            </View>
                                        )}
                                        {insight.current_tut && (
                                            <View style={styles.detailChip}>
                                                <Text style={styles.detailLabel}>TUT</Text>
                                                <Text style={styles.detailValue}>{insight.current_tut}s</Text>
                                            </View>
                                        )}
                                        {insight.seconds_per_rep && (
                                            <View style={styles.detailChip}>
                                                <Text style={styles.detailLabel}>Tempo</Text>
                                                <Text style={styles.detailValue}>{insight.seconds_per_rep}s/rep</Text>
                                            </View>
                                        )}
                                        {insight.set_position && (
                                            <View style={styles.detailChip}>
                                                <Text style={styles.detailLabel}>Position</Text>
                                                <Text style={styles.detailValue}>{insight.set_position}</Text>
                                            </View>
                                        )}
                                        {insight.total_sets && (
                                            <View style={styles.detailChip}>
                                                <Text style={styles.detailLabel}>Sets</Text>
                                                <Text style={styles.detailValue}>{insight.total_sets}</Text>
                                            </View>
                                        )}
                                        {insight.optimal_sets && (
                                            <View style={styles.detailChip}>
                                                <Text style={styles.detailLabel}>Optimal</Text>
                                                <Text style={styles.detailValue}>{insight.optimal_sets}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        hasNoInsights ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="bulb-outline" size={40} color={theme.colors.text.tertiary} />
                                <Text style={styles.emptyText}>No insights for this set yet.</Text>
                                <Text style={styles.emptySubtext}>Insights appear as you train more.</Text>
                            </View>
                        ) : null
                    }
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border,
    },
    title: {
        color: theme.colors.text.primary,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    headerBadges: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
    },
    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    countText: {
        fontSize: 11,
        fontWeight: '700',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.ui.glass,
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    insightAccent: {
        width: 3,
    },
    insightBody: {
        flex: 1,
        padding: 14,
        gap: 10,
    },
    insightReason: {
        color: theme.colors.text.primary,
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    insightDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.ui.glassStrong,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.3,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text.primary,
        fontVariant: ['tabular-nums'],
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 8,
    },
    emptyText: {
        color: theme.colors.text.secondary,
        fontSize: 15,
        fontWeight: '600',
        marginTop: 8,
    },
    emptySubtext: {
        color: theme.colors.text.tertiary,
        fontSize: 13,
    },
});
