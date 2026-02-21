import { theme } from '@/constants/theme';
import { useEffect, useMemo, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 220;
const MIN_POINT_SPACING = 80;

interface NeuralBarChartProps {
  data: any[];
  valueKey: string;
  secondaryKey?: string;
  showPercentage?: boolean;
  mode?: 'timeline' | 'reps';
}

export default function NeuralBarChart({
  data,
  valueKey,
  secondaryKey,
  showPercentage = false,
  mode = 'timeline',
}: NeuralBarChartProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const dataLength = data?.length ?? 0;
  const chartWidth = Math.max(SCREEN_WIDTH - 48, dataLength * MIN_POINT_SPACING);
  const shouldScroll = chartWidth > SCREEN_WIDTH - 48;
  const hasData = data && data.length > 0;

  useEffect(() => {
    if (shouldScroll && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [shouldScroll, dataLength]);

  const chartContent = useMemo(() => {
    if (!hasData) return null;
    const values = data.map((entry) => entry[valueKey]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const padding = range * 0.15;
    const effectiveMin = Math.max(0, minVal - padding);
    const effectiveMax = maxVal + padding;
    const effectiveRange = effectiveMax - effectiveMin;

    const getCoordinates = (index: number, value: number) => {
      const x = (index / (data.length - 1 || 1)) * (chartWidth - 40) + 20;
      const y = CHART_HEIGHT - ((value - effectiveMin) / effectiveRange) * (CHART_HEIGHT - 60) - 30;
      return { x, y };
    };

    let pathD = '';
    data.forEach((entry, i) => {
      const { x, y } = getCoordinates(i, entry[valueKey]);
      if (i === 0) pathD = `M ${x} ${y}`;
      else {
        const prev = getCoordinates(i - 1, data[i - 1][valueKey]);
        const cp1x = prev.x + (x - prev.x) / 2;
        pathD += ` C ${cp1x} ${prev.y}, ${cp1x} ${y}, ${x} ${y}`;
      }
    });

    const fillPathD =
      data.length > 1
        ? `${pathD} L ${getCoordinates(data.length - 1, data[data.length - 1][valueKey]).x} ${CHART_HEIGHT} L ${getCoordinates(0, data[0][valueKey]).x} ${CHART_HEIGHT} Z`
        : '';

    return (
      <View style={[styles.chartContent, { width: chartWidth }]}>
        <Svg width={chartWidth} height={CHART_HEIGHT} onLayout={() => {}}>
          <Defs>
            <SvgLinearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.text.brand} stopOpacity="0.3" />
              <Stop offset="1" stopColor={theme.colors.text.brand} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>

          {[0, 0.5, 1].map((ratio, i) => {
            const y = CHART_HEIGHT - ratio * (CHART_HEIGHT - 60) - 30;
            return (
              <Path
                key={i}
                d={`M 20 ${y} L ${chartWidth - 20} ${y}`}
                stroke={theme.colors.ui.border}
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}

          {fillPathD && <Path d={fillPathD} fill="url(#lineGradient)" />}

          <Path
            d={pathD}
            stroke={theme.colors.text.brand}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((entry, i) => {
            const { x, y } = getCoordinates(i, entry[valueKey]);
            return (
              <View key={i}>
                <Path
                  d={`M ${x - 1.5} ${y} a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0`}
                  fill={theme.colors.text.brand}
                  stroke={theme.colors.background}
                  strokeWidth="2"
                />
              </View>
            );
          })}
        </Svg>

        <View style={[styles.dataLabelsContainer, { width: chartWidth }]}>
          {data.map((entry, i) => {
            const { x, y } = getCoordinates(i, entry[valueKey]);
            if (mode === 'timeline') {
              const date = new Date(entry.workout_date);
              const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
              const weight = entry[valueKey].toFixed(1);
              return (
                <View key={i} style={[styles.dataLabel, { left: x - 30, top: y - 45 }]}>
                  <Text style={styles.dataLabelWeight}>{weight}kg</Text>
                  <Text style={styles.dataLabelDate}>{dateStr}</Text>
                </View>
              );
            }
            const weight = entry[valueKey].toFixed(1);
            return (
              <View key={i} style={[styles.dataLabel, { left: x - 30, top: y - 45 }]}>
                <Text style={styles.dataLabelWeight}>{weight}kg</Text>
              </View>
            );
          })}
        </View>

        {mode === 'reps' && (
          <View style={[styles.xAxis, { width: chartWidth - 40 }]}>
            {data.map((entry, i) => (
              <Text key={i} style={styles.xAxisLabel}>
                {entry.reps} reps
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }, [data, valueKey, mode, chartWidth, hasData]);

  return !hasData ? null : (
    <View style={styles.chartWrapper}>
      {shouldScroll ? (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {chartContent}
        </ScrollView>
      ) : (
        chartContent
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrapper: {
    marginTop: 10,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  chartContent: {
    position: 'relative',
    alignItems: 'center',
  },
  dataLabelsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: CHART_HEIGHT,
  },
  dataLabel: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glassStrong,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    width: 60,
  },
  dataLabelWeight: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text.brand,
    fontStyle: 'italic',
  },
  dataLabelDate: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    marginTop: 1,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  xAxisLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
  },
});
