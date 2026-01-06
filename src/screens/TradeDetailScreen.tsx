import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from "react-native";
import { useAppContext } from "../hooks/useAppContext";
import { useToast } from "../context/ToastContext";
import {
  deleteTrade as deleteTradeService,
  updateAccount,
  getUserAccounts,
} from "../services/firebaseService";
import { calculateEffectiveRR } from "../utils/calculations";
import { deleteTradeImage } from "../services/supabaseImageService";
import ConfirmModal from "../components/ConfirmModal";

export default function TradeDetailScreen({ route, navigation }: any) {
  const trade = route?.params?.trade;
  const { state, dispatch } = useAppContext();
  const toast = useToast();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState<string>("");
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (!trade) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Trade Not Found</Text>
        <Text style={styles.errorText}>
          The trade you're looking for doesn't exist.
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getResultColor = () => {
    if (trade.result === "Win") return "#4caf50";
    if (trade.result === "Loss") return "#f44336";
    return "#ffa500";
  };

  const displayedRR = (() => {
    try {
      if (
        trade &&
        trade.actualExit !== undefined &&
        trade.actualExit !== null
      ) {
        const eff = calculateEffectiveRR(
          Number(trade.entryPrice),
          Number(trade.stopLoss),
          Number(trade.takeProfit),
          trade.direction,
          Number(trade.actualExit)
        );
        return Number(eff || trade.riskToReward || 0);
      }
    } catch (e) {}
    return Number(trade.riskToReward || 0);
  })();

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "#4caf50";
    if (grade === "B") return "#00d4d4";
    if (grade === "C") return "#ffa500";
    return "#f44336";
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <View style={{ marginTop: 8, marginBottom: 6 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 8 }}
          >
            <Text style={{ color: "#00d4d4", fontWeight: "700" }}>← Back</Text>
          </TouchableOpacity>
        </View>
        {/* Hero Header */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.pair}>{trade.pair}</Text>
              <View style={styles.heroSubInfo}>
                <View
                  style={[
                    styles.directionBadge,
                    {
                      backgroundColor:
                        trade.direction === "Buy" ? "#4caf5020" : "#f4433620",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.directionText,
                      {
                        color:
                          trade.direction === "Buy" ? "#4caf50" : "#f44336",
                      },
                    ]}
                  >
                    {trade.direction === "Buy" ? "↑" : "↓"} {trade.direction}
                  </Text>
                </View>
                <View style={styles.sessionBadge}>
                  <Text style={styles.sessionIcon}>
                    {trade.session === "London"
                      ? "🇬🇧"
                      : trade.session === "NY"
                      ? "🇺🇸"
                      : "🌏"}
                  </Text>
                  <Text style={styles.sessionText}>{trade.session}</Text>
                </View>
              </View>
            </View>
            <View
              style={[
                styles.resultBadge,
                { backgroundColor: getResultColor() },
              ]}
            >
              <Text style={styles.resultText}>{trade.result || "Pending"}</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Risk:Reward</Text>
              <Text style={[styles.heroStatValue, { color: "#00d4d4" }]}>
                1:{displayedRR.toFixed(2)}
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Grade</Text>
              <Text
                style={[
                  styles.heroStatValue,
                  { color: getGradeColor(trade.grade) },
                ]}
              >
                {trade.grade}
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Confluence</Text>
              <Text style={[styles.heroStatValue, { color: "#ffa500" }]}>
                {trade.confluenceScore.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Trade Setup Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trade Setup</Text>
            <Text style={styles.sectionIcon}>📋</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Setup Type</Text>
              <Text style={styles.infoValue}>{trade.setupType || "N/A"}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {new Date(trade.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Price Levels */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Price Levels</Text>
            <Text style={styles.sectionIcon}>💹</Text>
          </View>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <View
                  style={[styles.priceIcon, { backgroundColor: "#00d4d420" }]}
                >
                  <Text style={styles.priceIconText}>📍</Text>
                </View>
                <View>
                  <Text style={styles.priceLabel}>Entry Price</Text>
                  <Text style={styles.priceValue}>
                    {trade.entryPrice.toFixed(5)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.priceDivider} />

            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <View
                  style={[styles.priceIcon, { backgroundColor: "#f4433620" }]}
                >
                  <Text style={styles.priceIconText}>🛑</Text>
                </View>
                <View>
                  <Text style={styles.priceLabel}>Stop Loss</Text>
                  <Text style={[styles.priceValue, { color: "#f44336" }]}>
                    {trade.stopLoss.toFixed(5)}
                  </Text>
                </View>
              </View>
              <View style={styles.pipsBadge}>
                <Text style={styles.pipsText}>
                  {Math.abs(trade.entryPrice - trade.stopLoss).toFixed(5)} pips
                </Text>
              </View>
            </View>

            <View style={styles.priceDivider} />

            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <View
                  style={[styles.priceIcon, { backgroundColor: "#4caf5020" }]}
                >
                  <Text style={styles.priceIconText}>🎯</Text>
                </View>
                <View>
                  <Text style={styles.priceLabel}>Take Profit</Text>
                  <Text style={[styles.priceValue, { color: "#4caf50" }]}>
                    {trade.takeProfit.toFixed(5)}
                  </Text>
                </View>
              </View>
              <View style={styles.pipsBadge}>
                <Text style={styles.pipsText}>
                  {Math.abs(trade.takeProfit - trade.entryPrice).toFixed(5)}{" "}
                  pips
                </Text>
              </View>
            </View>

            {trade.actualExit && (
              <>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <View style={styles.priceLeft}>
                    <View
                      style={[
                        styles.priceIcon,
                        { backgroundColor: "#ffa50020" },
                      ]}
                    >
                      <Text style={styles.priceIconText}>✓</Text>
                    </View>
                    <View>
                      <Text style={styles.priceLabel}>Actual Exit</Text>
                      <Text style={[styles.priceValue, { color: "#ffa500" }]}>
                        {trade.actualExit.toFixed(5)}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <Text style={styles.sectionIcon}>📊</Text>
          </View>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { borderColor: "#00d4d4" }]}>
              <Text style={styles.metricIcon}>🎯</Text>
              <Text style={styles.metricLabel}>R:R Ratio</Text>
              <Text style={[styles.metricValue, { color: "#00d4d4" }]}>
                1:{trade.riskToReward.toFixed(2)}
              </Text>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeText}>
                  {trade.riskToReward >= 3
                    ? "Excellent"
                    : trade.riskToReward >= 2
                    ? "Good"
                    : trade.riskToReward >= 1.5
                    ? "Fair"
                    : "Poor"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.metricCard,
                { borderColor: getGradeColor(trade.grade) },
              ]}
            >
              <Text style={styles.metricIcon}>📝</Text>
              <Text style={styles.metricLabel}>Trade Grade</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: getGradeColor(trade.grade) },
                ]}
              >
                {trade.grade}
              </Text>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeText}>
                  {trade.confluenceScore.toFixed(0)}% Confluence
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Psychology */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Psychology & Discipline</Text>
            <Text style={styles.sectionIcon}>🧠</Text>
          </View>
          <View style={styles.psychologyCard}>
            <View style={styles.emotionRow}>
              <Text style={styles.emotionLabel}>Emotional State</Text>
              <View style={styles.emotionRating}>
                <View style={styles.emotionDots}>
                  {[...Array(10)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.emotionDot,
                        {
                          backgroundColor:
                            i < trade.emotionalRating ? "#ffa500" : "#2a2a2a",
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.emotionValue}>
                  {trade.emotionalRating}/10
                </Text>
              </View>
            </View>

            <View style={styles.deviationRow}>
              <View style={styles.deviationLeft}>
                <View
                  style={[
                    styles.deviationIcon,
                    {
                      backgroundColor: trade.ruleDeviation
                        ? "#f4433620"
                        : "#4caf5020",
                    },
                  ]}
                >
                  <Text style={styles.deviationIconText}>
                    {trade.ruleDeviation ? "⚠️" : "✓"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.deviationLabel}>Rule Deviation</Text>
                  <Text
                    style={[
                      styles.deviationValue,
                      { color: trade.ruleDeviation ? "#f44336" : "#4caf50" },
                    ]}
                  >
                    {trade.ruleDeviation
                      ? "Yes - Rules broken"
                      : "No - Followed plan"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Notes */}
        {trade.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trade Notes</Text>
              <Text style={styles.sectionIcon}>📝</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{trade.notes}</Text>
            </View>
          </View>
        )}

        {/* Checklist Items */}
        {trade.checklist && trade.checklist.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Setup Checklist</Text>
              <View style={styles.checklistCounter}>
                <Text style={styles.checklistCounterText}>
                  {trade.checklist.length} items
                </Text>
              </View>
            </View>
            <View style={styles.checklistCard}>
              {trade.checklist.map((item: string, index: number) => (
                <View key={index} style={styles.checklistItem}>
                  <View style={styles.checklistIconContainer}>
                    <Text style={styles.checklistIcon}>✓</Text>
                  </View>
                  <Text style={styles.checklistText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Screenshots */}
        {trade.screenshots && trade.screenshots.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Chart Screenshots</Text>
              <Text style={styles.sectionIcon}>📸</Text>
            </View>
            <View style={styles.screenshotsCard}>
              {trade.screenshots.map((screenshot: any, index: number) => {
                const uri =
                  typeof screenshot === "string"
                    ? screenshot
                    : screenshot?.uri || screenshot?.url || "";
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.screenshotImageWrapper}
                    onPress={() => {
                      if (uri) {
                        setViewerUri(uri);
                        setViewerVisible(true);
                      }
                    }}
                  >
                    {uri ? (
                      <Image
                        source={{ uri }}
                        style={styles.screenshotImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.screenshotPlaceholder}>
                        <Text style={styles.screenshotText}>
                          Screenshot {index + 1}
                        </Text>
                        <Text style={styles.screenshotSubtext}>
                          Tap to view full size
                        </Text>
                      </View>
                    )}
                    {/* Label (if provided) */}
                    {typeof screenshot === "object" && screenshot?.label ? (
                      <Text style={styles.screenshotLabel}>
                        {screenshot.label}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              (navigation as any).navigate("Journal", {
                screen: "AddTrade",
                params: { trade, origin: "Journal" },
              })
            }
          >
            <Text style={styles.actionButtonIcon}>✏️</Text>
            <Text style={styles.actionButtonText}>Edit Trade</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => setConfirmVisible(true)}
          >
            <Text style={styles.actionButtonIcon}>🗑️</Text>
            <Text style={[styles.actionButtonText, { color: "#f44336" }]}>
              Delete Trade
            </Text>
          </TouchableOpacity>
        </View>

        <ConfirmModal
          visible={confirmVisible}
          title="Delete Trade"
          message="Are you sure you want to delete this trade? This action cannot be undone."
          onCancel={() => setConfirmVisible(false)}
          onConfirm={async () => {
            setConfirmVisible(false);
            try {
              console.warn("Attempting to delete trade", trade?.id);
              if (!trade?.id) throw new Error("Trade id missing");

              // Delete any linked screenshots from Supabase (best-effort)
              try {
                if (trade.screenshots && Array.isArray(trade.screenshots)) {
                  for (const s of trade.screenshots) {
                    const uri =
                      typeof s === "string" ? s : s?.uri || s?.url || "";
                    if (uri) {
                      try {
                        await deleteTradeImage(uri);
                      } catch (e) {
                        /* best-effort */
                      }
                    }
                  }
                }
              } catch (e) {
                // ignore image deletion errors
              }

              // Compute PnL impact of this trade so we can revert it on the account
              const computeTradePnlLocal = (t: any) => {
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
                    if (t.direction === "Buy") {
                      sign = ax > entry ? 1 : ax < entry ? -1 : 0;
                    } else {
                      sign = ax < entry ? 1 : ax > entry ? -1 : 0;
                    }
                    const pnl = sign * (exitDistance / stopDistance) * risk;
                    return Math.round(pnl * 100) / 100;
                  }

                  const rr = Number(t?.riskToReward) || 1;
                  if (t?.result === "Win")
                    return Math.round(risk * rr * 100) / 100;
                  if (t?.result === "Loss")
                    return Math.round(-risk * 100) / 100;
                  return 0;
                } catch (e) {
                  return 0;
                }
              };

              const pnl = computeTradePnlLocal(trade);

              // Delete Firestore trade doc
              await deleteTradeService(trade.id);

              // Update local context
              try {
                dispatch({ type: "DELETE_TRADE", payload: trade.id });
                console.warn("Dispatched DELETE_TRADE", trade.id);
              } catch (e) {
                console.warn("Dispatch failed", e);
              }

              // If linked to an account, revert the PnL impact
              try {
                const accountId = trade.accountId;
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
                      dispatch({ type: "SET_ACCOUNTS", payload: refreshed });
                    } catch {}
                  }
                }
              } catch (e) {
                // ignore account update errors
              }

              // Navigate back to journal with fallback
              try {
                if (
                  navigation &&
                  typeof navigation.goBack === "function" &&
                  navigation.canGoBack &&
                  navigation.canGoBack()
                ) {
                  navigation.goBack();
                } else if (
                  navigation &&
                  typeof navigation.navigate === "function"
                ) {
                  navigation.navigate("JournalMain");
                }
              } catch (e) {
                try {
                  navigation.goBack();
                } catch {}
              }

              try {
                toast.show("Trade deleted", "success");
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

        <View style={{ height: 40 }} />
      </ScrollView>
      {/* Fullscreen image viewer */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => setViewerVisible(false)}
            style={{ position: "absolute", top: 40, right: 20, zIndex: 50 }}
          >
            <Text style={{ color: "#fff", fontSize: 28 }}>×</Text>
          </TouchableOpacity>
          {viewerUri ? (
            <Image
              source={{ uri: viewerUri }}
              style={{ width: "94%", height: "80%", borderRadius: 12 }}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    paddingHorizontal: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    color: "#f5f5f5",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorText: {
    color: "#aaa",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: "#00d4d4",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  errorButtonText: {
    color: "#0d0d0d",
    fontSize: 15,
    fontWeight: "700",
  },
  hero: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.2)",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  pair: {
    color: "#f5f5f5",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubInfo: {
    flexDirection: "row",
    gap: 8,
  },
  directionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  directionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  sessionIcon: {
    fontSize: 14,
  },
  sessionText: {
    color: "#f5f5f5",
    fontSize: 12,
    fontWeight: "600",
  },
  resultBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: "#0d0d0d",
    borderRadius: 12,
    padding: 16,
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatLabel: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: "#2a2a2a",
    marginHorizontal: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#f5f5f5",
    fontSize: 18,
    fontWeight: "700",
  },
  sectionIcon: {
    fontSize: 20,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.15)",
  },
  infoLabel: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: {
    color: "#f5f5f5",
    fontSize: 15,
    fontWeight: "700",
  },
  priceCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.15)",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  priceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  priceIconText: {
    fontSize: 18,
  },
  priceLabel: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  priceValue: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700",
  },
  pipsBadge: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pipsText: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricLabel: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  metricBadge: {
    backgroundColor: "rgba(0, 212, 212, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  metricBadgeText: {
    color: "#00d4d4",
    fontSize: 10,
    fontWeight: "600",
  },
  psychologyCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.15)",
  },
  emotionRow: {
    marginBottom: 16,
  },
  emotionLabel: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
  },
  emotionRating: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emotionDots: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  emotionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emotionValue: {
    color: "#ffa500",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 12,
  },
  deviationRow: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  deviationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deviationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  deviationIconText: {
    fontSize: 20,
  },
  deviationLabel: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  deviationValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  notesCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.15)",
  },
  notesText: {
    color: "#f5f5f5",
    fontSize: 14,
    lineHeight: 22,
  },
  checklistCounter: {
    backgroundColor: "#00d4d420",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  checklistCounterText: {
    color: "#00d4d4",
    fontSize: 11,
    fontWeight: "700",
  },
  checklistCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.15)",
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
  },
  checklistIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4caf5020",
    justifyContent: "center",
    alignItems: "center",
  },
  checklistIcon: {
    color: "#4caf50",
    fontSize: 12,
    fontWeight: "700",
  },
  checklistText: {
    color: "#f5f5f5",
    fontSize: 14,
    flex: 1,
  },
  screenshotsCard: {
    gap: 12,
  },
  screenshotImageWrapper: {
    width: 160,
    height: 140,
    borderRadius: 10,
    overflow: "visible",
    marginRight: 12,
  },
  screenshotImage: {
    width: "100%",
    height: 110,
  },
  screenshotPlaceholder: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.15)",
    borderStyle: "dashed",
  },
  screenshotText: {
    color: "#f5f5f5",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  screenshotSubtext: {
    color: "#666",
    fontSize: 12,
  },
  screenshotLabel: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  actionSection: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00d4d4",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#f44336",
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    color: "#0d0d0d",
    fontSize: 15,
    fontWeight: "700",
  },
});
