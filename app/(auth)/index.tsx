import { checkEmail, CheckEmailResponse, checkName, CheckNameResponse, checkPassword, CheckPasswordResponse, googleLogin, login, register } from '@/api/Auth';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Web-compatible alert helper
const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message);
    }
};

// Handle deep linking for authentication
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState<'email' | 'name' | 'password'>('email');
    const [isRegistering, setIsRegistering] = useState(false);
    

    // Validation states
    const [emailValidation, setEmailValidation] = useState<CheckEmailResponse | null>(null);
    const [nameValidation, setNameValidation] = useState<CheckNameResponse | null>(null);
    const [passwordValidation, setPasswordValidation] = useState<CheckPasswordResponse | null>(null);
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
    
    
    // Animation for hero subtitle text rotation
    const subtitleIndex = useSharedValue(0);
    const subtitleOpacity = useSharedValue(1);
    const subtitleTranslateY = useSharedValue(0);
    const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
    
    const subtitlePhrases = ['by Discipline', 'with Science', 'for Excellence', 'for You'];    
    
    const setEmailValue = (text: string) => {
        if (text.length > 0) {
            setEmailValidation(null);
        }
        setEmail(text);
        console.log(email);
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
    }, [email.length, currentStep]);
    
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
    }, [name.length, currentStep]);
    
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
    }, [password.length, currentStep]);
    
    // Hide social buttons when not on email step
    useEffect(() => {
        if (currentStep !== 'email') {
            socialButtonsHeight.value = withTiming(0, { duration: 300 });
            socialButtonsOpacity.value = withTiming(0, { duration: 300 });
        } else {
            socialButtonsHeight.value = withTiming(56, { duration: 300 });
            socialButtonsOpacity.value = withTiming(1, { duration: 300 });
        }
    }, [currentStep]);

    
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
    
    const animatedSocialButtonsStyle = useAnimatedStyle(() => ({
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
    
    const animatedSubtitleStyle = useAnimatedStyle(() => ({
        opacity: subtitleOpacity.value,
        transform: [{ translateY: subtitleTranslateY.value }],
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
            showAlert("Invalid Email", result.errors.join('\n') || 'Please enter a valid email address.');
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
            showAlert("Invalid Email", result.errors.join('\n') || 'Please enter a valid email address.');
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
        setNameValidation(result);
        setValidating(false);

        if (!result.is_valid) {
            showAlert("Invalid Name", result.errors.join('\n') || 'Please enter a valid name.');
            return;
        }

        setCurrentStep('password');
    };
    
    const handleForgotPassword = () => {
        // TODO: Implement forgot password flow
        showAlert("Forgot Password", "This feature is coming soon!");
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
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                handleGoogleLogin(authentication.accessToken);
            }
        }
    }, [response]);

    useEffect(() => {
        return () => {
            if (tapTimeout.current) {
                clearTimeout(tapTimeout.current);
            }
        };
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
        }, 2000); // Change every 3 seconds
        
        return () => clearInterval(interval);
    }, [currentSubtitleIndex]);
    

    const handleUtrackTap = () => {
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

    const handleGoogleLogin = async (token: string) => {
        setLoading(true);
        try {
            const result = await googleLogin(token);
            // Allow login if we get an object with an access token, even if refresh is empty string
            if (typeof result === 'object' && result.access) {
                router.replace('/(home)');
            } else {
                showAlert("Google Login Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e) {
            showAlert("Error", "An unexpected error occurred during Google login.");
        } finally {
            setLoading(false);
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
        } catch (e) {
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
        setPasswordValidation(passwordResult);
        setValidating(false);

        if (!passwordResult.is_valid) {
            showAlert("Invalid Password", passwordResult.errors.join('\n') || 'Please enter a valid password.');
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
        } catch (e) {
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
        <View style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.content, { paddingTop: insets.top }]}
            >
                <View style={styles.heroSection}>
                    <TouchableOpacity 
                        onPress={handleUtrackTap}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.heroTitle}>utrack</Text>
                    </TouchableOpacity>
                    <View style={styles.heroSubtitleContainer}>
                        <Text style={styles.heroSubtitleStatic}>Built </Text>
                        <Animated.View style={[styles.heroSubtitleAnimated, animatedSubtitleStyle]}>
                            <Text style={styles.heroSubtitleDynamic}>
                                {subtitlePhrases[currentSubtitleIndex]}
                            </Text>
                        </Animated.View>
                    </View>
                </View>
      
                <View style={styles.contentContainer}>
                <BlurView intensity={80} style={styles.blurView}>
                <View style={styles.inputGroup}>
                    {currentStep === 'email' ? (
                        // Email Step
                        <>
                            <TextInput 
                                style={[styles.inputTop, emailValidation && !emailValidation.is_valid && styles.inputError]} 
                                placeholder="Email" 
                                placeholderTextColor="#8E8E93"
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
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.splitButtonText}>Register</Text>
                                        )}
                                    </TouchableOpacity>
                                    <View style={styles.splitButtonDivider} />
                                    <TouchableOpacity 
                                        style={[styles.splitButton, styles.splitButtonRight]}
                                        onPress={(e) => {
                                            e.preventDefault();
                                            handleContinueFromEmail();
                                        }}
                                        activeOpacity={0.8}
                                        disabled={email.length === 0 || validating}
                                    >
                                        <Text style={styles.splitButtonText}>Continue</Text>
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
                                        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </Animated.View>
                                <TextInput 
                                    style={styles.inputTop} 
                                    placeholder="Name" 
                                    placeholderTextColor="#8E8E93"
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
                                    <ActivityIndicator size="small" color="#8E8E93" />
                                    <Text style={styles.validatingText}>Validating...</Text>
                                </View>
                            )}
                            <Animated.View style={animatedNameButtonStyle}>
                                <View style={styles.seperatorWide} />
                                <TouchableOpacity 
                                    style={styles.inputBottom}
                                    onPress={(e) => {
                                        e.preventDefault();
                                        handleContinueFromName();
                                    }}
                                    activeOpacity={0.8}
                                    disabled={name.length === 0 || validating}
                                >
                                    {validating && currentStep === 'name' ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.splitButtonText}>Continue</Text>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </>
                    ) : (
                        // Password Step
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
                                        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </Animated.View>
                                <TextInput 
                                    style={styles.inputTop} 
                                    placeholder="Password" 
                                    placeholderTextColor="#8E8E93"
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
                            {validating && currentStep === 'password' && (
                                <View style={styles.validatingContainer}>
                                    <ActivityIndicator size="small" color="#8E8E93" />
                                    <Text style={styles.validatingText}>Validating...</Text>
                                </View>
                            )}
                            <Animated.View style={animatedPasswordButtonStyle}>
                                <View style={styles.seperatorWide} />
                                {isRegistering ? (
                                    <TouchableOpacity 
                                        style={styles.inputBottom}
                                        onPress={(e) => {
                                            e.preventDefault();
                                            handleRegister();
                                        }}
                                        activeOpacity={0.8}
                                        disabled={loading || password.length === 0 || validating}
                                    >
                                        {loading || validating ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.splitButtonText}>Register</Text>
                                        )}
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.splitButtonContainer}>
                                        <TouchableOpacity 
                                            style={[styles.splitButton, styles.splitButtonLeft]}
                                            onPress={handleForgotPassword}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.splitButtonText}>Forgot?</Text>
                                        </TouchableOpacity>
                                        <View style={styles.splitButtonDivider} />
                                        <TouchableOpacity 
                                            style={[styles.splitButton, styles.splitButtonRight]}
                                            onPress={(e) => {
                                                e.preventDefault();
                                                handleLogin();
                                            }}
                                            activeOpacity={0.8}
                                            disabled={loading || password.length === 0}
                                        >
                                            {loading ? (
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            ) : (
                                                <Text style={styles.splitButtonText}>Login</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </Animated.View>
                        </>
                    )}
                </View>

                {/* Social Buttons */}
                <Animated.View style={animatedSocialButtonsStyle}>
                    <View style={styles.socialContainer}>
                        {Platform.OS === 'ios' && (
                            <TouchableOpacity 
                                style={styles.socialButton} 
                                onPress={() => handleSocialLogin('Apple')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                                <Text style={styles.socialButtonText}>Apple</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                            style={[styles.socialButton, Platform.OS !== 'ios' && styles.socialButtonFull]}
                            onPress={() => handleSocialLogin('Google')}
                            activeOpacity={0.8}
                            disabled={!request}
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
                </Animated.View>
                </BlurView>
                </View>
         
            </KeyboardAvoidingView>
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
        padding: 1 
        
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 10,

    },
    blurView: {
        
        borderRadius: 22,
        borderColor: '#2C2C2E',
        padding: 12,
        overflow: 'hidden',
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
  
    inputGroup: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    inputTop: {
        width: '100%',
        minHeight: 56,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#1C1C1E',
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

    inputMiddle: {
        height: 56,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#1C1C1E',
    },
    inputBottom: {
        height: 70,
        paddingHorizontal: 16,
        fontSize: 17,
        backgroundColor: '#151517',
        justifyContent: 'center',
        alignItems: 'center',
    },
    splitButtonContainer: {
        flexDirection: 'row',
        height: 70,
        backgroundColor: '#151517',
    },
    splitButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    splitButtonLeft: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    splitButtonRight: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    splitButtonDivider: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43',
    },
    splitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43',
        marginLeft: 16,
        marginRight: 16,
    },
    seperatorWide: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },

    socialContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 16,
        paddingBottom: 16,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1C1C1E',
        height: 56,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        gap: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    socialButtonFull: {
        flex: 1,
        width: '100%',
    },
    socialButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '400',
    },
    footer: {
        alignItems: 'center',
    },
    linkText: {
        color: '#8E8E93',
        fontSize: 17,
    },
    linkBold: {
        color: '#0A84FF',
        fontWeight: '400',
    },
    forgotPasswordText: {
        color: '#0A84FF',
        fontSize: 17,
    },
    inputError: {
        borderColor: '#FF3B30',
        borderWidth: 1,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    errorContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 13,
        fontWeight: '400',
    },
    warningContainer: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 4,
    },
    warningText: {
        color: '#FF9500',
        fontSize: 13,
        fontWeight: '400',
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
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '400',
    },
    strengthContainer: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 4,
    },
    strengthText: {
        fontSize: 13,
        fontWeight: '400',
    },
    strengthTextWeak: {
        color: '#FF3B30',
    },
    strengthTextMedium: {
        color: '#FF9500',
    },
    strengthTextStrong: {
        color: '#34C759',
    },
});
