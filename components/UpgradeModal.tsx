import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Modal, StyleSheet, Text, Pressable, View } from 'react-native';

interface UpgradeModalProps {
    visible: boolean;
    onClose: () => void;
    feature?: string;
    message?: string;
    upgradeUrl?: string;
}

export default function UpgradeModal({ 
    visible, 
    onClose, 
    feature = "PRO Feature",
    message = "This feature requires PRO subscription",
    upgradeUrl = "/(account)/upgrade"
}: UpgradeModalProps) {
    const handleUpgrade = () => {
        onClose();
        router.push(upgradeUrl as any);
    };

    return (
        <Modal
            presentationStyle="formSheet"
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="star" size={32} color={theme.colors.status.rest} />
                        </View>
                        <Text style={styles.title}>Unlock PRO Feature</Text>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.featureName}>{feature}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <View style={styles.featuresList}>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.status.rest} />
                                <Text style={styles.featureText}>CNS Recovery Tracking</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.status.rest} />
                                <Text style={styles.featureText}>Unlimited Volume Analysis</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.status.rest} />
                                <Text style={styles.featureText}>Advanced Workout Insights</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.status.rest} />
                                <Text style={styles.featureText}>Training Recommendations</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.status.rest} />
                                <Text style={styles.featureText}>Research-Backed Guidance</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <Pressable 
                            style={styles.upgradeButton}
                            onPress={handleUpgrade}
                        >
                            <Text style={styles.upgradeButtonText}>Upgrade to PRO</Text>
                        </Pressable>
                        <Pressable 
                            style={styles.cancelButton}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Maybe Later</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: theme.colors.ui.glassStrong,
        borderRadius: theme.borderRadius.xxl,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden',
    },
    header: {
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 16,
        paddingHorizontal: 24,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${theme.colors.status.rest}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    featureName: {
        fontSize: theme.typography.sizes.m,
        fontWeight: '700',
        color: theme.colors.status.rest,
        textAlign: 'center',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    message: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    featuresList: {
        gap: 12,
        marginBottom: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    actions: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 12,
    },
    upgradeButton: {
        backgroundColor: theme.colors.status.rest,
        borderRadius: theme.borderRadius.xxl,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    upgradeButtonText: {
        fontSize: theme.typography.sizes.m,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
    },
});

