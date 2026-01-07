import React, { useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Trade } from "../types";
import { useTheme } from "./ThemeProvider";
import { breakpoints } from "../theme/theme";

interface CalendarHeatmapProps {
  trades: Trade[];
  onDayPress?: (date: Date) => void;
  theme?: "dark" | "light";
}

export default function CalendarHeatmap({
  trades,
  onDayPress,
  theme = "dark",
}: CalendarHeatmapProps) {
  const { colors } = useTheme();
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
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [yearIdx, setYearIdx] = useState(now.getFullYear());
  const year = yearIdx;
  const month = monthIndex;

  const widthAnimations = useRef<Record<string, Animated.Value>>({}).current;

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const isTablet = windowWidth >= breakpoints.tablet;
  const isDesktop = windowWidth >= breakpoints.desktop;

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const localDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const tradesByDate = useMemo(() => {
    const grouped: Record<string, Trade[]> = {};
    trades.forEach((trade) => {
      const d =
        toDate((trade as any).tradeTime) || toDate((trade as any).createdAt);
      if (!d) return;
      const dateKey = localDateKey(d);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(trade);
    });
    return grouped;
  }, [trades]);

  const blendHex = (a: string, b: string, t: number) => {
    const hexToRgb = (h: string) => {
      const san = h.replace("#", "");
      const bigint = parseInt(
        san.length === 3
          ? san
              .split("")
              .map((c) => c + c)
              .join("")
          : san,
        16
      );
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
      };
    };
    const ra = hexToRgb(a);
    const rb = hexToRgb(b);
    const r = Math.round(ra.r + (rb.r - ra.r) * t);
    const g = Math.round(ra.g + (rb.g - ra.g) * t);
    const b2 = Math.round(ra.b + (rb.b - ra.b) * t);
    return `rgb(${r}, ${g}, ${b2})`;
  };

  const getDayColor = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const dayTrades = tradesByDate[dateKey] || [];

    if (dayTrades.length === 0) return colors.neutral;

    const tradePnL = (t: Trade) => {
      // Prefer explicit pnl
      if ((t as any).pnl !== undefined && (t as any).pnl !== null)
        return Number((t as any).pnl) || 0;
      // Derive from risk amount and R:R when result exists
      const risk = Math.abs(Number((t as any).riskAmount) || 0);
      const rr = Number((t as any).riskToReward) || 1;
      if ((t as any).result === "Win") return Math.round(risk * rr * 100) / 100;
      if ((t as any).result === "Loss") return Math.round(-risk * 100) / 100;
      return 0;
    };

    const totalPnL = dayTrades.reduce((sum, t) => sum + tradePnL(t), 0);

    const maxAbsPnL = Math.max(
      1,
      ...Object.keys(tradesByDate).map((k) =>
        Math.abs(tradesByDate[k].reduce((s, t) => s + tradePnL(t), 0))
      )
    );

    const intensity = Math.min(1, Math.abs(totalPnL) / maxAbsPnL);

    if (totalPnL > 0) {
      return blendHex(colors.profitStart, colors.profitEnd, intensity);
    }
    if (totalPnL < 0) {
      return blendHex(colors.lossStart, colors.lossEnd, intensity);
    }
    return colors.breakEven;
  };

  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Build weeks as rows of 7, padding the final week with nulls so each week has 7 cells
  const weeks: (number | null)[][] = (() => {
    const count = Math.ceil(days.length / 7);
    const out: (number | null)[][] = [];
    for (let i = 0; i < count; i++) {
      const start = i * 7;
      const week = days.slice(start, start + 7);
      while (week.length < 7) week.push(null);
      out.push(week);
    }
    return out;
  })();

  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  // Use scale animations (1 = normal). We animate transform scale so layout width stays percentage-based
  const handleMouseEnter = (day: number, dayKey: string) => {
    if (!widthAnimations[dayKey])
      widthAnimations[dayKey] = new Animated.Value(1);
    Animated.timing(widthAnimations[dayKey], {
      toValue: 1.08,
      duration: 160,
      useNativeDriver: false,
    }).start();
    setFocusedDay(day);
  };

  const handleMouseLeave = (dayKey: string) => {
    if (!widthAnimations[dayKey])
      widthAnimations[dayKey] = new Animated.Value(1);
    Animated.timing(widthAnimations[dayKey], {
      toValue: 1,
      duration: 120,
      useNativeDriver: false,
    }).start();
    setFocusedDay(null);
  };

  const handleFocus = (day: number, dayKey: string) => {
    handleMouseEnter(day, dayKey);
  };

  const handleBlur = (dayKey: string) => {
    handleMouseLeave(dayKey);
  };

  const getWidthAnimatedValue = (dayKey: string) => {
    if (!widthAnimations[dayKey]) {
      widthAnimations[dayKey] = new Animated.Value(1);
    }
    return widthAnimations[dayKey];
  };

  const handleDayCellPressIn = (dayKey: string) => {
    const w = getWidthAnimatedValue(dayKey);
    Animated.spring(w, { toValue: 0.95, useNativeDriver: false }).start();
  };

  const handleDayCellPressOut = (dayKey: string) => {
    const w = getWidthAnimatedValue(dayKey);
    Animated.spring(w, { toValue: 1, useNativeDriver: false }).start();
  };

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonthIndex(11);
      setYearIdx(year - 1);
    } else {
      setMonthIndex(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonthIndex(0);
      setYearIdx(year + 1);
    } else {
      setMonthIndex(month + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setMonthIndex(today.getMonth());
    setYearIdx(today.getFullYear());
  };

  const getResponsiveCellPixelWidth = (): number => {
    // kept for legacy uses; prefer percentage widths
    const totalGap = 4 * 6;
    const base = containerWidth || windowWidth;
    const available = Math.max(280, base - totalGap);
    return Math.floor(available / 7);
  };

  // Compute cell percent based on measured container width and gaps so cells don't overflow labels
  const cellPercent = (() => {
    const gapPx = 4; // per-cell right gap
    const gapsPerRow = 6; // between 7 cells
    const totalGapPx = gapPx * gapsPerRow;
    if (containerWidth && containerWidth > 0) {
      const percent =
        ((containerWidth - totalGapPx) / containerWidth / 7) * 100;
      // reduce cells slightly (approx 1.5%) to give extra breathing room
      return `${Math.max(11, percent - 1.5).toFixed(4)}%`;
    }
    return "13.9%";
  })();

  return (
    <View
      style={[styles.container, { position: "relative", paddingTop: 44 }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Header with Navigation */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.monthYear, { color: colors.text }]}>
            {new Date(year, month).toLocaleDateString("default", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {
              trades.filter((t) => {
                const d =
                  toDate((t as any).tradeTime) || toDate((t as any).createdAt);
                if (!d) return false;
                return d.getMonth() === month && d.getFullYear() === year;
              }).length
            }{" "}
            trades this month
          </Text>
        </View>
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.neutral }]}
            onPress={goToPrevMonth}
          >
            <Text style={styles.navIcon}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.todayButton, { backgroundColor: colors.highlight }]}
            onPress={goToToday}
          >
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.neutral }]}
            onPress={goToNextMonth}
          >
            <Text style={styles.navIcon}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Removed tooltip preview — hover now expands a day and pushes neighbors (handled in cell handlers). */}

      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {/* Day Headers */}
        <View style={styles.dayHeaderRow}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
            <Text
              key={`${day}-${idx}`}
              style={[
                styles.dayLabel,
                {
                  color: colors.subtext,
                  width: cellPercent as any,
                  marginRight: 4,
                },
              ]}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* Day Cells */}
        <View style={styles.calendarGrid}>
          {weeks.map((week, weekIdx) => (
            <View key={`week-${weekIdx}`} style={styles.weekRow}>
              {week.map((day, dayIdx) => {
                const dayKey = `${weekIdx}-${dayIdx}`;
                const scaleAnim = getWidthAnimatedValue(dayKey);
                const isToday =
                  day === now.getDate() &&
                  month === now.getMonth() &&
                  year === now.getFullYear();

                return (
                  <Animated.View
                    key={dayKey}
                    style={[
                      {
                        width: cellPercent as any,
                        marginRight: 4,
                        marginBottom: 4,
                        transform: [{ scale: scaleAnim }],
                      },
                    ]}
                  >
                    <Pressable
                      accessible
                      accessibilityRole="button"
                      // @ts-ignore
                      tabIndex={day ? 0 : -1}
                      // @ts-ignore
                      onKeyDown={(e: any) => {
                        if (!day) return;
                        const k =
                          e?.key || (e?.nativeEvent && e.nativeEvent.key);
                        if (k === "Enter" || k === " ")
                          onDayPress?.(new Date(year, month, day));
                      }}
                      onFocus={() => day && handleFocus(day, dayKey)}
                      onBlur={() => day && handleBlur(dayKey)}
                      onPressIn={() => day && handleDayCellPressIn(dayKey)}
                      onPressOut={() => day && handleDayCellPressOut(dayKey)}
                      style={({ pressed }) => [
                        styles.dayCell,
                        {
                          backgroundColor: day
                            ? getDayColor(day)
                            : "transparent",
                          opacity: pressed ? 0.9 : 1,
                          borderWidth: isToday ? 2 : focusedDay === day ? 2 : 1,
                          borderColor: isToday
                            ? colors.highlight
                            : focusedDay === day
                            ? colors.highlight
                            : "rgba(255,255,255,0.1)",
                        },
                      ]}
                      onPress={() =>
                        day && onDayPress?.(new Date(year, month, day))
                      }
                      // @ts-ignore
                      onMouseEnter={() => day && handleMouseEnter(day, dayKey)}
                      // @ts-ignore
                      onMouseLeave={() => day && handleMouseLeave(dayKey)}
                      disabled={!day}
                    >
                      {day && (
                        <View
                          style={[
                            styles.dayContent,
                            { aspectRatio: 1, width: "100%" },
                          ]}
                        >
                          <Text
                            style={[styles.dayText, { color: colors.text }]}
                          >
                            {day}
                          </Text>
                          {(() => {
                            const dateKey = `${year}-${String(
                              month + 1
                            ).padStart(2, "0")}-${String(day).padStart(
                              2,
                              "0"
                            )}`;
                            const dayTrades = tradesByDate[dateKey] || [];
                            if (dayTrades.length > 0) {
                              return (
                                <View style={styles.tradeDot}>
                                  <Text style={styles.tradeDotText}>
                                    {dayTrades.length}
                                  </Text>
                                </View>
                              );
                            }
                          })()}
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={[styles.legendTitle, { color: colors.subtext }]}>
            Activity:
          </Text>
          <View style={styles.legendItems}>
            <View
              style={[styles.legendBox, { backgroundColor: colors.neutral }]}
            />
            <Text style={[styles.legendLabel, { color: colors.subtext }]}>
              None
            </Text>
            <View
              style={[
                styles.legendBox,
                { backgroundColor: colors.profitStart },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.subtext }]}>
              Wins
            </Text>
            <View
              style={[styles.legendBox, { backgroundColor: colors.lossStart }]}
            />
            <Text style={[styles.legendLabel, { color: colors.subtext }]}>
              Losses
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  navButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  navIcon: {
    fontSize: 20,
    color: "#f5f5f5",
    fontWeight: "700",
  },
  todayButton: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  todayText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0d0d0d",
  },
  tooltip: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.2)",
  },
  tooltipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  tooltipDate: {
    fontSize: 14,
    fontWeight: "700",
  },
  tooltipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tooltipPnl: {
    fontSize: 12,
    fontWeight: "700",
  },
  tooltipTrades: {
    fontSize: 12,
  },
  calendar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "flex-start",
  },
  dayHeaderRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
    marginBottom: 4,
  },
  calendarGrid: {
    flexDirection: "column",
    gap: 4,
    justifyContent: "flex-start",
    width: "100%",
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tooltipAbsolute: {
    position: "absolute",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.2)",
    zIndex: 20,
  },
  dayLabel: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  dayCell: {
    width: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 38,
  },
  dayContent: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tradeDot: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#00d4d4",
    justifyContent: "center",
    alignItems: "center",
  },
  tradeDotText: {
    color: "#0d0d0d",
    fontSize: 9,
    fontWeight: "700",
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: "600",
  },
  legendItems: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 11,
    marginRight: 8,
  },
});
