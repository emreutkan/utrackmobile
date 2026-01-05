import { checkToday, getRecoveryStatus } from '@/api/Workout';
import { useHomeLoadingStore } from '@/state/userStore';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LOADING_DURATION = 2000; // 2 seconds

export default function LoadingHome() {
    const insets = useSafeAreaInsets();
    const progress = useSharedValue(0);
    const { fromDebug } = useLocalSearchParams<{ fromDebug?: string }>();
    
    // Animation for hero subtitle text rotation
    const subtitleIndex = useSharedValue(0);
    const subtitleOpacity = useSharedValue(1);
    const subtitleTranslateY = useSharedValue(0);
    const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
    
    const subtitlePhrases = ['by Discipline', 'with Science', 'for Excellence', 'for You'];
    
    const { setTodayStatus, setRecoveryStatus, setInitialLoadComplete } = useHomeLoadingStore();

    useEffect(() => {
        // Start loading data immediately
        const loadData = async () => {
            try {
                // Load today status and recovery status in parallel
                const [todayResult, recoveryResult] = await Promise.all([
                    checkToday().catch(() => null),
                    getRecoveryStatus().catch(() => null)
                ]);

                // Store the data
                if (todayResult) {
                    setTodayStatus(todayResult);
                }
                if (recoveryResult?.recovery_status) {
                    setRecoveryStatus(recoveryResult.recovery_status);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();

        // Start progress bar animation
        progress.value = withTiming(100, {
            duration: LOADING_DURATION,
            easing: Easing.linear,
        });

        // Navigate to home or back to debug after loading completes
        const timer = setTimeout(() => {
            if (fromDebug === 'true') {
                router.back();
            } else {
                setInitialLoadComplete(true);
                router.replace('/(home)');
            }
        }, LOADING_DURATION);

        return () => clearTimeout(timer);
    }, []);

    // Animate subtitle text rotation
    useEffect(() => {
        const interval = setInterval(() => {
            // Fade out and move up
            subtitleOpacity.value = withTiming(0, { duration: 300 });
            subtitleTranslateY.value = withTiming(-10, { duration: 300 });
            
            setTimeout(() => {
                // Change text index
                const nextIndex = (currentSubtitleIndex + 1) % subtitlePhrases.length;
                setCurrentSubtitleIndex(nextIndex);
                subtitleIndex.value = nextIndex;
                // Reset position
                subtitleTranslateY.value = 10;
                // Fade in and move to center
                subtitleOpacity.value = withTiming(1, { duration: 300 });
                subtitleTranslateY.value = withTiming(0, { duration: 300 });
            }, 300);
        }, 2000); // Change every 2 seconds
        
        return () => clearInterval(interval);
    }, [currentSubtitleIndex]);

    const progressBarStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }));

    const animatedSubtitleStyle = useAnimatedStyle(() => ({
        opacity: subtitleOpacity.value,
        transform: [{ translateY: subtitleTranslateY.value }],
    }));

    return (
        <View style={styles.container}>
            <View style={[styles.content, { paddingTop: insets.top }]}>
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>utrack</Text>
                    <View style={styles.heroSubtitleContainer}>
                        <Text style={styles.heroSubtitleStatic}>Built </Text>
                        <Animated.View style={[styles.heroSubtitleAnimated, animatedSubtitleStyle]}>
                            <Text style={styles.heroSubtitleDynamic}>
                                {subtitlePhrases[currentSubtitleIndex]}
                            </Text>
                        </Animated.View>
                    </View>
                </View>
            </View>

            {/* Progress Bar at bottom */}
            <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBar, progressBarStyle]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
        padding: 20,
        paddingBottom: 40,
    },
    content: {
        flex: 1,
        padding: 1,
    },
    heroSection: {
        paddingTop: "20%",
        paddingBottom: "25%",
        alignItems: 'flex-start',
    },
    heroTitle: {
        fontWeight: '200',
        fontSize: 72,
        color: 'white',
        letterSpacing: 5,
    },
    heroSubtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    heroSubtitleStatic: {
        fontSize: 16,
        fontWeight: '400',
        color: '#8E8E93',
    },
    heroSubtitleAnimated: {
        overflow: 'hidden',
    },
    heroSubtitleDynamic: {
        fontSize: 16,
        fontWeight: '400',
        color: '#8E8E93',
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 60,
        left: 20,
        right: 20,
        height: 4,
        backgroundColor: '#1C1C1E',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#0A84FF',
    },
});

