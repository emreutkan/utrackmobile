import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 180;
const CHART_PADDING = 20;
const CHART_WIDTH = SCREEN_WIDTH - 48 - CHART_PADDING * 2;
const LINE_THICKNESS = 2.5;

interface NeuralTrendChartProps {
  weightData: number[];
  bodyFatData: number[];
}

interface Point {
  x: number;
  y: number;
}

function getPoints(data: number[], width: number, height: number): Point[] {
  if (data.length < 2) return [];
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  return data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - minVal) / range) * (height * 0.78) - height * 0.11,
  }));
}

function LineSegments({ points, color }: { points: Point[]; color: string }) {
  if (points.length < 2) return null;
  return (
    <>
      {points.slice(0, -1).map((p1, i) => {
        const p2 = points[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: midX - length / 2,
              top: midY - LINE_THICKNESS / 2,
              width: length,
              height: LINE_THICKNESS,
              backgroundColor: color,
              borderRadius: LINE_THICKNESS / 2,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
      {/* Dots at each data point */}
      {points.map((p, i) => (
        <View
          key={`dot-${i}`}
          style={{
            position: 'absolute',
            left: p.x - 4,
            top: p.y - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
          }}
        />
      ))}
    </>
  );
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

  const weightPoints = getPoints(weightData, CHART_WIDTH, CHART_HEIGHT);
  const bodyFatPoints = getPoints(bodyFatData, CHART_WIDTH, CHART_HEIGHT);

  const gridLines = [0.2, 0.4, 0.6, 0.8].map((pct) => pct * CHART_HEIGHT);

  return (
    <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH }}>
      {/* Grid lines */}
      {gridLines.map((y, i) => (
        <View
          key={`grid-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            top: y,
            width: CHART_WIDTH,
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        />
      ))}

      <LineSegments points={weightPoints} color={theme.colors.text.brand} />
      <LineSegments points={bodyFatPoints} color={theme.colors.status.rest} />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyChart: {
    height: CHART_HEIGHT,
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
