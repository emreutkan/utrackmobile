import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { ReactNode, useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UnifiedHeaderProps {
    title: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    backButtonText?: string;
    rightButton?: {
        icon: keyof typeof Ionicons.glyphMap;
        onPress: () => void;
    };
    rightButtonText?: string;
    onRightButtonPress?: () => void;
    modalContent?: ReactNode;
    modalVisible?: boolean;
    onModalClose?: () => void;
}

export default function UnifiedHeader({
    title,
    showBackButton = true,
    onBackPress,
    backButtonText,
    rightButton,
    rightButtonText,
    onRightButtonPress,
    modalContent,
    modalVisible = false,
    onModalClose,
}: UnifiedHeaderProps) {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (modalVisible) {
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [modalVisible, slideAnim]);

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    const headerTop = insets.top + 12;
    const headerHeight = 56;
    const modalTop = headerTop + headerHeight + 8;

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-400, 0],
    });

    const opacity = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <>
            {Platform.OS === 'ios' ? (
                <BlurView intensity={80} tint="dark" style={[styles.header, { top: headerTop }]}>
                    {showBackButton ? (
                        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                            {backButtonText && (
                                <Text style={styles.backButtonText}>{backButtonText}</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.backButton} />
                    )}
                    
                    <Text style={styles.headerTitle}>{title}</Text>
                    
                    {rightButtonText && onRightButtonPress ? (
                        <TouchableOpacity 
                            onPress={onRightButtonPress}
                            style={styles.rightButton}
                        >
                            <Text style={styles.rightButtonText}>{rightButtonText}</Text>
                        </TouchableOpacity>
                    ) : rightButton ? (
                        <TouchableOpacity 
                            onPress={rightButton.onPress}
                            style={styles.rightButton}
                        >
                            <Ionicons name={rightButton.icon} size={24} color="#0A84FF" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.rightButton} />
                    )}
                </BlurView>
            ) : (
                <View style={[styles.header, { top: headerTop, backgroundColor: 'rgba(28, 28, 30, 0.95)' }]}>
                    {showBackButton ? (
                        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                            {backButtonText && (
                                <Text style={styles.backButtonText}>{backButtonText}</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.backButton} />
                    )}
                    
                    <Text style={styles.headerTitle}>{title}</Text>
                    
                    {rightButtonText && onRightButtonPress ? (
                        <TouchableOpacity 
                            onPress={onRightButtonPress}
                            style={styles.rightButton}
                        >
                            <Text style={styles.rightButtonText}>{rightButtonText}</Text>
                        </TouchableOpacity>
                    ) : rightButton ? (
                        <TouchableOpacity 
                            onPress={rightButton.onPress}
                            style={styles.rightButton}
                        >
                            <Ionicons name={rightButton.icon} size={24} color="#0A84FF" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.rightButton} />
                    )}
                </View>
            )}

            {modalContent && (
                <>
                    {modalVisible && (
                        <TouchableOpacity 
                            style={[styles.modalBackdrop, { top: headerTop + headerHeight }]}
                            activeOpacity={1}
                            onPress={() => onModalClose?.()}
                        />
                    )}
                    {modalVisible && (
                        <Animated.View 
                            style={[
                                styles.modalContainer,
                                {
                                    top: modalTop,
                                    opacity,
                                    transform: [{ translateY }],
                                }
                            ]}
                        >
                            {Platform.OS === 'ios' ? (
                                <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
                                    <KeyboardAvoidingView
                                        behavior="padding"
                                        keyboardVerticalOffset={modalTop}
                                    >
                                        <View style={styles.modalContent}>
                                            {modalContent}
                                        </View>
                                    </KeyboardAvoidingView>
                                </BlurView>
                            ) : (
                                <View style={[styles.modalBlur, { backgroundColor: 'rgba(28, 28, 30, 0.95)' }]}>
                                    <KeyboardAvoidingView
                                        behavior="height"
                                        keyboardVerticalOffset={modalTop}
                                    >
                                        <View style={styles.modalContent}>
                                            {modalContent}
                                        </View>
                                    </KeyboardAvoidingView>
                                </View>
                            )}
                        </Animated.View>
                    )}
                </>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        zIndex: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 40,
    },
    backButtonText: {
        color: '#0A84FF',
        fontSize: 17,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'center',
    },
    rightButton: {
        minWidth: 40,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    rightButtonText: {
        color: '#34C759',
        fontSize: 17,
        fontWeight: '600',
    },
    modalBackdrop: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9,
    },
    modalContainer: {
        position: 'absolute',
        left: 12,
        right: 12,
        zIndex: 11,
    },
    modalBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    modalContent: {
        padding: 24,
    },
});

