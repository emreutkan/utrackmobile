import { Ionicons } from '@expo/vector-icons';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { theme } from '@/constants/theme';

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  color: string;
  unit: string;
}

const StatsCard = ({ icon, value, label, color, unit }: StatsCardProps) => (
  <Animated.View style={styles.neuralStatCard}>
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.cardLabel}>{label.toUpperCase()}</Text>
      </View>
      <Ionicons name="pulse" size={18} color={`${color}50`} />
    </View>
    <View style={styles.cardValueRow}>
      <Text style={styles.cardValue}>{value}</Text>
      {unit && <Text style={styles.cardUnit}>{unit.toUpperCase()}</Text>}
    </View>
    <View style={styles.miniGraphWrapper}>
      <Svg width="100%" height="30" onLayout={() => {}}>
        <Path
          d="M 0 15 Q 25 5, 50 20 T 100 15 T 150 25 T 200 10"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.3"
        />
      </Svg>
    </View>
  </Animated.View>
);

export default StatsCard;
const styles = StyleSheet.create({
  neuralStatCard: {
    flex: 1,
    backgroundColor: theme.colors.ui.glass,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
  },
  cardValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  cardValue: { fontSize: 24, fontWeight: '900', color: theme.colors.text.primary },
  cardUnit: { fontSize: 10, fontWeight: '800', color: theme.colors.text.tertiary, marginLeft: 4 },
  miniGraphWrapper: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 30,
    opacity: 0.5,
  },
});
