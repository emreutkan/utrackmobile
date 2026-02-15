import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

interface Feature {
  icon: string;
  iconColor: string;
  title: string;
  benefit: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'pulse',
    iconColor: theme.colors.status.rest,
    title: 'CNS RECOVERY TRACKING',
    benefit: 'Optimize training intensity like pro powerlifters by monitoring Central Nervous System recovery',
  },
  {
    icon: 'bar-chart',
    iconColor: theme.colors.status.warning,
    title: 'UNLIMITED VOLUME ANALYSIS',
    benefit: 'Access complete training volume data for any time period with detailed muscle group breakdowns',
  },
  {
    icon: 'analytics',
    iconColor: theme.colors.status.active,
    title: 'ADVANCED 1RM TRACKING',
    benefit: 'Performance tracking with 1RM calculations and progress charts used by elite strength athletes',
  },
  {
    icon: 'flash',
    iconColor: theme.colors.status.success,
    title: 'AI-POWERED INSIGHTS',
    benefit: 'Receive intelligent training recommendations based on your unique performance patterns and recovery',
  },
  {
    icon: 'trophy',
    iconColor: '#FFD700',
    title: 'GLOBAL RANKINGS',
    benefit: 'Compare your lifts with athletes worldwide and track your progress against the best',
  },
];

export default function FeatureStack() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>WHAT YOU GET</Text>
      {FEATURES.map((feature, index) => (
        <View key={index} style={styles.featureCard}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[`${feature.iconColor}33`, `${feature.iconColor}1A`]}
              style={styles.iconGradient}
            />
            <Ionicons name={feature.icon as any} size={20} color={feature.iconColor} />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{feature.title}</Text>
            <Text style={styles.benefit}>{feature.benefit}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xxxl,
  },
  sectionLabel: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3.6,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.l,
    marginLeft: 4,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  iconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
    overflow: 'hidden',
  },
  iconGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.text.primary,
  },
  benefit: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
});
