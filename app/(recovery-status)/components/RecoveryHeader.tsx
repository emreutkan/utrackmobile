import { commonStyles, theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, Pressable, View } from 'react-native';

export default function RecoveryHeader() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={commonStyles.backButton}>
        <Ionicons name="chevron-back" size={24} color={theme.colors.text.zinc600} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={typographyStyles.h2}>RECOVERY</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.l,
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
  },
});
