import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Trade } from "../types";
import { calculateWinRate } from "../utils/calculations";

interface WinRatePieChartProps {
  trades: Trade[];
}

export default function WinRatePieChart({ trades }: WinRatePieChartProps) {
  const size = Dimensions.get("window").width - 64;
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;

  const completedTrades = trades.filter((t) => t.result);
  if (completedTrades.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No completed trades</Text>
      </View>
    );
  }

  const wins = completedTrades.filter((t) => t.result === "Win").length;
  const losses = completedTrades.filter((t) => t.result === "Loss").length;
  const breakEven = completedTrades.filter(
    (t) => t.result === "Break-even"
  ).length;

  const total = wins + losses + breakEven;
  const winPercentage = (wins / total) * 100;
  const lossPercentage = (losses / total) * 100;
  const breakEvenPercentage = (breakEven / total) * 100;

  // Calculate pie slices
  const startAngle = -Math.PI / 2;
  let currentAngle = startAngle;

  const slices = [];

  // Win slice (green)
  const winAngle = (winPercentage / 100) * 2 * Math.PI;
  const winEndAngle = currentAngle + winAngle;
  slices.push({
    color: "#4caf50",
    percentage: winPercentage,
    label: "Wins",
    count: wins,
    startAngle: currentAngle,
    endAngle: winEndAngle,
  });
  currentAngle = winEndAngle;

  // Loss slice (red)
  const lossAngle = (lossPercentage / 100) * 2 * Math.PI;
  const lossEndAngle = currentAngle + lossAngle;
  slices.push({
    color: "#f44336",
    percentage: lossPercentage,
    label: "Losses",
    count: losses,
    startAngle: currentAngle,
    endAngle: lossEndAngle,
  });
  currentAngle = lossEndAngle;

  // Break-even slice (gray)
  if (breakEven > 0) {
    const breakEvenAngle = (breakEvenPercentage / 100) * 2 * Math.PI;
    const breakEvenEndAngle = currentAngle + breakEvenAngle;
    slices.push({
      color: "#999",
      percentage: breakEvenPercentage,
      label: "Break-even",
      count: breakEven,
      startAngle: currentAngle,
      endAngle: breakEvenEndAngle,
    });
  }

  const arcToPath = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Win/Loss Distribution</Text>
      <Svg width={size} height={size}>
        {slices.map((slice, index) => (
          <View key={index}>
            <Circle
              cx={
                centerX +
                radius * Math.cos((slice.startAngle + slice.endAngle) / 2)
              }
              cy={
                centerY +
                radius * Math.sin((slice.startAngle + slice.endAngle) / 2)
              }
              r={radius}
              fill={slice.color}
              opacity={0.3}
            />
          </View>
        ))}
      </Svg>

      <View style={styles.legend}>
        {slices.map((slice, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: slice.color }]}
            />
            <Text style={styles.legendLabel}>
              {slice.label}: {slice.count} ({slice.percentage.toFixed(1)}%)
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.winRateText}>
        Win Rate: {calculateWinRate(trades).toFixed(1)}%
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
  noDataText: {
    color: "#888",
    textAlign: "center",
    paddingVertical: 30,
  },
  legend: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  legendLabel: {
    color: "#f5f5f5",
    fontSize: 13,
    fontWeight: "500",
  },
  winRateText: {
    color: "#00d4d4",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
});
