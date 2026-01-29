import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "./ThemeProvider";
import { useAppContext } from "../hooks/useAppContext";
import { Trade } from "../types";

interface WeeklySummaryPanelProps {
  trades: Trade[];
  layout?: "horizontal" | "vertical";
  // New props to support synchronization
  currentMonth?: number;
  currentYear?: number;
  onMonthYearChange?: (month: number, year: number) => void;
}

function getWeekRanges(
  year: number,
  month: number
): { start: Date; end: Date }[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: { start: Date; end: Date }[] = [];
  let day = 1;
  while (day <= daysInMonth) {
    const start = new Date(year, month, day);
    const end = new Date(year, month, Math.min(day + 6, daysInMonth));
    // Make start at start of day and end at end of day so comparisons are inclusive
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    weeks.push({ start, end });
    day += 7;
  }
  return weeks;
}

export default function WeeklySummaryPanel({
  trades,
  layout = "vertical",
  // Initialize with current month/year if provided, otherwise use current date
  currentMonth: propMonth = new Date().getMonth(),
  currentYear: propYear = new Date().getFullYear(),
  onMonthYearChange,
}: WeeklySummaryPanelProps) {
  const { colors } = useTheme();
  const { state } = useAppContext();
  const uiScale = state.uiScale || "normal";
  const scaleMultiplier =
    uiScale === "small" ? 0.86 : uiScale === "large" ? 1.12 : 1;

  const toDate = (value: any): Date | null => {
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
  const now = new Date();
  // Use prop values if provided, otherwise use current date
  const [selectedMonth, setSelectedMonth] = useState({
    year: propYear,
    month: propMonth,
  });
  const { year, month } = selectedMonth;
  const weekRanges = getWeekRanges(year, month);

  // Group trades by week
  const weeklyStats = weekRanges.map((range, idx) => {
    const tradesInWeek = trades.filter((t) => {
      const d = toDate((t as any).tradeTime) || toDate((t as any).createdAt);
      if (!d) return false;
      return d >= range.start && d <= range.end;
    });

    const wins = tradesInWeek.filter((t) => t.result === "Win").length;
    const losses = tradesInWeek.filter((t) => t.result === "Loss").length;
    const winRate =
      tradesInWeek.length > 0 ? (wins / tradesInWeek.length) * 100 : 0;

    // Calculate PnL based on result field
    const totalPnL = tradesInWeek.reduce((sum, t) => {
      if (t.riskAmount && t.result === "Win")
        return sum + t.riskAmount * (t.riskToReward || 1);
      if (t.riskAmount && t.result === "Loss") return sum - t.riskAmount;
      if (!t.riskAmount && t.result === "Win")
        return sum + (t.riskToReward || 1);
      if (!t.riskAmount && t.result === "Loss") return sum - 1;
      return sum;
    }, 0);

    return {
      week: idx + 1,
      range,
      trades: tradesInWeek.length,
      wins,
      losses,
      winRate,
      totalPnL,
    };
  });

  const totalTrades = weeklyStats.reduce((sum, w) => sum + w.trades, 0);
  const totalPnL = weeklyStats.reduce((sum, w) => sum + w.totalPnL, 0);
  const bestWeek = weeklyStats.reduce(
    (best, w) => (w.totalPnL > best.totalPnL ? w : best),
    weeklyStats[0]
  );

  // Update internal state when prop values change
  React.useEffect(() => {
    setSelectedMonth({
      year: propYear,
      month: propMonth,
    });
  }, [propMonth, propYear]);

  const goToPrevMonth = () => {
    let newMonth, newYear;
    if (month === 0) {
      newMonth = 11;
      newYear = year - 1;
    } else {
      newMonth = month - 1;
      newYear = year;
    }
    const newSelection = { year: newYear, month: newMonth };
    setSelectedMonth(newSelection);
    onMonthYearChange?.(newMonth, newYear);
  };

  const goToNextMonth = () => {
    let newMonth, newYear;
    if (month === 11) {
      newMonth = 0;
      newYear = year + 1;
    } else {
      newMonth = month + 1;
      newYear = year;
    }
    const newSelection = { year: newYear, month: newMonth };
    setSelectedMonth(newSelection);
    onMonthYearChange?.(newMonth, newYear);
  };

  const goToCurrentMonth = () => {
    const newSelection = {
      year: now.getFullYear(),
      month: now.getMonth(),
    };
    setSelectedMonth(newSelection);
    onMonthYearChange?.(now.getMonth(), now.getFullYear());
  };

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colors.surface,
          borderColor: "rgba(0, 212, 212, 0.15)",
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text
            style={[
              styles.title,
              { color: colors.text, fontSize: 18 * scaleMultiplier },
            ]}
          >
            Weekly Summary
          </Text>
          <Text
            style={[
              styles.monthName,
              { color: colors.subtext, fontSize: 13 * scaleMultiplier },
            ]}
          >
            {new Date(year, month).toLocaleDateString("default", {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.neutral }]}
          onPress={goToPrevMonth}
        >
          <Text style={[styles.navIcon, { fontSize: 16 * scaleMultiplier }]}>
            ‹
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.todayButton, { backgroundColor: colors.highlight }]}
          onPress={goToCurrentMonth}
        >
          <Text
            style={[
              styles.todayText,
              { color: colors.background, fontSize: 13 * scaleMultiplier },
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.neutral }]}
          onPress={goToNextMonth}
        >
          <Text style={[styles.navIcon, { fontSize: 16 * scaleMultiplier }]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Overview */}
      <View
        style={[
          styles.overviewCard,
          {
            backgroundColor: "rgba(0, 212, 212, 0.05)",
            borderColor: "rgba(0, 212, 212, 0.2)",
          },
        ]}
      >
        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text
              style={[
                styles.overviewLabel,
                { color: colors.subtext, fontSize: 11 * scaleMultiplier },
              ]}
            >
              Trades
            </Text>
            <Text
              style={[
                styles.overviewValue,
                { color: colors.text, fontSize: 20 * scaleMultiplier },
              ]}
            >
              {totalTrades}
            </Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text
              style={[
                styles.overviewLabel,
                { color: colors.subtext, fontSize: 11 * scaleMultiplier },
              ]}
            >
              P&L
            </Text>
            <Text
              style={[
                styles.overviewValue,
                {
                  color: totalPnL >= 0 ? colors.profitEnd : colors.lossEnd,
                  fontSize: 20 * scaleMultiplier,
                },
              ]}
            >
              {totalPnL >= 0 ? "+" : ""}
              {totalPnL.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Weekly Boxes */}
      <View
        style={[
          styles.weeksContainer,
          layout === "horizontal" ? styles.weeksContainerHorizontal : null,
        ]}
      >
        {weeklyStats.map((w) => {
          const isCurrentWeek = now >= w.range.start && now <= w.range.end;
          const isEmpty = w.trades === 0;

          return (
            <View
              key={w.week}
              style={[
                styles.weekBox,
                layout === "horizontal" ? styles.weekBoxHorizontal : null,
                {
                  backgroundColor: isEmpty
                    ? colors.neutral
                    : w.totalPnL > 0
                    ? "rgba(76, 175, 80, 0.15)"
                    : w.totalPnL < 0
                    ? "rgba(244, 67, 54, 0.15)"
                    : "rgba(255, 165, 0, 0.15)",
                  borderWidth: 1 * scaleMultiplier,
                  borderColor: isCurrentWeek
                    ? colors.highlight
                    : isEmpty
                    ? "rgba(255, 255, 255, 0.05)"
                    : w.totalPnL > 0
                    ? colors.profitEnd
                    : w.totalPnL < 0
                    ? colors.lossEnd
                    : colors.breakEven,
                },
              ]}
            >
              <View style={styles.weekHeader}>
                <View style={styles.weekLabelContainer}>
                  <Text
                    style={[
                      styles.weekLabel,
                      { color: colors.text, fontSize: 14 * scaleMultiplier },
                    ]}
                  >
                    Week {w.week}
                  </Text>
                  {isCurrentWeek && (
                    <View
                      style={[
                        styles.currentBadge,
                        { backgroundColor: colors.highlight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currentBadgeText,
                          {
                            color: colors.background,
                            fontSize: 9 * scaleMultiplier,
                          },
                        ]}
                      >
                        Now
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.weekDate,
                    { color: colors.subtext, fontSize: 11 * scaleMultiplier },
                  ]}
                >
                  {w.range.start.getDate()}-{w.range.end.getDate()}
                </Text>
              </View>

              {isEmpty ? (
                <View style={styles.emptyWeek}>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: colors.subtext, fontSize: 12 * scaleMultiplier },
                    ]}
                  >
                    No trades
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.weekPnLContainer}>
                    <Text
                      style={[
                        styles.weekPnL,
                        {
                          color:
                            w.totalPnL >= 0 ? colors.profitEnd : colors.lossEnd,
                          fontSize: 24 * scaleMultiplier,
                        },
                      ]}
                    >
                      {w.totalPnL >= 0 ? "+" : ""}
                      {w.totalPnL.toFixed(1)}R
                    </Text>
                    <View style={styles.weekPnLIndicator}>
                      <Text
                        style={[
                          styles.weekPnLIcon,
                          { fontSize: 16 * scaleMultiplier },
                        ]}
                      >
                        {w.totalPnL > 0 ? "📈" : w.totalPnL < 0 ? "📉" : "—"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.weekStats}>
                    <View style={styles.weekStatItem}>
                      <Text
                        style={[
                          styles.weekStatLabel,
                          {
                            color: colors.subtext,
                            fontSize: 10 * scaleMultiplier,
                          },
                        ]}
                      >
                        Trades
                      </Text>
                      <Text
                        style={[
                          styles.weekStatValue,
                          {
                            color: colors.text,
                            fontSize: 13 * scaleMultiplier,
                          },
                        ]}
                      >
                        {w.trades}
                      </Text>
                    </View>
                    <View style={styles.weekStatItem}>
                      <Text
                        style={[
                          styles.weekStatLabel,
                          {
                            color: colors.subtext,
                            fontSize: 10 * scaleMultiplier,
                          },
                        ]}
                      >
                        W/L
                      </Text>
                      <Text
                        style={[
                          styles.weekStatValue,
                          {
                            color: colors.text,
                            fontSize: 13 * scaleMultiplier,
                          },
                        ]}
                      >
                        {w.wins}/{w.losses}
                      </Text>
                    </View>
                    <View style={styles.weekStatItem}>
                      <Text
                        style={[
                          styles.weekStatLabel,
                          {
                            color: colors.subtext,
                            fontSize: 10 * scaleMultiplier,
                          },
                        ]}
                      >
                        Win %
                      </Text>
                      <Text
                        style={[
                          styles.weekStatValue,
                          {
                            color:
                              w.winRate >= 50
                                ? colors.profitEnd
                                : colors.lossEnd,
                            fontSize: 13 * scaleMultiplier,
                          },
                        ]}
                      >
                        {w.winRate.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>

      {/* Best Week Highlight */}
      {bestWeek && bestWeek.trades > 0 && (
        <View
          style={[
            styles.bestWeekCard,
            {
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              borderColor: colors.profitEnd,
            },
          ]}
        >
          <Text
            style={[styles.bestWeekIcon, { fontSize: 24 * scaleMultiplier }]}
          >
            🏆
          </Text>
          <View style={styles.bestWeekInfo}>
            <Text
              style={[
                styles.bestWeekLabel,
                { color: colors.subtext, fontSize: 11 * scaleMultiplier },
              ]}
            >
              Best Week
            </Text>
            <Text
              style={[
                styles.bestWeekValue,
                { color: colors.profitEnd, fontSize: 14 * scaleMultiplier },
              ]}
            >
              Week {bestWeek.week}: +{bestWeek.totalPnL.toFixed(1)}R
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 16,
    minWidth: 280,
    maxWidth: 360,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: Platform.OS === "web" ? 0 : 0,
    marginTop: Platform.OS !== "web" ? 16 : 0,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  monthName: {
    fontSize: 13,
  },
  monthNav: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  navButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  navIcon: {
    fontSize: 16,
    color: "#f5f5f5",
    fontWeight: "700",
  },
  todayButton: {
    flex: 2,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  todayText: {
    fontSize: 13,
    fontWeight: "700",
  },
  overviewCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  overviewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  overviewItem: {
    flex: 1,
    alignItems: "center",
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  overviewDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 12,
  },
  weeksContainer: {
    gap: 12,
  },
  weeksContainerHorizontal: {
    flexDirection: "row",
    overflow: "hidden",
  },
  weekBox: {
    borderRadius: 10,
    padding: 14,
  },
  weekBoxHorizontal: {
    minWidth: 220,
    marginRight: 12,
    flexShrink: 0,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  weekLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  weekDate: {
    fontSize: 11,
  },
  emptyWeek: {
    paddingVertical: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  weekPnLContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekPnL: {
    fontSize: 24,
    fontWeight: "800",
  },
  weekPnLIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  weekPnLIcon: {
    fontSize: 16,
  },
  weekStats: {
    flexDirection: "row",
    gap: 12,
  },
  weekStatItem: {
    flex: 1,
  },
  weekStatLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  weekStatValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  bestWeekCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    gap: 10,
  },
  bestWeekIcon: {
    fontSize: 24,
  },
  bestWeekInfo: {
    flex: 1,
  },
  bestWeekLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  bestWeekValue: {
    fontSize: 14,
    fontWeight: "700",
  },
});
