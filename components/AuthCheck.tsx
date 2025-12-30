import { getBASE_URL, REFRESH_URL } from '@/api/ApiBase';
import { clearTokens, getAccessToken, getRefreshToken, storeAccessToken, storeRefreshToken } from '@/api/Storage';
import axios from 'axios';
import { useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Global event emitter for token errors
let tokenErrorListeners: Array<() => void> = [];
let globalHasChecked = false; // Global flag to prevent infinite loops

export const onTokenError = (callback: () => void) => {
    tokenErrorListeners.push(callback);
    return () => {
        tokenErrorListeners = tokenErrorListeners.filter(l => l !== callback);
    };
};

export const triggerTokenError = () => {
    // Only trigger if we haven't already checked and are not in a loop
    if (!globalHasChecked) {
        tokenErrorListeners.forEach(listener => listener());
    }
};

export default function AuthCheck({ children }: { children: React.ReactNode }) {
    const [isChecking, setIsChecking] = useState(true);
    const [initialRoute, setInitialRoute] = useState<string | null>(null);
    const router = useRouter();
    const segments = useSegments();
    const insets = useSafeAreaInsets();
    const isCheckingRef = useRef(false);

    useEffect(() => {
        // Only check once globally
        if (globalHasChecked) {
            console.log('[AuthCheck] Already checked globally, skipping');
            setIsChecking(false);
            return;
        }
        
        console.log('[AuthCheck] Component mounted, starting auth check');
        globalHasChecked = true;
        checkAuth();
        
        // Listen for token errors - but prevent infinite loops
        const unsubscribe = onTokenError(() => {
            console.log('[AuthCheck] Token error triggered, but checking if we should re-check');
            // Only re-check if we're not already checking and not on auth screen with no tokens
            if (!isCheckingRef.current && segments[0] !== '(auth)') {
                console.log('[AuthCheck] Re-checking auth due to token error');
                globalHasChecked = false; // Reset to allow re-check
                checkAuth();
            } else {
                console.log('[AuthCheck] Skipping re-check - already checking or on auth screen');
            }
        });
        
        return unsubscribe;
    }, []);

    const checkAuth = async () => {
        // Prevent multiple simultaneous checks
        if (isCheckingRef.current) {
            console.log('[AuthCheck] checkAuth() already in progress, skipping');
            return;
        }
        
        console.log('[AuthCheck] checkAuth() called, setting isChecking=true');
        isCheckingRef.current = true;
        setIsChecking(true);
        try {
            console.log('[AuthCheck] Getting tokens from storage...');
            const accessToken = await getAccessToken();
            const refreshToken = await getRefreshToken();
            console.log('[AuthCheck] Tokens retrieved:', {
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
                accessTokenLength: accessToken?.length || 0,
                refreshTokenLength: refreshToken?.length || 0
            });

            // No tokens - go to login (but allow storybook)
            if (!accessToken && !refreshToken) {
                console.log('[AuthCheck] No tokens found');
                isCheckingRef.current = false;
                setIsChecking(false);
                console.log('[AuthCheck] isChecking set to false');
                // Only route if not already on auth or storybook
                if (segments[0] !== '(auth)' && segments[0] !== '(storybook)') {
                    console.log('[AuthCheck] Not on auth, calling router.replace');
                    router.replace('/(auth)');
                } else {
                    console.log('[AuthCheck] Already on auth/storybook screen, staying put');
                }
                return;
            }

            // Have tokens - validate them
            if (refreshToken) {
                console.log('[AuthCheck] Has refresh token, validating...');
                try {
                    console.log('[AuthCheck] Getting base URL...');
                    const baseUrl = await getBASE_URL();
                    console.log('[AuthCheck] Base URL:', baseUrl);
                    console.log('[AuthCheck] Making refresh request to:', `${baseUrl}${REFRESH_URL}`);
                    
                    const response = await axios.post(`${baseUrl}${REFRESH_URL}`, { refresh: refreshToken }, {
                        timeout: 3000
                    });
                    
                    console.log('[AuthCheck] Refresh response status:', response.status);
                    
                    if (response.status === 200 && response.data.access) {
                        console.log('[AuthCheck] Token refresh successful, storing tokens');
                        await storeAccessToken(response.data.access);
                        if (response.data.refresh) {
                            await storeRefreshToken(response.data.refresh);
                        }
                        console.log('[AuthCheck] Current segments:', segments);
                        isCheckingRef.current = false;
                        setIsChecking(false);
                        setInitialRoute('/(home)');
                        console.log('[AuthCheck] isChecking set to false, setting initial route to home');
                        // Route immediately, but preserve storybook route
                        if (segments[0] !== '(storybook)') {
                            router.replace('/(home)');
                        }
                        return;
                    }
                } catch (error: any) {
                    // Check if it's an authentication error (401, 403) vs network error
                    const status = error?.response?.status;
                    const isAuthError = status === 401 || status === 403;
                    
                    console.log('[AuthCheck] Token validation failed:', {
                        message: error?.message,
                        response: status,
                        code: error?.code,
                        isAuthError: isAuthError,
                        fullError: error
                    });
                    
                    if (isAuthError) {
                        // Token is actually invalid - clear and go to login (but allow storybook)
                        console.log('[AuthCheck] Authentication error (401/403), clearing tokens and routing to auth');
                        await clearTokens();
                        isCheckingRef.current = false;
                        setIsChecking(false);
                        if (segments[0] !== '(auth)' && segments[0] !== '(storybook)') {
                            setTimeout(() => {
                                router.replace('/(auth)');
                            }, 100);
                        }
                    } else {
                        // Network error or other issue - keep tokens, assume valid, go to home
                        console.log('[AuthCheck] Network/other error, keeping tokens and routing to home');
                        isCheckingRef.current = false;
                        setIsChecking(false);
                        setInitialRoute('/(home)');
                        // Preserve storybook route
                        if (segments[0] !== '(storybook)') {
                            router.replace('/(home)');
                        }
                    }
                    return;
                }
            }

            // Have access token but no refresh - assume valid
            if (accessToken) {
                console.log('[AuthCheck] Has access token but no refresh token, assuming valid');
                console.log('[AuthCheck] Current segments:', segments);
                isCheckingRef.current = false;
                setIsChecking(false);
                setInitialRoute('/(home)');
                console.log('[AuthCheck] isChecking set to false, setting initial route to home');
                // Route immediately, but preserve storybook route
                if (segments[0] !== '(storybook)') {
                    router.replace('/(home)');
                }
                return;
            }

            // Fallback - go to login (but allow storybook)
            console.log('[AuthCheck] Fallback: routing to auth');
            isCheckingRef.current = false;
            setIsChecking(false);
            console.log('[AuthCheck] isChecking set to false, checking segments before routing');
            if (segments[0] !== '(auth)' && segments[0] !== '(storybook)') {
                setTimeout(() => {
                    router.replace('/(auth)');
                }, 100);
            }
        } catch (error) {
            console.error('[AuthCheck] Auth check error:', error);
            console.log('[AuthCheck] Setting isChecking to false in catch block');
            isCheckingRef.current = false;
            setIsChecking(false);
            console.log('[AuthCheck] Checking segments before routing in catch block');
            if (segments[0] !== '(auth)' && segments[0] !== '(storybook)') {
                setTimeout(() => {
                    router.replace('/(auth)');
                }, 100);
            }
        }
    };

    console.log('[AuthCheck] Render - isChecking:', isChecking, 'segments:', segments, 'initialRoute:', initialRoute);
    
    // Redirect if we're on wrong route after auth check
    useEffect(() => {
        if (!isChecking && initialRoute && segments[0] && segments[0] !== '(auth)' && segments[0] !== '(home)' && segments[0] !== '(storybook)') {
            console.log('[AuthCheck] Redirecting from', segments[0], 'to home');
            router.replace(initialRoute);
        }
    }, [isChecking, initialRoute, segments, router]);
    
    if (isChecking) {
        console.log('[AuthCheck] Rendering loading spinner');
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#0A84FF" />
            </View>
        );
    }

    console.log('[AuthCheck] Rendering children (Stack navigator)');
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
