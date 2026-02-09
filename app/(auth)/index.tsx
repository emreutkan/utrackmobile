import { checkEmail, CheckEmailResponse, checkName, checkPassword, googleLogin, login, register } from '@/api/Auth';
import { getErrorMessage } from '@/api/errorHandler';
import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
};

// Handle deep linking for authentication

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState<'email' | 'name' | 'password'>('email');
    const [isRegistering, setIsRegistering] = useState(false);


    // Validation states
    const [emailValidation, setEmailValidation] = useState<CheckEmailResponse | null>(null);

    const [validating, setValidating] = useState(false);

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tapCount = useRef(0);
    const tapTimeout = useRef<NodeJS.Timeout | null>(null);

    // Animation for continue/register button (email step)
    const emailButtonHeight = useSharedValue(0);
    const emailButtonOpacity = useSharedValue(0);

    // Animation for continue button (name step)
    const nameButtonHeight = useSharedValue(0);
    const nameButtonOpacity = useSharedValue(0);

    // Animation for login/register button (password step)
    const passwordButtonHeight = useSharedValue(0);
    const passwordButtonOpacity = useSharedValue(0);

    // Animation for social buttons
    const socialButtonsHeight = useSharedValue(56); // Height of social button + gap
    const socialButtonsOpacity = useSharedValue(1);

    // Animation for back button (hide when typing)
    const backButtonWidth = useSharedValue(40);
    const backButtonOpacity = useSharedValue(1);
    const backButtonMarginRight = useSharedValue(2);

    const setEmailValue = (text: string) => {
        if (text.length > 0) {
            setEmailValidation(null);
        }
        setEmail(text);
    };
    // Email step: show continue/register button when email is entered
    useEffect(() => {
        if (currentStep === 'email') {
            if (email.length > 0) {
                emailButtonHeight.value = withTiming(70, { duration: 500 });
                emailButtonOpacity.value = withTiming(1, { duration: 500 });
            } else {
                emailButtonHeight.value = withTiming(0, { duration: 500 });
                emailButtonOpacity.value = withTiming(0, { duration: 500 });
            }
        }
    }, [email.length, currentStep, emailButtonHeight, emailButtonOpacity]);

    // Name step: show continue button when name is entered and hide back button
    useEffect(() => {
        if (currentStep === 'name') {
            if (name.length > 0) {
                nameButtonHeight.value = withTiming(70, { duration: 500 });
                nameButtonOpacity.value = withTiming(1, { duration: 500 });
                // Hide back button
                backButtonWidth.value = withTiming(0, { duration: 500 });
                backButtonOpacity.value = withTiming(0, { duration: 500 });
                backButtonMarginRight.value = withTiming(0, { duration: 500 });
            } else {
                nameButtonHeight.value = withTiming(0, { duration: 500 });
                nameButtonOpacity.value = withTiming(0, { duration: 500 });
                // Show back button
                backButtonWidth.value = withTiming(40, { duration: 500 });
                backButtonOpacity.value = withTiming(1, { duration: 500 });
                backButtonMarginRight.value = withTiming(2, { duration: 500 });
            }
        } else if (currentStep === 'email') {
            // Reset back button when on email step
            backButtonWidth.value = withTiming(40, { duration: 0 });
            backButtonOpacity.value = withTiming(1, { duration: 0 });
            backButtonMarginRight.value = withTiming(2, { duration: 0 });
        }
    }, [name.length, currentStep, nameButtonHeight, nameButtonOpacity, backButtonWidth, backButtonOpacity, backButtonMarginRight]);

    // Password step: show login/register button when password is entered and hide back button
    useEffect(() => {
        if (currentStep === 'password') {
            if (password.length > 0) {
                // Show button
                passwordButtonHeight.value = withTiming(70, { duration: 500 });
                passwordButtonOpacity.value = withTiming(1, { duration: 500 });
                // Hide back button
                backButtonWidth.value = withTiming(0, { duration: 500 });
                backButtonOpacity.value = withTiming(0, { duration: 500 });
                backButtonMarginRight.value = withTiming(0, { duration: 500 });
            } else {
                // Hide button
                passwordButtonHeight.value = withTiming(0, { duration: 500 });
                passwordButtonOpacity.value = withTiming(0, { duration: 500 });
                // Show back button
                backButtonWidth.value = withTiming(40, { duration: 500 });
                backButtonOpacity.value = withTiming(1, { duration: 500 });
                backButtonMarginRight.value = withTiming(2, { duration: 500 });
            }
        }
    }, [password.length, currentStep, passwordButtonHeight, passwordButtonOpacity, backButtonWidth, backButtonOpacity, backButtonMarginRight]);

    // Hide social buttons when not on email step or when user is typing email
    useEffect(() => {
        if (currentStep !== 'email' || email.length > 0) {
            socialButtonsHeight.value = withTiming(0, { duration: 300 });
            socialButtonsOpacity.value = withTiming(0, { duration: 300 });
        } else {
            socialButtonsHeight.value = withTiming(56, { duration: 300 });
            socialButtonsOpacity.value = withTiming(1, { duration: 300 });
        }
    }, [currentStep, email.length, socialButtonsHeight, socialButtonsOpacity]);


    const animatedEmailButtonStyle = useAnimatedStyle(() => ({
        height: emailButtonHeight.value,
        opacity: emailButtonOpacity.value,
        overflow: 'hidden',
    }));

    const animatedNameButtonStyle = useAnimatedStyle(() => ({
        height: nameButtonHeight.value,
        opacity: nameButtonOpacity.value,
        overflow: 'hidden',
    }));

    const animatedPasswordButtonStyle = useAnimatedStyle(() => ({
        height: passwordButtonHeight.value,
        opacity: passwordButtonOpacity.value,
        overflow: 'hidden',
    }));

    const     animatedSocialButtonsStyle = useAnimatedStyle(() => ({
        height: socialButtonsHeight.value,
        opacity: socialButtonsOpacity.value,
        marginBottom: 24,
    }));

    const animatedBackButtonStyle = useAnimatedStyle(() => ({
        width: backButtonWidth.value,
        opacity: backButtonOpacity.value,
        marginRight: backButtonMarginRight.value,
        overflow: 'hidden',
        pointerEvents: backButtonOpacity.value > 0.5 ? 'auto' : 'none',
    }));

    const handleContinueFromEmail = async () => {
        if (email.length === 0) {
            return;
        }

        // Validate email before proceeding
        setValidating(true);
        const result = await checkEmail(email);
        setEmailValidation(result);
        setValidating(false);

        if (!result.is_valid) {
            showAlert("Invalid Email", result.errors?.join('\n') || 'Please enter a valid email address.');
            return;
        }

        if (isRegistering) {
            setCurrentStep('name');
        } else {
            setCurrentStep('password');
        }
    };

    const handleStartRegister = async () => {
        if (email.length === 0) {
            return;
        }

        // Validate email before proceeding
        setValidating(true);
        const result = await checkEmail(email);
        setEmailValidation(result);
        setValidating(false);

        if (!result.is_valid) {
            showAlert("Invalid Email", result.errors?.join('\n') || 'Please enter a valid email address.');
            return;
        }

        if (result.user_exists) {
            showAlert("Email Already Registered", "");
            return;
        }

        setIsRegistering(true);
        setCurrentStep('name');
    };

    const handleContinueFromName = async () => {
        if (name.length === 0) {
            return;
        }

        // Validate name before proceeding
        setValidating(true);
        const result = await checkName(name);
        setValidating(false);

        if (!result.is_valid) {
            showAlert("Invalid Name", result.errors?.join('\n') || 'Please enter a valid name.');
            return;
        }

        setCurrentStep('password');
    };



    // Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '344903572266-72t0uji4lhh6htisqb3kq36sslq6jf7j.apps.googleusercontent.com',
        // You need to generate these in Google Cloud Console for the specific platform to avoid "Compliance" errors
        iosClientId: '344903572266-314v6q9vh2qooo4hqkqp1ornn8098uh6.apps.googleusercontent.com',
        androidClientId: '344903572266-1kfttptioqaffsf58e5rq5uo2n9s2ho5.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
    });


    useEffect(() => {
       const handleGoogleLoginEffect = async (token: string) => {
        setLoading(true);
        try {
            const result = await googleLogin(token);
            // Allow login if we get an object with an access token, even if refresh is empty string
            if (typeof result === 'object' && result.access) {
                router.replace('/(home)');
            } else {
                showAlert("Google Login Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e: any) {
            showAlert("Error", getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                handleGoogleLoginEffect(authentication.accessToken);
            }
        }
    }, [response, router]);

    useEffect(() => {
        return () => {
            if (tapTimeout.current) {
                clearTimeout(tapTimeout.current);
            }
        };
    }, [tapTimeout]);


    const handleForceTap = () => {
        tapCount.current += 1;

        // Clear existing timeout
        if (tapTimeout.current) {
            clearTimeout(tapTimeout.current);
        }

        // If 5 taps, navigate to debug
        if (tapCount.current >= 5) {
            tapCount.current = 0;
            router.push('/(auth)/debug');
        } else {
            // Reset counter after 2 seconds of no taps
            tapTimeout.current = setTimeout(() => {
                tapCount.current = 0;
            }, 2000) as any;
        }
    };



    const handleLogin = async () => {
        if (!email || !password) {
            showAlert("Missing Information", "Please enter both email and password.");
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            if (typeof result === 'object' && result.access && result.refresh) {
                router.replace('/(home)');
            } else {
                showAlert("Login Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e: any) {
            showAlert("Error", getErrorMessage(e));
            showAlert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name || !email || !password) {
            showAlert("Missing Information", "Please fill in all fields.");
            return;
        }

        // Validate password before registering
        setValidating(true);
        const passwordResult = await checkPassword(password);
        setValidating(false);

        if (!passwordResult.is_valid) {
            showAlert("Invalid Password", passwordResult.errors?.join('\n') || 'Please enter a valid password.');
            return;
        }

        setLoading(true);
        try {
            const result = await register(email, password, 'male', undefined, name);
            if (typeof result === 'object' && result.access && result.refresh) {
                router.replace('/(home)');
            } else {
                showAlert("Registration Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e: any) {
            showAlert("Error", getErrorMessage(e));
            showAlert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        if (provider === 'Google') {
            promptAsync();
        } else {
            showAlert(`${provider} Login`, "This feature is coming soon!");
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <LinearGradient
                colors={['rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 0.1)', 'transparent']}
                style={styles.bgGlow}
            />
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={styles.gradientBg}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Header with waveform icon and FORCE PERFORMANCE V2.0 */}
                <View style={styles.topSection}>
                    <Ionicons name="pulse" size={16} color={theme.colors.status.rest} />
                    <Text style={styles.footerText}>FORCE PERFORMANCE V2.0</Text>
                </View>

                <View style={styles.middleSection}>
                    <View style={styles.titleContainer}>
                    <TouchableOpacity
                        onPress={handleForceTap}
                        activeOpacity={0.8}
                    >
                            <Text style={typographyStyles.hero}>
                                FORCE
                                <Text style={{ color: theme.colors.status.rest }}>.</Text>
                            </Text>
                    </TouchableOpacity>
                    </View>
                    <Text style={styles.heroSubtitle}>
                        {currentStep === 'password' ? 'BUILT FOR YOU' : 'BUILT FOR EXCELLENCE'}
                            </Text>
                </View>

                <View style={styles.contentContainer}>
                <View style={styles.inputGroup}>
                    {currentStep === 'email' ? (
                        // Email Step
                        <>
                            <View style={[styles.inputWrapper, emailValidation && !emailValidation.is_valid && styles.inputWrapperError]}>
                                <Ionicons name="mail-outline" size={20} color={theme.colors.text.primary} style={styles.inputIcon} />
                            <TextInput
                                    style={styles.inputTop}
                                placeholder="Email"
                                placeholderTextColor={theme.colors.text.secondary}
                                value={email}
                                onChangeText={setEmailValue}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    if (email.length > 0 && (!emailValidation || emailValidation.is_valid)) {
                                        if (isRegistering) {
                                            handleStartRegister();
                                        } else {
                                            handleContinueFromEmail();
                                        }
                                    }
                                }}
                            />
                            </View>
                            <Animated.View style={animatedEmailButtonStyle}>
                                <View style={styles.seperatorWide} />
                                <View style={styles.splitButtonContainer}>
                                    <TouchableOpacity
                                        style={[styles.splitButton, styles.splitButtonLeft]}
                                        onPress={(e) => {
                                            e.preventDefault();
                                            handleStartRegister();
                                        }}
                                        activeOpacity={0.8}
                                        disabled={email.length === 0 || validating}
                                    >
                                        {validating && currentStep === 'email' ? (
                                            <ActivityIndicator size="small" color={theme.colors.text.primary} />
                                        ) : (
                                            <Text style={styles.splitButtonText}>REGISTER</Text>
                                        )}
                                    </TouchableOpacity>
                                    <View style={styles.splitButtonDivider} />
                                    <TouchableOpacity
                                        style={[styles.splitButton, styles.splitButtonRight, styles.splitButtonPrimary]}
                                        onPress={(e) => {
                                            e.preventDefault();
                                            handleContinueFromEmail();
                                        }}
                                        activeOpacity={0.8}
                                        disabled={email.length === 0 || validating}
                                    >
                                        <Text style={[styles.splitButtonText, styles.splitButtonTextPrimary]}>CONTINUE</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        </>
                    ) : currentStep === 'name' ? (
                        // Name Step (Registration only)
                        <>
                            <View style={styles.passwordStepContainer}>
                                <Animated.View style={animatedBackButtonStyle}>
                                    <TouchableOpacity
                                        style={styles.backButton}
                                        onPress={() => {
                                            setCurrentStep('email');
                                            setName('');
                                            setIsRegistering(false);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
                                    </TouchableOpacity>
                                </Animated.View>
                                <TextInput
                                    style={styles.inputTop}
                                    placeholder="Name"
                                    placeholderTextColor={theme.colors.text.secondary}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    returnKeyType="next"
                                    onSubmitEditing={() => {
                                        if (name.length > 0) {
                                            handleContinueFromName();
                                        }
                                    }}
                                />
                            </View>
                            {validating && currentStep === 'name' && (
                                <View style={styles.validatingContainer}>
                                    <ActivityIndicator size="small" color={theme.colors.text.secondary} />
                                    <Text style={styles.validatingText}>Validating...</Text>
                                </View>
                            )}
                            <Animated.View style={animatedNameButtonStyle}>
                                <View style={styles.seperatorWide} />
                                <TouchableOpacity
                                    style={[styles.inputBottom, styles.inputBottomPrimary]}
                                    onPress={(e) => {
                                        e.preventDefault();
                                        handleContinueFromName();
                                    }}
                                    activeOpacity={0.8}
                                    disabled={name.length === 0 || validating}
                                >
                                    {validating && currentStep === 'name' ? (
                                        <ActivityIndicator size="small" color={theme.colors.text.primary} />
                                    ) : (
                                        <Text style={[styles.splitButtonText, styles.splitButtonTextPrimary]}>CONTINUE</Text>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </>
                    ) : (
                        <>
                            <View style={styles.passwordStepContainer}>
                                <Animated.View style={animatedBackButtonStyle}>
                                    <TouchableOpacity
                                        style={styles.backButton}
                                        onPress={() => {
                                            if (isRegistering) {
                                                setCurrentStep('name');
                                            } else {
                                                setCurrentStep('email');
                                            }
                                            setPassword('');
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
                                    </TouchableOpacity>
                                </Animated.View>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.primary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.inputTop}
                                    placeholder="Password"
                                    placeholderTextColor={theme.colors.text.secondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    returnKeyType={isRegistering ? "done" : "go"}
                                    onSubmitEditing={() => {
                                        if (password.length > 0) {
                                            if (isRegistering) {
                                                handleRegister();
                                            } else {
                                                handleLogin();
                                            }
                                        }
                                    }}
                                />
                                </View>
                            </View>
                            {!isRegistering && currentStep === 'password' && (
                                <TouchableOpacity
                                    style={styles.forgotPasswordLink}
                                    onPress={() => router.push('/(auth)/request-reset')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            )}
                            {validating && currentStep === 'password' && (
                                <View style={styles.validatingContainer}>
                                    <ActivityIndicator size="small" color={theme.colors.text.secondary} />
                                    <Text style={styles.validatingText}>Validating...</Text>
                                </View>
                            )}
                            <Animated.View style={animatedPasswordButtonStyle}>
                                <View style={styles.seperatorWide} />
                                {isRegistering ? (
                                    <TouchableOpacity
                                        style={[styles.inputBottom, styles.inputBottomPrimary]}
                                        onPress={(e) => {
                                            e.preventDefault();
                                            handleRegister();
                                        }}
                                        activeOpacity={0.8}
                                        disabled={loading || password.length === 0 || validating}
                                    >
                                        {loading || validating ? (
                                            <ActivityIndicator size="small" color={theme.colors.text.primary} />
                                        ) : (
                                            <Text style={[styles.splitButtonText, styles.splitButtonTextPrimary]}>REGISTER</Text>
                                        )}
                                    </TouchableOpacity>
                                ) : (
                                        <TouchableOpacity
                                        style={[styles.inputBottom, styles.inputBottomPrimary]}
                                            onPress={(e) => {
                                                e.preventDefault();
                                                handleLogin();
                                            }}
                                            activeOpacity={0.8}
                                            disabled={loading || password.length === 0}
                                        >
                                            {loading ? (
                                                <ActivityIndicator size="small" color={theme.colors.text.primary} />
                                            ) : (
                                            <Text style={[styles.splitButtonText, styles.splitButtonTextPrimary]}>LOGIN</Text>
                                            )}
                                        </TouchableOpacity>
                                )}
                            </Animated.View>
                        </>
                    )}
                </View>

                <Animated.View style={animatedSocialButtonsStyle}>
                    <View style={styles.socialContainer}>
                            <TouchableOpacity
                                style={styles.socialButton}
                            onPress={() => handleSocialLogin('Google')}
                            activeOpacity={0.8}
                            disabled={!request}
                        >
                            {loading && response?.type !== 'success' && request ? (
                                 <ActivityIndicator size="small" color={theme.colors.text.primary} />
                            ) : (
                                 <>
                                    <Ionicons name="logo-google" size={24} color={theme.colors.text.primary} />
                                    <Text style={styles.socialButtonText}>GOOGLE</Text>
                                 </>
                            )}
                        </TouchableOpacity>

                        {Platform.OS === 'ios' && (
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={() => handleSocialLogin('Apple')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="logo-apple" size={24} color={theme.colors.text.primary} />
                                <Text style={styles.socialButtonText}>APPLE</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
                </View>


            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.xl,
    },
    bgGlow: {
        position: 'absolute',
        top: '25%',
        left: '50%',
        width: 300,
        height: 300,
        borderRadius: 9999,
        transform: [{ translateX: -150 }],
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        position: 'relative',
        zIndex: 10,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
        justifyContent: 'center',
        paddingTop: theme.spacing.xxl,
        paddingBottom: theme.spacing.xxl,
        position: 'relative',
        zIndex: 10,
    },
    footerText: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.wide,
        color: theme.colors.text.zinc700,
        textAlign: 'center',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingBottom: theme.spacing.m,
        position: 'relative',
        zIndex: 10,
    },
    middleSection: {
        alignItems: 'center',
        paddingTop: theme.spacing.xxxxxl,
        paddingBottom: theme.spacing.xl,
        zIndex: 10,
        gap: theme.spacing.m,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    heroSubtitle: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.status.rest,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.wide,
    },

    inputGroup: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        marginBottom: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
        minHeight: 56,
        maxHeight: 60,
    },
    inputWrapperError: {
        borderColor: theme.colors.status.error,
        borderWidth: 1,
    },
    inputIcon: {
        marginRight: 12,
    },
    inputTop: {
        flex: 1,
        minHeight: 56,
        fontSize: 17,
        color: theme.colors.text.primary,
        backgroundColor: 'transparent',
    },
    passwordStepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    inputBottom: {
        height: 56,
        paddingHorizontal: 16,
        fontSize: 17,
        backgroundColor: theme.colors.ui.glass,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputBottomPrimary: {
        backgroundColor: theme.colors.status.rest,
    },
    splitButtonContainer: {
        flexDirection: 'row',
        height: 56,
        backgroundColor: 'transparent',
        width: '100%',
    },
    splitButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glass,
    },
    splitButtonLeft: {
        borderBottomLeftRadius: 22,
    },
    splitButtonRight: {
        borderBottomRightRadius: 22,
    },
    splitButtonPrimary: {
        backgroundColor: theme.colors.status.rest,
    },
    splitButtonDivider: {
        width: 1,
        backgroundColor: theme.colors.ui.border,
    },
    splitButtonText: {
        color: theme.colors.text.primary,
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    splitButtonTextPrimary: {
        color: theme.colors.text.primary,
    },
    seperatorWide: {
        height: 1,
        backgroundColor: theme.colors.ui.border,
    },
    socialContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.ui.glass,
        height: 56,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        gap: 8,
    },
    socialButtonText: {
        color: theme.colors.text.primary,
        fontSize: 17,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    validatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
        gap: 8,
    },
    validatingText: {
        color: theme.colors.text.secondary,
        fontSize: 13,
        fontWeight: '400',
    },
    forgotPasswordLink: {
        alignSelf: 'flex-end',
        marginTop: theme.spacing.s,
        marginBottom: theme.spacing.s,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.s,
    },
    forgotPasswordText: {
        color: theme.colors.status.active,
        fontSize: theme.typography.sizes.s,
        fontWeight: '500',
    },
});
