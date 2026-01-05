import { healthService } from '@/api/Health';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Design Tokens ---
const COLORS = {
    bg: '#000000',
    card: '#1C1C1E',
    primary: '#0A84FF',
    success: '#32D74B',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#2C2C2E',
};

export default function PermissionsScreen() {
    const insets = useSafeAreaInsets();
    const [status, setStatus] = useState<'granted' | 'denied' | 'undetermined' | 'loading'>('loading');
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        try {
            // Add a small artificial delay for smoother UI transition if it's too fast
            const hasPermission = await healthService.checkPermissionStatus();
            setStatus(hasPermission ? 'granted' : 'undetermined');
        } catch (error) {
            console.log('Error checking permission:', error);
            setStatus('denied');
        }
    };

    const handleRequest = async () => {
        setIsRequesting(true);
        try {
            const success = await healthService.initialize();
            if (success) {
                setStatus('granted');
                Alert.alert("All Set", "Step tracking is now active.");
            } else {
                setStatus('denied');
                // If denied on iOS, we usually need to send them to settings manually
                if (Platform.OS === 'ios') {
                    Alert.alert(
                        "Permission Required",
                        "Health access was previously denied. Please enable 'Steps' in Settings.",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Open Settings", onPress: () => Linking.openSettings() }
                        ]
                    );
                }
            }
        } catch (error) {
            setStatus('denied');
        } finally {
            setIsRequesting(false);
        }
    };

    const instructions = Platform.OS === 'ios' ? [
        "Tap 'Enable Integration' below.",
        "Toggle 'Turn All Categories On' or select 'Steps'.",
        "Tap 'Allow' at the top right."
    ] : [
        "Tap 'Enable Integration' below.",
        "Select your Google Account.",
        "Allow access to physical activity."
    ];

    const renderStatusHero = () => {
        if (status === 'loading') {
            return (
                <View style={styles.heroContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.heroTitle}>Checking Status...</Text>
                </View>
            );
        }

        const isGranted = status === 'granted';
        return (
            <View style={styles.heroContainer}>
                <View style={[styles.iconCircle, { backgroundColor: isGranted ? 'rgba(50, 215, 75, 0.1)' : 'rgba(10, 132, 255, 0.1)' }]}>
                    <Ionicons 
                        name={isGranted ? "checkmark-circle" : "heart"} 
                        size={48} 
                        color={isGranted ? COLORS.success : COLORS.primary} 
                    />
                </View>
                <Text style={styles.heroTitle}>
                    {isGranted ? "Health Access Active" : "Health Access Inactive"}
                </Text>
                <Text style={styles.heroSubtitle}>
                    {isGranted 
                        ? "Your step count is automatically syncing with Apple Health."
                        : "Enable access to view your daily step count and activity trends directly in uTrack."
                    }
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <UnifiedHeader 
                title="Integrations" 
                onBackPress={() => router.back()} 
                backButtonText="Settings"
            />

            <ScrollView contentContainerStyle={[styles.content, { marginTop: 58 }]}>
                {renderStatusHero()}

                {status !== 'granted' && status !== 'loading' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>SETUP INSTRUCTIONS</Text>
                        <View style={styles.card}>
                            {instructions.map((step, index) => (
                                <View key={index} style={[styles.stepRow, index !== instructions.length - 1 && styles.stepBorder]}>
                                    <View style={styles.stepNumber}>
                                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.stepText}>{step}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.actionContainer}>
                    {status === 'granted' ? (
                        <TouchableOpacity style={styles.secondaryButton} onPress={checkPermission}>
                            <Text style={styles.secondaryButtonText}>Refresh Status</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.primaryButton, isRequesting && { opacity: 0.7 }]} 
                            onPress={handleRequest}
                            disabled={isRequesting || status === 'loading'}
                        >
                            {isRequesting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Enable Integration</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.privacyContainer}>
                    <Ionicons name="lock-closed" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.privacyText}>
                        Your health data is stored locally on your device and is only used to display your daily metrics.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    // Hero
    heroContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        marginBottom: 24,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: '80%',
    },
    // Section
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 8,
        marginLeft: 16,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        overflow: 'hidden',
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    stepBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.border,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '600',
    },
    stepText: {
        color: COLORS.text,
        fontSize: 16,
        flex: 1,
    },
    // Actions
    actionContainer: {
        gap: 12,
        marginBottom: 24,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: COLORS.card,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: COLORS.primary,
        fontSize: 17,
        fontWeight: '600',
    },
    // Privacy
    privacyContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 24,
        opacity: 0.8,
    },
    privacyText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
});