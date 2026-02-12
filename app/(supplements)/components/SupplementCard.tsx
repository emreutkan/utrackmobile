import { UserSupplement } from '@/api/types';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SupplementCardProps {
  item: UserSupplement;
  isLogged: boolean;
  onLog: () => void;
  onPress: () => void;
}

const getSupplementBenefit = (name: string): string => {
  const benefits: Record<string, string> = {
    Creatine: 'STRENGTH & POWER',
    Protein: 'MUSCLE RECOVERY',
    Caffeine: 'ENERGY & FOCUS',
    'Beta-Alanine': 'ENDURANCE',
  };
  return benefits[name] || 'GENERAL HEALTH';
};

export default function SupplementCard({ item, isLogged, onLog, onPress }: SupplementCardProps) {
  const benefit = getSupplementBenefit(item.supplement_details.name);

  return (
    <TouchableOpacity style={styles.supplementCard} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.supplementIcon}>
        <Ionicons name="medical-outline" size={24} color={theme.colors.text.secondary} />
      </View>
      <View style={styles.supplementInfo}>
        <Text style={styles.supplementName}>{item.supplement_details.name.toUpperCase()}</Text>
        <Text style={styles.supplementDetails}>
          {item.dosage}
          {item.supplement_details.dosage_unit.toUpperCase()} • {benefit}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.logButton, isLogged && styles.logButtonDone]}
        onPress={onLog}
        activeOpacity={0.8}
        disabled={isLogged}
      >
        <Text style={[styles.logButtonText, isLogged && styles.logButtonTextDone]}>
          {isLogged ? 'LOGGED' : 'LOG'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  supplementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  supplementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  supplementInfo: {
    flex: 1,
  },
  supplementName: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  supplementDetails: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  logButton: {
    backgroundColor: theme.colors.status.active,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
  },
  logButtonDone: {
    backgroundColor: theme.colors.status.success,
  },
  logButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  logButtonTextDone: {
    color: '#000000',
  },
});
