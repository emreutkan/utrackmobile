import { TemplateWorkout } from '@/api/types';
import { deleteTemplateWorkout, startTemplateWorkout } from '@/api/Workout';
import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import UpgradeModal from './UpgradeModal';
import { useUserStore } from '@/state/userStore';

interface TemplatesSectionProps {
    templates: TemplateWorkout[];
    onRefresh?: () => void;
}

const FREE_TEMPLATE_LIMIT = 3;

export default function TemplatesSection({ templates, onRefresh }: TemplatesSectionProps) {
    const { user } = useUserStore();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const isPro = user?.is_pro || false;
    const canCreateTemplate = isPro || templates.length < FREE_TEMPLATE_LIMIT;

    const handleCreatePress = () => {
        if (!canCreateTemplate) {
            setShowUpgradeModal(true);
        } else {
            router.push('/(templates)/create');
        }
    };

    const handleTemplatePress = (template: TemplateWorkout) => {
        Alert.alert(
            template.title.toUpperCase(),
            "What would you like to do?",
            [
                {
                    text: "Start Workout",
                    onPress: () => {
                        startTemplateWorkout({ template_workout_id: template.id }).then(res => {
                            if(res?.id) router.push('/(active-workout)');
                        });
                    }
                },
                {
                    text: "Delete Template",
                    style: "destructive",
                    onPress: () => {
                        Alert.alert(
                            "Delete Template",
                            "Are you sure you want to delete this template?",
                            [
                                { text: "Cancel", style: "cancel" },
                                { 
                                    text: "Delete", 
                                    style: "destructive", 
                                    onPress: async () => {
                                        await deleteTemplateWorkout(template.id);
                                        onRefresh?.();
                                    } 
                                }
                            ]
                        );
                    }
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerIndicator} />
                    <Text style={styles.sectionTitle}>WORKOUT TEMPLATES</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.createButton, !canCreateTemplate && styles.createButtonDisabled]}
                    onPress={handleCreatePress}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>NEW</Text>
                    {!isPro && (
                        <View style={styles.limitBadge}>
                            <Text style={styles.limitText}>{templates.length}/{FREE_TEMPLATE_LIMIT}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.templateList}
                snapToInterval={280 + theme.spacing.m}
                decelerationRate="fast"
            >
                {templates.map(tpl => (
                    <TouchableOpacity 
                        key={tpl.id} 
                        style={styles.templateCard} 
                        onPress={() => handleTemplatePress(tpl)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.templateIcon}>
                                <Ionicons name="fitness" size={20} color={theme.colors.status.active} />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.templateName} numberOfLines={1}>{tpl.title.toUpperCase()}</Text>
                                <Text style={styles.templateSubtitle}>PRE-SET DRILL</Text>
                            </View>
                        </View>

                        <View style={styles.cardFooter}>
                            <View style={styles.metricItem}>
                                <Ionicons name="list" size={14} color={theme.colors.text.tertiary} />
                                <Text style={styles.metricText}>{tpl.exercises.length} EXERCISES</Text>
                            </View>
                            <View style={styles.startButton}>
                                <Ionicons name="play" size={12} color="#FFFFFF" />
                                <Text style={styles.startButtonText}>START</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
                
                {templates.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Ionicons name="duplicate-outline" size={32} color={theme.colors.text.zinc700} />
                        <Text style={styles.emptyText}>NO TEMPLATES YET</Text>
                    </View>
                )}
            </ScrollView>

            <UpgradeModal 
                visible={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                feature="Unlimited Workout Templates"
                message={`Free users can create up to ${FREE_TEMPLATE_LIMIT} templates. Upgrade to PRO for unlimited template creation.`}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: theme.spacing.m,
    },
    sectionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: theme.spacing.m, 
        paddingHorizontal: theme.spacing.xs 
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIndicator: {
        width: 3,
        height: 16,
        backgroundColor: theme.colors.status.active,
        borderRadius: 2,
    },
    sectionTitle: { 
        ...typographyStyles.labelMuted,
        color: theme.colors.text.primary,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glassStrong,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        gap: 4,
    },
    createButtonDisabled: {
        opacity: 0.5,
    },
    createButtonText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFFFFF',
        fontStyle: 'italic',
    },
    limitBadge: {
        backgroundColor: theme.colors.status.warning,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 4,
    },
    limitText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#000',
    },
    templateList: { 
        paddingHorizontal: theme.spacing.xs,
        gap: theme.spacing.m,
        paddingBottom: 8,
    },
    templateCard: { 
        width: 280, 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: theme.borderRadius.xl, 
        padding: theme.spacing.l, 
        borderWidth: 1, 
        borderColor: theme.colors.ui.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: theme.spacing.l,
    },
    templateIcon: { 
        width: 44, 
        height: 44, 
        borderRadius: 14, 
        backgroundColor: 'rgba(99, 102, 241, 0.1)', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    headerInfo: {
        flex: 1,
    },
    templateName: { 
        fontSize: 16, 
        fontWeight: '900', 
        color: '#FFFFFF',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
    templateSubtitle: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metricText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        letterSpacing: 0.5,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.status.active,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    startButtonText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#FFFFFF',
        fontStyle: 'italic',
    },
    emptyCard: {
        width: 280,
        height: 110,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyText: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.zinc700,
        letterSpacing: 1,
    },
});

