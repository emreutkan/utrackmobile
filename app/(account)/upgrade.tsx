import { getErrorMessage } from '@/api/errorHandler';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    Pressable,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UpgradeScreen() {
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            // TODO: Implement actual subscription purchase flow
            // This would integrate with your payment provider (Stripe, RevenueCat, etc.)
            Alert.alert(
                "Upgrade to PRO",
                "Subscription purchase integration coming soon!",
                [{ text: "OK" }]
            );
        } catch (error: any) {
            Alert.alert("Error", getErrorMessage(error as Error));
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        {
            icon: "pulse",
            title: "CNS Recovery Tracking",
            description: "Track your Central Nervous System recovery to optimize training"
        },
        {
            icon: "bar-chart",
            title: "Unlimited Volume Analysis",
            description: "View volume analysis for any time period"
        },
        {
            icon: "analytics",
            title: "Advanced Workout Insights",
            description: "See 1RM performance tracking and detailed analysis"
        },
        {
            icon: "bulb",
            title: "Training Recommendations",
            description: "Get personalized recovery and rest period recommendations"
        },
        {
            icon: "library",
            title: "Research-Backed Guidance",
            description: "Access evidence-based training recommendations"
        }
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={styles.gradientBg}
            />
            <View style={styles.backHeader}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </Pressable>
            </View>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20, marginTop: 16 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>Unlock PRO Features</Text>
                    <Text style={styles.heroSubtitle}>
                        Get access to advanced analytics and research-backed training insights
                    </Text>
                </View>

                <View style={styles.pricingCard}>
                    <View style={styles.pricingHeader}>
                        <Text style={styles.price}>$5</Text>
                        <Text style={styles.pricePeriod}>/month</Text>
                    </View>
                    <Text style={styles.pricingDescription}>
                        Cancel anytime. No commitment.
                    </Text>
                </View>

                <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>PRO Features</Text>
                    {features.map((feature, index) => (
                        <View key={index} style={styles.featureCard}>
                            <View style={styles.featureIconContainer}>
                                <Ionicons name={feature.icon as any} size={24} color={theme.colors.status.rest} />
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <Pressable
                    style={[styles.upgradeButton, isLoading && styles.upgradeButtonDisabled]}
                    onPress={handleUpgrade}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.upgradeButtonText}>Upgrade to PRO</Text>
                    )}
                </Pressable>

                <Pressable
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.cancelButtonText}>Maybe Later</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    backHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 8,
    },
    backButton: {
        padding: 4,
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scrollContent: {
        padding: 16,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },

    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    pricingCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.xxl,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
    },
    pricingHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    price: {
        fontSize: 48,
        fontWeight: '800',
        color: theme.colors.status.rest,
    },
    pricePeriod: {
        fontSize: 18,
        color: theme.colors.text.secondary,
        marginLeft: 8,
    },
    pricingDescription: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    featuresSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#636366',
        textTransform: 'uppercase',
        marginBottom: 16,
        marginLeft: 4,
    },
    featureCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        padding: 16,
        marginBottom: 12,
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${theme.colors.status.rest}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    upgradeButton: {
        backgroundColor: theme.colors.status.rest,
        borderRadius: theme.borderRadius.xxl,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    upgradeButtonDisabled: {
        opacity: 0.6,
    },
    upgradeButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cancelButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
    },
});

