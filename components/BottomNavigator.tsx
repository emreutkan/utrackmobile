import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Types & Config ---

interface TabItem {
    key: string;
    label: string;
    route: string;
    icon: (props: { size: number; color: string }) => React.ReactNode;
}

const tabs: TabItem[] = [
    {
        key: 'home',
        label: 'Home',
        route: '/(home)',
        icon: ({ size, color }) => <Ionicons name="home" size={size} color={color} />,
    },
    {
        key: 'workouts',
        label: 'Workouts',
        route: '/(workouts)',
        icon: ({ size, color }) => <Ionicons name="reader-outline" size={size} color={color} />,
    },
    {
        key: 'supplements',
        label: 'Supplements',
        route: '/(supplements)',
        icon: ({ size, color }) => <MaterialIcons name="medication" size={size} color={color} />,
    },
    {
        key: 'calculations',
        label: 'Measurements',
        route: '/(calculations)',
        icon: ({ size, color }) => <Ionicons name="body-outline" size={size} color={color} />,
    },
    {
        key: 'account',
        label: 'Account',
        route: '/(account)',
        icon: ({ size, color }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
    },
];

// --- Components ---

interface TabButtonProps {
    tab: TabItem;
    isActive: boolean;
    onPress: (route: string) => void;
}

const TabButton = ({ tab, isActive, onPress }: TabButtonProps) => {
    // 0 = Inactive, 1 = Active
    const activeProgress = useSharedValue(isActive ? 1 : 0);
    const textWidth = useSharedValue(0);

    useEffect(() => {
        activeProgress.value = withSpring(isActive ? 1 : 0, {
            damping: 15,
            stiffness: 150,
        });
    }, [isActive]);

    const animatedContainerStyle = useAnimatedStyle(() => {
        // Base width is 48 (icon + padding). 
        // Expanded width is 48 + textWidth + extra padding for text.
        // We ensure textWidth is at least 40 to prevent collapse before measurement.
        const expandedWidth = 48 + (textWidth.value || 40) + 12;
        
        // Animate background color opacity from transparent to white
        const bgOpacity = activeProgress.value;
        
        return {
            width: interpolate(activeProgress.value, [0, 1], [48, expandedWidth]),
            backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(activeProgress.value, [0, 0.5, 1], [0, 0, 1]),
            transform: [
                { translateX: interpolate(activeProgress.value, [0, 1], [10, 0]) }
            ]
        };
    });

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: interpolate(activeProgress.value, [0, 1], [1, 0.9]) }]
        };
    });

    const handleTextLayout = (e: LayoutChangeEvent) => {
        textWidth.value = e.nativeEvent.layout.width;
    };

    return (
        <TouchableOpacity
            onPress={() => onPress(tab.route)}
            activeOpacity={0.7}
            style={styles.tabWrapper}
        >
            <Animated.View style={[styles.tabButton, animatedContainerStyle]}>
                <View style={styles.tabContent}>
                    <Animated.View style={animatedIconStyle}>
                        {tab.icon({ 
                            size: 24, 
                            color: isActive ? '#000000' : '#8E8E93' 
                        })}
                    </Animated.View>
                    
                    {/* We render text always to measure it, but hide it visually 
                      and clip it via the container's overflow: hidden 
                    */}
                    <Animated.View style={[styles.textContainer, animatedTextStyle]}>
                        <Text 
                            numberOfLines={1} 
                            style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                            onLayout={handleTextLayout}
                        >
                            {tab.label}
                        </Text>
                    </Animated.View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

// --- Main Navigator ---

export default function BottomNavigator() {
    const router = useRouter();
    const pathname = usePathname();
    const segments = useSegments();
    const insets = useSafeAreaInsets();

    // 1. Determine Visibility
    // Hide on Auth screens, specific flows, loading states, or workout detail pages
    const isWorkoutDetailPage = (pathname.includes('/workouts/') && pathname.split('/workouts/')[1]?.length > 0 && !pathname.endsWith('/workouts')) || 
                                (segments.includes('(workouts)') && segments.length > 2);
    const shouldHide = segments.some(s => 
        ['(auth)', 'auth', 'active-workout', '(active-workout)', 'recovery-status', '(recovery-status)', 'templates', '(templates)', 'loadingHome', 'permissions', '(permissions)', 'knowledge-base', '(knowledge-base)', 'volume-analysis', '(volume-analysis)'].includes(String(s))
    ) || pathname.includes('/auth') || pathname.includes('/active-workout') || pathname.includes('/recovery-status') || pathname.includes('/templates') || pathname.includes('/permissions') || pathname.includes('/knowledge-base') || pathname.includes('/volume-analysis') || isWorkoutDetailPage;

    if (shouldHide) return null;

    // 2. Determine Active Tab
    // Simplified matching: Check if the current path starts with the tab route
    // or checks the primary segment name.
    const activeTab = tabs.find(t => {
        // Clean route string: '/(home)' -> 'home'
        const cleanRoute = t.route.replace(/\W/g, ''); 
        // Check current segment: ['(home)', 'index'] -> '(home)'
        const currentSegment = segments[0]?.replace(/\W/g, '') || '';
        
        return currentSegment === cleanRoute || pathname.startsWith(t.route);
    }) || tabs[0]; // Default to first tab (Home)

    return (
        <View style={[styles.container, { bottom: insets.bottom }]}>
            {Platform.OS === 'ios' ? (
                <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                    <TabList activeKey={activeTab.key} router={router} />
                </BlurView>
            ) : (
                <View style={[styles.blurContainer, styles.androidContainer]}>
                    <TabList activeKey={activeTab.key} router={router} />
                </View>
            )}
        </View>
    );
}

// Helper to render the list and keep the main component clean
const TabList = ({ activeKey, router }: { activeKey: string, router: any }) => (
    <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
            <TabButton
                key={tab.key}
                tab={tab}
                isActive={activeKey === tab.key}
                onPress={(route) => router.replace(route)}
            />
        ))}
    </View>
);

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    blurContainer: {
        borderRadius: 30, // Slightly rounder for modern look
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)', // Subtle border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    androidContainer: {
        backgroundColor: '#1C1C1E',
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 6,
    },
    tabWrapper: {
        // No fixed width, let them flex naturally or stay compact
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabButton: {
        height: 44, // Slightly cleaner height
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // Important for expansion animation
        paddingHorizontal: 4, // Padding for the icon side
        overflow: 'hidden',
    },
    tabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8, // Space around icon
    },
    textContainer: {
        marginLeft: 8, // Gap between icon and text
        // Don't set overflow hidden here, let the text measure itself
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginRight: 12, // Right padding inside the pill
    },
    tabLabelActive: {
        color: '#000000',
    },
});