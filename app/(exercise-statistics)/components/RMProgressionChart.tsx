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
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name="analytics" size={18} color={theme.colors.text.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>1RM PROGRESSION</Text>
          <Text style={styles.sectionSubtitle}>
            {rmChartMode === '1RM' ? 'ESTIMATED MAX OVER TIME' : 'PERCENTAGE CHANGE FROM START'}
          </Text>
        </View>

        <View style={styles.toggleContainer}>
          <Pressable
            onPress={() => setRmChartMode('1RM')}
            style={[styles.toggleButton, rmChartMode === '1RM' && styles.toggleButtonActive]}
          >
            <Text
              style={[
                styles.toggleButtonText,
                rmChartMode === '1RM' && styles.toggleButtonTextActive,
              ]}
            >
              1RM
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRmChartMode('PROGRESS')}
            style={[styles.toggleButton, rmChartMode === 'PROGRESS' && styles.toggleButtonActive]}
          >
            <Text
              style={[
                styles.toggleButtonText,
                rmChartMode === 'PROGRESS' && styles.toggleButtonTextActive,
              ]}
            >
              PROGRESS
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
  sectionCard: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.ui.glassStrong,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.text.brand,
  },
  toggleButtonText: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  toggleButtonTextActive: {
    color: '#000',
  },
});
