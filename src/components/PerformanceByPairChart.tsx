import React from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView, Platform } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { Trade } from "../types";
import { getPerformanceBy } from "../utils/calculations";
import { useTheme } from "./ThemeProvider";

interface PerformanceByPairChartProps {
  trades: Trade[];
}

export default function PerformanceByPairChart({
  trades,
}: PerformanceByPairChartProps) {
  const { colors, fontFamily } = useTheme();
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [tappedIndex, setTappedIndex] = React.useState<number | null>(null);
  // Clear tapped tooltip after 3s
  React.useEffect(() => {
    if (tappedIndex === null) return;
    const t = setTimeout(() => setTappedIndex(null), 3000);
    return () => clearTimeout(t);
  }, [tappedIndex]);
  const width = Dimensions.get("window").width - 32;
  const height = 280;
  const padding = { top: 30, right: 20, bottom: 60, left: 50 };

  const performance = getPerformanceBy(trades, "pair");
  const pairs = Object.keys(performance);

  if (pairs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Performance by Pair
          </Text>
          <View
            style={[styles.badge, { backgroundColor: `${colors.highlight}20` }]}
          >
            <Text style={[styles.badgeText, { color: colors.highlight }]}>
              📊
            </Text>
          </View>
        </View>
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataIcon, { color: colors.subtext }]}>📈</Text>
          <Text style={[styles.noDataText, { color: colors.subtext }]}>
            No trades by pair yet
          </Text>
          <Text style={[styles.noDataSubtext, { color: colors.subtext }]}>
            Start logging trades to see performance breakdown
          </Text>
        </View>
      </View>
    );
  }

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  // Ensure bars and labels never touch - enforce minimum spacing
  const minSpacing = 24; // px
  const maxBarWidth = 60;
  // Compute a bar width that leaves at least minSpacing between bars
  const tentativeBarWidth = (chartWidth - minSpacing * (pairs.length + 1)) / pairs.length;
  const barWidth = Math.max(24, Math.min(maxBarWidth, tentativeBarWidth));
  const spacing = Math.max(minSpacing, (chartWidth - barWidth * pairs.length) / (pairs.length + 1));
  const maxValue = Math.max(...Object.values(performance), 100);

  // Helper to get color based on win rate
  const getBarColor = (percentage: number) => {
    if (percentage >= 70) return colors.profitEnd;
    if (percentage >= 60) return colors.profitStart;
    if (percentage >= 50) return "#ffa726";
    if (percentage >= 40) return colors.lossStart;
    return colors.lossEnd;
  };

  // Calculate bars
  const bars = pairs.map((pair, index) => {
    const percentage = performance[pair];
    const barHeight = Math.max((percentage / maxValue) * chartHeight, 5);
    const x = padding.left + spacing + index * (barWidth + spacing);
    const y = padding.top + chartHeight - barHeight;
    const color = getBarColor(percentage);

    return {
      pair,
      percentage,
      x,
      y,
      barHeight,
      color,
    };
  });
  // Grid lines (5 horizontal lines)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const value = (maxValue / 4) * (4 - i);
    const y = padding.top + (i * chartHeight) / 4;
    return { value, y };
  });

  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth <= 420;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Performance by Pair
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Win rate comparison across {pairs.length} pairs
          </Text>
        </View>
        <View
          style={[styles.badge, { backgroundColor: `${colors.highlight}20` }]}
        >
          <Text style={[styles.badgeText, { color: colors.highlight }]}>
            {pairs.length}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Svg width={Math.max(width, pairs.length * 80)} height={height}>
          {/* Grid lines */}
          {gridLines.map((line, i) => (
            <React.Fragment key={`grid-${i}`}>
              <Line
                x1={padding.left}
                y1={line.y}
                x2={padding.left + chartWidth}
                y2={line.y}
                stroke={colors.neutral}
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.3"
              />
              <SvgText
                x={padding.left - 10}
                y={line.y + 4}
                fill={colors.subtext}
                fontSize="10"
                fontWeight="600"
                textAnchor="end"
                fontFamily={fontFamily}
              >
                {line.value.toFixed(0)}%
              </SvgText>
            </React.Fragment>
          ))}

          {/* Bars */}
          {bars.map((bar, i) => (
            <React.Fragment key={bar.pair}>
              {/* Bar with gradient effect */}
              <Rect
                x={bar.x}
                y={bar.y}
                width={barWidth}
                height={bar.barHeight}
                fill={bar.color}
                rx="6"
                opacity="0.9"
              />

              {/* Bar highlight */}
              <Rect
                x={bar.x}
                y={bar.y}
                width={barWidth}
                height={Math.min(bar.barHeight * 0.3, 20)}
                fill="rgba(255,255,255,0.2)"
                rx="6"
              />

              {/* Value label on top of bar */}
              <SvgText
                x={bar.x + barWidth / 2}
                y={bar.y - 8}
                fill={colors.text}
                fontSize="12"
                fontWeight="700"
                textAnchor="middle"
                fontFamily={fontFamily}
              >
                {bar.percentage.toFixed(0)}%
              </SvgText>

              {/* Pair label below bar - short on small screens, full on hover/tap */}
              <SvgText
                x={bar.x + barWidth / 2}
                y={padding.top + chartHeight + 20}
                fill={colors.text}
                fontSize="12"
                fontWeight="700"
                textAnchor="middle"
                fontFamily={fontFamily}
                onPress={(() => {
                  // Native tap support
                  return () => {
                    setTappedIndex(i);
                  };
                })()}
                {...(Platform.OS === "web"
                  ? ({
                      onMouseEnter: () => setHoveredIndex(i),
                      onMouseLeave: () => setHoveredIndex((h) => (h === i ? null : h)),
                    } as any)
                  : ({} as any))}
              >
                {(() => {
                  try {
                    const raw = String(bar.pair || "").replace(/\//g, "");
                    const showFull = hoveredIndex === i || tappedIndex === i;
                    if (showFull) return bar.pair;
                    if (isSmallScreen) {
                      if (raw.length >= 4) return `${raw.charAt(0)}.${raw.charAt(3)}.`;
                      return `${raw.slice(0, 2)}.`;
                    }
                    return bar.pair;
                  } catch (e) {
                    return bar.pair;
                  }
                })()}
              </SvgText>

              {/* Win rate category label */}
              <SvgText
                x={bar.x + barWidth / 2}
                y={padding.top + chartHeight + 38}
                fill={bar.color}
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
                opacity="0.8"
                fontFamily={fontFamily}
              >
                {bar.percentage >= 60
                  ? "Strong"
                  : bar.percentage >= 50
                  ? "Good"
                  : "Weak"}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Axes */}
          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke={colors.highlight}
            strokeWidth="2"
          />
          <Line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke={colors.highlight}
            strokeWidth="2"
          />

          {/* Y-axis label */}
          <SvgText
            x={15}
            y={padding.top + chartHeight / 2}
            fill={colors.subtext}
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            transform={`rotate(-90, 15, ${padding.top + chartHeight / 2})`}
            fontFamily={fontFamily}
          >
            Win Rate (%)
          </SvgText>
        </Svg>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.profitEnd }]}
          />
          <Text style={[styles.legendText, { color: colors.subtext }]}>
            70%+ Strong
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#ffa726" }]} />
          <Text style={[styles.legendText, { color: colors.subtext }]}>
            50-60% Good
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.lossEnd }]}
          />
          <Text style={[styles.legendText, { color: colors.subtext }]}>
            &lt;40% Weak
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 40,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollContent: {
    paddingRight: 20,
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: 50,
    gap: 12,
  },
  noDataIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  noDataText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  noDataSubtext: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.7,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
