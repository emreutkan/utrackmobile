import { resetPassword } from '@/api/Auth';
import { theme } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getErrorMessage } from '@/api/errorHandler';
import { ResetPasswordRequest } from '@/api/types';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ uid?: string; token?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!params.uid || !params.token) {
      Alert.alert('Invalid Link', 'This password reset link is invalid or has expired.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)'),
        },
      ]);
    }
  }, [params.uid, params.token]);

  const handleResetPassword = async () => {
    if (!params.uid || !params.token) {
      Alert.alert('Error', 'Invalid reset link.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Missing Information', 'Please enter a new password.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const resetPasswordRequest: ResetPasswordRequest = {
        uid: params.uid as string,
        token: params.token as string,
        new_password: password,
      };
      await resetPassword(resetPasswordRequest);
      Alert.alert('Success', 'Your password has been reset successfully.');
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!params.uid || !params.token) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.status.error} />
          <Text style={styles.errorText}>Invalid Reset Link</Text>
          <Pressable style={styles.backButton} onPress={() => router.replace('/(auth)')}>
            <Text style={styles.backButtonText}>Go to Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </Pressable>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your new password below.</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>NEW PASSWORD</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter new password"
                placeholderTextColor={theme.colors.text.tertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.text.tertiary}
                />
              </Pressable>
            </View>
            <Text style={styles.hint}>Must be at least 8 characters</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={theme.colors.text.tertiary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.text.tertiary}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Reset Password</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
  },
  backButton: {
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.l,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    fontSize: theme.typography.sizes.m,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xxl,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: theme.spacing.l,
  },
  label: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glassStrong,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    paddingRight: theme.spacing.s,
  },
  passwordInput: {
    flex: 1,
    padding: theme.spacing.m,
    fontSize: theme.typography.sizes.m,
    color: theme.colors.text.primary,
  },
  eyeIcon: {
    padding: theme.spacing.s,
  },
  hint: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
  submitButton: {
    backgroundColor: theme.colors.status.active,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    marginTop: theme.spacing.m,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.m,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
  },
  errorText: {
    fontSize: theme.typography.sizes.l,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  backButtonText: {
    color: theme.colors.status.active,
    fontSize: theme.typography.sizes.m,
    fontWeight: '600',
  },
});
