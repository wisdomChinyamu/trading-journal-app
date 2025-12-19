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
  Alert,
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
import {
  calculateRiskToReward,
  calculateConfluenceScore,
  assignGrade,
} from "../utils/calculations";
import { Trade, TradeDirection, TradeSession, Strategy } from "../types";
import { getUserStrategies, addTrade } from "../services/firebaseService";

// Shared date parsing helper (handles Firestore Timestamp, number, string, Date)
const parseDate = (value: any): Date | null => {
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

interface AddTradeScreenProps {
  navigation: any;
  route?: any;
}

export default function DashboardScreen() {
  const { state, dispatch } = useAppContext();
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { colors, mode } = useTheme();

  

  const trades = state.trades || [];
  const equitySeries = React.useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const withDates = trades
      .map((t) => ({ t, date: parseDate((t as any).createdAt) }))
      .filter((x) => x.date !== null) as { t: Trade; date: Date }[];

    if (withDates.length === 0) return [];

    const sorted = [...withDates].sort((a, b) => a.date.getTime() - b.date.getTime());
    let acc = 0;
    return sorted.map(({ t, date }) => {
      const delta =
        (t as any).pnl ??
        (t.result === "Win" ? 1 : t.result === "Loss" ? -1 : 0);
      acc += delta;
      return {
        date: date.toISOString().split("T")[0],
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

  const isWeb = Platform.OS === "web";
  
  return (
    <ScreenLayout style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Enhanced Header with Gradient Accent */}
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <Text style={[styles.title, { color: colors.text }]}>
              Caprianne Trdz
            </Text>
            <View style={styles.accentLine} />
          </View>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Trading Performance Dashboard
          </Text>
        </View>

        {/* Enhanced Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIcon, { backgroundColor: '#00d4d420' }]}>
                <Text style={styles.statIconText}>📊</Text>
              </View>
            </View>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Win Rate</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {winLossRatio.wins}/{winLossRatio.losses}
            </Text>
            <View style={styles.statBar}>
              <View 
                style={[
                  styles.statBarFill, 
                  { 
                    width: `${(winLossRatio.wins / (winLossRatio.wins + winLossRatio.losses) * 100)}%`,
                    backgroundColor: colors.profitEnd 
                  }
                ]} 
              />
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIcon, { backgroundColor: pnlStats.totalPnL > 0 ? '#4caf5020' : '#f4433620' }]}>
                <Text style={styles.statIconText}>{pnlStats.totalPnL > 0 ? '📈' : '📉'}</Text>
              </View>
            </View>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Total P&L</Text>
            <Text style={[styles.statValue, { color: pnlStats.totalPnL > 0 ? colors.profitEnd : colors.lossEnd }]}>
              ${pnlStats.totalPnL}
            </Text>
            <Text style={[styles.statSubtext, { color: colors.subtext }]}>
              Avg: ${pnlStats.avgPnL}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIcon, { backgroundColor: '#00d4d420' }]}>
                <Text style={styles.statIconText}>🎯</Text>
              </View>
            </View>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Confluence</Text>
            <Text style={[styles.statValue, { color: colors.highlight }]}>
              {avgConfluenceScore}
            </Text>
            <Text style={[styles.statSubtext, { color: colors.subtext }]}>
              Average Score
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIcon, { backgroundColor: '#ffa50020' }]}>
                <Text style={styles.statIconText}>🧠</Text>
              </View>
            </View>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Emotion</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {todayEmotionalRating}/10
            </Text>
            <View style={styles.emotionIndicator}>
              {[...Array(10)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.emotionDot,
                    { backgroundColor: i < todayEmotionalRating ? '#ffa500' : colors.neutral }
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Main Content Layout */}
        <View style={isWeb ? styles.row : undefined}>
          <View style={isWeb ? styles.leftCol : undefined}>
            {/* Enhanced Equity Chart Card */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Equity Curve</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{trades.length} Trades</Text>
                </View>
              </View>
              <EquityChart series={equitySeries} />
            </View>

            {/* Enhanced Calendar Card */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Trading Calendar</Text>
                <Text style={[styles.cardSubtitle, { color: colors.subtext }]}>
                  Tap a day to view trades
                </Text>
              </View>
              <CalendarHeatmap
                trades={trades}
                onDayPress={(date) => setSelectedDate(date)}
                theme={mode}
              />
            </View>

            {/* Enhanced Grade Distribution */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Grade Distribution</Text>
              </View>
              <View style={styles.gradeContainer}>
                {(["A+", "A", "B", "C", "D"] as const).map((grade) => {
                  const count = trades.filter((t) => t.grade === grade).length;
                  const total = trades.length || 1;
                  const percentage = (count / total) * 100;
                  
                  return (
                    <View key={grade} style={styles.gradeItem}>
                      <View style={styles.gradeHeader}>
                        <Text style={[styles.gradeLabel, { color: colors.text }]}>{grade}</Text>
                        <Text style={[styles.gradeCount, { color: colors.subtext }]}>{count}</Text>
                      </View>
                      <View style={[styles.gradeBar, { backgroundColor: colors.neutral }]}>
                        <View 
                          style={[
                            styles.gradeBarFill,
                            { 
                              width: `${percentage}%`,
                              backgroundColor: grade.startsWith('A') ? colors.profitEnd : 
                                             grade === 'B' ? colors.highlight :
                                             colors.lossEnd
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.gradePercentage, { color: colors.subtext }]}>
                        {percentage.toFixed(0)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={isWeb ? styles.rightCol : undefined}>
            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
              <WeeklySummaryPanel trades={trades} />
            </View>
          </View>
        </View>

        {!isWeb && (
          <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
            <WeeklySummaryPanel trades={trades} />
          </View>
        )}

        {/* Enhanced Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => setShowAddTrade(true)}
          >
            <Text style={styles.actionButtonIcon}>+</Text>
            <Text style={styles.actionButtonText}>Add Trade</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <Text style={styles.actionButtonIcon}>📝</Text>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Open Journal
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showAddTrade}
        animationType="none"
        onRequestClose={() => setShowAddTrade(false)}
      >
        <AddTradeModalAnimated
          visible={showAddTrade}
          onClose={() => setShowAddTrade(false)}
          onSubmit={async (trade: any) => {
            try {
              // Get user ID from context
              const userId = state.user?.uid;
              
              if (!userId) {
                throw new Error("User not authenticated");
              }

              // Save trade to Firebase
              const tradeId = await addTrade(userId, trade);
              
              // Dispatch ADD_TRADE action to update context
              dispatch({ 
                type: 'ADD_TRADE', 
                payload: { ...trade, id: tradeId, userId } 
              });
              
              setShowAddTrade(false);
              Alert.alert("Success", "Trade recorded successfully");
            } catch (error) {
              console.error("Error saving trade:", error);
              Alert.alert("Error", "Failed to save trade. Please try again.");
            }
          }}
        />
      </Modal>

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
  const { state } = useAppContext(); // Get access to app context
  const [selectedAccountId, setSelectedAccountId] = useState<string>(''); // State for selected account
  const [strategies, setStrategies] = useState<Strategy[]>([]); // State for strategies
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null); // State for selected strategy
  const [checklistItems, setChecklistItems] = useState<any[]>([]); // State for checklist items
  const [selectedChecklistItems, setSelectedChecklistItems] = useState<string[]>([]); // State for selected checklist items
  const [confluenceScore, setConfluenceScore] = useState<number | null>(null); // State for confluence score

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
    
    // Set default account when accounts are available
    if (state.accounts && state.accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(state.accounts[0].id);
    }
    
    // Load user strategies
    const loadStrategies = async () => {
      if (state.user?.uid) {
        try {
          const userStrategies = await getUserStrategies(state.user.uid);
          setStrategies(userStrategies);
        } catch (error) {
          console.error("Error loading strategies:", error);
        }
      }
    };
    
    loadStrategies();
  }, [visible, state.accounts, state.user?.uid]);

  // Update checklist items when strategy changes
  useEffect(() => {
    if (selectedStrategyId) {
      const strategy = strategies.find((s) => s.id === selectedStrategyId);
      setChecklistItems(strategy?.checklist || []);
    } else {
      setChecklistItems([]);
    }
    setSelectedChecklistItems([]);
    setConfluenceScore(null);
  }, [selectedStrategyId, strategies]);
  
  // Update confluence score when selected checklist items change
  useEffect(() => {
    if (selectedChecklistItems.length > 0 && checklistItems.length > 0) {
      // Create a map of item IDs to their weights
      const itemWeights = new Map<string, number>();
      checklistItems.forEach(item => {
        itemWeights.set(item.id, item.weight);
      });
      
      // Calculate confluence score using the proper formula
      const score = calculateConfluenceScore(selectedChecklistItems, itemWeights);
      setConfluenceScore(parseFloat(score.toFixed(2)));
    } else {
      setConfluenceScore(null);
    }
  }, [selectedChecklistItems, checklistItems]);
  
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });
  const opacity = anim;

  // Handle account selection
  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId);
  };
  
  // Handle strategy selection
  const handleStrategySelect = (strategyId: string) => {
    setSelectedStrategyId(strategyId);
  };
  
  // Handle checklist item toggle
  const handleChecklistItemToggle = (itemId: string) => {
    setSelectedChecklistItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Enhanced submit handler that includes account info
  const handleSubmitWithAccount = (tradeData: any) => {
    // Add accountId to trade data
    const tradeWithAccount = {
      ...tradeData,
      accountId: selectedAccountId || undefined,
      strategyId: selectedStrategyId || undefined,
      checklist: selectedChecklistItems,
      confluenceScore: confluenceScore || 0,
    };
    onSubmit(tradeWithAccount);
  };

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
        <AddTradeForm 
          onSubmit={handleSubmitWithAccount} 
          onClose={onClose} 
          accounts={state.accounts || []}
          selectedAccountId={selectedAccountId}
          onAccountSelect={handleAccountSelect}
          checklistItems={checklistItems}
          selectedChecklistItems={selectedChecklistItems}
          onChecklistItemToggle={handleChecklistItemToggle}
          strategies={strategies}
          selectedStrategyId={selectedStrategyId}
          onStrategySelect={handleStrategySelect}
          confluenceScore={confluenceScore}
        />
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
      <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {date ? new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            }) : ""}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: colors.highlight, fontSize: 24 }}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 520 }}
        >
          {(() => {
            if (!date) return null;
            const dateObj = parseDate(date);
            const dateKey = dateObj ? dateObj.toISOString().split("T")[0] : "";
            const tradesOnDate = trades.filter((t: any) => {
              const d = parseDate((t as any).createdAt);
              return d ? d.toISOString().split("T")[0] === dateKey : false;
            });

            if (tradesOnDate.length === 0) {
              return (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>📭</Text>
                  <Text style={[styles.emptyStateText, { color: colors.subtext }]}>
                    No trades recorded for this day
                  </Text>
                </View>
              );
            }

            return tradesOnDate.map((t: any) => (
              <TradeCard key={t.id} trade={t} />
            ));
          })()}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  leftCol: {
    flex: 2,
    minWidth: 0,
  },
  rightCol: {
    flex: 1,
    minWidth: 280,
    maxWidth: 360,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  headerGradient: {
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  accentLine: {
    height: 3,
    width: 60,
    backgroundColor: '#00d4d4',
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.1)',
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  statBar: {
    height: 4,
    backgroundColor: 'rgba(0, 212, 212, 0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  emotionIndicator: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 8,
  },
  emotionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.1)',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(0, 212, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeText: {
    color: '#00d4d4',
    fontSize: 11,
    fontWeight: '600',
  },
  gradeContainer: {
    gap: 16,
  },
  gradeItem: {
    gap: 8,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  gradeCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  gradeBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gradeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  gradePercentage: {
    fontSize: 12,
    textAlign: 'right',
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#00d4d4',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00d4d4',
  },
  actionButtonIcon: {
    fontSize: 20,
    color: '#0d0d0d',
    fontWeight: '700',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0d0d0d',
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 212, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
  },
});