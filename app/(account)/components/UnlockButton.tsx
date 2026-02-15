import { theme, commonStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface UnlockButtonProps {
  onPress: () => void;
  isLoading: boolean;
}

export default function UnlockButton({ onPress, isLoading }: UnlockButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        isLoading && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isLoading}
    >
      <LinearGradient
        colors={['#a855f7', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="rocket" size={20} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.text}>UNLOCK PRO ACCESS</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
    marginBottom: theme.spacing.m,
    ...commonStyles.shadow,
    shadowColor: theme.colors.status.rest,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.s,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  text: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: theme.colors.text.primary,
  },
});
