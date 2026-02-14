import { updateGender, updateHeight, updateWeight } from '@/api/account';
import { clearTokens } from '@/hooks/Storage';
import { theme } from '@/constants/theme';
import { useInvalidateUser, useUser, useClearUser, useChangePassword } from '@/hooks/useUser';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
// import { useUserStatistics } from '@/hooks/useStatistics';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const clearUser = useClearUser();
  const changePassword = useChangePassword();
  // const { data: stats } = useUserStatistics();
  const invalidateUser = useInvalidateUser();
  // Controls visibility of the 3 modals
  const [modals, setModals] = useState({
    height: false,
    weight: false,
    gender: false,
    password: false,
  });

  // Loading state for async operations
  const [isSaving, setIsSaving] = useState(false);

  // Form data buffer (avoids changing user store directly before save)
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    gender: 'male' as 'male' | 'female',
    oldPassword: '',
    newPassword: '',
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

  // Format total volume
  // const formattedVolume = useMemo(() => {
  //   const volume = stats?.total_volume || 0;
  //   if (volume >= 1000000) {
  //     return `${(volume / 1000000).toFixed(1)}T`;
  //   } else if (volume >= 1000) {
  //     return `${(volume / 1000).toFixed(1)}K`;
  //   }
  //   return volume.toFixed(0);
  // }, [stats]);

  // --- Handlers ---

  // Helper to open/close modals and clear sensitive data on close
  const toggleModal = (key: keyof typeof modals, visible: boolean) => {
    setModals((prev) => ({ ...prev, [key]: visible }));
    // Security: Clear password fields when closing the modal
    if (!visible && key === 'password') {
      setFormData((prev) => ({ ...prev, oldPassword: '', newPassword: '' }));
    }
  };

  const handleLogout = () => {
    const performLogout = () => {
      clearTokens();
      clearUser();
      router.replace('/(auth)');
    };
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: performLogout },
    ]);
  };

  // Centralized save handler for all modals
  const handleSave = async (type: 'height' | 'weight' | 'gender' | 'password') => {
    setIsSaving(true);
    try {
      let result;

      // Execute specific API call based on type
      if (type === 'height') {
        if (!formData.height) throw new Error('Please enter your height');
        result = await updateHeight(parseFloat(formData.height));
      } else if (type === 'weight') {
        if (!formData.weight) throw new Error('Please enter your weight');
        result = await updateWeight(parseFloat(formData.weight));
      } else if (type === 'gender') {
        result = await updateGender(formData.gender);
      } else if (type === 'password') {
        if (!formData.oldPassword || !formData.newPassword) throw new Error('Missing fields');
        if (formData.newPassword.length < 8)
          throw new Error('New password must be at least 8 characters');
        const result = await changePassword.mutateAsync({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        });
        if (result?.message) throw new Error(result.message);
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
        style={styles.gradientBg}
      />
      <View style={styles.backHeader}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.memberSince}>
              MEMBER SINCE {user?.created_at ? new Date(user.created_at).getFullYear() : 2024}
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SESSIONS</Text>
            <View style={styles.statValueContainer}>
              {/* <Text style={styles.statValue}>{stats?.total_workouts || 0}</Text> */}
              <Ionicons
                name="barbell"
                size={16}
                color={theme.colors.status.rest}
                style={styles.statIcon}
              />
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>STREAK</Text>
            <View style={styles.statValueContainer}>
              {/* <Text style={styles.statValue}>{stats?.current_streak || 0}</Text> */}
              <Ionicons name="flame" size={16} color="#FF9F0A" style={styles.statIcon} />
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>VOLUME</Text>
            {/* <Text style={styles.statValue}>{formattedVolume}</Text> */}
          </View>
        </View>

        {/* Analytics Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>ANALYTICS</Text>
        </View>
        <View style={styles.settingsContainer}>
          <Pressable
            style={styles.settingCard}
            onPress={() => router.push('/(exercise-statistics)/list')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="barbell-outline" size={20} color={theme.colors.text.brand} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>EXERCISE STATISTICS</Text>
              <Text style={styles.settingSubtitle}>VIEW PERFORMANCE BY EXERCISE</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>
          <Pressable
            style={styles.settingCard}
            onPress={() => router.push('/(prs)')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="medal-outline" size={20} color="#10B981" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>PERSONAL RECORDS</Text>
              {/* <Text style={styles.settingSubtitle}>{stats?.total_prs || 0} RECORDS TRACKED</Text> */}
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Biometrics Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>BIOMETRICS</Text>
        </View>
        <View style={styles.settingsContainer}>
          <Pressable
            style={styles.settingCard}
            onPress={() => toggleModal('weight', true)}
          >
            <View style={styles.iconBox}>
              <Ionicons name="scale-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>WEIGHT</Text>
              <Text style={styles.settingSubtitle}>
                {user?.weight ? `${user.weight} KG` : 'NOT SET'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>

          <Pressable
            style={styles.settingCard}
            onPress={() => toggleModal('height', true)}
          >
            <View style={styles.iconBox}>
              <Ionicons name="resize-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>HEIGHT</Text>
              <Text style={styles.settingSubtitle}>
                {user?.height ? `${user.height} CM` : 'NOT SET'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>

          <Pressable
            style={styles.settingCard}
            onPress={() => toggleModal('gender', true)}
          >
            <View style={styles.iconBox}>
              <Ionicons name="body-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>GENDER</Text>
              <Text style={styles.settingSubtitle}>{user?.gender?.toUpperCase() || 'NOT SET'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>SUBSCRIPTION</Text>
        </View>
        <View style={styles.settingsContainer}>
          <Pressable
            style={styles.settingCard}
            // onPress={() => router.push('/(account)/upgrade')}
          >
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: user?.is_pro
                    ? 'rgba(192, 132, 252, 0.1)'
                    : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
            >
              <Ionicons
                name={user?.is_pro ? 'star' : 'star-outline'}
                size={20}
                color={user?.is_pro ? theme.colors.status.rest : theme.colors.status.active}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>
                {user?.is_pro ? (user?.is_trial ? 'FREE TRIAL' : 'PRO MEMBER') : 'FREE PLAN'}
              </Text>
              <Text style={styles.settingSubtitle}>
                {user?.is_trial && user?.trial_days_remaining !== null
                  ? `${user.trial_days_remaining} DAYS LEFT`
                  : user?.is_paid_pro && user?.pro_days_remaining !== null
                    ? `${user.pro_days_remaining} DAYS LEFT`
                    : user?.is_pro
                      ? 'ACTIVE'
                      : 'UPGRADE TO PRO'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>ACCOUNT</Text>
        </View>
        <View style={styles.settingsContainer}>
          <Pressable
            style={styles.settingCard}
            onPress={() => toggleModal('password', true)}
          >
            <View style={styles.iconBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>CHANGE PASSWORD</Text>
              <Text style={styles.settingSubtitle}>SECURE YOUR ACCOUNT</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>

          <Pressable
            style={styles.settingCard}
            onPress={() => router.push('/(permissions)')}
          >
            <View style={styles.iconBox}>
              <Ionicons name="pulse-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>HEALTH CONNECT</Text>
              <Text style={styles.settingSubtitle}>SYNC BIOMETRICS</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>

          <Pressable
            style={styles.settingCard}
            onPress={() => handleLogout()}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 69, 58, 0.1)' }]}>
              <Ionicons name="log-out-outline" size={20} color={theme.colors.status.error} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.colors.status.error }]}>
                LOG OUT
              </Text>
              <Text style={styles.settingSubtitle}>EXIT SESSION</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
            presentationStyle="formSheet"
        visible={modals.height}
        transparent
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
              <Pressable
                style={styles.btnCancel}
                onPress={() => toggleModal('height', false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.btnSave}
                onPress={() => handleSave('height')}
                disabled={isSaving}
              >
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

      <Modal
            presentationStyle="formSheet"
        visible={modals.weight}
        transparent
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
              <Pressable
                style={styles.btnCancel}
                onPress={() => toggleModal('weight', false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.btnSave}
                onPress={() => handleSave('weight')}
                disabled={isSaving}
              >
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

      <Modal
            presentationStyle="formSheet"
        visible={modals.gender}
        transparent
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
                  color={
                    formData.gender === 'male'
                      ? theme.colors.text.primary
                      : theme.colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.genderLabel,
                    formData.gender === 'male' && styles.genderLabelActive,
                  ]}
                >
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
                  color={
                    formData.gender === 'female'
                      ? theme.colors.text.primary
                      : theme.colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.genderLabel,
                    formData.gender === 'female' && styles.genderLabelActive,
                  ]}
                >
                  Female
                </Text>
              </Pressable>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.btnCancel}
                onPress={() => toggleModal('gender', false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.btnSave}
                onPress={() => handleSave('gender')}
                disabled={isSaving}
              >
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

      <Modal
            presentationStyle="formSheet"
        visible={modals.password}
        transparent
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
              <Pressable
                style={styles.btnCancel}
                onPress={() => toggleModal('password', false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.btnSave}
                onPress={() => handleSave('password')}
                disabled={isSaving}
              >
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
    </View>
  );
}

// ============================================================================
// 4. STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    marginBottom: theme.spacing.xs,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    padding: theme.spacing.m,
    paddingTop: theme.spacing.xl,
  },

  // --- Profile Header ---
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xs,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  avatarText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '900',
    color: theme.colors.status.active,
  },
  profileInfo: {
    marginLeft: theme.spacing.m,
  },
  userEmail: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
  },

  // --- Stats Cards ---
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.s,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text.primary,
  },
  statIcon: {
    marginTop: 2,
  },

  // --- Sections ---
  sectionHeader: {
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.xs,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // --- Settings Cards ---
  settingsContainer: {
    gap: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    gap: theme.spacing.m,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subscriptionSubtitle: {
    color: theme.colors.status.rest,
  },

  // --- Modern Modals ---
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
  modalTitle: {
    fontSize: theme.typography.sizes.l,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },

  // Height Specific
  bigInputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: theme.spacing.xxl,
  },
  bigInput: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    minWidth: 60,
    textAlign: 'center',
  },
  bigInputSuffix: {
    fontSize: theme.typography.sizes.l,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.s,
  },

  // Gender Specific (Visual Cards)
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
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  genderLabelActive: {
    color: theme.colors.text.primary,
  },

  // Password Specific (Stacked Inputs)
  inputStack: {
    width: '100%',
    backgroundColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.xl,
  },
  cleanInput: {
    padding: theme.spacing.m,
    fontSize: theme.typography.sizes.m,
    color: theme.colors.text.primary,
    height: 54,
  },
  inputSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.ui.border,
    marginLeft: theme.spacing.m,
  },

  // Modal Action Buttons
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
    fontSize: theme.typography.sizes.m,
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
    fontSize: theme.typography.sizes.m,
    fontWeight: '600',
  },
});
