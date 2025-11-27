import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Polyline, Circle, Line } from "react-native-svg";
import { Trade } from "../types";

interface EquityCurveChartProps {
  trades: Trade[];
}

export default function EquityCurveChart({ trades }: EquityCurveChartProps) {
  const width = Dimensions.get("window").width - 32;
  const height = 200;
  const padding = 30;

  // Calculate equity curve
  let equity = 0;
  const equityPoints: { date: string; value: number }[] = [];

  trades.forEach((trade) => {
    if (trade.result === "Win") {
      equity += trade.riskToReward;
    } else if (trade.result === "Loss") {
      equity -= 1;
    }
    equityPoints.push({
      date: new Date(trade.createdAt).toLocaleDateString(),
      value: equity,
    });
  });

  if (equityPoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No trades recorded yet</Text>
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

  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding + (i * chartHeight) / 4;
    const value = maxValue - (i * range) / 4;
    gridLines.push(
      <Line
        key={`grid-${i}`}
        x1={padding}
        y1={y}
        x2={width - padding}
        y2={y}
        stroke="#333"
        strokeWidth="1"
      />,
      <Text
        key={`label-${i}`}
        style={[styles.axisLabel, { top: y - 8, right: 5 }]}
      >
        {value.toFixed(1)}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Equity Curve</Text>
      <Svg width={width} height={height}>
        {gridLines.filter(
          (item) => item && item.key && item.key.startsWith("grid")
        )}
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
          strokeWidth="2"
          fill="none"
        />

        {/* Data points */}
        {equityPoints.map((point, index) => {
          const x = padding + index * pointSpacing;
          const y =
            height - padding - ((point.value - minValue) / range) * chartHeight;
          return (
            <Circle key={`point-${index}`} cx={x} cy={y} r="3" fill="#00d4d4" />
          );
        })}
      </Svg>
      <Text style={styles.finalValue}>
        Final Equity:{" "}
        {(equityPoints[equityPoints.length - 1]?.value || 0).toFixed(2)}
      </Text>
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
  axisLabel: {
    color: "#888",
    fontSize: 10,
    position: "absolute",
  },
  noDataText: {
    color: "#888",
    textAlign: "center",
    paddingVertical: 30,
  },
  finalValue: {
    color: "#00d4d4",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
  },
});
