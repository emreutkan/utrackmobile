import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import NeuralBarChart from './NeuralBarChart';

interface WeightRepsChartProps {
  kgRepsData: any[];
}

export default function WeightRepsChart({ kgRepsData }: WeightRepsChartProps) {
  if (kgRepsData.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="barbell" size={16} color={theme.colors.text.brand} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>WEIGHT & REPS</Text>
          <Text style={styles.subtitle}>BEST WEIGHT AT EACH REP COUNT</Text>
        </View>
      </View>

      <NeuralBarChart data={kgRepsData} valueKey="weight" mode="reps" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
