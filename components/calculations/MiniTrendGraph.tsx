import { View } from 'react-native';

interface MiniTrendGraphProps {
  data: number[];
  color: string;
  width: number;
}

export const MiniTrendGraph = ({ data, color, width }: MiniTrendGraphProps) => {
  if (data.length < 2 || width <= 0) return null;

  const HEIGHT = 50;
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;

  return (
    <View style={{ width, height: HEIGHT, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 2, gap: 3 }}>
      {data.map((value, i) => {
        const barHeight = Math.max(4, ((value - minVal) / range) * (HEIGHT - 10) + 4);
        const opacity = 0.25 + (i / (data.length - 1)) * 0.75;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: barHeight,
              backgroundColor: color,
              opacity,
              borderRadius: 3,
            }}
          />
        );
      })}
    </View>
  );
};
