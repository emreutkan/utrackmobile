import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function BenefitsRow() {
  const benefits = [
    { icon: 'trending-up', text: 'LIFT MORE', color: theme.colors.status.success },
    { icon: 'pulse', text: 'RECOVER FASTER', color: theme.colors.status.rest },
    { icon: 'analytics', text: 'TRACK EVERYTHING', color: theme.colors.status.active },
  ];

  return (
    <View style={styles.container}>
      {benefits.map((benefit, index) => (
        <View key={index} style={styles.benefit}>
          <View style={[styles.iconBox, { backgroundColor: `${benefit.color}1A` }]}>
            <Ionicons name={benefit.icon as any} size={24} color={benefit.color} />
          </View>
          <Text style={styles.text}>{benefit.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xxxl,
    gap: theme.spacing.s,
  },
  benefit: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});
