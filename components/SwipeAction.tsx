import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    SharedValue,
    withSpring
} from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';

interface SwipeActionProps {
    progress: SharedValue<number>;
    dragX?: SharedValue<number>;
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
    iconSize = 22
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
        <RectButton
            onPress={handlePress}
            style={[
                styles.container,
                { backgroundColor },
                style
            ]}
            underlayColor="rgba(255, 255, 255, 0.2)"
        >
            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                <Ionicons name={iconName} size={iconSize} color={color} />
            </Animated.View>
        </RectButton>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 80,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.lg,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

