import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, Pressable, View } from 'react-native';

interface UpgradePromptProps {
    feature: string;
    message?: string;
    upgradeUrl?: string;
    compact?: boolean;
}

export default function UpgradePrompt({
    feature,
    message,
    upgradeUrl = "/(account)/upgrade",
    compact = false
}: UpgradePromptProps) {
    const handleUpgrade = () => {
        router.push(upgradeUrl as any);
    };

    if (compact) {
        return (
            <Pressable
                style={styles.compactCard}
                onPress={handleUpgrade}
            >
                <View style={styles.compactContent}>
                    <Text style={styles.compactText}>{feature} - PRO Feature</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
            </Pressable>
        );
    }

    return (
        <Pressable
            style={styles.card}
            onPress={handleUpgrade}
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.featureName}>{feature}</Text>
                    {message && (
                        <Text style={styles.message}>{message}</Text>
                    )}
                </View>
            </View>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>PRO</Text>
            </View>
        </Pressable>
        )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.xxl,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    compactCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },

    textContainer: {
        ...typographyStyles.labelMuted,
    },
    featureName: {
        fontSize: theme.typography.sizes.m,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    message: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    badge: {
        backgroundColor: theme.colors.status.rest,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.m,
        marginRight: theme.spacing.s,
        marginLeft: theme.spacing.s,
    },
    badgeText: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
    },
    compactContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    compactText: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },


});

