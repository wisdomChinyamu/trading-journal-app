import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Polyline, Circle, Line, Defs, LinearGradient, Stop, Polygon, Text as SvgText } from "react-native-svg";
import { Trade } from "../types";

interface EquityCurveChartProps {
  trades: Trade[];
}

export default function EquityCurveChart({ trades }: EquityCurveChartProps) {
  const width = Dimensions.get("window").width - 32;
  const height = 220;
  const padding = 40;

  // Calculate equity curve
  let equity = 0;
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
    equityPoints.push({
      date: new Date(trade.createdAt).toLocaleDateString(),
      value: equity,
    });
  });

  if (equityPoints.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyTitle}>No Equity Data</Text>
          <Text style={styles.emptyText}>Start trading to see your equity curve</Text>
        </View>
      </View>
    );
  }

  // Find min and max for scaling
  const values = equityPoints.map((p) => p.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const range = maxValue - minValue || 1;

  // Calculate points for polyline
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const pointSpacing = chartWidth / (equityPoints.length - 1 || 1);

  const points = equityPoints
    .map((point, index) => {
      const x = padding + index * pointSpacing;
      const y =
        height - padding - ((point.value - minValue) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  // Calculate area polygon points
  const areaPoints = equityPoints
    .map((point, index) => {
      const x = padding + index * pointSpacing;
      const y =
        height - padding - ((point.value - minValue) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");
  
  const areaPolygon = `${areaPoints} ${width - padding},${height - padding} ${padding},${height - padding}`;

  // Grid lines
  const gridLines = [];
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const y = padding + (i * chartHeight) / yTicks;
    const value = maxValue - (i * range) / yTicks;
    gridLines.push(
      <Line
        key={`grid-${i}`}
        x1={padding}
        y1={y}
        x2={width - padding}
        y2={y}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
      />
    );
    gridLines.push(
      <SvgText
        key={`label-${i}`}
        x={padding - 8}
        y={y + 4}
        fontSize="10"
        fill="#888"
        textAnchor="end"
      >
        {value.toFixed(1)}
      </SvgText>
    );
  }

  const finalEquity = equityPoints[equityPoints.length - 1]?.value || 0;
  const isProfit = finalEquity >= 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Equity Curve</Text>
        <View style={[styles.badge, { backgroundColor: isProfit ? '#4caf5020' : '#f4433620' }]}>
          <Text style={[styles.badgeText, { color: isProfit ? '#4caf50' : '#f44336' }]}>
            {isProfit ? '↑' : '↓'} {finalEquity.toFixed(2)}
          </Text>
        </View>
      </View>

      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#00d4d4" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#00d4d4" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {gridLines}

        {/* Zero line */}
        {minValue < 0 && (
          <Line
            x1={padding}
            y1={height - padding - ((0 - minValue) / range) * chartHeight}
            x2={width - padding}
            y2={height - padding - ((0 - minValue) / range) * chartHeight}
            stroke="#f44336"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}

        {/* Area fill */}
        <Polygon
          points={areaPolygon}
          fill="url(#areaGradient)"
        />

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
          x2={width - padding}
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
        {equityPoints.map((point, index) => {
          const x = padding + index * pointSpacing;
          const y =
            height - padding - ((point.value - minValue) / range) * chartHeight;
          return (
            <Circle 
              key={`point-${index}`} 
              cx={x} 
              cy={y} 
              r="4" 
              fill="#00d4d4"
              stroke="#0d0d0d"
              strokeWidth="2"
            />
          );
        })}
      </Svg>

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Trades</Text>
          <Text style={styles.statValue}>{equityPoints.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Peak</Text>
          <Text style={[styles.statValue, { color: '#4caf50' }]}>
            {maxValue.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Drawdown</Text>
          <Text style={[styles.statValue, { color: '#f44336' }]}>
            {minValue.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={[styles.statValue, { color: isProfit ? '#4caf50' : '#f44336' }]}>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    color: "#888",
    fontSize: 13,
    textAlign: 'center',
  },
  statsFooter: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 212, 212, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: '#f5f5f5',
    fontSize: 15,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
});