import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

export default function PremiumPreview() {
  return (
    <View style={styles.container}>
      <View style={styles.previewCard}>
        {/* Mock CNS Recovery Card (Blurred) */}
        <View style={styles.mockCard}>
          <View style={styles.mockHeader}>
            <View style={styles.mockIconBox} />
            <View style={styles.mockTextBox} />
          </View>
          <View style={styles.mockContent}>
            <View style={styles.mockStatBox} />
            <View style={styles.mockProgressBar} />
          </View>
        </View>

        {/* Blur Overlay Effect */}
        <LinearGradient
          colors={['rgba(2, 2, 5, 0.95)', 'rgba(2, 2, 5, 0.85)']}
          style={styles.blurOverlay}
        />

        {/* Lock Icon */}
        <View style={styles.lockContainer}>
          <View style={styles.lockIconBox}>
            <Ionicons name="lock-closed" size={32} color={theme.colors.status.rest} />
          </View>
          <Text style={styles.lockText}>PRO FEATURE</Text>
        </View>
      </View>

      <Text style={styles.teaser}>SEE YOUR CNS RECOVERY STATUS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xxxl,
    alignItems: 'center',
  },
  previewCard: {
    width: '100%',
    height: 180,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.m,
  },
  mockCard: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    padding: theme.spacing.l,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  mockIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
  },
  mockTextBox: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mockContent: {
    gap: theme.spacing.m,
  },
  mockStatBox: {
    width: '60%',
    height: 48,
    borderRadius: theme.borderRadius.m,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  mockProgressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backdropFilter: 'blur(20px)',
  },
  lockContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  lockIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(192, 132, 252, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockText: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    color: theme.colors.status.rest,
  },
  teaser: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
