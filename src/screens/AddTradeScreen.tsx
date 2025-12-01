import React, { useState, useEffect } from "react";
import EditableChecklistTable from "../components/EditableChecklistTable";
import ImageUploader from "../components/ImageUploader";
import { uploadTradeImage } from "../services/supabaseImageService";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Switch,
  Dimensions,
} from "react-native";
import {
  calculateRiskToReward,
  calculateConfluenceScore,
  assignGrade,
} from "../utils/calculations";
import { Trade, TradeDirection, TradeSession, Strategy } from "../types";
import { getUserStrategies, addTrade } from "../services/firebaseService";
import { useAppContext } from "../hooks/useAppContext";

interface AddTradeScreenProps {
  navigation: any;
  route?: any;
}

const PAIRS = [
  "GBPUSD",
  "EURUSD",
  "USDJPY",
  "AUDUSD",
  "USDCAD",
  "NZDUSD",
  "USDCHF",
];
const SESSIONS = ["London", "NY", "Asia"];
const DIRECTIONS = ["Buy", "Sell"];
const SETUP_TYPES = [
  "Order Block",
  "Liquidity Sweep",
  "FVG",
  "Swing",
  "Fair Value",
  "Support/Resistance",
];

export default function AddTradeScreen({
  navigation,
  route,
}: AddTradeScreenProps) {
  const { state } = useAppContext();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    null
  );
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  
  useEffect(() => {
    // Get user ID from context
    const userId = state.user?.uid;
    
    if (userId) {
      getUserStrategies(userId).then(setStrategies);
    }
  }, []);

  useEffect(() => {
    if (selectedStrategyId) {
      const strategy = strategies.find((s) => s.id === selectedStrategyId);
      setChecklistItems(strategy?.checklist || []);
    } else {
      setChecklistItems([]);
    }
  }, [selectedStrategyId, strategies]);
  
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [beforeImage, setBeforeImage] = useState<string>("");
  const [afterImage, setAfterImage] = useState<string>("");
  const [pair, setPair] = useState("GBPUSD");
  const [direction, setDirection] = useState<TradeDirection>("Buy");
  const [session, setSession] = useState<TradeSession>("London");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [actualExit, setActualExit] = useState("");
  const [result, setResult] = useState<"Win" | "Loss" | "Break-even" | "">("");
  const [setupType, setSetupType] = useState("");
  const [emotion, setEmotion] = useState("5");
  const [ruleDeviation, setRuleDeviation] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedChecklist, setSelectedChecklist] = useState<string[]>([]);
  const [rr, setRR] = useState<number | null>(null);
  const [confluenceScore, setConfluenceScore] = useState<number | null>(null);

  useEffect(() => {
    if (entryPrice && stopLoss && takeProfit) {
      const rrValue = calculateRiskToReward(
        Number(entryPrice),
        Number(stopLoss),
        Number(takeProfit),
        direction
      );
      setRR(parseFloat(rrValue.toFixed(2)));
    }
  }, [entryPrice, stopLoss, takeProfit, direction]);

  useEffect(() => {
    if (selectedChecklist.length > 0) {
      const score = (selectedChecklist.length / 5) * 100;
      setConfluenceScore(parseFloat(score.toFixed(2)));
    } else {
      setConfluenceScore(null);
    }
  }, [selectedChecklist]);

  const handleSubmit = async () => {
    if (!entryPrice || !stopLoss || !takeProfit) {
      Alert.alert(
        "Validation Error",
        "Please fill in entry, stop loss, and take profit prices"
      );
      return;
    }

    if (
      Number(entryPrice) <= 0 ||
      Number(stopLoss) <= 0 ||
      Number(takeProfit) <= 0
    ) {
      Alert.alert("Validation Error", "Prices must be greater than 0");
      return;
    }

    if (!rr) {
      Alert.alert("Calculation Error", "Could not calculate R:R ratio");
      return;
    }

    let beforeImageUrl = beforeImage;
    let afterImageUrl = afterImage;
    if (beforeImage && beforeImage.startsWith("blob:")) {
      beforeImageUrl =
        (await uploadTradeImage("temp", beforeImage as any)) || beforeImage;
    }
    if (afterImage && afterImage.startsWith("blob:")) {
      afterImageUrl =
        (await uploadTradeImage("temp", afterImage as any)) || afterImage;
    }
    
    const newTrade: Partial<Trade> = {
      pair: pair as any,
      direction,
      session,
      entryPrice: Number(entryPrice),
      stopLoss: Number(stopLoss),
      takeProfit: Number(takeProfit),
      actualExit: actualExit ? Number(actualExit) : undefined,
      result: (result as any) || undefined,
      riskToReward: rr,
      confluenceScore: confluenceScore || 0,
      grade: confluenceScore ? assignGrade(confluenceScore) : "D",
      strategyId: selectedStrategyId || undefined,
      setupType,
      emotionalRating: Number(emotion),
      ruleDeviation,
      screenshots: [beforeImageUrl, afterImageUrl].filter(Boolean),
      notes,
      checklist: checkedItems,
    };

    try {
      // Get user ID from context
      const userId = state.user?.uid;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Save trade to Firebase
      await addTrade(userId, newTrade as Omit<Trade, "id">);
      
      navigation.goBack();
      Alert.alert("Success", `Trade recorded: ${pair} ${direction}`);
    } catch (error) {
      console.error("Error saving trade:", error);
      Alert.alert("Error", "Failed to save trade. Please try again.");
    }
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#81c784';
    if (score >= 50) return '#00d4d4';
    if (score >= 30) return '#ffa500';
    return '#f44336';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Add New Trade</Text>
        <Text style={styles.subtitle}>Record your trading setup and execution</Text>
      </View>

      {/* Live Calculation Cards */}
      <View style={styles.calculationCards}>
        <View style={[styles.calcCard, { borderColor: '#00d4d4' }]}>
          <Text style={styles.calcLabel}>Risk:Reward</Text>
          <Text style={[styles.calcValue, { color: '#00d4d4' }]}>
            {rr !== null ? `1:${rr.toFixed(2)}` : '—'}
          </Text>
          <View style={styles.calcIndicator}>
            {rr !== null && rr >= 2 ? (
              <Text style={styles.calcBadge}>✓ Good R:R</Text>
            ) : (
              <Text style={[styles.calcBadge, { opacity: 0.5 }]}>Calculating...</Text>
            )}
          </View>
        </View>

        <View style={[styles.calcCard, { borderColor: confluenceScore ? getGradeColor(confluenceScore) : '#444' }]}>
          <Text style={styles.calcLabel}>Confluence</Text>
          <Text style={[styles.calcValue, { color: confluenceScore ? getGradeColor(confluenceScore) : '#666' }]}>
            {confluenceScore !== null ? `${confluenceScore.toFixed(0)}%` : '—'}
          </Text>
          <View style={styles.calcIndicator}>
            <Text style={styles.calcBadge}>
              Grade: {confluenceScore ? assignGrade(confluenceScore) : '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Pair Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Currency Pair</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{pair}</Text>
          </View>
        </View>
        <View style={styles.buttonGrid}>
          {PAIRS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.gridButton, pair === p && styles.gridButtonActive]}
              onPress={() => setPair(p)}
            >
              <Text
                style={[
                  styles.gridButtonText,
                  pair === p && styles.gridButtonTextActive,
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Direction */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trade Direction</Text>
        </View>
        <View style={styles.directionGroup}>
          {DIRECTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.directionButton,
                direction === d && styles.directionButtonActive,
                d === "Buy" && direction === d && { 
                  backgroundColor: '#4caf50',
                  borderColor: '#4caf50'
                },
                d === "Sell" && direction === d && { 
                  backgroundColor: '#f44336',
                  borderColor: '#f44336'
                },
              ]}
              onPress={() => setDirection(d as TradeDirection)}
            >
              <Text style={styles.directionIcon}>
                {d === "Buy" ? '↑' : '↓'}
              </Text>
              <Text
                style={[
                  styles.directionText,
                  direction === d && styles.directionTextActive,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Session */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trading Session</Text>
          <View style={styles.sessionIndicator}>
            <View style={styles.sessionDot} />
            <Text style={styles.sessionText}>{session}</Text>
          </View>
        </View>
        <View style={styles.sessionGroup}>
          {SESSIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sessionButton, session === s && styles.sessionButtonActive]}
              onPress={() => setSession(s as TradeSession)}
            >
              <Text style={styles.sessionEmoji}>
                {s === 'London' ? '🇬🇧' : s === 'NY' ? '🇺🇸' : '🌏'}
              </Text>
              <Text
                style={[
                  styles.sessionButtonText,
                  session === s && styles.sessionButtonTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Price Inputs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Levels</Text>
        <View style={styles.priceInputsContainer}>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.inputLabel}>Entry Price</Text>
            <View style={styles.inputWithIcon}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00000"
                placeholderTextColor="#666"
                value={entryPrice}
                onChangeText={setEntryPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.priceInputWrapper}>
            <Text style={styles.inputLabel}>Stop Loss</Text>
            <View style={styles.inputWithIcon}>
              <Text style={styles.inputIcon}>🛑</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00000"
                placeholderTextColor="#666"
                value={stopLoss}
                onChangeText={setStopLoss}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.priceInputWrapper}>
            <Text style={styles.inputLabel}>Take Profit</Text>
            <View style={styles.inputWithIcon}>
              <Text style={styles.inputIcon}>🎯</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00000"
                placeholderTextColor="#666"
                value={takeProfit}
                onChangeText={setTakeProfit}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Actual Exit (Optional) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exit Details</Text>
          <Text style={styles.optionalBadge}>Optional</Text>
        </View>
        
        <View style={styles.priceInputWrapper}>
          <Text style={styles.inputLabel}>Actual Exit Price</Text>
          <View style={styles.inputWithIcon}>
            <Text style={styles.inputIcon}>✓</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00000"
              placeholderTextColor="#666"
              value={actualExit}
              onChangeText={setActualExit}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.resultGroup}>
          {["Win", "Loss", "Break-even"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.resultButton,
                result === r && styles.resultButtonActive,
                r === "Win" && result === r && styles.resultWin,
                r === "Loss" && result === r && styles.resultLoss,
                r === "Break-even" && result === r && styles.resultBreakeven,
              ]}
              onPress={() => setResult(r as any)}
            >
              <Text style={styles.resultIcon}>
                {r === "Win" ? '✓' : r === "Loss" ? '✗' : '—'}
              </Text>
              <Text
                style={[
                  styles.resultButtonText,
                  result === r && styles.resultButtonTextActive,
                ]}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Strategy Selection */}
      {strategies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strategy Template</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.strategyGroup}>
              {strategies.map((strategy) => (
                <TouchableOpacity
                  key={strategy.id}
                  style={[
                    styles.strategyCard,
                    selectedStrategyId === strategy.id && styles.strategyCardActive,
                  ]}
                  onPress={() => {
                    setSelectedStrategyId(strategy.id);
                    setSetupType(strategy.name);
                  }}
                >
                  <View style={styles.strategyIcon}>
                    <Text style={styles.strategyIconText}>📋</Text>
                  </View>
                  <Text
                    style={[
                      styles.strategyName,
                      selectedStrategyId === strategy.id && styles.strategyNameActive,
                    ]}
                  >
                    {strategy.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Emotional State */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emotional State</Text>
          <View style={styles.emotionDisplay}>
            <Text style={styles.emotionValue}>{emotion}/10</Text>
          </View>
        </View>
        
        <View style={styles.emotionSlider}>
          {[...Array(10)].map((_, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.emotionDot,
                Number(emotion) > i && styles.emotionDotActive,
              ]}
              onPress={() => setEmotion(String(i + 1))}
            >
              <Text style={styles.emotionDotText}>{i + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.emotionLabels}>
          <Text style={styles.emotionLabel}>Fearful</Text>
          <Text style={styles.emotionLabel}>Confident</Text>
        </View>
      </View>

      {/* Rule Deviation */}
      <View style={styles.section}>
        <View style={styles.deviationCard}>
          <View style={styles.deviationContent}>
            <View style={styles.deviationIcon}>
              <Text style={styles.deviationIconText}>⚠️</Text>
            </View>
            <View style={styles.deviationInfo}>
              <Text style={styles.deviationTitle}>Rule Deviation</Text>
              <Text style={styles.deviationSubtitle}>
                Did you break any trading rules?
              </Text>
            </View>
          </View>
          <Switch
            value={ruleDeviation}
            onValueChange={setRuleDeviation}
            trackColor={{ false: "#444", true: "#f4433680" }}
            thumbColor={ruleDeviation ? "#f44336" : "#f5f5f5"}
          />
        </View>
      </View>

      {/* Checklist Selection */}
      {checklistItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Setup Checklist</Text>
            <View style={styles.checklistCounter}>
              <Text style={styles.checklistCounterText}>
                {checkedItems.length}/{checklistItems.length}
              </Text>
            </View>
          </View>

          <EditableChecklistTable
            items={checklistItems}
            onAddItem={(item) =>
              setChecklistItems([
                ...checklistItems,
                { ...item, id: Date.now().toString(), createdAt: new Date() },
              ])
            }
            onUpdateItem={(item) =>
              setChecklistItems(
                checklistItems.map((i) => (i.id === item.id ? item : i))
              )
            }
            onDeleteItem={(id) =>
              setChecklistItems(checklistItems.filter((i) => i.id !== id))
            }
          />

          <View style={styles.checklistGrid}>
            {checklistItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.checklistChip,
                  checkedItems.includes(item.id) && styles.checklistChipActive,
                ]}
                onPress={() =>
                  setCheckedItems(
                    checkedItems.includes(item.id)
                      ? checkedItems.filter((i) => i !== item.id)
                      : [...checkedItems, item.id]
                  )
                }
              >
                <View style={styles.checklistChipIcon}>
                  <Text style={styles.checklistChipIconText}>
                    {checkedItems.includes(item.id) ? '✓' : '○'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.checklistChipText,
                    checkedItems.includes(item.id) && styles.checklistChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Before/After Images */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chart Screenshots</Text>
        
        <View style={styles.imageSection}>
          <View style={styles.imageCard}>
            <View style={styles.imageHeader}>
              <Text style={styles.imageLabel}>Before Entry</Text>
              {beforeImage && <Text style={styles.imageCheck}>✓</Text>}
            </View>
            <ImageUploader
              screenshots={beforeImage ? [beforeImage] : []}
              onAdd={(uri) => setBeforeImage(uri)}
              onRemove={() => setBeforeImage("")}
            />
          </View>

          <View style={styles.imageCard}>
            <View style={styles.imageHeader}>
              <Text style={styles.imageLabel}>After Exit</Text>
              {afterImage && <Text style={styles.imageCheck}>✓</Text>}
            </View>
            <ImageUploader
              screenshots={afterImage ? [afterImage] : []}
              onAdd={(uri) => setAfterImage(uri)}
              onRemove={() => setAfterImage("")}
            />
          </View>
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trade Notes</Text>
        <View style={styles.notesContainer}>
          <TextInput
            style={styles.notesInput}
            placeholder="What was your thought process? What did you learn? Any observations about market conditions..."
            placeholderTextColor="#666"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={6}
          />
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonIcon}>✓</Text>
        <Text style={styles.submitButtonText}>Record Trade</Text>
      </TouchableOpacity>

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
  calculationCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  calcCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  calcLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  calcValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  calcIndicator: {
    backgroundColor: 'rgba(0, 212, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  calcBadge: {
    color: '#00d4d4',
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionBadge: {
    backgroundColor: '#00d4d420',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    color: '#00d4d4',
    fontSize: 12,
    fontWeight: '700',
  },
  optionalBadge: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridButton: {
    flex: 0,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.3)",
    borderRadius: 10,
    alignItems: "center",
  },
  gridButtonActive: {
    backgroundColor: "#00d4d4",
    borderColor: "#00d4d4",
  },
  gridButtonText: {
    color: "#f5f5f5",
    fontSize: 13,
    fontWeight: "600",
  },
  gridButtonTextActive: {
    color: "#0d0d0d",
  },
  directionGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  directionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#444",
    borderRadius: 12,
    gap: 8,
  },
  directionButtonActive: {
    borderWidth: 2,
  },
  directionIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  directionText: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700",
  },
  directionTextActive: {
    color: "#fff",
  },
  sessionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
  },
  sessionText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.3)",
    borderRadius: 12,
    gap: 6,
  },
  sessionButtonActive: {
    backgroundColor: "#00d4d420",
    borderColor: "#00d4d4",
    borderWidth: 2,
  },
  sessionEmoji: {
    fontSize: 24,
  },
  sessionButtonText: {
    color: "#f5f5f5",
    fontSize: 13,
    fontWeight: "600",
  },
  sessionButtonTextActive: {
    color: "#00d4d4",
  },
  priceInputsContainer: {
    gap: 12,
  },
  priceInputWrapper: {
    gap: 8,
  },
  inputLabel: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#00d4d4",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    color: "#f5f5f5",
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  resultGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  resultButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#444",
    borderRadius: 10,
    gap: 6,
  },
  resultButtonActive: {
    borderWidth: 2,
  },
  resultWin: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  resultLoss: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  resultBreakeven: {
    backgroundColor: '#ffa500',
    borderColor: '#ffa500',
  },
  resultIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  resultButtonText: {
    color: "#f5f5f5",
    fontSize: 13,
    fontWeight: "700",
  },
  resultButtonTextActive: {
    color: "#fff",
  },
  strategyGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  strategyCard: {
    minWidth: 120,
    alignItems: 'center',
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.3)",
    borderRadius: 12,
    gap: 8,
  },
  strategyCardActive: {
    backgroundColor: "#00d4d420",
    borderColor: "#00d4d4",
    borderWidth: 2,
  },
  strategyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  strategyIconText: {
    fontSize: 20,
  },
  strategyName: {
    color: "#f5f5f5",
    fontSize: 12,
    fontWeight: "600",
    textAlign: 'center',
  },
  strategyNameActive: {
    color: "#00d4d4",
  },
  emotionDisplay: {
    backgroundColor: '#ffa50020',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emotionValue: {
    color: '#ffa500',
    fontSize: 14,
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
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionDotActive: {
    backgroundColor: '#ffa500',
    borderColor: '#ffa500',
  },
  emotionDotText: {
    color: '#f5f5f5',
    fontSize: 11,
    fontWeight: '700',
  },
  emotionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  emotionLabel: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  deviationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
    borderRadius: 12,
    padding: 16,
  },
  deviationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  deviationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviationIconText: {
    fontSize: 20,
  },
  deviationInfo: {
    flex: 1,
  },
  deviationTitle: {
    color: '#f5f5f5',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  deviationSubtitle: {
    color: '#aaa',
    fontSize: 12,
  },
  checklistCounter: {
    backgroundColor: '#00d4d420',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checklistCounterText: {
    color: '#00d4d4',
    fontSize: 12,
    fontWeight: '700',
  },
  checklistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  checklistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    gap: 8,
  },
  checklistChipActive: {
    backgroundColor: '#00d4d420',
    borderColor: '#00d4d4',
  },
  checklistChipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 212, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistChipIconText: {
    color: '#00d4d4',
    fontSize: 12,
    fontWeight: '700',
  },
  checklistChipText: {
    color: '#f5f5f5',
    fontSize: 13,
    fontWeight: '600',
  },
  checklistChipTextActive: {
    color: '#00d4d4',
  },
  imageSection: {
    gap: 16,
  },
  imageCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  imageLabel: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  imageCheck: {
    color: '#4caf50',
    fontSize: 18,
    fontWeight: '700',
  },
  notesContainer: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#00d4d4',
    borderRadius: 12,
    padding: 4,
  },
  notesInput: {
    color: '#f5f5f5',
    fontSize: 14,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#00d4d4",
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  submitButtonIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0d0d0d',
  },
  submitButtonText: {
    color: "#0d0d0d",
    fontSize: 16,
    fontWeight: "700",
  },
});