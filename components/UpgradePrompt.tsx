import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
            <Pressable style={styles.compactCard} onPress={handleUpgrade}>
                <View style={styles.compactLeft}>
                    <View style={styles.compactIconBox}>
                        <Ionicons name="star" size={14} color={theme.colors.status.rest} />
                    </View>
                    <Text style={styles.compactText}>{feature}</Text>
                    <View style={styles.compactBadge}>
                        <Text style={styles.compactBadgeText}>PRO</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
            </Pressable>
        );
    }

    return (
        <Pressable style={styles.card} onPress={handleUpgrade}>
            <LinearGradient
                colors={['rgba(168, 85, 247, 0.08)', 'rgba(168, 85, 247, 0.03)']}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.header}>
                <View style={styles.iconBox}>
                    <Ionicons name="lock-closed" size={20} color={theme.colors.status.rest} />
                </View>
                <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.featureName}>{feature}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>PRO</Text>
                        </View>
                    </View>
                    {message && (
                        <Text style={styles.message}>{message}</Text>
                    )}
                </View>
            </View>
            <View style={styles.upgradeRow}>
                <Text style={styles.upgradeText}>UPGRADE TO UNLOCK</Text>
                <Ionicons name="arrow-forward" size={14} color={theme.colors.status.rest} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        borderColor: 'rgba(192, 132, 252, 0.2)',
        padding: theme.spacing.m,
        marginBottom: theme.spacing.m,
        overflow: 'hidden',
        gap: theme.spacing.m,
    },
    compactCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        padding: theme.spacing.m,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.m,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(192, 132, 252, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(192, 132, 252, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        gap: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
        flexWrap: 'wrap',
    },
    featureName: {
        fontSize: 14,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        color: theme.colors.text.primary,
    },
    badge: {
        backgroundColor: 'rgba(192, 132, 252, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(192, 132, 252, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.full,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: theme.colors.status.rest,
    },
    message: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    upgradeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    upgradeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: theme.colors.status.rest,
    },
    compactLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
        flex: 1,
    },
    compactIconBox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(192, 132, 252, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactText: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        color: theme.colors.text.primary,
        flex: 1,
    },
    compactBadge: {
        backgroundColor: 'rgba(192, 132, 252, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(192, 132, 252, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.full,
    },
    compactBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: theme.colors.status.rest,
    },
});
