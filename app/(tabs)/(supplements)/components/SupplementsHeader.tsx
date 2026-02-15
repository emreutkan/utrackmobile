import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, Pressable, View } from 'react-native';

interface SupplementsHeaderProps {
  onAddPress: () => void;
}

export default function SupplementsHeader({ onAddPress }: SupplementsHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.mainTitle}>SUPPLEMENT STACK</Text>
      </View>
      <Pressable style={styles.addButton} onPress={onAddPress}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.l,
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  headerLeft: {
    flex: 1,
  },
  mainTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -0.4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.status.active,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
