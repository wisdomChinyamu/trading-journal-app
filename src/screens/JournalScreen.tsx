import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  Alert,
} from "react-native";
import {
  deleteTrade as deleteTradeService,
  updateAccount,
  getUserAccounts,
} from "../services/firebaseService";
import ConfirmModal from "../components/ConfirmModal";
import AccountDropdown from "../components/AccountDropdown";
import { deleteTradeImage } from "../services/supabaseImageService";
import { useToast } from "../context/ToastContext";
import { useAppContext } from "../hooks/useAppContext";

export default function JournalScreen({ navigation }: any) {
  const { state, dispatch } = useAppContext();
  const toast = useToast();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<any>(null);
  const [showFab, setShowFab] = useState(true);
  const scrollRef = useRef<any>(null);
  const [filterPair, setFilterPair] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "grade" | "rr">("date");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [accountModalVisible, setAccountModalVisible] =
    useState<boolean>(false);

  const filteredTrades = (state.trades || [])
    .filter((trade) => {
      if (
        filterPair &&
        !trade.pair.toUpperCase().includes(filterPair.toUpperCase())
      )
        return false;
      if (filterResult && trade.result !== filterResult) return false;
      if (
        selectedAccountId &&
        selectedAccountId !== "all" &&
        String(trade.accountId || "") !== String(selectedAccountId)
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === "grade") {
        const gradeOrder = { "A+": 5, A: 4, B: 3, C: 2, D: 1 };
        return gradeOrder[b.grade] - gradeOrder[a.grade];
      } else {
        return b.riskToReward - a.riskToReward;
      }
    });

  const baseForStats =
    selectedAccountId && selectedAccountId !== "all"
      ? (state.trades || []).filter(
          (t) => String(t.accountId || "") === String(selectedAccountId)
        )
      : state.trades || [];

  const stats = {
    // Stats reflect currently selected account (not search filters)
    total: baseForStats.length,
    wins: baseForStats.filter((t) => t.result === "Win").length,
    losses: baseForStats.filter((t) => t.result === "Loss").length,
    winRate: (() => {
      return baseForStats.length > 0
        ? (
            (baseForStats.filter((t) => t.result === "Win").length /
              baseForStats.length) *
            100
          ).toFixed(1)
        : "0";
    })(),
  };

  const renderTradeCard = ({ item }: any) => {
    const resultColor =
      item.result === "Win"
        ? "#4caf50"
        : item.result === "Loss"
        ? "#f44336"
        : "#ffa500";

    return (
      <TouchableOpacity
        style={styles.tradeCard}
        onPress={() =>
          navigation.navigate("Journal", {
            screen: "TradeDetail",
            params: { trade: item },
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <View style={styles.pairContainer}>
              <Text style={styles.pair}>{item.pair}</Text>
              <View
                style={[
                  styles.directionBadge,
                  {
                    backgroundColor:
                      item.direction === "Buy" ? "#4caf5020" : "#f4433620",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.directionText,
                    {
                      color: item.direction === "Buy" ? "#4caf50" : "#f44336",
                    },
                  ]}
                >
                  {item.direction === "Buy" ? "↑" : "↓"} {item.direction}
                </Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Session</Text>
                <Text style={styles.detailValue}>{item.session}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>R:R</Text>
                <Text style={[styles.detailValue, { color: "#00d4d4" }]}>
                  1:{item.riskToReward.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Grade</Text>
                <View
                  style={[
                    styles.gradeBadge,
                    {
                      backgroundColor: item.grade.startsWith("A")
                        ? "#4caf5020"
                        : item.grade === "B"
                        ? "#00d4d420"
                        : "#f4433620",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.gradeText,
                      {
                        color: item.grade.startsWith("A")
                          ? "#4caf50"
                          : item.grade === "B"
                          ? "#00d4d4"
                          : "#f44336",
                      },
                    ]}
                  >
                    {item.grade}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.dateText}>
              {parseToDate(
                (item as any).tradeTime || (item as any).createdAt
              ).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          <View style={styles.cardRight}>
            <View
              style={[styles.resultBadge, { backgroundColor: resultColor }]}
            >
              <Text style={styles.resultText}>{item.result || "Pending"}</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
            <TouchableOpacity
              style={styles.cardDelete}
              onPress={() => {
                setTradeToDelete(item);
                setConfirmVisible(true);
              }}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {item.emotionalRating && (
          <View style={styles.emotionBar}>
            <Text style={styles.emotionLabel}>Emotion:</Text>
            <View style={styles.emotionDots}>
              {[...Array(10)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.emotionDot,
                    {
                      backgroundColor:
                        i < item.emotionalRating ? "#ffa500" : "#2a2a2a",
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.emotionValue}>{item.emotionalRating}/10</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const parseToDate = (v: any) => {
    if (!v) return new Date();
    if (typeof v === "string") return new Date(v);
    if (v instanceof Date) return v;
    if (v?.toDate && typeof v.toDate === "function") return v.toDate();
    try {
      return new Date(v);
    } catch (e) {
      return new Date();
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      onScroll={(e) => {
        try {
          const { contentOffset, layoutMeasurement, contentSize } =
            e.nativeEvent;
          const distanceFromBottom =
            contentSize.height - (contentOffset.y + layoutMeasurement.height);
          setShowFab(!(distanceFromBottom <= 120));
        } catch (err) {}
      }}
      scrollEventThrottle={16}
    >
      {/* Header with Stats */}
      <View style={styles.header}></View>

      {/* Search and Filter */}

      <AccountDropdown
        accounts={state.accounts || []}
        selectedAccountId={selectedAccountId}
        onSelect={(id) => setSelectedAccountId(id)}
        onAddAccount={() =>
          navigation.navigate("Settings", {
            screen: "Accounts",
            params: { origin: "Journal" },
          })
        }
      />
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#4caf50" }]}>
            {stats.wins}
          </Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#f44336" }]}>
            {stats.losses}
          </Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#00d4d4" }]}>
            {stats.winRate}%
          </Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
      </View>
      {/* </View> */}

      {/* Search and Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by pair (e.g., GBPUSD, EURUSD)..."
            placeholderTextColor="#666"
            value={filterPair}
            onChangeText={setFilterPair}
          />
          {filterPair.length > 0 && (
            <TouchableOpacity onPress={() => setFilterPair("")}>
              <Text style={styles.clearIcon}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
        >
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Result:</Text>
            {["All", "Win", "Loss", "Break-even"].map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.filterChip,
                  filterResult === (r === "All" ? "" : r) &&
                    styles.filterChipActive,
                ]}
                onPress={() => setFilterResult(r === "All" ? "" : r)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterResult === (r === "All" ? "" : r) &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Sort:</Text>
            {[
              { label: "Date", value: "date" },
              { label: "Grade", value: "grade" },
              { label: "R:R", value: "rr" },
            ].map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.filterChip,
                  sortBy === s.value && styles.filterChipActive,
                ]}
                onPress={() => setSortBy(s.value as any)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    sortBy === s.value && styles.filterChipTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Trade List */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {filteredTrades.length}{" "}
          {filteredTrades.length === 1 ? "Trade" : "Trades"}
        </Text>
      </View>

      {filteredTrades.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📊</Text>
          <Text style={styles.emptyStateTitle}>No trades found</Text>
          <Text style={styles.emptyStateText}>
            {filterPair || filterResult
              ? "Try adjusting your filters"
              : "Start by adding your first trade"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrades}
          keyExtractor={(item) => item.id}
          renderItem={renderTradeCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          nestedScrollEnabled={true}
        />
      )}

      {/* Floating Add Trade button for Journal */}
      {showFab && (
        <TouchableOpacity
          style={styles.journalFab}
          onPress={() =>
            navigation.navigate("Dashboard", { screen: "AddTrade" })
          }
        >
          <Text style={styles.journalFabIcon}>＋</Text>
        </TouchableOpacity>
      )}
      {/* Account modal replaced by AccountDropdown */}
      <ConfirmModal
        visible={confirmVisible}
        title="Delete Trade"
        message="Are you sure you want to delete this trade? This action cannot be undone."
        onCancel={() => {
          setConfirmVisible(false);
          setTradeToDelete(null);
        }}
        onConfirm={async () => {
          setConfirmVisible(false);
          const item = tradeToDelete;
          setTradeToDelete(null);
          if (!item) return;
          try {
            if (!item?.id) throw new Error("Trade id missing");

            // Best-effort delete images
            try {
              if (item.screenshots && Array.isArray(item.screenshots)) {
                for (const s of item.screenshots) {
                  const uri =
                    typeof s === "string" ? s : s?.uri || s?.url || "";
                  if (uri) {
                    try {
                      await deleteTradeImage(uri);
                    } catch (e) {}
                  }
                }
              }
            } catch (e) {}

            // compute pnl locally (prefer actualExit)
            const computePnl = (t: any) => {
              try {
                if (t?.pnl !== undefined && t?.pnl !== null)
                  return Number(t.pnl) || 0;
                const risk = Math.abs(Number(t?.riskAmount) || 0);
                const entry = Number(t?.entryPrice);
                const sl = Number(t?.stopLoss);
                const ax =
                  t?.actualExit !== undefined && t?.actualExit !== null
                    ? Number(t.actualExit)
                    : null;
                const stopDistance = Math.abs(entry - sl);
                if (ax !== null && !isNaN(ax) && stopDistance > 0) {
                  const exitDistance = Math.abs(ax - entry);
                  let sign = 0;
                  if (t.direction === "Buy")
                    sign = ax > entry ? 1 : ax < entry ? -1 : 0;
                  else sign = ax < entry ? 1 : ax > entry ? -1 : 0;
                  const pnl = sign * (exitDistance / stopDistance) * risk;
                  return Math.round(pnl * 100) / 100;
                }
                const rr = Number(t?.riskToReward) || 1;
                if (t?.result === "Win")
                  return Math.round(risk * rr * 100) / 100;
                if (t?.result === "Loss") return Math.round(-risk * 100) / 100;
                return 0;
              } catch (e) {
                return 0;
              }
            };

            const pnl = computePnl(item);

            // optimistic UI: remove locally first
            try {
              dispatch && dispatch({ type: "DELETE_TRADE", payload: item.id });
            } catch (e) {}
            await deleteTradeService(item.id);

            // revert account balance
            try {
              const accountId = item.accountId;
              if (accountId) {
                const currentAccounts = await getUserAccounts(
                  (state.user && state.user.uid) || ""
                );
                const acc =
                  currentAccounts.find((a) => a.id === accountId) ||
                  (state.accounts &&
                    state.accounts.find((a) => a.id === accountId));
                if (acc) {
                  const newBalance =
                    Number(acc.currentBalance || 0) - Number(pnl || 0);
                  await updateAccount(accountId, {
                    currentBalance: newBalance,
                  });
                  const refreshed = await getUserAccounts(
                    (state.user && state.user.uid) || ""
                  );
                  try {
                    dispatch &&
                      dispatch({ type: "SET_ACCOUNTS", payload: refreshed });
                  } catch (e) {}
                }
              }
            } catch (e) {}

            try {
              toast.show("Trade deleted", "success");
            } catch (e) {}

            try {
              navigation.navigate("JournalMain");
            } catch (e) {}
          } catch (err) {
            console.error("Failed to delete trade", err);
            try {
              toast.show("Failed to delete trade", "error");
            } catch (e) {}
            Alert.alert("Error", "Failed to delete trade");
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  journalFab: {
    position: "absolute",
    right: 20,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#00d4d4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 60,
  },
  journalFabIcon: {
    fontSize: 26,
    color: "#0d0d0d",
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  title: {
    color: "#f5f5f5",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.1)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#f5f5f5",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(0, 212, 212, 0.15)",
    marginHorizontal: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 212, 0.1)",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#00d4d4",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#f5f5f5",
    fontSize: 15,
    paddingVertical: 12,
  },
  clearIcon: {
    color: "#00d4d4",
    fontSize: 24,
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  filterRow: {
    flexDirection: "row",
  },
  filterGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  filterGroupLabel: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: "#00d4d4",
    borderColor: "#00d4d4",
  },
  filterChipText: {
    color: "#f5f5f5",
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#0d0d0d",
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listHeaderText: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  tradeCard: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.15)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  pairContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  pair: {
    color: "#f5f5f5",
    fontSize: 18,
    fontWeight: "700",
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  directionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#f5f5f5",
    fontSize: 14,
    fontWeight: "600",
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  gradeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  dateText: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  resultText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  arrowIcon: {
    color: "#00d4d4",
    fontSize: 20,
    fontWeight: "700",
  },
  cardDelete: {
    marginTop: 8,
    padding: 6,
  },
  deleteIcon: {
    fontSize: 18,
    color: "#f44336",
  },
  emotionBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 212, 212, 0.1)",
  },
  emotionLabel: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
  },
  emotionDots: {
    flexDirection: "row",
    gap: 3,
    flex: 1,
  },
  emotionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emotionValue: {
    color: "#ffa500",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    color: "#f5f5f5",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyStateText: {
    color: "#aaa",
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
