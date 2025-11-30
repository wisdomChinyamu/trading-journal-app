import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Trade } from '../types';
import { ThemeMode } from '../theme/theme';
import ImageUploader from './ImageUploader';
import { useTheme } from './ThemeProvider';

interface AddTradeFormProps {
  onSubmit: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
  theme?: ThemeMode;
}

export default function AddTradeForm({ onSubmit, onClose }: AddTradeFormProps) {
  const [pair, setPair] = React.useState('GBPUSD');
  const [direction, setDirection] = React.useState<'Buy' | 'Sell'>('Buy');
  const [session, setSession] = React.useState<'London' | 'NY' | 'Asia'>('London');
  const [entryPrice, setEntryPrice] = React.useState('');
  const [stopLoss, setStopLoss] = React.useState('');
  const [takeProfit, setTakeProfit] = React.useState('');
  const [result, setResult] = React.useState<'Win' | 'Loss' | 'Break-even' | undefined>();
  const [emotionalRating, setEmotionalRating] = React.useState(5);
  const [ruleDeviation, setRuleDeviation] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [screenshots, setScreenshots] = React.useState<string[]>([]);

  const { colors } = useTheme();

  const calculateRR = () => {
    if (!entryPrice || !stopLoss || !takeProfit) return 0;
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    return risk > 0 ? reward / risk : 0;
  };

  const rr = calculateRR();

  const handleSubmit = () => {
    if (!entryPrice || !stopLoss || !takeProfit) {
      Alert.alert('Error', 'Please fill in all price fields');
      return;
    }

    onSubmit({
      userId: 'current-user',
      pair,
      direction,
      session,
      entryPrice: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      result,
      riskToReward: rr,
      confluenceScore: 0,
      grade: 'B',
      setupType: 'SMC',
      emotionalRating,
      ruleDeviation,
      screenshots,
      notes,
    });

    onClose();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Add New Trade</Text>
              <Text style={[styles.subtitle, { color: colors.subtext }]}>Record your setup</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Live R:R Display */}
          {(entryPrice && stopLoss && takeProfit) && (
            <View style={[styles.rrHero, { borderColor: rr >= 2 ? colors.profitEnd : colors.highlight }]}>
              <Text style={[styles.rrLabel, { color: colors.subtext }]}>Risk:Reward</Text>
              <Text style={[styles.rrValue, { color: rr >= 2 ? colors.profitEnd : colors.highlight }]}>
                1:{rr.toFixed(2)}
              </Text>
              <View style={[styles.rrBadge, { backgroundColor: rr >= 2 ? '#4caf5020' : '#00d4d420' }]}>
                <Text style={[styles.rrBadgeText, { color: rr >= 2 ? colors.profitEnd : colors.highlight }]}>
                  {rr >= 3 ? '🔥 Excellent' : rr >= 2 ? '✓ Good' : '⚠️ Fair'}
                </Text>
              </View>
            </View>
          )}

          {/* Pair Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Currency Pair</Text>
            <View style={styles.pairInput}>
              <Text style={styles.pairIcon}>💱</Text>
              <TextInput
                style={[styles.pairTextInput, { color: colors.text }]}
                value={pair}
                onChangeText={setPair}
                placeholder="GBPUSD"
                placeholderTextColor={colors.subtext}
              />
            </View>
          </View>

          {/* Direction */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Direction</Text>
            <View style={styles.directionButtons}>
              {(['Buy', 'Sell'] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.directionButton,
                    direction === d && d === 'Buy' && { backgroundColor: colors.profitEnd, borderColor: colors.profitEnd },
                    direction === d && d === 'Sell' && { backgroundColor: colors.lossEnd, borderColor: colors.lossEnd },
                    direction !== d && { borderColor: colors.neutral },
                  ]}
                  onPress={() => setDirection(d)}
                >
                  <Text style={styles.directionIcon}>{d === 'Buy' ? '↑' : '↓'}</Text>
                  <Text style={[styles.directionText, { color: direction === d ? '#fff' : colors.text }]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Session */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trading Session</Text>
            <View style={styles.sessionButtons}>
              {(['London', 'NY', 'Asia'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.sessionButton,
                    { borderColor: session === s ? colors.highlight : colors.neutral },
                    session === s && { backgroundColor: `${colors.highlight}20` },
                  ]}
                  onPress={() => setSession(s)}
                >
                  <Text style={styles.sessionEmoji}>
                    {s === 'London' ? '🇬🇧' : s === 'NY' ? '🇺🇸' : '🌏'}
                  </Text>
                  <Text style={[styles.sessionText, { color: session === s ? colors.highlight : colors.text }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Inputs */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Levels</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceIcon}>📍</Text>
              <View style={styles.priceInputGroup}>
                <Text style={[styles.priceLabel, { color: colors.subtext }]}>Entry</Text>
                <TextInput
                  style={[styles.priceInput, { backgroundColor: colors.neutral, color: colors.text }]}
                  placeholder="0.00000"
                  placeholderTextColor={colors.subtext}
                  value={entryPrice}
                  onChangeText={setEntryPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceIcon}>🛑</Text>
              <View style={styles.priceInputGroup}>
                <Text style={[styles.priceLabel, { color: colors.subtext }]}>Stop Loss</Text>
                <TextInput
                  style={[styles.priceInput, { backgroundColor: colors.neutral, color: colors.text }]}
                  placeholder="0.00000"
                  placeholderTextColor={colors.subtext}
                  value={stopLoss}
                  onChangeText={setStopLoss}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceIcon}>🎯</Text>
              <View style={styles.priceInputGroup}>
                <Text style={[styles.priceLabel, { color: colors.subtext }]}>Take Profit</Text>
                <TextInput
                  style={[styles.priceInput, { backgroundColor: colors.neutral, color: colors.text }]}
                  placeholder="0.00000"
                  placeholderTextColor={colors.subtext}
                  value={takeProfit}
                  onChangeText={setTakeProfit}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Result */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trade Result</Text>
            <View style={styles.resultButtons}>
              {(['Win', 'Loss', 'Break-even'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.resultButton,
                    result === r && r === 'Win' && { backgroundColor: colors.profitEnd },
                    result === r && r === 'Loss' && { backgroundColor: colors.lossEnd },
                    result === r && r === 'Break-even' && { backgroundColor: colors.breakEven },
                    result !== r && { backgroundColor: colors.neutral, borderColor: colors.neutral },
                  ]}
                  onPress={() => setResult(r)}
                >
                  <Text style={styles.resultIcon}>
                    {r === 'Win' ? '✓' : r === 'Loss' ? '✗' : '—'}
                  </Text>
                  <Text style={[styles.resultText, { color: result === r ? '#fff' : colors.text }]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Emotional Rating */}
          <View style={styles.section}>
            <View style={styles.emotionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Emotional State</Text>
              <View style={styles.emotionBadge}>
                <Text style={styles.emotionValue}>{emotionalRating}/10</Text>
              </View>
            </View>
            <View style={styles.emotionSlider}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.emotionDot,
                    { backgroundColor: emotionalRating >= i ? '#ffa500' : colors.neutral },
                  ]}
                  onPress={() => setEmotionalRating(i)}
                >
                  <Text style={[styles.emotionNumber, { opacity: emotionalRating >= i ? 1 : 0.5 }]}>
                    {i}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.emotionLabels}>
              <Text style={[styles.emotionLabel, { color: colors.subtext }]}>Fearful</Text>
              <Text style={[styles.emotionLabel, { color: colors.subtext }]}>Confident</Text>
            </View>
          </View>

          {/* Rule Deviation */}
          <TouchableOpacity
            style={[styles.deviationCard, { backgroundColor: colors.neutral }]}
            onPress={() => setRuleDeviation(!ruleDeviation)}
          >
            <View style={styles.deviationLeft}>
              <View style={[
                styles.deviationIcon,
                { backgroundColor: ruleDeviation ? '#f4433620' : '#4caf5020' }
              ]}>
                <Text style={styles.deviationIconText}>{ruleDeviation ? '⚠️' : '✓'}</Text>
              </View>
              <View style={styles.deviationInfo}>
                <Text style={[styles.deviationTitle, { color: colors.text }]}>Rule Deviation</Text>
                <Text style={[styles.deviationSubtitle, { color: colors.subtext }]}>
                  {ruleDeviation ? 'Rules were broken' : 'Following the plan'}
                </Text>
              </View>
            </View>
            <View style={[
              styles.toggle,
              { backgroundColor: ruleDeviation ? colors.lossEnd : colors.neutral }
            ]}>
              <View style={[
                styles.toggleThumb,
                { transform: [{ translateX: ruleDeviation ? 16 : 0 }] }
              ]} />
            </View>
          </TouchableOpacity>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trade Notes</Text>
            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: colors.neutral, color: colors.text, borderColor: colors.highlight }
              ]}
              placeholder="Observations, lessons learned, market conditions..."
              placeholderTextColor={colors.subtext}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Screenshots */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Chart Screenshots</Text>
            <ImageUploader
              screenshots={screenshots}
              onAdd={(uri: string) => setScreenshots((s) => [...s, uri])}
              onRemove={(uri: string) => setScreenshots((s) => s.filter((x) => x !== uri))}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.highlight }]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitIcon}>✓</Text>
              <Text style={styles.submitText}>Add Trade</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.neutral }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: '#f5f5f5',
    fontWeight: '700',
  },
  rrHero: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  rrLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  rrValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
  },
  rrBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rrBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  pairInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#00d4d4',
  },
  pairIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  pairTextInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  directionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  directionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 2,
    gap: 8,
  },
  directionIcon: {
    fontSize: 20,
    color: '#fff',
  },
  directionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sessionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    gap: 6,
  },
  sessionEmoji: {
    fontSize: 24,
  },
  sessionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  priceIcon: {
    fontSize: 20,
  },
  priceInputGroup: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  priceInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resultButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    gap: 6,
  },
  resultIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  resultText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emotionBadge: {
    backgroundColor: '#ffa50020',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  emotionValue: {
    color: '#ffa500',
    fontSize: 13,
    fontWeight: '700',
  },
  emotionSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emotionDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionNumber: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  emotionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emotionLabel: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  deviationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  deviationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deviationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviationIconText: {
    fontSize: 18,
  },
  deviationInfo: {
    flex: 1,
  },
  deviationTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  deviationSubtitle: {
    fontSize: 12,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  notesInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    gap: 8,
  },
  submitIcon: {
    fontSize: 18,
    color: '#0d0d0d',
  },
  submitText: {
    color: '#0d0d0d',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
});