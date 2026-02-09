import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface TrainingIntensityCardProps {
    intensityScore?: number; // 0-10, will be shown as percentage (0-100%)
    totalVolume?: number; // Total volume in kg
    caloriesBurned?: number; // Calories burned (replaces progress)
}

export default function TrainingIntensityCard({
    intensityScore = 0,
    totalVolume = 0,
    caloriesBurned = 0
}: TrainingIntensityCardProps) {
    // Convert score 0-10 to percentage 0-100%
    const intensityPercentage = Math.round(intensityScore * 10);

    // Calculate intensity bars based on score
    const getIntensityBars = () => {
        const score = intensityScore;
        if (score >= 8) return [1, 1, 1]; // All high
        if (score >= 6) return [0.7, 1, 1]; // Medium, high, high
        if (score >= 4) return [0.5, 0.7, 1]; // Low, medium, high
        return [0.3, 0.5, 0.7]; // All low-medium
    };

    const bars = getIntensityBars();
    return (
        <View style={styles.card}>
            <View style={styles.upperSection}>
                <View style={styles.upperLeft}>
                    <View style={styles.intensityHeader}>
                    <View style={styles.intensityBars}>
                        {bars.map((opacity, index) => (
                            <View
                                key={index}
                                style={[styles.bar, { opacity }]}
                            />
                        ))}

                    </View>
                    <Text style={styles.intensityLabel}>TRAINING INTENSITY</Text>

                    </View>

                    <View style={styles.intensityTextContainer}>
                        <Text style={styles.intensityValue}>{intensityPercentage}%</Text>
                        <Text style={styles.intensitySubtitle}>Effort level of today&apos;s workout</Text>
                    </View>
                </View>
                <View style={styles.intensityIcon}>
                    <Ionicons name="pulse" size={24} color={theme.colors.status.active} />
                </View>
            </View>

            {(totalVolume > 0 || caloriesBurned > 0) && (
                <View style={styles.lowerSection}>
                    {totalVolume > 0 && (
                        <View style={styles.metricItem}>
                            <View style={[styles.metricIcon, styles.volumeIcon]}>
                                <Ionicons name="layers" size={20} color={theme.colors.text.primary} />
                            </View>
                            <View style={styles.metricContent}>
                                <Text style={styles.metricLabel}>TOTAL VOLUME</Text>
                                <Text style={styles.metricValue}>{totalVolume.toFixed(0)} KG</Text>
                            </View>
                        </View>
                    )}

                    {caloriesBurned > 0 && (
                        <View style={styles.metricItem}>
                            <View style={[styles.metricIcon, styles.caloriesIcon]}>
                                <Ionicons name="flame" size={20} color={theme.colors.text.primary} />
                            </View>
                            <View style={styles.metricContent}>
                                <Text style={styles.metricLabel}>CALORIES</Text>
                                <Text style={styles.metricValue}>{caloriesBurned.toFixed(0)} KCAL</Text>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.xxl,
        padding: theme.spacing.xxl,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        shadowColor: theme.colors.ui.brandGlow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    upperSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.l,
    },
    upperLeft: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        flex: 1,
        gap: theme.spacing.s,
    },
    intensityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    intensityBars: {
        flexDirection: 'row',
        gap: 4,

    },
    bar: {
        width: 4,
        height: 12,
        borderRadius: 2,
        backgroundColor: theme.colors.status.active,
    },
    intensityTextContainer: {
        flex: 1,
    },
    intensityLabel: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.xs,
    },
    intensityValue: {
        fontSize: theme.typography.sizes.xxxl,
        fontWeight: '900',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    intensitySubtitle: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
    intensityIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.ui.primaryLight,
        borderWidth: 1,
        borderColor: theme.colors.ui.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lowerSection: {
        flexDirection: 'row',
        gap: theme.spacing.m,
    },
    metricItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    metricIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    volumeIcon: {
        backgroundColor: theme.colors.ui.primaryLight,
    },
    caloriesIcon: {
        backgroundColor: 'rgba(52, 211, 153, 0.2)',
    },
    metricContent: {
        flex: 1,
    },
    metricLabel: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: theme.spacing.xs,
    },
    metricValue: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '900',
        color: theme.colors.text.primary,
    },
});

