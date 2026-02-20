import { theme } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { getPackageType, getPackagePeriod } from '@/utils/packageHelpers';

interface PricingDisplayProps {
  packageInfo?: PurchasesPackage | null;
}

export default function PricingDisplay({ packageInfo }: PricingDisplayProps) {
  if (!packageInfo) {
    return null;
  }

  const packageType = getPackageType(packageInfo);
  const price = packageInfo.product.price;
  const priceString = packageInfo.product.priceString;
  const period = getPackagePeriod(packageType);

  const currency = priceString.replace(/[\d.,]/g, '').trim() || '$';
  const perDay = (price / 30).toFixed(2);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Big price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{priceString}</Text>
          <Text style={styles.period}>{period}</Text>
        </View>

        <Text style={styles.perDay}>{currency}{perDay} per day • less than a protein shake</Text>

        <View style={styles.divider} />

        <Text style={styles.features}>
          CNS RECOVERY • FULL 1RM HISTORY • RESEARCH LIBRARY
        </Text>
      </View>
      <Text style={styles.trust}>Cancel anytime in your App Store settings</Text>
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
    borderColor: 'rgba(192, 132, 252, 0.2)',
    padding: theme.spacing.l,
    alignItems: 'center',
    width: '100%',
    gap: theme.spacing.s,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  price: {
    fontSize: 40,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1.5,
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  period: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  perDay: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.ui.border,
    marginVertical: theme.spacing.xs,
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
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: theme.spacing.s,
  },
});
