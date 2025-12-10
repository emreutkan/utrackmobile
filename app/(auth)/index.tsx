import { appleLogin, googleLogin, login } from '@/api/Auth';
import { getAccessToken } from '@/api/Storage';
import debug, { DebugLoginButton } from '@/state/debug';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Handle deep linking for authentication
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '344903572266-72t0uji4lhh6htisqb3kq36sslq6jf7j.apps.googleusercontent.com',
        // You need to generate these in Google Cloud Console for the specific platform to avoid "Compliance" errors
        iosClientId: '344903572266-314v6q9vh2qooo4hqkqp1ornn8098uh6.apps.googleusercontent.com', 
        androidClientId: '344903572266-1kfttptioqaffsf58e5rq5uo2n9s2ho5.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        getAccessToken().then((accessToken) => {
            if (accessToken) {
                router.replace('/(home)');
            }
        });
    }, []);

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                handleGoogleLogin(authentication.accessToken);
            }
        }
    }, [response]);

    const handleGoogleLogin = async (token: string) => {
        setLoading(true);
        try {
            const result = await googleLogin(token);
            // Allow login if we get an object with an access token, even if refresh is empty string
            if (typeof result === 'object' && result.access) {
                router.replace('/(home)');
            } else {
                Alert.alert("Google Login Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e) {
            Alert.alert("Error", "An unexpected error occurred during Google login.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Missing Information", "Please enter both email and password.");
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            if (typeof result === 'object' && result.access && result.refresh) {
                router.replace('/(home)');
            } else {
                Alert.alert("Login Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e) {
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setLoading(true);
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            
            if (credential.identityToken && credential.authorizationCode) {
                const result = await appleLogin(
                    credential.identityToken, 
                    credential.authorizationCode, 
                    credential.fullName // Pass user info (only available on first login)
                );
                
                if (typeof result === 'object' && result.access) {
                    router.replace('/(home)');
                } else {
                    Alert.alert("Apple Login Failed", typeof result === 'string' ? result : 'Unknown error');
                }
            }
        } catch (e: any) {
            if (e.code === 'ERR_CANCELED') {
                // User canceled
            } else {
                console.error(e);
                Alert.alert("Error", "Apple Sign In failed.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        if (provider === 'Google') {
            promptAsync();
        } else if (provider === 'Apple') {
            handleAppleLogin();
        } else {
            Alert.alert(`${provider} Login`, "This feature is coming soon!");
        }
    };

    return (
        <View style={styles.container}>
             {debug ? <View style={{ marginTop: 50 }}><DebugLoginButton /></View> : null}
             
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.content, { paddingTop: insets.top }]}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Log In</Text>
                    <Text style={styles.subtitle}>Sign in to access your workouts</Text>
                </View>
                
                <View style={styles.inputGroup}>
                    <TextInput 
                        style={styles.inputTop} 
                        placeholder="Email" 
                        placeholderTextColor="#8E8E93"
                        value={email} 
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <View style={styles.separator} />
                    <TextInput 
                        style={styles.inputBottom} 
                        placeholder="Password" 
                        placeholderTextColor="#8E8E93"
                        value={password} 
                        onChangeText={setPassword} 
                        secureTextEntry
                    />
                </View>

                <View style={styles.buttonContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0A84FF" />
                    ) : (
                        <TouchableOpacity 
                            style={styles.loginButton} 
                            onPress={handleLogin}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.loginButtonText}>Log In</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Or continue with</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Social Buttons */}
                <View style={styles.socialContainer}>
                    <TouchableOpacity 
                        style={styles.socialButton} 
                        onPress={() => handleSocialLogin('Apple')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                        <Text style={styles.socialButtonText}>Apple</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.socialButton} 
                        onPress={() => handleSocialLogin('Google')}
                        activeOpacity={0.8}
                        disabled={!request} // Disable if request is not ready
                    >
                        {loading && response?.type !== 'success' && request ? ( 
                             <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                             <>
                                <Ionicons name="logo-google" size={24} color="#FFFFFF" />
                                <Text style={styles.socialButtonText}>Google</Text>
                             </>
                        )}
                       
                    </TouchableOpacity>
                </View>
                
                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginTop: 16 }}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
    },
    inputGroup: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    inputTop: {
        height: 56,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#1C1C1E',
    },
    inputBottom: {
        height: 56,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#1C1C1E',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43',
        marginLeft: 16,
    },
    buttonContainer: {
        marginBottom: 24,
    },
    loginButton: {
        backgroundColor: '#0A84FF',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43',
    },
    dividerText: {
        color: '#8E8E93',
        fontSize: 13,
        marginHorizontal: 16,
    },
    socialContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1C1C1E',
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        gap: 8,
    },
    socialButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
    },
    linkText: {
        color: '#8E8E93',
        fontSize: 15,
    },
    linkBold: {
        color: '#0A84FF',
        fontWeight: '600',
    },
    forgotPasswordText: {
        color: '#0A84FF',
        fontSize: 15,
    }
});
