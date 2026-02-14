import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, Pressable, View } from 'react-native';

interface CreateTemplateHeaderProps {
  paddingTop: number;
}

export default function CreateTemplateHeader({ paddingTop }: CreateTemplateHeaderProps) {
  return (
    <View style={[styles.header, { paddingTop: paddingTop + 16 }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
      </Pressable>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>NEW TEMPLATE</Text>
        <Text style={styles.headerSubtitle}>DESIGN YOUR DRILL</Text>
      </View>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.ui.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
  },
});
