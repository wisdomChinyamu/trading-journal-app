import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import Svg, {
  Path,
  G,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
  Rect,
} from "react-native-svg";
import { useTheme } from "./ThemeProvider";

type Point = { x: number; y: number };

export default function EquityChart({
  series,
  height = 180,
  startingBalance = 0,
  leftPadding,
}: {
  series: { date: string; value: number }[];
  height?: number;
  startingBalance?: number;
  leftPadding?: number;
}) {
  const { colors, fontFamily } = useTheme();
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(
    null
  );
  // Measure container width so the chart fills the card area responsively.
  const [internalWidth, setInternalWidth] = React.useState<number>(800);
  const padding = { top: 24, right: 48, bottom: 36, left: leftPadding ?? 48 };
  const chartWidth = internalWidth - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const min = Math.min(0, ...series.map((s) => s.value));
  const max = Math.max(1, ...series.map((s) => s.value));
  const range = max - min || 1;

  const points: Point[] = useMemo(() => {
    if (!series || series.length === 0) return [];
    const step = chartWidth / Math.max(1, series.length - 1);
    return series.map((s, i) => ({
      x: padding.left + i * step,
      y: padding.top + chartHeight - ((s.value - min) / range) * chartHeight,
    }));
  }, [series, chartWidth, chartHeight, min, range]);

  const path = useMemo(() => {
    if (points.length === 0) return "";
    return points
      .map(
        (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
      )
      .join(" ");
  }, [points]);

  const areaPath = path
    ? `${path} L ${points[points.length - 1].x} ${
        padding.top + chartHeight
      } L ${padding.left} ${padding.top + chartHeight} Z`
    : "";

  // Y-axis ticks (no labels shown)
  const yTicks = 5;
  const yTickPositions = Array.from({ length: yTicks }, (_, i) =>
    padding.top + (i * chartHeight) / (yTicks - 1)
  );

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
    <View
      style={{ width: "100%" }}
      onLayout={(e: any) => {
        const w = Math.max(320, Math.min(1200, e.nativeEvent.layout.width));
        if (Math.abs(w - internalWidth) > 1) setInternalWidth(w);
      }}
    >
      <Svg
        width={"100%"}
        height={height}
        viewBox={`0 0 ${internalWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.highlight} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={colors.highlight} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        <G>
          {yTickPositions.map((y, i) => (
            <Line
              key={`grid-${i}`}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
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

        {/* Interaction layer to clear selection */}
        <Rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight}
          fill="transparent"
          onPress={() => setSelectedIndex(null)}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <G key={`pt-${i}`}>
            <Circle
              cx={p.x}
              cy={p.y}
              r={4}
              fill={colors.highlight}
              stroke={colors.background}
              strokeWidth="2"
              accessible
              accessibilityLabel={`Equity ${series[i].value.toFixed(2)} on ${series[i].date}`}
              onPress={() => setSelectedIndex(i)}
              {...(Platform.OS === "web"
                ? ({
                    onMouseEnter: () => setSelectedIndex(i),
                    onMouseMove: () => setSelectedIndex(i),
                  } as any)
                : ({} as any))}
            />
          </G>
        ))}

        {/* Tooltip */}
        {selectedIndex !== null && points[selectedIndex] && (() => {
          const p = points[selectedIndex];
          const prev = points[selectedIndex - 1];
          const delta = prev ? series[selectedIndex].value - series[selectedIndex - 1].value : 0;
          const tipW = 160;
          const tipH = 48;
          const margin = 12;
          const x = Math.max(
            padding.left + margin,
            Math.min(padding.left + chartWidth - tipW - margin, p.x - tipW / 2)
          );
          const y = Math.max(padding.top, Math.min(p.y - tipH - 8, padding.top + chartHeight - tipH - margin));
          const deltaStr = `${delta >= 0 ? "+" : ""}${Math.abs(delta) >= 1000 ? delta.toLocaleString() : Math.abs(delta).toFixed(2)}`;
          return (
            <G key={`tooltip-${selectedIndex}`}>
              <Rect
                x={x}
                y={y}
                width={tipW}
                height={tipH}
                rx={8}
                fill="#0d0d0d"
                opacity={0.98}
                stroke={colors.highlight}
                strokeWidth={1}
              />
                <SvgText x={x + 10} y={y + 18} fontSize="13" fill="#fff" fontFamily={fontFamily}>
                  {delta === 0 ? series[selectedIndex].value.toFixed(2) : deltaStr}
                </SvgText>
                <SvgText x={x + 10} y={y + 34} fontSize="11" fill="#9aa" fontFamily={fontFamily}>
                  {(() => {
                    try {
                      const d = new Date(series[selectedIndex].date);
                      return isNaN(d.getTime())
                        ? String(series[selectedIndex].date)
                        : d.toLocaleString();
                    } catch (e) {
                      return String(series[selectedIndex].date);
                    }
                  })()}
                </SvgText>
            </G>
          );
        })()}

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
          <Text style={[styles.statLabel, { color: colors.subtext }]}>
            Starting
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{startingBalance.toFixed(2)}</Text>
        </View>
        <View
          style={[styles.statDivider, { backgroundColor: colors.neutral }]}
        />
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>
            Current
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  series[series.length - 1].value >= 0
                    ? colors.profitEnd
                    : colors.lossEnd,
              },
            ]}
          >
            {series[series.length - 1].value.toFixed(2)}
          </Text>
        </View>
        <View
          style={[styles.statDivider, { backgroundColor: colors.neutral }]}
        />
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>
            Change
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  series[series.length - 1].value >= 0
                    ? colors.profitEnd
                    : colors.lossEnd,
              },
            ]}
          >
            {series[series.length - 1].value >= 0 ? "+" : ""}
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
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  chartFooter: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 212, 212, 0.05)",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statDivider: {
    width: 1,
    marginHorizontal: 8,
  },
});
