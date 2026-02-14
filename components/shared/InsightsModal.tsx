import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { FlatList, Modal, StyleSheet, Text, Pressable, TouchableWithoutFeedback, View } from 'react-native';

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
                title: 'Good',
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
                title: 'Areas to Improve',
                icon: 'alert-circle',
                color: theme.colors.status.error,
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

    return (
        <Modal
            presentationStyle="formSheet"
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View style={styles.content}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Set {set.set_number} Insights</Text>
                                <Pressable onPress={onClose}>
                                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                                </Pressable>
                            </View>

                            <FlatList
                                data={flattenedData}
                                keyExtractor={(item, index) =>
                                    item.type === 'section' ? `section-${item.title}` : `item-${index}`
                                }
                                style={styles.body}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }) => {
                                    if (item.type === 'section') {
                                        return (
                                            <View style={styles.section}>
                                                <View style={styles.sectionHeader}>
                                                    <Ionicons
                                                        name={item.icon as any}
                                                        size={20}
                                                        color={item.color}
                                                    />
                                                    <Text style={styles.sectionTitle}>{item.title}</Text>
                                                </View>
                                            </View>
                                        );
                                    }

                                    const insight = item.insight;
                                    return (
                                        <View style={styles.item}>
                                            <Text style={styles.reason}>{insight.reason}</Text>
                                            {insight.current_reps && (
                                                <Text style={styles.detail}>Current: {insight.current_reps} reps</Text>
                                            )}
                                            {insight.optimal_range && (
                                                <Text style={styles.detail}>Optimal: {insight.optimal_range}</Text>
                                            )}
                                            {insight.current_tut && (
                                                <Text style={styles.detail}>Current TUT: {insight.current_tut}s</Text>
                                            )}
                                            {insight.seconds_per_rep && (
                                                <Text style={styles.detail}>{insight.seconds_per_rep}s per rep</Text>
                                            )}
                                            {insight.set_position && (
                                                <Text style={styles.detail}>Set Position: {insight.set_position}</Text>
                                            )}
                                            {insight.total_sets && (
                                                <Text style={styles.detail}>Total Sets: {insight.total_sets}</Text>
                                            )}
                                            {insight.optimal_sets && (
                                                <Text style={styles.detail}>Optimal: {insight.optimal_sets}</Text>
                                            )}
                                        </View>
                                    );
                                }}
                                ListEmptyComponent={
                                    hasNoInsights ? (
                                        <View style={styles.section}>
                                            <Text style={styles.noInsightsText}>
                                                No insights available for this set.
                                            </Text>
                                        </View>
                                    ) : null
                                }
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: theme.colors.ui.glassStrong,
        borderRadius: 24,
        width: '90%',
        maxHeight: '80%',
        borderWidth: 1.5,
        borderColor: theme.colors.ui.border,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 32,
        elevation: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border,
    },
    title: {
        color: theme.colors.text.primary,
        fontSize: 20,
        fontWeight: '700',
    },
    body: {
        padding: 20,
        maxHeight: 500,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        color: theme.colors.text.primary,
        fontSize: 18,
        fontWeight: '600',
    },
    item: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    reason: {
        color: theme.colors.text.primary,
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 8,
    },
    detail: {
        color: theme.colors.text.secondary,
        fontSize: 13,
        marginTop: 4,
    },
    noInsightsText: {
        color: theme.colors.text.secondary,
        fontSize: 15,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
