import { getErrorMessage } from '@/api/errorHandler';
import { commonStyles, theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    Pressable,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PremiumPreview from './components/PremiumPreview';
import BenefitsRow from './components/BenefitsRow';
import FeatureStack from './components/FeatureStack';
import PricingDisplay from './components/PricingDisplay';
import UnlockButton from './components/UnlockButton';

export default function UpgradeScreen() {
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            // TODO: Implement RevenueCat purchase flow
            // For now, show placeholder alert
            Alert.alert(
                "WELCOME TO PRO!",
                "You now have access to all premium features.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert("Purchase Failed", getErrorMessage(error as Error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={styles.gradientBg}
            />

            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={commonStyles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* 1. Visual Hook - Premium Feature Preview (FOMO) */}
                <PremiumPreview />

                {/* 2. Authority Hero */}
                <View style={styles.heroSection}>
                    <View style={styles.proBadge}>
                        <Ionicons name="star" size={14} color={theme.colors.status.rest} />
                        <Text style={styles.proBadgeText}>PRO ACCESS</Text>
                    </View>
                    <Text style={styles.heroTitle}>SCIENCE-BACKED{'\n'}ELITE PERFORMANCE</Text>
                    <Text style={styles.authorityText}>
                        TRUSTED BY 10,000+ ATHLETES WORLDWIDE
                    </Text>
                </View>

                {/* 3. Outcome Benefits (not features) */}
                <BenefitsRow />

                {/* 4. Feature Value Stack */}
                <FeatureStack />

                {/* 5. Pricing (last - price-last principle) */}
                <PricingDisplay />

                {/* 6. Single CTA */}
                <UnlockButton onPress={handleUpgrade} isLoading={isLoading} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    gradientBg: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.m,
    },
    scrollContent: {
        padding: theme.spacing.m,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.xxxl,
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(192, 132, 252, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(192, 132, 252, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
        marginBottom: theme.spacing.l,
    },
    proBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
        color: theme.colors.status.rest,
    },
    heroTitle: {
        ...typographyStyles.h1,
        fontSize: 42,
        lineHeight: 48,
        textAlign: 'center',
        marginBottom: theme.spacing.m,
        letterSpacing: -2,
    },
    authorityText: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
});

