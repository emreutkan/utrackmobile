import { theme } from '@/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    }, [isActive, activeProgress]);

    const animatedContainerStyle = useAnimatedStyle(() => {
        // Base width is 48 (icon + padding).
        // Expanded width is 48 + textWidth + extra padding for text.
        // We ensure textWidth is at least 40 to prevent collapse before measurement.
        const expandedWidth = 48 + (textWidth.value || 40) + theme.spacing.m;

        return {
            width: interpolate(activeProgress.value, [0, 1], [48, expandedWidth]),
            backgroundColor: `rgba(255, 255, 255, ${activeProgress.value})`,
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(activeProgress.value, [0, 0.8, 1], [0, 0, 1]),
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
                            size: isActive ? 24 : 20,
                            color: isActive ? theme.colors.status.active : theme.colors.text.secondary
                        })}
                    </Animated.View>

                    <Animated.View style={[styles.textContainer, animatedTextStyle]}>
                        <Text
                            numberOfLines={1}
                            style={[styles.tabLabel, isActive && { color: theme.colors.status.active }]}
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
                                (segments.some(s => String(s) === '(workouts)') && segments.length > 2);
    const shouldHide = segments.some(s =>
        ['(auth)', 'auth', 'hero', 'active-workout', '(active-workout)', 'recovery-status', '(recovery-status)', 'templates', '(templates)', 'loadingHome', 'permissions', '(permissions)', 'knowledge-base', '(knowledge-base)', 'volume-analysis', '(volume-analysis)'].includes(String(s))
    ) || pathname.includes('/auth') || pathname.includes('/hero') || pathname.includes('/active-workout') || pathname.includes('/recovery-status') || pathname.includes('/templates') || pathname.includes('/permissions') || pathname.includes('/knowledge-base') || pathname.includes('/volume-analysis') || isWorkoutDetailPage;

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
            <View style={styles.blurContainer}>
                <TabList activeKey={activeTab.key} router={router} />
            </View>
        </View>
    );
}

// Helper to render the list and keep the main component clean
const TabList = ({ activeKey, router }: { activeKey: string, router: any }) => {
    const handleTabPress = (tabKey: string, route: string) => {
        // Prevent navigation if already on this tab
        if (activeKey === tabKey) {
            return;
        }
        router.replace(route);
    };

    return (
        <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
                <TabButton
                    key={tab.key}
                    tab={tab}
                    isActive={activeKey === tab.key}
                    onPress={(route) => handleTabPress(tab.key, route)}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.s,
    },
    blurContainer: {
        backgroundColor: theme.colors.ui.glassStrong,
        borderRadius: theme.borderRadius.xxl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.s,
    },
    tabWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabButton: {
        height: 48,
        borderRadius: theme.borderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: theme.spacing.xs,
        overflow: 'hidden',
    },
    tabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: theme.spacing.s,
    },
    textContainer: {
        marginLeft: theme.spacing.s,
    },
    tabLabel: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        color: theme.colors.text.secondary,
        marginRight: theme.spacing.m,
    },
});
