import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 180;
const CHART_PADDING = 20;
const CHART_WIDTH = SCREEN_WIDTH - 48 - (CHART_PADDING * 2);

interface NeuralTrendChartProps {
  weightData: number[];
  bodyFatData: number[];
}

export const NeuralTrendChart = ({ weightData, bodyFatData }: NeuralTrendChartProps) => {
  if (weightData.length < 2 && bodyFatData.length < 2) {
    return (
      <View style={styles.emptyChart}>
        <Ionicons name="stats-chart" size={32} color={theme.colors.text.secondary} />
        <Text style={styles.emptyChartText}>Not enough data to graph</Text>
      </View>
    );
  }

  const normalizeData = (data: number[]) => {
    if (data.length < 2) return [];
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;
    const padding = range * 0.1;
    const effectiveMin = minVal - padding;
    const effectiveMax = maxVal + padding;
    const effectiveRange = effectiveMax - effectiveMin;
    return data.map(val => ((val - effectiveMin) / effectiveRange) * 100);
  };

  const normalizedWeight = normalizeData(weightData);
  const normalizedBodyFat = normalizeData(bodyFatData);
  const maxLength = Math.max(normalizedWeight.length, normalizedBodyFat.length);

  const getCoordinates = (index: number, value: number) => {
    const x = (index / (maxLength - 1 || 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - (value / 100) * (CHART_HEIGHT - 20) - 10;
    return { x, y };
  };

  const generatePath = (data: number[]) => {
    if (data.length < 2) return '';
    let d = `M ${getCoordinates(0, data[0]).x} ${getCoordinates(0, data[0]).y}`;
    for (let i = 1; i < data.length; i++) {
      const p0 = getCoordinates(i - 1, data[i - 1]);
      const p1 = getCoordinates(i, data[i]);
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      d += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const weightPathD = generatePath(normalizedWeight);
  const bodyFatPathD = generatePath(normalizedBodyFat);

  return (
    <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH }}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.text.brand} stopOpacity="0.4" />
            <Stop offset="1" stopColor={theme.colors.text.brand} stopOpacity="0.0" />
          </LinearGradient>
          <LinearGradient id="bodyFatGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.status.rest} stopOpacity="0.4" />
            <Stop offset="1" stopColor={theme.colors.status.rest} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        {weightPathD && <Path d={`${weightPathD} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`} fill="url(#weightGradient)" />}
        {bodyFatPathD && <Path d={`${bodyFatPathD} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`} fill="url(#bodyFatGradient)" />}
        {weightPathD && (
          <>
            <Path d={weightPathD} stroke={theme.colors.text.brand} strokeWidth="6" fill="none" opacity="0.1" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={weightPathD} stroke={theme.colors.text.brand} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {bodyFatPathD && (
          <>
            <Path d={bodyFatPathD} stroke={theme.colors.status.rest} strokeWidth="6" fill="none" opacity="0.1" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={bodyFatPathD} stroke={theme.colors.status.rest} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyChart: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyChartText: {
    color: theme.colors.text.secondary,
    marginTop: 8,
    fontSize: 12,
  },
});
