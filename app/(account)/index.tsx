import { commonStyles, theme } from '@/constants/theme';
import { useUser } from '@/hooks/useUser';
import { useUserStats } from '@/hooks/useWorkout';
import { useSettingsStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const { data: stats } = useUserStats();
  const { tutCountdown, tutReactionOffset, setTutCountdown, setTutReactionOffset, isPro } = useSettingsStore();

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
          style={commonStyles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'rgba(168, 85, 247, 0.15)']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || 'U'}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.memberSince}>
              MEMBER SINCE {user?.created_at ? new Date(user.created_at).getFullYear() : 2024}
            </Text>
          </View>
        </View>

        {/* ── Row 1: Streak + Sessions + Longest Streak ── */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>STREAK</Text>
            <View style={styles.statValueContainer}>
              <Text style={styles.statValue}>{stats?.streak.current ?? '—'}</Text>
              <Ionicons name="flame" size={14} color="#FF9F0A" style={styles.statIcon} />
            </View>
            <Text style={styles.statSub}>DAYS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SESSIONS</Text>
            <Text style={styles.statValue}>{stats?.sessions.total ?? '—'}</Text>
            <Text style={styles.statSub}>TOTAL</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>BEST RUN</Text>
            <View style={styles.statValueContainer}>
              <Text style={styles.statValue}>{stats?.streak.longest ?? '—'}</Text>
              <Ionicons name="trophy" size={14} color={theme.colors.status.warning} style={styles.statIcon} />
            </View>
            <Text style={styles.statSub}>DAYS</Text>
          </View>
        </View>

        {/* ── Row 2: This Week ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>THIS WEEK</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SESSIONS</Text>
            <Text style={styles.statValue}>{stats?.sessions.this_week ?? '—'}</Text>
            <Text style={styles.statSub}>WORKOUTS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>VOLUME</Text>
            <Text style={styles.statValue}>
              {stats ? formatVolume(stats.volume_kg.this_week) : '—'}
            </Text>
            <Text style={styles.statSub}>LIFTED</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>CALORIES</Text>
            <Text style={styles.statValue}>
              {stats ? Math.round(stats.calories.this_week) : '—'}
            </Text>
            <Text style={styles.statSub}>KCAL</Text>
          </View>
        </View>

        {/* ── Row 3: Performance ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>PERFORMANCE</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AVG SESSION</Text>
            <Text style={styles.statValue}>
              {stats ? formatMinutes(stats.time.avg_per_session_minutes) : '—'}
            </Text>
            <Text style={styles.statSub}>DURATION</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ACTIVE DAYS</Text>
            <Text style={styles.statValue}>{stats?.consistency.active_days_last_30 ?? '—'}</Text>
            <Text style={styles.statSub}>LAST 30D</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PER WEEK</Text>
            <Text style={styles.statValue}>
              {stats ? stats.consistency.avg_sessions_per_week.toFixed(1) : '—'}
            </Text>
            <Text style={styles.statSub}>AVG SESSIONS</Text>
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
        </View>

        {/* Workout Settings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>WORKOUT</Text>
        </View>
        <View style={styles.settingsContainer}>
          <View style={styles.settingCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 159, 10, 0.1)' }]}>
              <Ionicons name="timer-outline" size={20} color={theme.colors.status.warning} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>TUT COUNTDOWN</Text>
              <Text style={styles.settingSubtitle}>SECONDS BEFORE TRACKING STARTS</Text>
            </View>
            <View style={styles.stepperContainer}>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setTutCountdown(Math.max(0, tutCountdown - 1))}
              >
                <Ionicons name="remove" size={16} color={theme.colors.text.primary} />
              </Pressable>
              <Text style={styles.stepperValue}>{tutCountdown}s</Text>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setTutCountdown(Math.min(10, tutCountdown + 1))}
              >
                <Ionicons name="add" size={16} color={theme.colors.text.primary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 69, 58, 0.1)' }]}>
              <Ionicons name="speedometer-outline" size={20} color={theme.colors.status.error} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>REACTION OFFSET</Text>
              <Text style={styles.settingSubtitle}>SECONDS SUBTRACTED FROM TUT</Text>
            </View>
            <View style={styles.stepperContainer}>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setTutReactionOffset(Math.max(0, tutReactionOffset - 1))}
              >
                <Ionicons name="remove" size={16} color={theme.colors.text.primary} />
              </Pressable>
              <Text style={styles.stepperValue}>{tutReactionOffset}s</Text>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setTutReactionOffset(Math.min(5, tutReactionOffset + 1))}
              >
                <Ionicons name="add" size={16} color={theme.colors.text.primary} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>SUBSCRIPTION</Text>
        </View>
        <View style={styles.settingsContainer}>
          <Pressable
            style={styles.settingCard}
            onPress={() => router.push('/(account)/upgrade')}
          >
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isPro
                    ? 'rgba(192, 132, 252, 0.1)'
                    : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
            >
              <Ionicons
                name={isPro ? 'star' : 'star-outline'}
                size={20}
                color={isPro ? theme.colors.status.rest : theme.colors.status.active}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>
                {isPro ? (user?.is_trial ? 'FREE TRIAL' : 'PRO MEMBER') : 'FREE PLAN'}
              </Text>
              <Text style={styles.settingSubtitle}>
                {user?.is_trial && user?.trial_days_remaining !== null
                  ? `${user.trial_days_remaining} DAYS LEFT`
                  : user?.is_paid_pro && user?.pro_days_remaining !== null
                    ? `${user.pro_days_remaining} DAYS LEFT`
                    : isPro
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
            onPress={() => router.push('/(account)/manage')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="person-outline" size={20} color={theme.colors.text.brand} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>ACCOUNT MANAGEMENT</Text>
              <Text style={styles.settingSubtitle}>EMAIL, PASSWORD, BODY METRICS</Text>
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
              <Text style={styles.settingSubtitle}>SYNC HEALTH DATA</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>

        </View>
      </ScrollView>

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
    marginBottom: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xs,
  },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
  },
  profileInfo: {
    marginLeft: theme.spacing.m,
  },
  userEmail: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  memberSince: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
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
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  statIcon: {
    marginTop: 2,
  },
  statSub: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },

  // --- Sections ---
  sectionHeader: {
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.xs,
  },
  sectionHeaderText: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 3.6,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: theme.colors.text.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
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

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 30,
    textAlign: 'center',
  },
});
