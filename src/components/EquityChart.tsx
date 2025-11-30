import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Path, G, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from './ThemeProvider';

type Point = { x: number; y: number };

export default function EquityChart({ series, height = 180 }: { series: { date: string; value: number }[]; height?: number }) {
  const { colors } = useTheme();
  const windowWidth = Dimensions.get('window').width;
  const width = Platform.OS === 'web'
    ? Math.max(400, windowWidth - 80)
    : Math.max(300, windowWidth - 80);

  const padding = { top: 20, right: 40, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const min = Math.min(0, ...(series.map(s => s.value)));
  const max = Math.max(1, ...(series.map(s => s.value)));
  const range = max - min || 1;

  const points: Point[] = useMemo(() => {
    if (!series || series.length === 0) return [];
    const step = chartWidth / Math.max(1, series.length - 1);
    return series.map((s, i) => ({
      x: padding.left + i * step,
      y: padding.top + chartHeight - ((s.value - min) / range) * chartHeight
    }));
  }, [series, chartWidth, chartHeight, min, range]);

  const path = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
  }, [points]);

  const areaPath = path
    ? `${path} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`
    : '';

  // Y-axis labels
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const value = max - (i * range) / (yTicks - 1);
    return {
      value: value.toFixed(1),
      y: padding.top + (i * chartHeight) / (yTicks - 1)
    };
  });

  if (series.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📈</Text>
        <Text style={[styles.emptyText, { color: colors.subtext }]}>
          No equity data available
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.highlight} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={colors.highlight} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        <G>
          {yLabels.map((label, i) => (
            <G key={i}>
              <Line
                x1={padding.left}
                y1={label.y}
                x2={padding.left + chartWidth}
                y2={label.y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
              <SvgText
                x={padding.left - 8}
                y={label.y + 4}
                fontSize="10"
                fill={colors.subtext}
                textAnchor="end"
              >
                {label.value}
              </SvgText>
            </G>
          ))}
        </G>

        {/* Zero line */}
        {min < 0 && (
          <Line
            x1={padding.left}
            y1={padding.top + chartHeight - ((0 - min) / range) * chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight - ((0 - min) / range) * chartHeight}
            stroke={colors.lossEnd}
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}

        {/* Area fill */}
        {areaPath && <Path d={areaPath} fill="url(#equityGradient)" />}

        {/* Line */}
        {path && (
          <Path
            d={path}
            fill="none"
            stroke={colors.highlight}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={colors.highlight}
            stroke={colors.background}
            strokeWidth="2"
          />
        ))}

        {/* Axes */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke={colors.subtext}
          strokeWidth="2"
        />
        <Line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke={colors.subtext}
          strokeWidth="2"
        />
      </Svg>

      {/* Stats Footer */}
      <View style={styles.chartFooter}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Starting</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>0.00</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.neutral }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Current</Text>
          <Text style={[
            styles.statValue,
            { color: series[series.length - 1].value >= 0 ? colors.profitEnd : colors.lossEnd }
          ]}>
            {series[series.length - 1].value.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.neutral }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Change</Text>
          <Text style={[
            styles.statValue,
            { color: series[series.length - 1].value >= 0 ? colors.profitEnd : colors.lossEnd }
          ]}>
            {series[series.length - 1].value >= 0 ? '+' : ''}
            {series[series.length - 1].value.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartFooter: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 212, 212, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    marginHorizontal: 8,
  },
});