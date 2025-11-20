import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Path, Rect, G, Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from './ThemeProvider';

type Point = { x: number; y: number };

export default function EquityChart({ series, height = 140 }: { series: { date: string; value: number }[]; height?: number }) {
  const { colors } = useTheme();
  // On web, use larger width to take advantage of bigger screens
  const windowWidth = Dimensions.get('window').width;
  const width = Platform.OS === 'web'
    ? Math.max(400, windowWidth - 48)  // Less padding on web
    : Math.max(300, windowWidth - 64);

  const min = Math.min(0, ...(series.map(s => s.value)));
  const max = Math.max(1, ...(series.map(s => s.value)));

  const points: Point[] = useMemo(() => {
    if (!series || series.length === 0) return [];
    const w = width;
    const step = w / Math.max(1, series.length - 1);
    return series.map((s, i) => ({ x: i * step, y: s.value }));
  }, [series, width]);

  const path = useMemo(() => {
    if (points.length === 0) return '';
    const range = max - min || 1;
    const h = height;
    return points
      .map((p, i) => {
        const px = p.x;
        const py = h - ((p.y - min) / range) * h;
        return `${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`;
      })
      .join(' ');
  }, [points, min, max, height]);

  const areaPath = path ? `${path} L ${points[points.length - 1].x} ${height} L 0 ${height} Z` : '';

  return (
    <View style={{ paddingHorizontal: 8 }}>
      <Text style={[{ fontSize: 14, fontWeight: '700', marginBottom: 8 }, { color: colors.text }]}>Equity Curve</Text>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.profitStart} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={colors.profitEnd} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {areaPath ? <Path d={areaPath} fill="url(#g1)" /> : null}
        {path ? (
          <Path d={path} fill="none" stroke={colors.highlight} strokeWidth={2} />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({});
