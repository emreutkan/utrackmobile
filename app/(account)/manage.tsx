import { updateGender, updateHeight, updateWeight } from '@/api/account';
import { supabase } from '@/lib/supabase';
import { commonStyles, theme } from '@/constants/theme';
import {
  useInvalidateUser,
  useUser,
  useClearUser,
  useChangePassword,
  useDeleteAccount,
  useChangeEmail,
} from '@/hooks/useUser';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountManageScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const clearUser = useClearUser();
  const changePassword = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();
  const changeEmailMutation = useChangeEmail();
  const invalidateUser = useInvalidateUser();

  const [modals, setModals] = useState({
    height: false,
    weight: false,
    gender: false,
    password: false,
    email: false,
    deleteAccount: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    gender: 'male' as 'male' | 'female',
    oldPassword: '',
    newPassword: '',
    newEmail: '',
    deletePassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        height: user.height?.toString() || '',
        weight: user.weight?.toString() || '',
        gender: (user.gender as 'male' | 'female') || 'male',
      }));
    }
  }, [user]);

  const toggleModal = (key: keyof typeof modals, visible: boolean) => {
    setModals((prev) => ({ ...prev, [key]: visible }));
    if (!visible) {
      if (key === 'password') {
        setFormData((prev) => ({ ...prev, oldPassword: '', newPassword: '' }));
      } else if (key === 'email') {
        setFormData((prev) => ({ ...prev, newEmail: '' }));
      } else if (key === 'deleteAccount') {
        setFormData((prev) => ({ ...prev, deletePassword: '' }));
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          clearUser();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'DELETE ACCOUNT',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => toggleModal('deleteAccount', true),
        },
      ]
    );
  };

  const handleConfirmDelete = async () => {
    if (!formData.deletePassword) {
      Alert.alert('Error', 'Please enter your password to confirm.');
      return;
    }
    setIsSaving(true);
    try {
      await deleteAccountMutation.mutateAsync(formData.deletePassword);
      toggleModal('deleteAccount', false);
      await supabase.auth.signOut();
      clearUser();
      router.replace('/(auth)');
    } catch (error: any) {
      Alert.alert('Delete Failed', error.message || 'Incorrect password or server error.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (type: 'height' | 'weight' | 'gender' | 'password' | 'email') => {
    setIsSaving(true);
    try {
      if (type === 'height') {
        if (!formData.height) throw new Error('Please enter your height');
        await updateHeight(parseFloat(formData.height));
      } else if (type === 'weight') {
        if (!formData.weight) throw new Error('Please enter your weight');
        await updateWeight(parseFloat(formData.weight));
      } else if (type === 'gender') {
        await updateGender(formData.gender);
      } else if (type === 'password') {
        if (!formData.oldPassword || !formData.newPassword) throw new Error('Missing fields');
        if (formData.newPassword.length < 8)
          throw new Error('New password must be at least 8 characters');
        const result = await changePassword.mutateAsync({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        });
        if (result?.message) throw new Error(result.message);
      } else if (type === 'email') {
        if (!formData.newEmail) throw new Error('Please enter a new email address');
        if (!formData.newEmail.includes('@')) throw new Error('Please enter a valid email address');
        await changeEmailMutation.mutateAsync(formData.newEmail);
      }

      invalidateUser();
      toggleModal(type, false);
    } catch (error: any) {
      Alert.alert('Action Failed', error.message || 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={commonStyles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>ACCOUNT</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile summary */}
        <View style={styles.profileRow}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'rgba(168, 85, 247, 0.15)']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || 'U'}</Text>
          </LinearGradient>
          <View>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileSince}>
              MEMBER SINCE {user?.created_at ? new Date(user.created_at).getFullYear() : 2024}
            </Text>
          </View>
        </View>

        {/* User Details */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>USER DETAILS</Text>
        </View>
        <View style={styles.group}>
          <Pressable style={styles.row} onPress={() => toggleModal('email', true)}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.text.brand} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>CHANGE EMAIL</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{user?.email || 'NOT SET'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>

          <View style={styles.separator} />

          <Pressable style={styles.row} onPress={() => toggleModal('password', true)}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 211, 153, 0.1)' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.status.success} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>CHANGE PASSWORD</Text>
              <Text style={styles.rowSub}>SECURE YOUR ACCOUNT</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>

          <View style={styles.separator} />

          <Pressable style={styles.row} onPress={() => toggleModal('weight', true)}>
            <View style={styles.iconBox}>
              <Ionicons name="scale-outline" size={20} color={theme.colors.text.secondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>WEIGHT</Text>
              <Text style={styles.rowSub}>{user?.weight ? `${user.weight} KG` : 'NOT SET'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>

          <View style={styles.separator} />

          <Pressable style={styles.row} onPress={() => toggleModal('height', true)}>
            <View style={styles.iconBox}>
              <Ionicons name="resize-outline" size={20} color={theme.colors.text.secondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>HEIGHT</Text>
              <Text style={styles.rowSub}>{user?.height ? `${user.height} CM` : 'NOT SET'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>

          <View style={styles.separator} />

          <Pressable style={styles.row} onPress={() => toggleModal('gender', true)}>
            <View style={styles.iconBox}>
              <Ionicons name="body-outline" size={20} color={theme.colors.text.secondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>GENDER</Text>
              <Text style={styles.rowSub}>{user?.gender?.toUpperCase() || 'NOT SET'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Session */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>SESSION</Text>
        </View>
        <View style={styles.group}>
          <Pressable style={styles.row} onPress={handleLogout}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 69, 58, 0.1)' }]}>
              <Ionicons name="log-out-outline" size={20} color={theme.colors.status.error} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.colors.status.error }]}>LOG OUT</Text>
              <Text style={styles.rowSub}>EXIT CURRENT SESSION</Text>
            </View>
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: theme.colors.status.error }]}>DANGER ZONE</Text>
        </View>
        <View style={[styles.group, styles.dangerGroup]}>
          <Pressable style={styles.row} onPress={handleDeleteAccount}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 69, 58, 0.08)' }]}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.status.error} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.colors.status.error }]}>
                DELETE ACCOUNT
              </Text>
              <Text style={styles.rowSub}>PERMANENTLY REMOVE ALL DATA</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Modals ── */}

      {/* Email */}
      <Modal
        presentationStyle="formSheet"
        visible={modals.email}
        animationType="fade"
        onRequestClose={() => toggleModal('email', false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Email</Text>
            <Text style={styles.modalSubtitle}>Enter your new email address.</Text>
            <View style={styles.inputStack}>
              <TextInput
                style={styles.cleanInput}
                value={formData.newEmail}
                onChangeText={(t) => setFormData({ ...formData, newEmail: t })}
                placeholder="New Email Address"
                placeholderTextColor={theme.colors.text.zinc500}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.btnCancel} onPress={() => toggleModal('email', false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.btnSave} onPress={() => handleSave('email')} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color={theme.colors.text.primary} />
                ) : (
                  <Text style={styles.btnSaveText}>Update</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password */}
      <Modal
        presentationStyle="formSheet"
        visible={modals.password}
        animationType="fade"
        onRequestClose={() => toggleModal('password', false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.modalSubtitle}>Ensure your new password is secure.</Text>
            <View style={styles.inputStack}>
              <TextInput
                style={styles.cleanInput}
                value={formData.oldPassword}
                onChangeText={(t) => setFormData({ ...formData, oldPassword: t })}
                placeholder="Current Password"
                placeholderTextColor={theme.colors.text.zinc500}
                secureTextEntry
              />
              <View style={styles.inputSeparator} />
              <TextInput
                style={styles.cleanInput}
                value={formData.newPassword}
                onChangeText={(t) => setFormData({ ...formData, newPassword: t })}
                placeholder="New Password"
                placeholderTextColor={theme.colors.text.zinc500}
                secureTextEntry
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.btnCancel} onPress={() => toggleModal('password', false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.btnSave} onPress={() => handleSave('password')} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color={theme.colors.text.primary} />
                ) : (
                  <Text style={styles.btnSaveText}>Change</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Weight */}
      <Modal
        presentationStyle="formSheet"
        visible={modals.weight}
        animationType="fade"
        onRequestClose={() => toggleModal('weight', false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Weight</Text>
              <Text style={styles.modalSubtitle}>Tracking your weight helps monitor progress.</Text>
            </View>
            <View style={styles.bigInputContainer}>
              <TextInput
                style={styles.bigInput}
                value={formData.weight}
                onChangeText={(t) => setFormData({ ...formData, weight: t })}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.text.zinc700}
                autoFocus
                selectionColor={theme.colors.status.active}
              />
              <Text style={styles.bigInputSuffix}>kg</Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.btnCancel} onPress={() => toggleModal('weight', false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.btnSave} onPress={() => handleSave('weight')} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color={theme.colors.text.primary} />
                ) : (
                  <Text style={styles.btnSaveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Height */}
      <Modal
        presentationStyle="formSheet"
        visible={modals.height}
        animationType="fade"
        onRequestClose={() => toggleModal('height', false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Height</Text>
              <Text style={styles.modalSubtitle}>This helps us calculate your calorie needs.</Text>
            </View>
            <View style={styles.bigInputContainer}>
              <TextInput
                style={styles.bigInput}
                value={formData.height}
                onChangeText={(t) => setFormData({ ...formData, height: t })}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.text.zinc700}
                autoFocus
                selectionColor={theme.colors.status.active}
              />
              <Text style={styles.bigInputSuffix}>cm</Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.btnCancel} onPress={() => toggleModal('height', false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.btnSave} onPress={() => handleSave('height')} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color={theme.colors.text.primary} />
                ) : (
                  <Text style={styles.btnSaveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Gender */}
      <Modal
        presentationStyle="formSheet"
        visible={modals.gender}
        animationType="fade"
        onRequestClose={() => toggleModal('gender', false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            <Text style={styles.modalSubtitle}>For physiological calculations.</Text>
            <View style={styles.genderRow}>
              <Pressable
                style={[styles.genderCard, formData.gender === 'male' && styles.genderCardActive]}
                onPress={() => setFormData({ ...formData, gender: 'male' })}
              >
                <Ionicons
                  name="male"
                  size={32}
                  color={formData.gender === 'male' ? theme.colors.text.primary : theme.colors.text.secondary}
                />
                <Text style={[styles.genderLabel, formData.gender === 'male' && styles.genderLabelActive]}>
                  Male
                </Text>
              </Pressable>
              <Pressable
                style={[styles.genderCard, formData.gender === 'female' && styles.genderCardActive]}
                onPress={() => setFormData({ ...formData, gender: 'female' })}
              >
                <Ionicons
                  name="female"
                  size={32}
                  color={formData.gender === 'female' ? theme.colors.text.primary : theme.colors.text.secondary}
                />
                <Text style={[styles.genderLabel, formData.gender === 'female' && styles.genderLabelActive]}>
                  Female
                </Text>
              </Pressable>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.btnCancel} onPress={() => toggleModal('gender', false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.btnSave} onPress={() => handleSave('gender')} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color={theme.colors.text.primary} />
                ) : (
                  <Text style={styles.btnSaveText}>Update</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account */}
      <Modal
        presentationStyle="formSheet"
        visible={modals.deleteAccount}
        animationType="fade"
        onRequestClose={() => toggleModal('deleteAccount', false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={[styles.iconBox, styles.modalWarningIcon]}>
              <Ionicons name="warning-outline" size={24} color={theme.colors.status.error} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.colors.status.error }]}>
              Delete Account
            </Text>
            <Text style={styles.modalSubtitle}>
              Enter your password to permanently delete your account. This cannot be undone.
            </Text>
            <View style={styles.inputStack}>
              <TextInput
                style={styles.cleanInput}
                value={formData.deletePassword}
                onChangeText={(t) => setFormData({ ...formData, deletePassword: t })}
                placeholder="Your Password"
                placeholderTextColor={theme.colors.text.zinc500}
                secureTextEntry
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.btnCancel} onPress={() => toggleModal('deleteAccount', false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btnSave, { backgroundColor: theme.colors.status.error }]}
                onPress={handleConfirmDelete}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={theme.colors.text.primary} />
                ) : (
                  <Text style={styles.btnSaveText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    marginBottom: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 36,
  },

  scrollContent: {
    padding: theme.spacing.m,
  },

  // Profile summary
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
  },
  profileEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 3,
  },
  profileSince: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // Sections
  sectionHeader: {
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 3.6,
  },

  // Grouped rows (iOS-style)
  group: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.s,
  },
  dangerGroup: {
    borderColor: 'rgba(255, 69, 58, 0.2)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    gap: theme.spacing.m,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.ui.border,
    marginLeft: 70,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: theme.colors.text.primary,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  rowSub: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: theme.spacing.m,
  },
  modalCard: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    shadowColor: theme.colors.background,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  modalWarningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    alignSelf: 'center',
    marginBottom: theme.spacing.m,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  bigInputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: theme.spacing.xxl,
  },
  bigInput: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.text.primary,
    minWidth: 60,
    textAlign: 'center',
  },
  bigInputSuffix: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.s,
  },
  inputStack: {
    width: '100%',
    backgroundColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.xl,
  },
  cleanInput: {
    padding: theme.spacing.m,
    fontSize: 16,
    color: theme.colors.text.primary,
    height: 54,
  },
  inputSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: theme.spacing.m,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.s,
    width: '100%',
  },
  btnCancel: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  btnSave: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.status.active,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSaveText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  genderRow: {
    flexDirection: 'row',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.xxl,
    width: '100%',
  },
  genderCard: {
    flex: 1,
    backgroundColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderCardActive: {
    backgroundColor: theme.colors.status.active,
    borderColor: theme.colors.status.active,
  },
  genderLabel: {
    marginTop: theme.spacing.s,
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  genderLabelActive: {
    color: theme.colors.text.primary,
  },
});
