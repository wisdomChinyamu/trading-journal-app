import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "./ThemeProvider";
import { Trade } from "../types";

interface Props {
  trades: Trade[];
  // New props to support synchronization
  currentMonth?: number;
  currentYear?: number;
  onMonthYearChange?: (month: number, year: number) => void;
}

function toDate(value: any): Date | null {
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
}

function getWeekRanges(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: { start: Date; end: Date }[] = [];
  let day = 1;
  while (day <= daysInMonth) {
    const start = new Date(year, month, day, 0, 0, 0, 0);
    const endDay = Math.min(day + 6, daysInMonth);
    const end = new Date(year, month, endDay, 23, 59, 59, 999);
    weeks.push({ start, end });
    day += 7;
  }
  return weeks;
}

export default function WeeklySummaryPanelSmall({ 
  trades, 
  // Initialize with current month/year if provided, otherwise use current date
  currentMonth: propMonth = new Date().getMonth(),
  currentYear: propYear = new Date().getFullYear(),
  onMonthYearChange,
}: Props) {
  const { colors } = useTheme();
  const now = new Date();
  // Use prop values if provided, otherwise use current date
  const [selectedMonth, setSelectedMonth] = useState({
    year: propYear,
    month: propMonth,
  });
  const { year, month } = selectedMonth;
  const weekRanges = getWeekRanges(year, month);

  // Update internal state when prop values change
  React.useEffect(() => {
    setSelectedMonth({
      year: propYear,
      month: propMonth,
    });
  }, [propMonth, propYear]);

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
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Weekly Summary
          </Text>
          <Text style={[styles.monthName, { color: colors.subtext }]}>
            {new Date(year, month).toLocaleDateString("default", {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={goToPrevMonth}
            style={[styles.navButton, { backgroundColor: colors.neutral }]}
          >
            <Text style={styles.navIcon}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goToCurrentMonth}
            style={[styles.todayButton, { backgroundColor: colors.highlight }]}
          >
            <Text style={[styles.todayText, { color: colors.background }]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goToNextMonth}
            style={[styles.navButton, { backgroundColor: colors.neutral }]}
          >
            <Text style={styles.navIcon}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weeksScroll}
      >
        {weeklyStats.map((w) => {
          const isCurrentWeek = now >= w.range.start && now <= w.range.end;
          const isEmpty = w.trades === 0;
          return (
            <View
              key={w.week}
              style={[
                styles.weekBox,
                {
                  backgroundColor: isEmpty
                    ? colors.neutral
                    : w.totalPnL > 0
                    ? "rgba(76, 175, 80, 0.12)"
                    : w.totalPnL < 0
                    ? "rgba(244, 67, 54, 0.12)"
                    : "rgba(255,165,0,0.08)",
                  borderColor: isCurrentWeek
                    ? colors.highlight
                    : isEmpty
                    ? "rgba(255,255,255,0.05)"
                    : w.totalPnL > 0
                    ? colors.profitEnd
                    : w.totalPnL < 0
                    ? colors.lossEnd
                    : colors.breakEven,
                },
              ]}
            >
              <Text style={[styles.weekLabel, { color: colors.text }]}>
                W{w.week}
              </Text>
              <Text style={[styles.weekDate, { color: colors.subtext }]}>
                {w.range.start.getDate()}-{w.range.end.getDate()}
              </Text>
              <Text
                style={[
                  styles.weekPnL,
                  {
                    color: w.totalPnL >= 0 ? colors.profitEnd : colors.lossEnd,
                  },
                ]}
              >
                {w.totalPnL >= 0 ? "+" : ""}
                {w.totalPnL.toFixed(1)}R
              </Text>
              <Text style={[styles.weekStat, { color: colors.subtext }]}>
                {w.trades} trades • {w.wins}/{w.losses} • {w.winRate.toFixed(0)}
                %
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 12, borderRadius: 12, borderWidth: 1, marginVertical: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontWeight: "800", fontSize: 16 },
  monthName: { fontSize: 12 },
  navRow: { flexDirection: "row", gap: 8 },
  navButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  navIcon: { fontSize: 16, color: "#f5f5f5", fontWeight: "700" },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  todayText: { fontWeight: "700" },
  weeksScroll: { paddingVertical: 4, paddingHorizontal: 4 },
  weekBox: {
    minWidth: 200,
    borderRadius: 10,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
  },
  weekLabel: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  weekDate: { fontSize: 12, marginBottom: 8 },
  weekPnL: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  weekStat: { fontSize: 12 },
});
