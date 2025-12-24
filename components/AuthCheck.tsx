import { getAccessToken, getRefreshToken, clearTokens, storeAccessToken, storeRefreshToken } from '@/api/Storage';
import { BASE_URL, REFRESH_URL } from '@/api/ApiBase';
import axios from 'axios';
import { useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Global event emitter for token errors
let tokenErrorListeners: Array<() => void> = [];

export const onTokenError = (callback: () => void) => {
    tokenErrorListeners.push(callback);
    return () => {
        tokenErrorListeners = tokenErrorListeners.filter(l => l !== callback);
    };
};

export const triggerTokenError = () => {
    tokenErrorListeners.forEach(listener => listener());
};

export default function AuthCheck({ children }: { children: React.ReactNode }) {
    const [isChecking, setIsChecking] = useState(true);
    const router = useRouter();
    const segments = useSegments();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        checkAuth();
        
        // Listen for token errors
        const unsubscribe = onTokenError(() => {
            checkAuth();
        });
        
        return unsubscribe;
    }, []);

    const checkAuth = async () => {
        setIsChecking(true);
        try {
            const accessToken = await getAccessToken();
            const refreshToken = await getRefreshToken();

            // No tokens at all - go to auth
            if (!accessToken && !refreshToken) {
                await clearTokens();
                setIsChecking(false);
                if (segments[0] !== '(auth)') {
                    router.replace('/(auth)');
                }
                return;
            }

            // Have refresh token but no access token - try to refresh
            if (!accessToken && refreshToken) {
                try {
                    const response = await axios.post(`${BASE_URL}${REFRESH_URL}`, { refresh: refreshToken });
                    if (response.status === 200 && response.data.access) {
                        await storeAccessToken(response.data.access);
                        if (response.data.refresh) {
                            await storeRefreshToken(response.data.refresh);
                        }
                        // Token refreshed successfully
                        setIsChecking(false);
                        if (segments[0] === '(auth)') {
                            router.replace('/(home)');
                        }
                        return;
                    }
                } catch (error) {
                    // Refresh failed - clear tokens and go to auth
                    await clearTokens();
                    setIsChecking(false);
                    router.replace('/(auth)');
                    return;
                }
            }

            // Have access token - validate it
            if (accessToken) {
                // Try to validate token with a simple request
                try {
                    // Just check if we have a valid token structure, or make a lightweight validation call
                    // For now, if we have access token, assume it's valid
                    setIsChecking(false);
                    if (segments[0] === '(auth)') {
                        router.replace('/(home)');
                    }
                    return;
                } catch (error) {
                    // Token validation failed - try refresh
                    if (refreshToken) {
                        try {
                            const response = await axios.post(`${BASE_URL}${REFRESH_URL}`, { refresh: refreshToken });
                            if (response.status === 200 && response.data.access) {
                                await storeAccessToken(response.data.access);
                                if (response.data.refresh) {
                                    await storeRefreshToken(response.data.refresh);
                                }
                                setIsChecking(false);
                                return;
                            }
                        } catch (refreshError) {
                            // Refresh failed
                        }
                    }
                    // All validation failed - clear and go to auth
                    await clearTokens();
                    setIsChecking(false);
                    router.replace('/(auth)');
                    return;
                }
            }

            // Fallback - go to auth
            await clearTokens();
            setIsChecking(false);
            router.replace('/(auth)');
        } catch (error) {
            console.error('Auth check error:', error);
            await clearTokens();
            setIsChecking(false);
            router.replace('/(auth)');
        }
    };

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

