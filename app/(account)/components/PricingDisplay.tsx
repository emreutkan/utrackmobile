import { theme } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

export default function PricingDisplay() {
  const monthlyPrice = 4.99;
  const dailyPrice = (monthlyPrice / 30).toFixed(2);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.priceRow}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.price}>{monthlyPrice.toFixed(2)}</Text>
          <Text style={styles.period}>/mo</Text>
        </View>
        <Text style={styles.dailyBreakdown}>
          ${dailyPrice} per day • Less than a protein shake
        </Text>
        <Text style={styles.features}>
          UNLIMITED 1RM • CNS RECOVERY • GLOBAL RANKINGS
        </Text>
      </View>
      <Text style={styles.trust}>Cancel anytime • No long-term commitment</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    width: '100%',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.s,
  },
  currency: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.status.rest,
    marginRight: 4,
  },
  price: {
    fontSize: 64,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.status.rest,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  period: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  dailyBreakdown: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  features: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  trust: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
