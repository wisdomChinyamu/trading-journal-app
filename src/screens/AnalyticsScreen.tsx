import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
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
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  const metrics = {
    winRate: calculateWinRate(state.trades),
    avgRR: calculateAverageRR(state.trades),
    profitFactor: calculateProfitFactor(state.trades as any),
    performanceByPair: getPerformanceBy(state.trades, "pair"),
    performanceBySession: getPerformanceBy(state.trades, "session"),
  };

  const totalTrades = state.trades.length;
  const winningTrades = state.trades.filter(t => t.result === 'Win').length;
  const losingTrades = state.trades.filter(t => t.result === 'Loss').length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Performance insights & statistics</Text>
        </View>
      </View>

      {/* Time Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.filterGroup}>
          {[
            { label: 'All Time', value: 'all' },
            { label: 'This Week', value: 'week' },
            { label: 'This Month', value: 'month' }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterButton,
                timeFilter === filter.value && styles.filterButtonActive
              ]}
              onPress={() => setTimeFilter(filter.value as any)}
            >
              <Text style={[
                styles.filterButtonText,
                timeFilter === filter.value && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { borderColor: '#00d4d4' }]}>
            <View style={styles.metricIconContainer}>
              <View style={[styles.metricIcon, { backgroundColor: '#00d4d420' }]}>
                <Text style={styles.metricIconText}>🎯</Text>
              </View>
            </View>
            <Text style={styles.metricLabel}>Win Rate</Text>
            <Text style={[styles.metricValue, { color: '#00d4d4' }]}>
              {metrics.winRate.toFixed(1)}%
            </Text>
            <View style={styles.metricSubInfo}>
              <Text style={styles.metricSubText}>{winningTrades}W / {losingTrades}L</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { borderColor: '#4caf50' }]}>
            <View style={styles.metricIconContainer}>
              <View style={[styles.metricIcon, { backgroundColor: '#4caf5020' }]}>
                <Text style={styles.metricIconText}>📊</Text>
              </View>
            </View>
            <Text style={styles.metricLabel}>Avg R:R</Text>
            <Text style={[styles.metricValue, { color: '#4caf50' }]}>
              1:{metrics.avgRR.toFixed(2)}
            </Text>
            <View style={styles.metricSubInfo}>
              <Text style={styles.metricSubText}>
                {metrics.avgRR >= 2 ? 'Excellent' : metrics.avgRR >= 1.5 ? 'Good' : 'Needs work'}
              </Text>
            </View>
          </View>

          <View style={[styles.metricCard, { borderColor: '#ffa500' }]}>
            <View style={styles.metricIconContainer}>
              <View style={[styles.metricIcon, { backgroundColor: '#ffa50020' }]}>
                <Text style={styles.metricIconText}>💰</Text>
              </View>
            </View>
            <Text style={styles.metricLabel}>Profit Factor</Text>
            <Text style={[styles.metricValue, { color: '#ffa500' }]}>
              {metrics.profitFactor.toFixed(2)}
            </Text>
            <View style={styles.metricSubInfo}>
              <Text style={styles.metricSubText}>
                {metrics.profitFactor >= 2 ? 'Strong' : metrics.profitFactor >= 1.5 ? 'Solid' : 'Weak'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Summary Stats Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalTrades}</Text>
          <Text style={styles.summaryLabel}>Total Trades</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#4caf50' }]}>
            {((winningTrades / totalTrades) * 100 || 0).toFixed(0)}%
          </Text>
          <Text style={styles.summaryLabel}>Win Rate</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#00d4d4' }]}>
            {state.trades.filter(t => t.grade.startsWith('A')).length}
          </Text>
          <Text style={styles.summaryLabel}>A+ Setups</Text>
        </View>
      </View>

      {/* Charts Section */}
      <View style={styles.section}>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Equity Curve</Text>
            <View style={styles.chartBadge}>
              <Text style={styles.chartBadgeText}>Cumulative P&L</Text>
            </View>
          </View>
          <EquityCurveChart trades={state.trades} />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Win/Loss Distribution</Text>
            <View style={styles.chartStats}>
              <View style={styles.chartStatItem}>
                <View style={[styles.chartStatDot, { backgroundColor: '#4caf50' }]} />
                <Text style={styles.chartStatText}>{winningTrades} Wins</Text>
              </View>
              <View style={styles.chartStatItem}>
                <View style={[styles.chartStatDot, { backgroundColor: '#f44336' }]} />
                <Text style={styles.chartStatText}>{losingTrades} Losses</Text>
              </View>
            </View>
          </View>
          <WinRatePieChart trades={state.trades} />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Performance by Pair</Text>
            <TouchableOpacity style={styles.chartAction}>
              <Text style={styles.chartActionText}>View All →</Text>
            </TouchableOpacity>
          </View>
          <PerformanceByPairChart trades={state.trades} />
        </View>
      </View>

      {/* Performance by Session */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Session Performance</Text>
          <Text style={styles.sectionSubtitle}>Win rate by trading session</Text>
        </View>
        
        <View style={styles.sessionGrid}>
          {Object.entries(metrics.performanceBySession).map(
            ([session, winRate]) => {
              const sessionTrades = state.trades.filter(t => t.session === session).length;
              const sessionIcon = session === 'London' ? '🇬🇧' : session === 'NY' ? '🇺🇸' : '🌏';
              const performanceColor = 
                winRate >= 60 ? '#4caf50' : 
                winRate >= 40 ? '#00d4d4' : 
                '#f44336';

              return (
                <View key={session} style={styles.sessionCard}>
                  <View style={styles.sessionCardHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionIcon}>{sessionIcon}</Text>
                      <View>
                        <Text style={styles.sessionName}>{session}</Text>
                        <Text style={styles.sessionTrades}>{sessionTrades} trades</Text>
                      </View>
                    </View>
                    <View style={[styles.sessionBadge, { backgroundColor: `${performanceColor}20` }]}>
                      <Text style={[styles.sessionBadgeText, { color: performanceColor }]}>
                        {winRate.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${Math.min(winRate, 100)}%`,
                            backgroundColor: performanceColor
                          }
                        ]} 
                      />
                    </View>
                  </View>

                  <View style={styles.sessionFooter}>
                    <Text style={styles.sessionFooterText}>
                      {winRate >= 60 ? '🔥 Hot' : winRate >= 40 ? '✓ Solid' : '⚠️ Focus Area'}
                    </Text>
                  </View>
                </View>
              );
            }
          )}
        </View>
      </View>

      {/* Performance by Pair - Detailed */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pair Performance</Text>
          <Text style={styles.sectionSubtitle}>Best & worst performing pairs</Text>
        </View>

        <View style={styles.pairList}>
          {Object.entries(metrics.performanceByPair)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([pair, winRate], index) => {
              const pairTrades = state.trades.filter(t => t.pair === pair).length;
              const rankColor = 
                index === 0 ? '#ffd700' : 
                index === 1 ? '#c0c0c0' : 
                index === 2 ? '#cd7f32' : 
                '#666';

              return (
                <View key={pair} style={styles.pairRow}>
                  <View style={styles.pairRank}>
                    <Text style={[styles.pairRankText, { color: rankColor }]}>
                      #{index + 1}
                    </Text>
                  </View>
                  
                  <View style={styles.pairInfo}>
                    <Text style={styles.pairName}>{pair}</Text>
                    <Text style={styles.pairTrades}>{pairTrades} trades</Text>
                  </View>

                  <View style={styles.pairProgress}>
                    <View style={styles.pairProgressBar}>
                      <View 
                        style={[
                          styles.pairProgressFill,
                          { 
                            width: `${Math.min(winRate, 100)}%`,
                            backgroundColor: winRate >= 50 ? '#4caf50' : '#f44336'
                          }
                        ]} 
                      />
                    </View>
                  </View>

                  <View style={styles.pairValue}>
                    <Text style={[
                      styles.pairValueText,
                      { color: winRate >= 50 ? '#4caf50' : '#f44336' }
                    ]}>
                      {winRate.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              );
            })}
        </View>
      </View>

      {/* Insights Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Insights</Text>
        <View style={styles.insightsGrid}>
          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>⚡</Text>
            <Text style={styles.insightTitle}>Best Session</Text>
            <Text style={styles.insightValue}>
              {Object.entries(metrics.performanceBySession)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>🎯</Text>
            <Text style={styles.insightTitle}>Best Pair</Text>
            <Text style={styles.insightValue}>
              {Object.entries(metrics.performanceByPair)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>📈</Text>
            <Text style={styles.insightTitle}>Streak</Text>
            <Text style={styles.insightValue}>
              {(() => {
                let streak = 0;
                for (let i = state.trades.length - 1; i >= 0; i--) {
                  if (state.trades[i].result === 'Win') streak++;
                  else break;
                }
                return `${streak}W`;
              })()}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    marginBottom: 8,
  },
  title: {
    color: "#f5f5f5",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 15,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#00d4d420',
    borderColor: '#00d4d4',
  },
  filterButtonText: {
    color: '#f5f5f5',
    fontSize: 13,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#00d4d4',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#f5f5f5",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#aaa',
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  metricIconContainer: {
    marginBottom: 10,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricIconText: {
    fontSize: 24,
  },
  metricLabel: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricSubInfo: {
    backgroundColor: 'rgba(0, 212, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  metricSubText: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: '600',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.1)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    color: '#f5f5f5',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 212, 212, 0.15)',
    marginHorizontal: 12,
  },
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.1)',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '700',
  },
  chartBadge: {
    backgroundColor: 'rgba(0, 212, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chartBadgeText: {
    color: '#00d4d4',
    fontSize: 11,
    fontWeight: '600',
  },
  chartStats: {
    flexDirection: 'row',
    gap: 12,
  },
  chartStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartStatText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  chartAction: {
    paddingVertical: 4,
  },
  chartActionText: {
    color: '#00d4d4',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionGrid: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.15)',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionIcon: {
    fontSize: 32,
  },
  sessionName: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '700',
  },
  sessionTrades: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  sessionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sessionBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    backgroundColor: "#2a2a2a",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  sessionFooter: {
    marginTop: 4,
  },
  sessionFooterText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  pairList: {
    gap: 12,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.1)',
  },
  pairRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pairRankText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pairInfo: {
    flex: 1,
  },
  pairName: {
    color: '#f5f5f5',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  pairTrades: {
    color: '#666',
    fontSize: 11,
  },
  pairProgress: {
    flex: 2,
  },
  pairProgressBar: {
    backgroundColor: '#2a2a2a',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  pairProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  pairValue: {
    width: 50,
    alignItems: 'flex-end',
  },
  pairValueText: {
    fontSize: 15,
    fontWeight: '700',
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.1)',
  },
  insightIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  insightTitle: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  insightValue: {
    color: '#00d4d4',
    fontSize: 16,
    fontWeight: '700',
  },
});