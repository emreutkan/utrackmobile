import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    SharedValue,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';

interface SwipeActionProps {
    progress: SharedValue<number>;
    onPress: () => void;
    iconName: keyof typeof Ionicons.glyphMap;
    color?: string;
    backgroundColor?: string;
    style?: ViewStyle;
    iconSize?: number;
}

export const SwipeAction = ({
    progress,
    onPress,
    iconName,
    color = theme.colors.text.primary,
    backgroundColor = theme.colors.ui.glass,
    style,
    iconSize = 20
}: SwipeActionProps) => {
    const animatedIconStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            progress.value,
            [0, 1],
            [0.5, 1.1],
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            progress.value,
            [0, 0.5, 1],
            [0, 0, 1],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale: withSpring(scale) }],
            opacity
        };
    });

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <Pressable
            onPress={handlePress}
            style={[
                styles.wrapper,
                { backgroundColor },
                style,
            ]}
        >
            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                <Ionicons name={iconName} size={iconSize} color={color} />
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: 68,
        marginLeft: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.m,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

