import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Platform, Animated } from 'react-native';
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
  // monthIndex allows navigation between months (0-11 for months in a given year)
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [yearIdx, setYearIdx] = useState(now.getFullYear());
  const year = yearIdx;
  const month = monthIndex;

  // Track animated scale values for each day cell
  const scaleAnimations = useRef<Record<string, Animated.Value>>({}).current;

  // Responsive layout based on window dimensions
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const isTablet = windowWidth >= breakpoints.tablet;
  const isDesktop = windowWidth >= breakpoints.desktop;

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const grouped: Record<string, Trade[]> = {};
    trades.forEach((trade) => {
      const dateKey = trade.createdAt.toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(trade);
    });
    return grouped;
  }, [trades]);

  // Helper: blend two hex colors by factor t (0..1)
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

  // Calculate day color based on trades (scaled by magnitude)
  const getDayColor = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTrades = tradesByDate[dateKey] || [];

    if (dayTrades.length === 0) return colors.neutral;

    // Use a simple PnL metric: wins - losses, magnitude by number of trades
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
      toValue: 0.95,
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

  // Responsive width calculation for day cells
  const getResponsiveCellWidth = (): any => {
    if (isDesktop) {
      return { flex: 0, width: '12%', minWidth: 60 };
    }
    if (isTablet) {
      return { flex: 0, width: '13%', minWidth: 48 };
    }
    return { flex: 0, width: '14.28%', minWidth: 40 };
  };

  // Responsive width calculation for day labels
  const getResponsiveLabelWidth = (): any => {
    if (isDesktop) {
      return { flex: 0, width: '12%', minWidth: 60 };
    }
    if (isTablet) {
      return { flex: 0, width: '13%', minWidth: 48 };
    }
    return { flex: 0, width: '14.28%', minWidth: 40 };
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        {new Date(year, month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
      </Text>

      {tooltip && Platform.OS === 'web' && (
        <View style={[styles.tooltip, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.tooltipText, { color: colors.text }]}>{tooltip.date}</Text>
          <Text style={[styles.tooltipText, { color: colors.subtext }]}>
            {tooltip.count} trade(s) • PnL: {tooltip.pnl}
          </Text>
        </View>
      )}

      <View style={styles.calendar}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Text key={day} style={[styles.dayLabel, { color: colors.subtext }, getResponsiveLabelWidth()]}>
            {day}
          </Text>
        ))}

        {weeks.map((week, weekIdx) =>
          week.map((day, dayIdx) => {
            const dayKey = `${weekIdx}-${dayIdx}`;
            const scaleValue = getScaleAnimatedValue(dayKey);
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
                  // web: allow tab focus when day exists
                  // @ts-ignore
                  tabIndex={day ? 0 : -1}
                  // keyboard activation for web/desktop (Enter / Space)
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
                      opacity: pressed ? 0.85 : 1,
                      borderWidth: focusedDay === day ? 2 : 0,
                      borderColor: focusedDay === day ? colors.highlight : 'transparent',
                    },
                  ]}
                  onPress={() => day && onDayPress?.(new Date(year, month, day))}
                  // onMouseEnter / onMouseLeave are web-only; TypeScript defs don't include them for Pressable
                  // @ts-ignore
                  onMouseEnter={() => day && handleMouseEnter(day)}
                  // @ts-ignore
                  onMouseLeave={() => day && handleMouseLeave()}
                  disabled={!day}
                >
                  {day && <Text style={[styles.dayText, { color: colors.text }]}>{day}</Text>}
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  calendar: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  tooltip: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
    elevation: 4,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  dayCell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
});
