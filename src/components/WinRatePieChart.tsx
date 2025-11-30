import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { Trade } from "../types";
import { calculateWinRate } from "../utils/calculations";

interface WinRatePieChartProps {
  trades: Trade[];
}

export default function WinRatePieChart({ trades }: WinRatePieChartProps) {
  const size = 220;
  const radius = 70;
  const centerX = size / 2;
  const centerY = size / 2;
  const strokeWidth = 24;

  const completedTrades = trades.filter((t) => t.result);
  
  if (completedTrades.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Win/Loss Distribution</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Completed Trades</Text>
          <Text style={styles.emptyText}>
            Complete trades to see your win/loss distribution
          </Text>
        </View>
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

  // Calculate circle segments
  const circumference = 2 * Math.PI * radius;
  const winStroke = (winPercentage / 100) * circumference;
  const lossStroke = (lossPercentage / 100) * circumference;
  const breakEvenStroke = (breakEvenPercentage / 100) * circumference;

  const winOffset = 0;
  const lossOffset = -winStroke;
  const breakEvenOffset = -(winStroke + lossStroke);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Win/Loss Distribution</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{completedTrades.length} trades</Text>
        </View>
      </View>

      {/* Donut Chart */}
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            stroke="#2a2a2a"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Win segment */}
          {wins > 0 && (
            <Circle
              cx={centerX}
              cy={centerY}
              r={radius}
              stroke="#4caf50"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${winStroke} ${circumference}`}
              strokeDashoffset={winOffset}
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
              strokeLinecap="round"
            />
          )}

          {/* Loss segment */}
          {losses > 0 && (
            <Circle
              cx={centerX}
              cy={centerY}
              r={radius}
              stroke="#f44336"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${lossStroke} ${circumference}`}
              strokeDashoffset={lossOffset}
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
              strokeLinecap="round"
            />
          )}

          {/* Break-even segment */}
          {breakEven > 0 && (
            <Circle
              cx={centerX}
              cy={centerY}
              r={radius}
              stroke="#ffa500"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${breakEvenStroke} ${circumference}`}
              strokeDashoffset={breakEvenOffset}
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
              strokeLinecap="round"
            />
          )}

          {/* Center text */}
          <SvgText
            x={centerX}
            y={centerY - 12}
            fontSize="28"
            fontWeight="700"
            fill="#00d4d4"
            textAnchor="middle"
          >
            {winPercentage.toFixed(0)}%
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 16}
            fontSize="12"
            fill="#aaa"
            textAnchor="middle"
            fontWeight="600"
          >
            Win Rate
          </SvgText>
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendIcon}>
            <View style={[styles.legendDot, { backgroundColor: '#4caf50' }]} />
          </View>
          <View style={styles.legendInfo}>
            <Text style={styles.legendLabel}>Wins</Text>
            <Text style={styles.legendValue}>
              {wins} trades ({winPercentage.toFixed(1)}%)
            </Text>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={styles.legendIcon}>
            <View style={[styles.legendDot, { backgroundColor: '#f44336' }]} />
          </View>
          <View style={styles.legendInfo}>
            <Text style={styles.legendLabel}>Losses</Text>
            <Text style={styles.legendValue}>
              {losses} trades ({lossPercentage.toFixed(1)}%)
            </Text>
          </View>
        </View>

        {breakEven > 0 && (
          <View style={styles.legendItem}>
            <View style={styles.legendIcon}>
              <View style={[styles.legendDot, { backgroundColor: '#ffa500' }]} />
            </View>
            <View style={styles.legendInfo}>
              <Text style={styles.legendLabel}>Break-even</Text>
              <Text style={styles.legendValue}>
                {breakEven} trades ({breakEvenPercentage.toFixed(1)}%)
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Overall Stats */}
      <View style={styles.overallStats}>
        <View style={styles.overallStatItem}>
          <Text style={styles.overallStatLabel}>Total Trades</Text>
          <Text style={styles.overallStatValue}>{total}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.overallStatItem}>
          <Text style={styles.overallStatLabel}>Win Rate</Text>
          <Text style={[styles.overallStatValue, { color: '#00d4d4' }]}>
            {calculateWinRate(trades).toFixed(1)}%
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
    backgroundColor: 'rgba(0, 212, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#00d4d4',
    fontSize: 11,
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
    textAlign: "center",
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  legend: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendInfo: {
    flex: 1,
  },
  legendLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  legendValue: {
    color: "#f5f5f5",
    fontSize: 14,
    fontWeight: "600",
  },
  overallStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 212, 212, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  overallStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  overallStatLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  overallStatValue: {
    color: '#f5f5f5',
    fontSize: 18,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
});