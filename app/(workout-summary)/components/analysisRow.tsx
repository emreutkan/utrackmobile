import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text } from 'react-native';

interface AnalysisRowProps {
  message: string;
  type: 'positive' | 'negative' | 'neutral';
}

const AnalysisRow = ({ message, type }: AnalysisRowProps) => {
  const color =
    type === 'positive'
      ? theme.colors.status.rest
      : type === 'negative'
        ? theme.colors.status.error
        : theme.colors.text.tertiary;
  const icon =
    type === 'positive'
      ? 'checkmark-circle'
      : type === 'negative'
        ? 'alert-circle'
        : 'information-circle';

  return (
    <View style={styles.analysisRow}>
      <View style={[styles.analysisIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.analysisText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  analysisRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'center' },
  analysisIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontWeight: '500',
  },
});

export default AnalysisRow;
