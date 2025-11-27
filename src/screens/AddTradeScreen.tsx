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
import { getUserStrategies } from "../services/firebaseService";

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
  const userId = "current-user"; // Replace with actual user ID from context/auth
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    null
  );
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  useEffect(() => {
    getUserStrategies(userId).then(setStrategies);
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

  // Calculate R:R when prices change
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

  // Calculate confluence score when checklist selection changes
  useEffect(() => {
    // This would be calculated based on user's checklist template items
    // For now, we'll use a placeholder
    if (selectedChecklist.length > 0) {
      const score = (selectedChecklist.length / 5) * 100; // Assuming 5 items max
      setConfluenceScore(parseFloat(score.toFixed(2)));
    } else {
      setConfluenceScore(null);
    }
  }, [selectedChecklist]);

  const handleSubmit = async () => {
    // Validation
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

    // Upload images to Supabase if present
    let beforeImageUrl = beforeImage;
    let afterImageUrl = afterImage;
    if (beforeImage && beforeImage.startsWith("blob:")) {
      // Convert blob URL to File (web only)
      // For demo, skip conversion
      // Use tradeId or 'temp' for upload
      beforeImageUrl =
        (await uploadTradeImage("temp", beforeImage as any)) || beforeImage;
    }
    if (afterImage && afterImage.startsWith("blob:")) {
      afterImageUrl =
        (await uploadTradeImage("temp", afterImage as any)) || afterImage;
    }
    // Create trade object
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

    // Navigate back or submit
    navigation.goBack();
    Alert.alert("Success", `Trade recorded: ${pair} ${direction}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Pair Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pair</Text>
        <View style={styles.buttonGroup}>
          {PAIRS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.button, pair === p && styles.buttonActive]}
              onPress={() => setPair(p)}
            >
              <Text
                style={[
                  styles.buttonText,
                  pair === p && styles.buttonTextActive,
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
        <Text style={styles.sectionTitle}>Direction</Text>
        <View style={styles.buttonGroup}>
          {DIRECTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.button,
                direction === d && styles.buttonActive,
                d === "Buy" && { backgroundColor: "#2d5d3d" },
              ]}
              onPress={() => setDirection(d as TradeDirection)}
            >
              <Text
                style={[
                  styles.buttonText,
                  direction === d && styles.buttonTextActive,
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
        <Text style={styles.sectionTitle}>Session</Text>
        <View style={styles.buttonGroup}>
          {SESSIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.button, session === s && styles.buttonActive]}
              onPress={() => setSession(s as TradeSession)}
            >
              <Text
                style={[
                  styles.buttonText,
                  session === s && styles.buttonTextActive,
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
        <Text style={styles.sectionTitle}>Prices</Text>
        <TextInput
          style={styles.input}
          placeholder="Entry Price"
          placeholderTextColor="#666"
          value={entryPrice}
          onChangeText={setEntryPrice}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Stop Loss"
          placeholderTextColor="#666"
          value={stopLoss}
          onChangeText={setStopLoss}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Take Profit"
          placeholderTextColor="#666"
          value={takeProfit}
          onChangeText={setTakeProfit}
          keyboardType="decimal-pad"
        />

        {/* R:R Display */}
        {rr !== null && (
          <View style={styles.rrDisplay}>
            <Text style={styles.rrLabel}>Risk:Reward</Text>
            <Text style={styles.rrValue}>1:{rr.toFixed(2)}</Text>
          </View>
        )}
      </View>

      {/* Actual Exit (Optional) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exit Details (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Actual Exit Price"
          placeholderTextColor="#666"
          value={actualExit}
          onChangeText={setActualExit}
          keyboardType="decimal-pad"
        />
        <View style={styles.buttonGroup}>
          {["Win", "Loss", "Break-even"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.button,
                result === r && styles.buttonActive,
                r === "Win" && styles.winButton,
                r === "Loss" && styles.lossButton,
              ]}
              onPress={() => setResult(r as any)}
            >
              <Text
                style={[
                  styles.buttonText,
                  result === r && styles.buttonTextActive,
                ]}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Strategy Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strategy</Text>
        <View style={styles.buttonGroup}>
          {strategies.map((strategy) => (
            <TouchableOpacity
              key={strategy.id}
              style={[
                styles.button,
                selectedStrategyId === strategy.id && styles.buttonActive,
              ]}
              onPress={() => {
                setSelectedStrategyId(strategy.id);
                setSetupType(strategy.name);
              }}
            >
              <Text
                style={[
                  styles.buttonText,
                  selectedStrategyId === strategy.id && styles.buttonTextActive,
                  { fontSize: 11 },
                ]}
              >
                {strategy.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Emotional Rating */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emotional Rating: {emotion}/10</Text>
        <View style={styles.sliderContainer}>
          <TextInput
            style={styles.input}
            value={emotion}
            onChangeText={setEmotion}
            keyboardType="numeric"
            placeholder="1-10"
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {/* Rule Deviation */}
      <View style={styles.section}>
        <View style={styles.deviationRow}>
          <Text style={styles.sectionTitle}>Rule Deviation</Text>
          <Switch
            value={ruleDeviation}
            onValueChange={setRuleDeviation}
            trackColor={{ false: "#444", true: "#81c784" }}
            thumbColor={ruleDeviation ? "#4caf50" : "#f5f5f5"}
          />
        </View>
      </View>

      {/* Checklist Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Checklist</Text>
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
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
          }}
        >
          {checklistItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: checkedItems.includes(item.id)
                  ? "#00d4d4"
                  : "#222",
              }}
              onPress={() =>
                setCheckedItems(
                  checkedItems.includes(item.id)
                    ? checkedItems.filter((i) => i !== item.id)
                    : [...checkedItems, item.id]
                )
              }
            >
              <Text
                style={{
                  color: checkedItems.includes(item.id) ? "#000" : "#fff",
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Before/After Images */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Before Image</Text>
        <ImageUploader
          screenshots={beforeImage ? [beforeImage] : []}
          onAdd={(uri) => setBeforeImage(uri)}
          onRemove={() => setBeforeImage("")}
        />
        <Text style={styles.sectionTitle}>After Image</Text>
        <ImageUploader
          screenshots={afterImage ? [afterImage] : []}
          onAdd={(uri) => setAfterImage(uri)}
          onRemove={() => setAfterImage("")}
        />
      </View>
      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Trade reflections, observations, lessons learned..."
          placeholderTextColor="#666"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Record Trade</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#f5f5f5",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#00d4d4",
    borderRadius: 8,
    color: "#f5f5f5",
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  buttonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  button: {
    flex: 0.48,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonActive: {
    backgroundColor: "#00d4d4",
    borderColor: "#00d4d4",
  },
  buttonText: {
    color: "#f5f5f5",
    fontSize: 12,
    fontWeight: "600",
  },
  buttonTextActive: {
    color: "#0d0d0d",
  },
  winButton: {
    borderColor: "#4caf50",
  },
  lossButton: {
    borderColor: "#f44336",
  },
  rrDisplay: {
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#00d4d4",
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    alignItems: "center",
  },
  rrLabel: {
    color: "#00d4d4",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  rrValue: {
    color: "#f5f5f5",
    fontSize: 24,
    fontWeight: "700",
  },
  confluenceDisplay: {
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#00d4d4",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  confluenceValue: {
    color: "#f5f5f5",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  confluenceGrade: {
    color: "#00d4d4",
    fontSize: 14,
    fontWeight: "600",
  },
  deviationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#00d4d4",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  submitButtonText: {
    color: "#0d0d0d",
    fontSize: 16,
    fontWeight: "700",
  },
});
