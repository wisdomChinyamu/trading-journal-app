import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Platform, Animated, TouchableOpacity } from 'react-native';
import { Trade } from '../types';
import { useTheme } from './ThemeProvider';
import { breakpoints } from '../theme/theme';

interface CalendarHeatmapProps {
  trades: Trade[];
  onDayPress?: (date: Date) => void;
  theme?: 'dark' | 'light';
}

export default function CalendarHeatmap({ trades, onDayPress, theme = 'dark' }: CalendarHeatmapProps) {
  const { colors } = useTheme();
  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [yearIdx, setYearIdx] = useState(now.getFullYear());
  const year = yearIdx;
  const month = monthIndex;

  const scaleAnimations = useRef<Record<string, Animated.Value>>({}).current;

  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const isTablet = windowWidth >= breakpoints.tablet;
  const isDesktop = windowWidth >= breakpoints.desktop;

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const tradesByDate = useMemo(() => {
    const grouped: Record<string, Trade[]> = {};
    trades.forEach((trade) => {
      const dateKey = trade.createdAt.toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(trade);
    });
    return grouped;
  }, [trades]);

  const blendHex = (a: string, b: string, t: number) => {
    const hexToRgb = (h: string) => {
      const san = h.replace('#', '');
      const bigint = parseInt(san.length === 3 ? san.split('').map((c) => c + c).join('') : san, 16);
      return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    };
    const ra = hexToRgb(a);
    const rb = hexToRgb(b);
    const r = Math.round(ra.r + (rb.r - ra.r) * t);
    const g = Math.round(ra.g + (rb.g - ra.g) * t);
    const b2 = Math.round(ra.b + (rb.b - ra.b) * t);
    return `rgb(${r}, ${g}, ${b2})`;
  };

  const getDayColor = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTrades = tradesByDate[dateKey] || [];

    if (dayTrades.length === 0) return colors.neutral;

    const totalPnL = dayTrades.reduce((sum, t) => sum + (t.result === 'Win' ? 1 : t.result === 'Loss' ? -1 : 0), 0);

    const maxAbsPnL = Math.max(1, ...Object.keys(tradesByDate).map((k) => Math.abs(tradesByDate[k].reduce((s, t) => s + (t.result === 'Win' ? 1 : t.result === 'Loss' ? -1 : 0), 0))));
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

  const weeks: (number | null)[][] = Array.from({ length: Math.ceil(days.length / 7) }, (_, i) =>
    days.slice(i * 7, (i + 1) * 7)
  );

  const [tooltip, setTooltip] = useState<null | { date: string; count: number; pnl: number }>(null);
  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  const handleMouseEnter = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTrades = tradesByDate[dateKey] || [];
    const pnl = dayTrades.reduce((s, t) => s + (t.result === 'Win' ? 1 : -1), 0);
    setTooltip({ date: dateKey, count: dayTrades.length, pnl });
  };

  const handleMouseLeave = () => setTooltip(null);

  const handleFocus = (day: number) => {
    handleMouseEnter(day);
    setFocusedDay(day);
  };

  const handleBlur = () => {
    handleMouseLeave();
    setFocusedDay(null);
  };

  const getScaleAnimatedValue = (dayKey: string) => {
    if (!scaleAnimations[dayKey]) {
      scaleAnimations[dayKey] = new Animated.Value(1);
    }
    return scaleAnimations[dayKey];
  };

  const handleDayCellPressIn = (dayKey: string) => {
    const scaleValue = getScaleAnimatedValue(dayKey);
    Animated.spring(scaleValue, {
      toValue: 0.9,
      useNativeDriver: Platform.OS !== 'web',
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleDayCellPressOut = (dayKey: string) => {
    const scaleValue = getScaleAnimatedValue(dayKey);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      tension: 100,
      friction: 8,
    }).start();
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

  const getResponsiveCellWidth = (): any => {
    if (isDesktop) {
      return { flex: 0, width: '12%', minWidth: 50 };
    }
    if (isTablet) {
      return { flex: 0, width: '13%', minWidth: 45 };
    }
    return { flex: 0, width: '14.28%', minWidth: 38 };
  };

  const getResponsiveLabelWidth = (): any => {
    if (isDesktop) {
      return { flex: 0, width: '12%', minWidth: 50 };
    }
    if (isTablet) {
      return { flex: 0, width: '13%', minWidth: 45 };
    }
    return { flex: 0, width: '14.28%', minWidth: 38 };
  };

  return (
    <View style={styles.container}>
      {/* Header with Navigation */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.monthYear, { color: colors.text }]}>
            {new Date(year, month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {trades.filter(t => {
              const tradeMonth = new Date(t.createdAt).getMonth();
              const tradeYear = new Date(t.createdAt).getFullYear();
              return tradeMonth === month && tradeYear === year;
            }).length} trades this month
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

      {/* Tooltip */}
      {tooltip && (
        <View style={[styles.tooltip, { backgroundColor: colors.surface }]}> 
          <View style={styles.tooltipHeader}>
            <Text style={[styles.tooltipDate, { color: colors.text }]}>
              {new Date(tooltip.date).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
            </Text>
            <View style={[
              styles.tooltipBadge,
              { backgroundColor: tooltip.pnl > 0 ? '#4caf5020' : tooltip.pnl < 0 ? '#f4433620' : '#2a2a2a' }
            ]}>
              <Text style={[
                styles.tooltipPnl,
                { color: tooltip.pnl > 0 ? colors.profitEnd : tooltip.pnl < 0 ? colors.lossEnd : colors.subtext }
              ]}>
                {tooltip.pnl > 0 ? '+' : ''}{tooltip.pnl}
              </Text>
            </View>
          </View>
          <Text style={[styles.tooltipTrades, { color: colors.subtext }]}>
            {tooltip.count} {tooltip.count === 1 ? 'trade' : 'trades'}
          </Text>
        </View>
      )}

      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {/* Day Headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <Text key={`${day}-${idx}`} style={[styles.dayLabel, { color: colors.subtext }, getResponsiveLabelWidth()]}>
            {day}
          </Text>
        ))}

        {/* Day Cells */}
        {weeks.map((week, weekIdx) =>
          week.map((day, dayIdx) => {
            const dayKey = `${weekIdx}-${dayIdx}`;
            const scaleValue = getScaleAnimatedValue(dayKey);
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            
            return (
              <Animated.View
                key={dayKey}
                style={[
                  getResponsiveCellWidth(),
                  {
                    transform: [{ scale: scaleValue }],
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
                    const k = e?.key || (e?.nativeEvent && e.nativeEvent.key);
                    if (k === 'Enter' || k === ' ') onDayPress?.(new Date(year, month, day));
                  }}
                  onFocus={() => day && handleFocus(day)}
                  onBlur={() => day && handleBlur()}
                  onPressIn={() => day && handleDayCellPressIn(dayKey)}
                  onPressOut={() => day && handleDayCellPressOut(dayKey)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    {
                      backgroundColor: day ? getDayColor(day) : 'transparent',
                      opacity: pressed ? 0.8 : 1,
                      borderWidth: isToday ? 2 : focusedDay === day ? 2 : 1,
                      borderColor: isToday ? colors.highlight : focusedDay === day ? colors.highlight : 'rgba(255,255,255,0.1)',
                    },
                  ]}
                  onPress={() => day && onDayPress?.(new Date(year, month, day))}
                  // @ts-ignore
                  onMouseEnter={() => day && handleMouseEnter(day)}
                  // @ts-ignore
                  onMouseLeave={() => day && handleMouseLeave()}
                  disabled={!day}
                >
                  {day && (
                    <View style={styles.dayContent}>
                      <Text style={[styles.dayText, { color: colors.text }]}>{day}</Text>
                      {(() => {
                        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayTrades = tradesByDate[dateKey] || [];
                        if (dayTrades.length > 0) {
                          return (
                            <View style={styles.tradeDot}>
                              <Text style={styles.tradeDotText}>{dayTrades.length}</Text>
                            </View>
                          );
                        }
                      })()}
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendTitle, { color: colors.subtext }]}>Activity:</Text>
        <View style={styles.legendItems}>
          <View style={[styles.legendBox, { backgroundColor: colors.neutral }]} />
          <Text style={[styles.legendLabel, { color: colors.subtext }]}>None</Text>
          <View style={[styles.legendBox, { backgroundColor: colors.profitStart }]} />
          <Text style={[styles.legendLabel, { color: colors.subtext }]}>Wins</Text>
          <View style={[styles.legendBox, { backgroundColor: colors.lossStart }]} />
          <Text style={[styles.legendLabel, { color: colors.subtext }]}>Losses</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
    color: '#f5f5f5',
    fontWeight: '700',
  },
  todayButton: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0d0d0d',
  },
  tooltip: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.2)',
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  tooltipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tooltipPnl: {
    fontSize: 12,
    fontWeight: '700',
  },
  tooltipTrades: {
    fontSize: 12,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-start',
  },
  dayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dayCell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 38,
  },
  dayContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tradeDot: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00d4d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeDotText: {
    color: '#0d0d0d',
    fontSize: 9,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  legendItems: {
    flexDirection: 'row',
    alignItems: 'center',
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