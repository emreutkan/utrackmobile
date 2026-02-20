import { supabase } from '@/lib/supabase';
import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const handleReset = async () => {
    if (!password || !confirm) {
      Alert.alert('Missing Fields', 'Please fill in both fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Too Short', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Password Updated', 'Your password has been changed successfully.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/(home)') },
        ]);
      }
    } finally {
      setLoading(false);
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
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={28} color={theme.colors.status.active} />
            </View>
            <Text style={typographyStyles.h2}>NEW PASSWORD</Text>
            <Text style={styles.subtitle}>Enter a new password for your account.</Text>
          </View>

          {/* Fields */}
          <View style={styles.form}>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={passwordFocused ? theme.colors.status.active : theme.colors.text.tertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={theme.colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                returnKeyType="next"
              />
            </View>

            <View style={[styles.inputWrapper, confirmFocused && styles.inputWrapperFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={confirmFocused ? theme.colors.status.active : theme.colors.text.tertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={theme.colors.text.tertiary}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.text.primary} />
              ) : (
                <Text style={styles.buttonText}>UPDATE PASSWORD</Text>
              )}
            </Pressable>
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
  },
  bgGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.xxl,
  },
  headerSection: {
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    gap: theme.spacing.m,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    paddingHorizontal: theme.spacing.m,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: theme.colors.status.active,
  },
  inputIcon: {
    marginRight: theme.spacing.s,
  },
  input: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.m,
    fontWeight: '500',
  },
  button: {
    backgroundColor: theme.colors.status.active,
    borderRadius: theme.borderRadius.xxl,
    paddingVertical: theme.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.s,
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.text.primary,
  },
});
