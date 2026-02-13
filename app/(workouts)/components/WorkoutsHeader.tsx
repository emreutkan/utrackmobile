import { commonStyles, theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WorkoutsHeader() {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={commonStyles.backButton}>
        <Ionicons name="chevron-back" size={24} color={theme.colors.text.zinc600} />
      </TouchableOpacity>
      <Text style={typographyStyles.h2}>RECORDS</Text>
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
    paddingBottom: theme.spacing.m,
  },
});
