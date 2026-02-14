import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import NeuralBarChart from './NeuralBarChart';

interface RMProgressionChartProps {
  rmChartData: any[];
}

export default function RMProgressionChart({ rmChartData }: RMProgressionChartProps) {
  const [rmChartMode, setRmChartMode] = useState<'1RM' | 'PROGRESS'>('1RM');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="analytics" size={16} color={theme.colors.text.brand} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>1RM PROGRESSION</Text>
          <Text style={styles.subtitle}>
            {rmChartMode === '1RM' ? 'ESTIMATED MAX OVER TIME' : '% CHANGE FROM START'}
          </Text>
        </View>
        <View style={styles.toggle}>
          <Pressable
            onPress={() => setRmChartMode('1RM')}
            style={[styles.toggleBtn, rmChartMode === '1RM' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, rmChartMode === '1RM' && styles.toggleTextActive]}>
              1RM
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRmChartMode('PROGRESS')}
            style={[styles.toggleBtn, rmChartMode === 'PROGRESS' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, rmChartMode === 'PROGRESS' && styles.toggleTextActive]}>
              %
            </Text>
          </Pressable>
        </View>
      </View>

      <NeuralBarChart
        data={rmChartData}
        valueKey={rmChartMode === '1RM' ? 'one_rep_max' : 'progress_pct'}
        mode="timeline"
      />
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
  toggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.ui.glassStrong,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.text.brand,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
  },
  toggleTextActive: {
    color: '#000',
  },
});
