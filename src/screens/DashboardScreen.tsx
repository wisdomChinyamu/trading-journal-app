import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { useAppContext } from "../hooks/useAppContext";
import CalendarHeatmap from "../components/CalendarHeatmap";
import StatBox from "../components/StatBox";
import Card from "../components/Card";
import AddTradeForm from "../components/AddTradeForm";
import TradeCard from "../components/TradeCard";
import { calculateWinLossRatio, calculatePnL } from "../utils/chartingUtils";
import ScreenLayout from "../components/ScreenLayout";
import { useTheme } from "../components/ThemeProvider";
import EquityChart from "../components/EquityChart";
import WeeklySummaryPanel from "../components/WeeklySummaryPanel";

export default function DashboardScreen() {
  const { state } = useAppContext();
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { colors, mode } = useTheme();

  const trades = state.trades || [];
  // Build equity series: cumulative PnL by trade date
  const equitySeries = React.useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const sorted = [...trades].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let acc = 0;
    return sorted.map((t) => {
      // Use explicit pnl if available; otherwise use simple +1/-1 per result
      const delta =
        (t as any).pnl ??
        (t.result === "Win" ? 1 : t.result === "Loss" ? -1 : 0);
      acc += delta;
      return {
        date: new Date(t.createdAt).toISOString().split("T")[0],
        value: acc,
      };
    });
  }, [trades]);
  const winLossRatio = calculateWinLossRatio(trades);
  const pnlStats = calculatePnL(trades);

  const todayEmotionalRating = state.psychologyLogs?.[0]?.emotionalState || 0;
  const avgConfluenceScore =
    trades.length > 0
      ? (
          trades.reduce((sum, t) => sum + t.confluenceScore, 0) / trades.length
        ).toFixed(1)
      : "0";

  // Responsive layout: web/desktop side-by-side, mobile stacked
  const isWeb = Platform.OS === "web";
  return (
    <ScreenLayout style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Caprianne Trdz
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Trading Dashboard
          </Text>
        </View>

        {/* Quick Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
        >
          <StatBox
            label="Win Rate"
            value={`${winLossRatio.wins}/${winLossRatio.losses}`}
          />
          <StatBox
            label="Total P&L"
            value={pnlStats.totalPnL}
            unit="$"
            color={pnlStats.totalPnL > 0 ? colors.profitEnd : colors.lossEnd}
          />
          <StatBox
            label="Avg P&L"
            value={pnlStats.avgPnL}
            unit="$"
            color="#00d4d4"
          />
          <StatBox label="Emotion" value={todayEmotionalRating} unit="/10" />
        </ScrollView>

        {/* Equity + Calendar + Weekly Summary */}
        <View style={isWeb ? styles.row : undefined}>
          <View style={isWeb ? styles.leftCol : undefined}>
            <Card>
              <EquityChart series={equitySeries} />
            </Card>
            <Card>
              <CalendarHeatmap
                trades={trades}
                onDayPress={(date) => setSelectedDate(date)}
                theme={mode}
              />
            </Card>
          </View>
          <View style={isWeb ? styles.rightCol : undefined}>
            <Card>
              {/* Weekly Summary Panel */}
              <WeeklySummaryPanel trades={trades} />
            </Card>
          </View>
        </View>
        {/* On mobile, show WeeklySummaryPanel below calendar */}
        {!isWeb && (
          <Card>
            <WeeklySummaryPanel trades={trades} />
          </Card>
        )}

        {/* Trade Distribution */}
        <Card>
          <Text style={styles.cardTitle}>Grade Distribution</Text>
          <View style={styles.gradeRow}>
            {(["A+", "A", "B", "C", "D"] as const).map((grade) => {
              const count = trades.filter((t) => t.grade === grade).length;
              return (
                <View key={grade} style={styles.gradeBox}>
                  <Text style={styles.gradeLabel}>{grade}</Text>
                  <Text style={styles.gradeValue}>{count}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Confluence Score */}
        <Card>
          <View style={styles.confluenceHeader}>
            <Text style={styles.cardTitle}>Avg Confluence Score</Text>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{avgConfluenceScore}</Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.addTradeButton]}
            onPress={() => setShowAddTrade(true)}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              + Add Trade
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.journalButton]}>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              📔 Journal
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add Trade Modal */}
      <Modal
        visible={showAddTrade}
        animationType="none"
        onRequestClose={() => setShowAddTrade(false)}
      >
        {/** Animated container for modal entrance */}
        <AddTradeModalAnimated
          visible={showAddTrade}
          onClose={() => setShowAddTrade(false)}
          onSubmit={(trade: any) => {
            console.log("Trade submitted:", trade);
            setShowAddTrade(false);
          }}
        />
      </Modal>

      {/* Day Trades Modal */}
      <Modal
        visible={!!selectedDate}
        animationType="none"
        onRequestClose={() => setSelectedDate(null)}
      >
        <DayTradesModalAnimated
          visible={!!selectedDate}
          date={selectedDate}
          trades={trades}
          onClose={() => setSelectedDate(null)}
        />
      </Modal>
    </ScreenLayout>
  );
}

function AddTradeModalAnimated({ visible, onClose, onSubmit }: any) {
  const anim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      anim.setValue(0);
    }
  }, [visible]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });
  const opacity = anim;

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <Card>
        <AddTradeForm onSubmit={onSubmit} onClose={onClose} />
      </Card>
    </Animated.View>
  );
}

function DayTradesModalAnimated({ visible, date, trades, onClose }: any) {
  const anim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      anim.setValue(0);
    }
  }, [visible]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });
  const opacity = anim;

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <Card>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
            {date ? new Date(date).toLocaleDateString() : ""}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: colors.highlight, fontWeight: "700" }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 520 }}
        >
          {(() => {
            if (!date) return null;
            const dateKey = new Date(date).toISOString().split("T")[0];
            const tradesOnDate = trades.filter(
              (t: any) =>
                new Date(t.createdAt).toISOString().split("T")[0] === dateKey
            );

            if (tradesOnDate.length === 0) {
              return (
                <View style={{ padding: 16, alignItems: "center" }}>
                  <Text style={{ color: colors.subtext }}>
                    No trades for this day.
                  </Text>
                </View>
              );
            }

            return tradesOnDate.map((t: any) => (
              <TradeCard key={t.id} trade={t} />
            ));
          })()}
        </ScrollView>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },
  leftCol: {
    flex: 2,
    minWidth: 0,
  },
  rightCol: {
    flex: 1,
    minWidth: 180,
    maxWidth: 260,
  },
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: "#f5f5f5",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#00d4d4",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  cardLabel: {
    color: "#00d4d4",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardValue: {
    color: "#f5f5f5",
    fontSize: 24,
    fontWeight: "700",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  header: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
  },
  statsContainer: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  gradeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gradeBox: {
    alignItems: "center",
    padding: 12,
    flex: 1,
  },
  gradeLabel: {
    color: "#00d4d4",
    fontWeight: "700",
    marginBottom: 6,
  },
  gradeValue: {
    color: "#f5f5f5",
    fontSize: 18,
    fontWeight: "700",
  },
  confluenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00d4d4",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreValue: {
    color: "#000",
    fontWeight: "700",
  },
  actionButtons: {
    marginTop: 12,
  },
  addTradeButton: {
    marginBottom: 8,
  },
  journalButton: {
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#00d4d4",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#f5f5f5",
    fontSize: 14,
    fontWeight: "600",
  },
});
