import { getAPI_URL, REFRESH_URL } from '@/api/ApiBase';
import { clearTokens, getAccessToken, getRefreshToken, storeAccessToken, storeRefreshToken } from '@/api/Storage';
import axios from 'axios';
import { RelativePathString, useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HERO_SEEN_KEY = '@force_hero_seen';

// Global event emitter for token errors
let tokenErrorListeners: (() => void)[] = [];
let globalHasChecked = false; // Global flag to prevent infinite loops

export const onTokenError = (callback: () => void) => {
    tokenErrorListeners.push(callback);
    return () => {
        tokenErrorListeners = tokenErrorListeners.filter((l: () => void) => l !== callback);
    };
};

export const triggerTokenError = () => {
    // Only trigger if we haven't already checked and are not in a loop
    if (!globalHasChecked) {
        tokenErrorListeners.forEach((listener: () => void) => listener());
    }
};

export default function AuthCheck({ children }: { children: React.ReactNode }) {
    const [isChecking, setIsChecking] = useState<boolean>(true);
    const [initialRoute, setInitialRoute] = useState<RelativePathString | null>(null);
    const router = useRouter();
    const segments = useSegments();
    const insets = useSafeAreaInsets();
    const isCheckingRef = useRef<boolean>(false);

    const checkAuth = useCallback(async () => {
        // Prevent multiple simultaneous checks
        if (isCheckingRef.current) {
            return;
        }

        isCheckingRef.current = true;
        setIsChecking(true);
        try {
            const accessToken = await getAccessToken();
            const refreshToken = await getRefreshToken();

            // No tokens - check hero first, then go to auth
            if (!accessToken && !refreshToken) {
                isCheckingRef.current = false;
                setIsChecking(false);
                // Only route if not already on auth or hero
                if (segments[0] !== '(auth)' && segments[0] !== 'hero') {
                    const heroSeen = await AsyncStorage.getItem(HERO_SEEN_KEY);
                    if (!heroSeen) {
                        router.replace('/hero');
                    } else {
                        router.replace('/(auth)');
                    }
                }
                return;
            }

            // Have tokens - validate them
            if (refreshToken) {
                try {
                    const apiUrl = await getAPI_URL();

                    const response = await axios.post(`${apiUrl}${REFRESH_URL}`, { refresh: refreshToken }, {
                        timeout: 3000
                    });

                    if (response.status === 200 && response.data.access) {
                        await storeAccessToken(response.data.access);
                        if (response.data.refresh) {
                            await storeRefreshToken(response.data.refresh);
                        }
                        isCheckingRef.current = false;
                        setIsChecking(false);
                        setInitialRoute('/(home)' as RelativePathString);
                        // Route immediately
                        router.replace('/(home)' as RelativePathString);
                        return;
                    }
                } catch (error: any) {
                    // Check if it's an authentication error (401, 403) vs network error
                    const status = error?.response?.status;
                    const isAuthError = status === 401 || status === 403;

                    if (isAuthError) {
                        // Token is actually invalid - clear and check hero first
                        await clearTokens();
                        isCheckingRef.current = false;
                        setIsChecking(false);
                        if (segments[0] !== '(auth)' && segments[0] !== 'hero') {
                            const heroSeen = await AsyncStorage.getItem(HERO_SEEN_KEY);
                            setTimeout(() => {
                                if (!heroSeen) {
                                    router.replace('/hero' as RelativePathString);
                                } else {
                                    router.replace('/(auth)' as RelativePathString);
                                }
                            }, 100);
                        }
                    } else {
                        // Network error or other issue - keep tokens, assume valid, go to home
                        isCheckingRef.current = false;
                        setIsChecking(false);
                        setInitialRoute('/(home)' as RelativePathString);
                        router.replace('/(home)' as RelativePathString);
                    }
                    return;
                }
            }

            // Have access token but no refresh - assume valid
            if (accessToken) {
                isCheckingRef.current = false;
                setIsChecking(false);
                setInitialRoute('/(home)' as RelativePathString);
                // Route immediately
                router.replace('/(home)' as RelativePathString);
                return;
            }

            // Fallback - check hero first, then go to auth
            isCheckingRef.current = false;
            setIsChecking(false);
            if (segments[0] !== '(auth)' && segments[0] !== 'hero') {
                const heroSeen = await AsyncStorage.getItem(HERO_SEEN_KEY);
                setTimeout(() => {
                    if (!heroSeen) {
                        router.replace('/hero' as RelativePathString);
                    } else {
                        router.replace('/(auth)' as RelativePathString);
                    }
                }, 100);
            }
        } catch (error) {
            isCheckingRef.current = false;
            setIsChecking(false);
            if (segments[0] !== '(auth)' && segments[0] !== 'hero') {
                const heroSeen = await AsyncStorage.getItem(HERO_SEEN_KEY);
                setTimeout(() => {
                    if (!heroSeen) {
                        router.replace('/hero' as RelativePathString);
                    } else {
                        router.replace('/(auth)' as RelativePathString);
                    }
                }, 100);
            }
        }
    }, [segments, router]);


        useEffect(() => {
        // Only check once globally
        if (globalHasChecked) {
            setIsChecking(false);
            return;
        }

        globalHasChecked = true;
        checkAuth();

        // Listen for token errors - but prevent infinite loops
        const unsubscribe = onTokenError(() => {
            // Only re-check if we're not already checking and not on auth screen with no tokens
            if (!isCheckingRef.current && segments[0] !== '(auth)') {
                globalHasChecked = false; // Reset to allow re-check
                checkAuth();
            }
        });

        return unsubscribe;
    }, [segments, checkAuth]);
    // Redirect if we're on wrong route after auth check
    useEffect(() => {
        if (!isChecking && initialRoute && segments[0] && segments[0] !== '(auth)' && segments[0] !== '(home)') {
            router.replace(initialRoute as RelativePathString);
        }
    }, [isChecking, initialRoute, segments, router]);

    if (isChecking) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#0A84FF" />
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
