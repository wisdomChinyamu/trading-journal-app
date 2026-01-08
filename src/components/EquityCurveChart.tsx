import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import { useTheme } from "./ThemeProvider";
import Svg, {
  Polyline,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Polygon,
  Text as SvgText,
  Rect,
  G,
} from "react-native-svg";
import { Trade } from "../types";

interface EquityCurveChartProps {
  trades: Trade[];
  startingBalance?: number;
  height?: number;
}

export default function EquityCurveChart({
  trades,
  startingBalance = 0,
  height: propHeight,
}: EquityCurveChartProps) {
  const screenWidth = Dimensions.get("window").width;
  const [internalWidth, setInternalWidth] = useState(
    Math.min(1200, Math.max(320, screenWidth - 48))
  );
  // Ensure Y-axis (chart) height is always 3/4 of X-axis width (chartWidth)
  // We compute internal padding-dependent chart width and force the overall
  // SVG height so the inner chart area height == 0.75 * chartWidth.
  const basePadding = 40;
  const paddingForCalc = basePadding;
  const chartWidthForCalc = internalWidth - paddingForCalc * 2;
  const computedChartHeight = Math.max(120, Math.round(chartWidthForCalc * 0.75));
  const height = typeof propHeight === "number" ? Math.max(propHeight, paddingForCalc * 2 + computedChartHeight) : paddingForCalc * 2 + computedChartHeight;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Helper to parse Firestore Timestamp / number / string / Date
  const parseDate = (value: any): Date | null => {
    if (!value && value !== 0) return null;
    if (typeof value?.toDate === "function") {
      try {
        const d = value.toDate();
        return isNaN(d.getTime()) ? null : d;
      } catch {
        return null;
      }
    }
    if (typeof value === "number") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  // Calculate equity curve (account balance over time)
  let equity = startingBalance;
  const equityPoints: { date: string; value: number }[] = [];

  trades.forEach((trade) => {
    if (trade.riskAmount) {
      // Use actual monetary values if riskAmount is available
      if (trade.result === "Win") {
        equity += trade.riskAmount * trade.riskToReward;
      } else if (trade.result === "Loss") {
        equity -= trade.riskAmount;
      }
    } else {
      // Fall back to R:R ratio based calculation
      if (trade.result === "Win") {
        equity += trade.riskToReward;
      } else if (trade.result === "Loss") {
        equity -= 1;
      }
    }
    // Prefer `tradeTime` (when trade occurred) falling back to `createdAt` (entry time)
    const rawDate = (trade as any).tradeTime ?? (trade as any).createdAt;
    const pd = parseDate(rawDate) || new Date();
    equityPoints.push({
      date: pd.toISOString(),
      value: equity,
    });
  });

  // Add a starting baseline point (slightly before the first trade) so chart shows starting balance
  if (equityPoints.length > 0) {
    try {
      const firstDate = new Date(equityPoints[0].date);
      const baselineTime = new Date(Math.max(0, firstDate.getTime() - 1));
      if (Math.abs(equityPoints[0].value - startingBalance) > 0.0001) {
        equityPoints.unshift({ date: new Date(baselineTime).toISOString(), value: startingBalance });
      }
    } catch (e) {}
  }

  if (equityPoints.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyTitle}>No Equity Data</Text>
          <Text style={styles.emptyText}>
            Start trading to see your equity curve
          </Text>
        </View>
      </View>
    );
  }

  // Find min and max for scaling and add 8-12% headroom so flat lines are visible
  const values = equityPoints.map((p) => p.value);
  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values, 0);
  const rawRange = rawMax - rawMin || 1;
  const headroom = Math.max(Math.abs(rawRange) * 0.12, 1);
  const minValue = rawMin - headroom;
  const maxValue = rawMax + headroom;
  const range = maxValue - minValue || 1;

  // Calculate points for polyline
  const padding = Math.min(basePadding, internalWidth * 0.08);
  const chartWidth = internalWidth - padding * 2;
  const chartHeight = height - padding * 2;
  const pointCount = Math.max(1, equityPoints.length);
  const pointSpacing = pointCount === 1 ? 0 : chartWidth / (pointCount - 1);

  const mappedPoints = equityPoints.map((point, index) => {
    const x =
      pointCount === 1
        ? padding + chartWidth / 2
        : padding + index * pointSpacing;
    const y =
      height - padding - ((point.value - minValue) / range) * chartHeight;
    return { x, y, value: point.value, date: point.date };
  });

  const points = mappedPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Calculate area polygon points
  const areaPolygon = `${points} ${internalWidth - padding},${
    height - padding
  } ${padding},${height - padding}`;

  // Grid lines (no numeric labels)
  const gridLines = [];
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const t = i / yTicks;
    const y = padding + t * chartHeight;
    gridLines.push(
      <Line
        key={`grid-${i}`}
        x1={padding}
        y1={y}
        x2={internalWidth - padding}
        y2={y}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
    );
  }

  const { colors, fontFamily } = useTheme();

  const finalEquity = equityPoints[equityPoints.length - 1]?.value || 0;
  const isProfit = finalEquity >= 0;

  // Compute max drawdown (peak-to-trough)
  let peak = -Infinity;
  let maxDrawdown = 0;
  equityPoints.forEach((p) => {
    if (p.value > peak) peak = p.value;
    const dd = peak - p.value;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });
  const rawPeak = Math.max(...values);
  const drawdownPercent = rawPeak > 0 ? (maxDrawdown / rawPeak) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Equity Curve</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: isProfit ? "#4caf5020" : "#f4433620" },
          ]}
        >
          <Text style={styles.badgeText}>{finalEquity.toFixed(2)}</Text>
        </View>
      </View>
      <View
        onLayout={(e) => {
          const w = Math.max(320, Math.min(1000, e.nativeEvent.layout.width));
          if (Math.abs(w - internalWidth) > 1) setInternalWidth(w);
        }}
        style={{ width: "100%" }}
      >
        <Svg
          width="100%"
          height={height}
          viewBox={`0 0 ${internalWidth} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <Defs>
            <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#00d4d4" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#00d4d4" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Interaction layer (clear selection on background press) */}
          <Rect
            x={padding}
            y={padding}
            width={chartWidth}
            height={chartHeight}
            fill="transparent"
            onPress={() => setSelectedIndex(null)}
            {...(Platform.OS === "web"
              ? ({
                  onMouseLeave: () => setSelectedIndex(null),
                  onMouseMove: (e: any) => {
                    try {
                      const offsetX = e.nativeEvent.offsetX ?? e.nativeEvent.clientX;
                      const targetWidth = (e.nativeEvent.target && e.nativeEvent.target.clientWidth) || e.currentTarget?.clientWidth || 1;
                      const ratio = offsetX / targetWidth;
                      const xInView = padding + ratio * chartWidth;
                      let nearest = 0;
                      let minDist = Infinity;
                      mappedPoints.forEach((pt, idx) => {
                        const d = Math.abs(pt.x - xInView);
                        if (d < minDist) {
                          minDist = d;
                          nearest = idx;
                        }
                      });
                      setSelectedIndex(nearest);
                    } catch (err) {}
                  },
                } as any)
              : ({} as any))}
          />

          {/* Grid lines */}
          {gridLines}

          {/* Zero line */}
          {minValue < 0 && (
            <Line
              x1={padding}
              y1={height - padding - ((0 - minValue) / range) * chartHeight}
              x2={internalWidth - padding}
              y2={height - padding - ((0 - minValue) / range) * chartHeight}
              stroke="#f44336"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          )}

          {/* Area fill */}
          <Polygon points={areaPolygon} fill="url(#areaGradient)" />

          {/* Axes */}
          <Line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#00d4d4"
            strokeWidth="2"
          />
          <Line
            x1={padding}
            y1={height - padding}
            x2={internalWidth - padding}
            y2={height - padding}
            stroke="#00d4d4"
            strokeWidth="2"
          />

          {/* Polyline for equity curve */}
          <Polyline
            points={points}
            stroke="#00d4d4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {mappedPoints.map((p, index) => {
            const isLast = index === mappedPoints.length - 1;
            const radius = isLast ? 5.5 : 3.5;
            return (
              <G key={`point-group-${index}`}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={radius}
                  fill={isLast ? "#00ffdd" : "#00d4d4"}
                  stroke="#0d0d0d"
                  strokeWidth={isLast ? 2.5 : 1.5}
                  accessible
                  accessibilityLabel={`Equity ${p.value.toFixed(2)} on ${p.date}`}
                  onPress={() => setSelectedIndex(index)}
                  {...(Platform.OS === "web"
                    ? ({
                        onMouseEnter: () => setSelectedIndex(index),
                        onMouseMove: () => setSelectedIndex(index),
                      } as any)
                    : ({} as any))}
                />
              </G>
            );
          })}

          {selectedIndex !== null && mappedPoints[selectedIndex] && (() => {
            const p = mappedPoints[selectedIndex];
            const prev = mappedPoints[selectedIndex - 1];
            const delta = prev ? p.value - prev.value : 0;
            const tipW = 160;
            const tipH = 48;
            const margin = 12;
            const x = Math.max(
              padding + margin,
              Math.min(internalWidth - padding - tipW - margin, p.x - tipW / 2)
            );
            const y = Math.max(padding, Math.min(p.y - tipH - 8, height - padding - tipH - margin));
            const deltaStr = `${delta >= 0 ? "+" : ""}${Math.abs(delta) >= 1000 || Math.abs(delta) <= -1000 ? delta.toLocaleString() : Math.abs(delta).toFixed(2)}`;
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
                  stroke="#00d4d4"
                  strokeWidth={1}
                />
                <SvgText x={x + 10} y={y + 18} fontSize="13" fill="#fff" fontFamily={fontFamily}>
                  {delta === 0 ? (p.value >= 1000 || p.value <= -1000 ? p.value.toLocaleString() : p.value.toFixed(2)) : deltaStr}
                </SvgText>
                <SvgText x={x + 10} y={y + 34} fontSize="11" fill="#9aa" fontFamily={fontFamily}>
                  {(() => {
                    try {
                      const d = new Date(p.date);
                      return isNaN(d.getTime()) ? String(p.date) : d.toLocaleString();
                    } catch (e) {
                      return String(p.date);
                    }
                  })()}
                </SvgText>
              </G>
            );
          })()}
        </Svg>
      </View>

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Trades</Text>
          <Text style={styles.statValue}>{equityPoints.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Peak</Text>
          <Text style={[styles.statValue, { color: "#4caf50" }]}>
            {rawPeak.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Drawdown</Text>
          <Text style={[styles.statValue, { color: "#f44336" }]}> 
            {maxDrawdown ? `-${maxDrawdown.toFixed(2)} (${drawdownPercent.toFixed(1)}%)` : "0.00"}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current</Text>
          <Text
            style={[
              styles.statValue,
              { color: isProfit ? "#4caf50" : "#f44336" },
            ]}
          >
            {finalEquity.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.15)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptyText: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
  },
  statsFooter: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 212, 212, 0.05)",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    color: "#aaa",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: "#f5f5f5",
    fontSize: 15,
    fontWeight: "700",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 8,
  },
});
