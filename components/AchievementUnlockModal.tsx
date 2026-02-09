import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { UnnotifiedAchievement, AchievementRarity } from '@/api/types/index';
import Animated, {
    FadeIn,
    FadeOut,
    RotateInUpLeft,
    withSpring,

    EntryExitAnimationFunction
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';


const scaleInSpring: EntryExitAnimationFunction = () => {
    'worklet';
    const animations = {
        opacity: withSpring(1, { damping: 15, stiffness: 150 }),
        transform: [{ scale: withSpring(1, { damping: 15, stiffness: 150 }) }],
    };
    const initialValues = {
        opacity: 0,
        transform: [{ scale: 0.8 }],
    };
    return {
        initialValues,
        animations,
    };
};

const RARITY_COLORS: Record<AchievementRarity, string> = {
    common: '#9CA3AF',
    uncommon: '#22C55E',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
};

interface AchievementUnlockModalProps {
    achievements: UnnotifiedAchievement[];
    visible: boolean;
    onClose: () => void;
}

export default function AchievementUnlockModal({ achievements, visible, onClose }: AchievementUnlockModalProps) {
    const [currentIndex, setCurrentSetIndex] = useState(0);
    const current = achievements[currentIndex];

    // Reset index when modal becomes visible
    useEffect(() => {
        if (visible) setCurrentSetIndex(0);
    }, [visible]);

    if (!current) return null;

    const rarityColor = RARITY_COLORS[current.achievement.rarity] || theme.colors.text.brand;

    const handleNext = () => {
        if (currentIndex < achievements.length - 1) {
            setCurrentSetIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const getIcon = (iconId: string) => {
        if (iconId.startsWith('workout_')) return 'barbell';
        if (iconId.startsWith('streak_')) return 'flame';
        if (iconId.startsWith('volume_')) return 'fitness';
        if (iconId.startsWith('pr_')) return 'medal';
        return 'star';
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={StyleSheet.absoluteFillObject}
                >
                    <View style={styles.blurBg} />
                </Animated.View>

                <Animated.View
                    key={currentIndex}
                    entering={scaleInSpring}
                    style={styles.container}
                >
                    <LinearGradient
                        colors={[`${rarityColor}20`, 'transparent']}
                        style={styles.gradient}
                    />

                    <View style={styles.content}>
                        <Animated.View entering={RotateInUpLeft.delay(300)}>
                            <View style={[styles.iconContainer, { borderColor: rarityColor }]}>
                                <Ionicons
                                    name={getIcon(current.achievement.icon) as any}
                                    size={48}
                                    color={rarityColor}
                                />
                            </View>
                        </Animated.View>

                        <Text style={styles.unlockText}>ACHIEVEMENT UNLOCKED</Text>
                        <Text style={styles.name}>{current.achievement.name.toUpperCase()}</Text>

                        <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}20`, borderColor: rarityColor }]}>
                            <Text style={[styles.rarityText, { color: rarityColor }]}>
                                {current.achievement.rarity.toUpperCase()}
                            </Text>
                        </View>

                        <Text style={styles.description}>{current.achievement.description}</Text>

                        <View style={styles.pointsContainer}>
                            <Ionicons name="flash" size={16} color="#F59E0B" />
                            <Text style={styles.pointsText}>+{current.achievement.points} POINTS</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: rarityColor }]}
                            onPress={handleNext}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>
                                {currentIndex < achievements.length - 1 ? 'NEXT ACHIEVEMENT' : 'AWESOME'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    blurBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    container: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#1C1C1E',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        alignItems: 'center',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
    },
    content: {
        padding: 30,
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        marginBottom: 24,
    },
    unlockText: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 2,
        marginBottom: 8,
    },
    name: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 12,
    },
    rarityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 20,
    },
    rarityText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    description: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        marginBottom: 30,
    },
    pointsText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#F59E0B',
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
});
