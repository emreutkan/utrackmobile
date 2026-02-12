import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface TitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export default function TitleInput({ value, onChangeText }: TitleInputProps) {
  return (
    <View style={styles.inputSection}>
      <Text style={styles.sectionLabel}>TEMPLATE TITLE</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="document-text" size={20} color={theme.colors.status.active} style={styles.inputIcon} />
        <TextInput
          placeholder="e.g. UPPER BODY PUSH"
          placeholderTextColor={theme.colors.text.zinc700}
          value={value}
          onChangeText={onChangeText}
          style={styles.titleInput}
          selectionColor={theme.colors.status.active}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.s,
    paddingHorizontal: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    paddingHorizontal: theme.spacing.m,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  inputIcon: {
    marginRight: theme.spacing.m,
  },
  titleInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
