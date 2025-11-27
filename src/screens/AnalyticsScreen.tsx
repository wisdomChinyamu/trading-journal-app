import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAppContext } from "../hooks/useAppContext";
import EquityCurveChart from "../components/EquityCurveChart";
import WinRatePieChart from "../components/WinRatePieChart";
import PerformanceByPairChart from "../components/PerformanceByPairChart";
import {
  calculateWinRate,
  calculateAverageRR,
  calculateProfitFactor,
  getPerformanceBy,
} from "../utils/calculations";

export default function AnalyticsScreen() {
  const { state } = useAppContext();

  const metrics = {
    winRate: calculateWinRate(state.trades),
    avgRR: calculateAverageRR(state.trades),
    profitFactor: calculateProfitFactor(state.trades as any),
    performanceByPair: getPerformanceBy(state.trades, "pair"),
    performanceBySession: getPerformanceBy(state.trades, "session"),
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Trading Analytics</Text>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Win Rate</Text>
            <Text style={styles.metricValue}>
              {metrics.winRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg R:R</Text>
            <Text style={styles.metricValue}>1:{metrics.avgRR.toFixed(2)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Profit Factor</Text>
            <Text style={styles.metricValue}>
              {metrics.profitFactor.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Real Charts */}
      <View style={styles.section}>
        <EquityCurveChart trades={state.trades} />
        <WinRatePieChart trades={state.trades} />
        <PerformanceByPairChart trades={state.trades} />
      </View>

      {/* Performance by Session */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance by Session</Text>
        {Object.entries(metrics.performanceBySession).map(
          ([session, winRate]) => (
            <View key={session} style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>{session}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${winRate}%` }]} />
              </View>
              <Text style={styles.performanceValue}>{winRate.toFixed(1)}%</Text>
            </View>
          )
        )}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#00d4d4",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  metricLabel: {
    color: "#00d4d4",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
  },
  metricValue: {
    color: "#f5f5f5",
    fontSize: 18,
    fontWeight: "700",
  },
  performanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  performanceLabel: {
    color: "#f5f5f5",
    fontSize: 12,
    fontWeight: "600",
    width: 60,
  },
  progressBar: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    height: 24,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#00d4d4",
  },
  progressFill: {
    backgroundColor: "#00d4d4",
    height: "100%",
  },
  performanceValue: {
    color: "#f5f5f5",
    fontSize: 12,
    fontWeight: "700",
    width: 50,
    textAlign: "right",
  },
});
