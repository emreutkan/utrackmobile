import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, Pressable, View } from 'react-native';

export default function EmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="barbell-outline" size={40} color={theme.colors.text.tertiary} />
      </View>
      <Text style={styles.title}>NO DATA YET</Text>
      <Text style={styles.subtitle}>
        Complete workouts with this exercise to start tracking performance.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
        onPress={() => router.replace('/(tabs)/(home)')}
      >
        <Ionicons name="flash" size={14} color="#000" />
        <Text style={styles.buttonText}>START TRAINING</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text.secondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.text.brand,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
});
