import { supabase } from '@/lib/supabase';
import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const showAlert = (title: string, message: string) => Alert.alert(title, message);

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'email' | 'name' | 'password'>('email');
  const [isRegistering, setIsRegistering] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const handleAppleSignIn = async () => {
    try {
      const rawNonce = Math.random().toString(36).substring(2);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) throw new Error('No identity token received from Apple.');

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (error) throw error;
      router.replace('/(tabs)/(home)');
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') return;
      showAlert('Apple Sign In Failed', e.message || 'An unexpected error occurred.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) throw new Error('No ID token received from Google.');

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.data.idToken,
      });

      if (error) throw error;
      router.replace('/(tabs)/(home)');
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (e.code === statusCodes.IN_PROGRESS) return;
      showAlert('Google Sign In Failed', e.message || 'An unexpected error occurred.');
    }
  };

  // Animation shared values
  const emailButtonHeight = useSharedValue(0);
  const emailButtonOpacity = useSharedValue(0);
  const nameButtonHeight = useSharedValue(0);
  const nameButtonOpacity = useSharedValue(0);
  const passwordButtonHeight = useSharedValue(0);
  const passwordButtonOpacity = useSharedValue(0);
  const backButtonWidth = useSharedValue(40);
  const backButtonOpacity = useSharedValue(1);
  const backButtonMarginRight = useSharedValue(2);

  // Email step: show continue/register button when email is entered
  useEffect(() => {
    if (currentStep === 'email') {
      if (email.length > 0) {
        emailButtonHeight.value = withTiming(57, { duration: 500 });
        emailButtonOpacity.value = withTiming(1, { duration: 500 });
      } else {
        emailButtonHeight.value = withTiming(0, { duration: 500 });
        emailButtonOpacity.value = withTiming(0, { duration: 500 });
      }
    }
  }, [email.length, currentStep, emailButtonHeight, emailButtonOpacity]);

  // Name step: show continue button, hide back button
  useEffect(() => {
    if (currentStep === 'name') {
      if (name.length > 0) {
        nameButtonHeight.value = withTiming(57, { duration: 500 });
        nameButtonOpacity.value = withTiming(1, { duration: 500 });
        backButtonWidth.value = withTiming(0, { duration: 500 });
        backButtonOpacity.value = withTiming(0, { duration: 500 });
        backButtonMarginRight.value = withTiming(0, { duration: 500 });
      } else {
        nameButtonHeight.value = withTiming(0, { duration: 500 });
        nameButtonOpacity.value = withTiming(0, { duration: 500 });
        backButtonWidth.value = withTiming(40, { duration: 500 });
        backButtonOpacity.value = withTiming(1, { duration: 500 });
        backButtonMarginRight.value = withTiming(2, { duration: 500 });
      }
    } else if (currentStep === 'email') {
      backButtonWidth.value = withTiming(40, { duration: 0 });
      backButtonOpacity.value = withTiming(1, { duration: 0 });
      backButtonMarginRight.value = withTiming(2, { duration: 0 });
    }
  }, [
    name.length,
    currentStep,
    nameButtonHeight,
    nameButtonOpacity,
    backButtonWidth,
    backButtonOpacity,
    backButtonMarginRight,
  ]);

  // Password step: show login/register button, hide back button
  useEffect(() => {
    if (currentStep === 'password') {
      if (password.length > 0) {
        passwordButtonHeight.value = withTiming(57, { duration: 500 });
        passwordButtonOpacity.value = withTiming(1, { duration: 500 });
        backButtonWidth.value = withTiming(0, { duration: 500 });
        backButtonOpacity.value = withTiming(0, { duration: 500 });
        backButtonMarginRight.value = withTiming(0, { duration: 500 });
      } else {
        passwordButtonHeight.value = withTiming(0, { duration: 500 });
        passwordButtonOpacity.value = withTiming(0, { duration: 500 });
        backButtonWidth.value = withTiming(40, { duration: 500 });
        backButtonOpacity.value = withTiming(1, { duration: 500 });
        backButtonMarginRight.value = withTiming(2, { duration: 500 });
      }
    }
  }, [
    password.length,
    currentStep,
    passwordButtonHeight,
    passwordButtonOpacity,
    backButtonWidth,
    backButtonOpacity,
    backButtonMarginRight,
  ]);

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

  const animatedBackButtonStyle = useAnimatedStyle(() => ({
    width: backButtonWidth.value,
    opacity: backButtonOpacity.value,
    marginRight: backButtonMarginRight.value,
    overflow: 'hidden',
    pointerEvents: backButtonOpacity.value > 0.5 ? 'auto' : 'none',
  }));

  const handleContinueFromEmail = () => {
    if (email.length === 0) return;
    setCurrentStep('password');
  };

  const handleStartRegister = () => {
    if (email.length === 0) return;
    setIsRegistering(true);
    setCurrentStep('name');
  };

  const handleContinueFromName = () => {
    if (name.length === 0) return;
    setCurrentStep('password');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Missing Information', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace('/(tabs)/(home)');
    } catch (e: any) {
      console.error('[Auth] login failed:', e);
      showAlert('Login Failed', e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      showAlert('Missing Information', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
      if (data.session) {
        // Email confirmation disabled — already signed in
        router.replace('/(tabs)/(home)');
        return;
      }
      // No session yet — try signing in immediately.
      // Succeeds if email confirmation is disabled in Supabase dashboard.
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInErr) {
        router.replace('/(tabs)/(home)');
      } else {
        showAlert(
          'Check Your Email',
          'We sent you a confirmation link. Please verify your email to continue.'
        );
      }
    } catch (e: any) {
      console.error('[Auth] register failed:', e);
      if (e.message?.toLowerCase().includes('already registered')) {
        Alert.alert('Account Exists', 'This email is already registered.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log In',
            onPress: () => {
              setIsRegistering(false);
              setCurrentStep('password');
            },
          },
        ]);
      } else {
        showAlert('Registration Failed', e.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showAlert('Enter Email', 'Please enter your email address first.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error('[Auth] reset password failed:', error);
      showAlert('Error', error.message);
    } else {
      showAlert('Email Sent', 'Check your email for a password reset link.');
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
        {/* Header */}
        <View style={styles.topSection}>
          <Ionicons name="pulse" size={16} color={theme.colors.status.rest} />
          <Text style={styles.footerText}>FORCE PERFORMANCE V2.0</Text>
        </View>

        <View style={styles.middleSection}>
          <View style={styles.titleContainer}>
            <Text style={typographyStyles.hero}>
              FORCE
              <Text style={{ color: theme.colors.status.rest }}>.</Text>
            </Text>
          </View>
          <Text style={styles.heroSubtitle}>
            {currentStep === 'password' ? 'BUILT FOR YOU' : 'BUILT FOR EXCELLENCE'}
          </Text>
        </View>

        <View style={styles.contentContainer}>
          {currentStep === 'email' && (
            <View style={styles.socialContainer}>
              {appleAvailable && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={22}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
              )}
              <Pressable style={styles.googleButton} onPress={handleGoogleSignIn}>
                <MaterialCommunityIcons name="google" size={20} color="#DB4437" />
                <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
              </Pressable>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>
          )}
          <View style={styles.inputGroup}>
            {currentStep === 'email' ? (
              <>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={theme.colors.text.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.inputTop}
                    placeholder="Email"
                    placeholderTextColor={theme.colors.text.secondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      if (email.length > 0) handleContinueFromEmail();
                    }}
                  />
                </View>
                <Animated.View style={animatedEmailButtonStyle}>
                  <View style={styles.seperatorWide} />
                  <View style={styles.splitButtonContainer}>
                    <Pressable
                      style={[styles.splitButton, styles.splitButtonLeft]}
                      onPress={(e) => {
                        e.preventDefault();
                        handleStartRegister();
                      }}
                      disabled={email.length === 0}
                    >
                      <Text style={styles.splitButtonText}>REGISTER</Text>
                    </Pressable>
                    <View style={styles.splitButtonDivider} />
                    <Pressable
                      style={[
                        styles.splitButton,
                        styles.splitButtonRight,
                        styles.splitButtonPrimary,
                      ]}
                      onPress={(e) => {
                        e.preventDefault();
                        handleContinueFromEmail();
                      }}
                      disabled={email.length === 0}
                    >
                      <Text style={[styles.splitButtonText, styles.splitButtonTextPrimary]}>
                        CONTINUE
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              </>
            ) : currentStep === 'name' ? (
              <>
                <View style={styles.passwordStepContainer}>
                  <Animated.View style={animatedBackButtonStyle}>
                    <Pressable
                      style={styles.backButton}
                      onPress={() => {
                        setCurrentStep('email');
                        setName('');
                        setIsRegistering(false);
                      }}
                    >
                      <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
                    </Pressable>
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
                      if (name.length > 0) handleContinueFromName();
                    }}
                  />
                </View>
                <Animated.View style={animatedNameButtonStyle}>
                  <View style={styles.seperatorWide} />
                  <Pressable
                    style={[styles.inputBottom, styles.inputBottomPrimary]}
                    onPress={(e) => {
                      e.preventDefault();
                      handleContinueFromName();
                    }}
                    disabled={name.length === 0}
                  >
                    <Text style={[styles.splitButtonText, styles.splitButtonTextPrimary]}>
                      CONTINUE
                    </Text>
                  </Pressable>
                </Animated.View>
              </>
            ) : (
              <>
                <View style={styles.passwordStepContainer}>
                  <Animated.View style={animatedBackButtonStyle}>
                    <Pressable
                      style={styles.backButton}
                      onPress={() => {
                        if (isRegistering) {
                          setCurrentStep('name');
                        } else {
                          setCurrentStep('email');
                        }
                        setPassword('');
                      }}
                    >
                      <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
                    </Pressable>
                  </Animated.View>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={theme.colors.text.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.inputTop}
                      placeholder="Password"
                      placeholderTextColor={theme.colors.text.secondary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      returnKeyType={isRegistering ? 'done' : 'go'}
                      onSubmitEditing={() => {
                        if (password.length > 0) {
                          if (isRegistering) handleRegister();
                          else handleLogin();
                        }
                      }}
                    />
                  </View>
                </View>
                {!isRegistering && currentStep === 'password' && (
                  <Pressable style={styles.forgotPasswordLink} onPress={handleForgotPassword}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </Pressable>
                )}
                <Animated.View style={animatedPasswordButtonStyle}>
                  <View style={styles.seperatorWide} />
                  {isRegistering ? (
                    <Pressable
                      style={[styles.inputBottom, styles.inputBottomPrimary]}
                      onPress={(e) => {
                        e.preventDefault();
                        handleRegister();
                      }}
                      disabled={loading || password.length === 0}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color={theme.colors.text.primary} />
                      ) : (
                        <Text style={[styles.splitButtonText, styles.splitButtonTextPrimary]}>
                          REGISTER
                        </Text>
                      )}
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[styles.inputBottom, styles.inputBottomPrimary]}
                      onPress={(e) => {
                        e.preventDefault();
                        handleLogin();
                      }}
                      disabled={loading || password.length === 0}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color={theme.colors.text.primary} />
                      ) : (
                        <Text style={[styles.splitButtonText, styles.splitButtonTextPrimary]}>
                          LOGIN
                        </Text>
                      )}
                    </Pressable>
                  )}
                </Animated.View>
              </>
            )}
          </View>
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
  socialContainer: {
    marginBottom: theme.spacing.m,
    gap: theme.spacing.m,
  },
  appleButton: {
    height: 56,
    width: '100%',
  },
  googleButton: {
    height: 56,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 22,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#3c4043',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.ui.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: theme.colors.text.tertiary,
  },
});
