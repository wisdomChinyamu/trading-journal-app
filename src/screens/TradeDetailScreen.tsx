import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function TradeDetailScreen({ route, navigation }: any) {
  const trade = route?.params?.trade;

  if (!trade) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Trade Not Found</Text>
        <Text style={styles.errorText}>The trade you're looking for doesn't exist.</Text>
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
    if (trade.result === 'Win') return '#4caf50';
    if (trade.result === 'Loss') return '#f44336';
    return '#ffa500';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#4caf50';
    if (grade === 'B') return '#00d4d4';
    if (grade === 'C') return '#ffa500';
    return '#f44336';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.pair}>{trade.pair}</Text>
            <View style={styles.heroSubInfo}>
              <View style={[styles.directionBadge, { 
                backgroundColor: trade.direction === 'Buy' ? '#4caf5020' : '#f4433620' 
              }]}>
                <Text style={[styles.directionText, { 
                  color: trade.direction === 'Buy' ? '#4caf50' : '#f44336' 
                }]}>
                  {trade.direction === 'Buy' ? '↑' : '↓'} {trade.direction}
                </Text>
              </View>
              <View style={styles.sessionBadge}>
                <Text style={styles.sessionIcon}>
                  {trade.session === 'London' ? '🇬🇧' : trade.session === 'NY' ? '🇺🇸' : '🌏'}
                </Text>
                <Text style={styles.sessionText}>{trade.session}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.resultBadge, { backgroundColor: getResultColor() }]}>
            <Text style={styles.resultText}>{trade.result || 'Pending'}</Text>
          </View>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatLabel}>Risk:Reward</Text>
            <Text style={[styles.heroStatValue, { color: '#00d4d4' }]}>
              1:{trade.riskToReward.toFixed(2)}
            </Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatLabel}>Grade</Text>
            <Text style={[styles.heroStatValue, { color: getGradeColor(trade.grade) }]}>
              {trade.grade}
            </Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatLabel}>Confluence</Text>
            <Text style={[styles.heroStatValue, { color: '#ffa500' }]}>
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
            <Text style={styles.infoValue}>{trade.setupType || 'N/A'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(trade.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
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
              <View style={[styles.priceIcon, { backgroundColor: '#00d4d420' }]}>
                <Text style={styles.priceIconText}>📍</Text>
              </View>
              <View>
                <Text style={styles.priceLabel}>Entry Price</Text>
                <Text style={styles.priceValue}>{trade.entryPrice.toFixed(5)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.priceDivider} />

          <View style={styles.priceRow}>
            <View style={styles.priceLeft}>
              <View style={[styles.priceIcon, { backgroundColor: '#f4433620' }]}>
                <Text style={styles.priceIconText}>🛑</Text>
              </View>
              <View>
                <Text style={styles.priceLabel}>Stop Loss</Text>
                <Text style={[styles.priceValue, { color: '#f44336' }]}>
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
              <View style={[styles.priceIcon, { backgroundColor: '#4caf5020' }]}>
                <Text style={styles.priceIconText}>🎯</Text>
              </View>
              <View>
                <Text style={styles.priceLabel}>Take Profit</Text>
                <Text style={[styles.priceValue, { color: '#4caf50' }]}>
                  {trade.takeProfit.toFixed(5)}
                </Text>
              </View>
            </View>
            <View style={styles.pipsBadge}>
              <Text style={styles.pipsText}>
                {Math.abs(trade.takeProfit - trade.entryPrice).toFixed(5)} pips
              </Text>
            </View>
          </View>

          {trade.actualExit && (
            <>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <View style={styles.priceLeft}>
                  <View style={[styles.priceIcon, { backgroundColor: '#ffa50020' }]}>
                    <Text style={styles.priceIconText}>✓</Text>
                  </View>
                  <View>
                    <Text style={styles.priceLabel}>Actual Exit</Text>
                    <Text style={[styles.priceValue, { color: '#ffa500' }]}>
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
          <View style={[styles.metricCard, { borderColor: '#00d4d4' }]}>
            <Text style={styles.metricIcon}>🎯</Text>
            <Text style={styles.metricLabel}>R:R Ratio</Text>
            <Text style={[styles.metricValue, { color: '#00d4d4' }]}>
              1:{trade.riskToReward.toFixed(2)}
            </Text>
            <View style={styles.metricBadge}>
              <Text style={styles.metricBadgeText}>
                {trade.riskToReward >= 3 ? 'Excellent' : 
                 trade.riskToReward >= 2 ? 'Good' : 
                 trade.riskToReward >= 1.5 ? 'Fair' : 'Poor'}
              </Text>
            </View>
          </View>

          <View style={[styles.metricCard, { borderColor: getGradeColor(trade.grade) }]}>
            <Text style={styles.metricIcon}>📝</Text>
            <Text style={styles.metricLabel}>Trade Grade</Text>
            <Text style={[styles.metricValue, { color: getGradeColor(trade.grade) }]}>
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
                      { backgroundColor: i < trade.emotionalRating ? '#ffa500' : '#2a2a2a' }
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.emotionValue}>{trade.emotionalRating}/10</Text>
            </View>
          </View>

          <View style={styles.deviationRow}>
            <View style={styles.deviationLeft}>
              <View style={[
                styles.deviationIcon, 
                { backgroundColor: trade.ruleDeviation ? '#f4433620' : '#4caf5020' }
              ]}>
                <Text style={styles.deviationIconText}>
                  {trade.ruleDeviation ? '⚠️' : '✓'}
                </Text>
              </View>
              <View>
                <Text style={styles.deviationLabel}>Rule Deviation</Text>
                <Text style={[
                  styles.deviationValue,
                  { color: trade.ruleDeviation ? '#f44336' : '#4caf50' }
                ]}>
                  {trade.ruleDeviation ? 'Yes - Rules broken' : 'No - Followed plan'}
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
              <Text style={styles.checklistCounterText}>{trade.checklist.length} items</Text>
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
            {trade.screenshots.map((screenshot: string, index: number) => (
              <View key={index} style={styles.screenshotPlaceholder}>
                <Text style={styles.screenshotText}>Screenshot {index + 1}</Text>
                <Text style={styles.screenshotSubtext}>Tap to view full size</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonIcon}>✏️</Text>
          <Text style={styles.actionButtonText}>Edit Trade</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
          <Text style={styles.actionButtonIcon}>🗑️</Text>
          <Text style={[styles.actionButtonText, { color: '#f44336' }]}>Delete Trade</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    paddingHorizontal: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#f5f5f5',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#00d4d4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  errorButtonText: {
    color: '#0d0d0d',
    fontSize: 15,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.2)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  pair: {
    color: '#f5f5f5',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  directionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  directionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  sessionIcon: {
    fontSize: 14,
  },
  sessionText: {
    color: '#f5f5f5',
    fontSize: 12,
    fontWeight: '600',
  },
  resultBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: '#0d0d0d',
    borderRadius: 12,
    padding: 16,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f5f5f5',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionIcon: {
    fontSize: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.15)',
  },
  infoLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: {
    color: '#f5f5f5',
    fontSize: 15,
    fontWeight: '700',
  },
  priceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.15)',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceIconText: {
    fontSize: 18,
  },
  priceLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  priceValue: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  pipsBadge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pipsText: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  metricBadge: {
    backgroundColor: 'rgba(0, 212, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  metricBadgeText: {
    color: '#00d4d4',
    fontSize: 10,
    fontWeight: '600',
  },
  psychologyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.15)',
  },
  emotionRow: {
    marginBottom: 16,
  },
  emotionLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  emotionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emotionDots: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  emotionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emotionValue: {
    color: '#ffa500',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
  },
  deviationRow: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  deviationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviationIconText: {
    fontSize: 20,
  },
  deviationLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  deviationValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  notesCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.15)',
  },
  notesText: {
    color: '#f5f5f5',
    fontSize: 14,
    lineHeight: 22,
  },
  checklistCounter: {
    backgroundColor: '#00d4d420',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  checklistCounterText: {
    color: '#00d4d4',
    fontSize: 11,
    fontWeight: '700',
  },
  checklistCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.15)',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
  },
  checklistIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4caf5020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistIcon: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '700',
  },
  checklistText: {
    color: '#f5f5f5',
    fontSize: 14,
    flex: 1,
  },
  screenshotsCard: {
    gap: 12,
  },
  screenshotPlaceholder: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.15)',
    borderStyle: 'dashed',
  },
  screenshotText: {
    color: '#f5f5f5',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  screenshotSubtext: {
    color: '#666',
    fontSize: 12,
  },
  actionSection: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00d4d4',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    color: '#0d0d0d',
    fontSize: 15,
    fontWeight: '700',
  },
});