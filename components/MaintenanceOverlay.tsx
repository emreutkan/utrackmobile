import { theme } from '@/constants/theme';
import { useBackendStore } from '@/state/stores/backendStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MaintenanceOverlay() {
  const { isDown, setDown, failureCount } = useBackendStore();
  const insets = useSafeAreaInsets();

  if (!isDown) return null;

  return (
    <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.15)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-offline-outline" size={40} color={theme.colors.status.warning} />
        </View>

        <Text style={styles.title}>SERVER UNAVAILABLE</Text>
        <Text style={styles.subtitle}>
          Unable to reach the server. This may be temporary — please try again in a moment.
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => setDown(false)}
        >
          <Ionicons name="refresh" size={16} color={theme.colors.text.primary} />
          <Text style={styles.retryText}>TRY AGAIN</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.status.active,
    borderRadius: 40,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.text.primary,
  },
});
