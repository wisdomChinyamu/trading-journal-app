import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { Trade } from "../types";
import { getPerformanceBy } from "../utils/calculations";

interface PerformanceByPairChartProps {
  trades: Trade[];
}

export default function PerformanceByPairChart({
  trades,
}: PerformanceByPairChartProps) {
  const width = Dimensions.get("window").width - 32;
  const height = 250;
  const padding = 40;

  const performance = getPerformanceBy(trades, "pair");
  const pairs = Object.keys(performance);

  if (pairs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No trades by pair yet</Text>
      </View>
    );
  }

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / pairs.length - 10;
  const maxValue = Math.max(...Object.values(performance), 100);

  const bars = pairs.map((pair, index) => {
    const percentage = performance[pair];
    const barHeight = (percentage / maxValue) * chartHeight;
    const x = padding + index * (barWidth + 10);
    const y = height - padding - barHeight;

    // Color based on win rate
    const color =
      percentage >= 60 ? "#4caf50" : percentage >= 50 ? "#ffc107" : "#f44336";

    return (
      <View key={pair}>
        <Rect
          x={x}
          y={y}
          width={barWidth}
          height={barHeight}
          fill={color}
          rx="4"
        />
        <Text style={[styles.barLabel, { left: x + barWidth / 2 - 20 }]}>
          {pair}
        </Text>
        <Text
          style={[
            styles.barValue,
            { left: x + barWidth / 2 - 15, top: y - 20 },
          ]}
        >
          {percentage.toFixed(0)}%
        </Text>
      </View>
    );
  });

  // Grid lines
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding + (i * chartHeight) / 4;
    const value = maxValue - (i * maxValue) / 4;
    gridLines.push(
      <View key={`grid-${i}`}>
        <Rect x={padding} y={y} width={chartWidth} height="1" fill="#333" />
        <Text style={[styles.gridLabel, { top: y - 8 }]}>
          {value.toFixed(0)}%
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance by Pair</Text>
      <Svg width={width} height={height}>
        {/* Axes */}
        <Rect
          x={padding}
          y={padding}
          width={chartWidth}
          height={chartHeight}
          fill="none"
          stroke="#00d4d4"
          strokeWidth="2"
        />
        {gridLines}
        {bars}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#00d4d4",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  title: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  noDataText: {
    color: "#888",
    textAlign: "center",
    paddingVertical: 30,
  },
  barLabel: {
    color: "#888",
    fontSize: 11,
    fontWeight: "600",
    position: "absolute",
    bottom: 5,
  },
  barValue: {
    color: "#f5f5f5",
    fontSize: 12,
    fontWeight: "700",
    position: "absolute",
  },
  gridLabel: {
    color: "#666",
    fontSize: 10,
    position: "absolute",
    right: 5,
  },
});
