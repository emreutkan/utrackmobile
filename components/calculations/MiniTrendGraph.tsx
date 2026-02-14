import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface MiniTrendGraphProps {
  data: number[];
  color: string;
  width: number;
}

export const MiniTrendGraph = ({ data, color, width }: MiniTrendGraphProps) => {
  if (data.length < 2 || width <= 0) return null;

  const MINI_HEIGHT = 50;

  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  const padding = range * 0.1;
  const effectiveMin = minVal - padding;
  const effectiveMax = maxVal + padding;
  const effectiveRange = effectiveMax - effectiveMin;

  const getCoordinates = (index: number, value: number) => {
    const x = (index / (data.length - 1)) * width;
    const y = MINI_HEIGHT - ((value - effectiveMin) / effectiveRange) * (MINI_HEIGHT - 10) - 5;
    return { x, y };
  };

  let pathD = `M ${getCoordinates(0, data[0]).x} ${getCoordinates(0, data[0]).y}`;
  for (let i = 1; i < data.length; i++) {
    const p0 = getCoordinates(i - 1, data[i - 1]);
    const p1 = getCoordinates(i, data[i]);
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    pathD += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const fillPathD = `${pathD} L ${width} ${MINI_HEIGHT} L 0 ${MINI_HEIGHT} Z`;

  return (
    <View style={{ width, height: MINI_HEIGHT, overflow: 'hidden' }}>
      <Svg width={width} height={MINI_HEIGHT}>
        <Defs>
          <LinearGradient id={`glow-${color}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.5" />
            <Stop offset="0.5" stopColor={color} stopOpacity="0.2" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={fillPathD} fill={`url(#glow-${color})`} />
        <Path d={pathD} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
};
