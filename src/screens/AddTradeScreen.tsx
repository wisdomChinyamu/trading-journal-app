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
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import {
  calculateRiskToReward,
  calculateConfluenceScore,
  assignGrade,
  calculateWinRate,
  calculateAverageRR,
} from "../utils/calculations";
import { Trade, TradeDirection, TradeSession, Strategy } from "../types";
import { getUserStrategies, addTrade, getUserAccounts, createAccount, updateAccount, deleteAccount } from "../services/firebaseService";
import { useAppContext } from "../hooks/useAppContext";
import AccountModal from "../components/AccountModal";

type LabeledScreenshot = { uri: string; label?: string };

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
  const { state, dispatch } = useAppContext();
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
  
  const [selectedChecklist, setSelectedChecklist] = useState<string[]>([]);
  const [beforeImage, setBeforeImage] = useState<string>("");
  const [afterImage, setAfterImage] = useState<string>("");
  const [screenshots, setScreenshots] = useState<Array<{ uri: string; label?: string }>>([]);
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
  // const [selectedChecklist, setSelectedChecklist] = useState<string[]>([]);
  const [rr, setRR] = useState<number | null>(null);
  const [confluenceScore, setConfluenceScore] = useState<number | null>(null);
  const [riskAmount, setRiskAmount] = useState(""); // Add riskAmount state variable
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [riskPercentage, setRiskPercentage] = useState<number>(2);
  const [positionSize, setPositionSize] = useState<number | null>(null);
  const [isResultAutoCalculated, setIsResultAutoCalculated] = useState<boolean>(false);
  const [tradeDate, setTradeDate] = useState<Date>(new Date());
  const [tradeTimeText, setTradeTimeText] = useState<string>(new Date().toISOString().slice(11,16));
  const [marketCondition, setMarketCondition] = useState<'Trending'|'Ranging'|'Volatile'|'News'|''>('');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [pendingTrade, setPendingTrade] = useState<any | null>(null);
  // Responsive / layout
  const [screenWidth, setScreenWidth] = useState<number>(Dimensions.get('window').width);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(screenWidth < 380);
  const [isMediumScreen, setIsMediumScreen] = useState<boolean>(screenWidth >= 380 && screenWidth < 640);

  // Collapsible optional sections
  const [showRiskDetails, setShowRiskDetails] = useState<boolean>(!isSmallScreen);
  const [showTradeContextDetails, setShowTradeContextDetails] = useState<boolean>(!isSmallScreen);
  const thumbnailSize = isSmallScreen ? 72 : isMediumScreen ? 88 : 100;

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
    // Enable LayoutAnimation on Android
    if (Platform.OS === 'android' && UIManager && UIManager.setLayoutAnimationEnabledExperimental) {
      try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch (e) { /* ignore */ }
    }

    const onChange = ({ window }: { window: { width: number } }) => {
      setScreenWidth(window.width);
      setIsSmallScreen(window.width < 380);
      setIsMediumScreen(window.width >= 380 && window.width < 640);
      // collapse optional sections on small screens
      if (window.width < 380) {
        setShowRiskDetails(false);
        setShowTradeContextDetails(false);
      } else {
        setShowRiskDetails(true);
        setShowTradeContextDetails(true);
      }
    };

    const subscription: any = Dimensions.addEventListener('change', onChange as any);
    return () => {
      try {
        if (subscription && typeof subscription.remove === 'function') subscription.remove();
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  // Safe LayoutAnimation caller (fallback no-op for unsupported platforms)
  const configureLayoutAnimationNext = () => {
    try {
      if (Platform.OS === 'android' && UIManager && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
      if (LayoutAnimation && LayoutAnimation.configureNext) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
    } catch (e) {
      // noop fallback
    }
  };

  // Initialize selected account from context if available
  useEffect(() => {
    if (state.accounts && state.accounts.length > 0) {
      // If no selected account yet, pick the first
      if (!selectedAccountId) setSelectedAccountId(state.accounts[0].id);
      // Update account balance when selected changes
      const acc = state.accounts.find((a) => a.id === selectedAccountId) || state.accounts[0];
      if (acc) setAccountBalance(Number(acc.currentBalance || acc.startingBalance || 0));
    }
  }, [state.accounts, selectedAccountId]);

  // Auto-calculate result when actual exit is provided (unless manually overridden)
  useEffect(() => {
    if (!actualExit) return;
    if (!entryPrice || !stopLoss || !takeProfit) return;

    const e = Number(entryPrice);
    const sl = Number(stopLoss);
    const tp = Number(takeProfit);
    const ax = Number(actualExit);

    const determineResult = () => {
      if (direction === "Buy") {
        if (ax <= sl) return "Loss";
        if (ax >= tp) return "Win";
        if (ax === e) return "Break-even";
        return "";
      } else {
        // Sell
        if (ax >= sl) return "Loss";
        if (ax <= tp) return "Win";
        if (ax === e) return "Break-even";
        return "";
      }
    };

    const autoRes = determineResult();
    if (autoRes) {
      setResult(autoRes as any);
      setIsResultAutoCalculated(true);
    }
  }, [actualExit, entryPrice, stopLoss, takeProfit, direction]);

  // Position size & risk amount calculation
  useEffect(() => {
    if (!selectedAccountId) return;
    if (!entryPrice || !stopLoss) return;

    const e = Number(entryPrice);
    const sl = Number(stopLoss);
    const stopDistance = Math.abs(e - sl);
    if (stopDistance === 0) return;

    // Risk amount based on percentage of account balance
    const calculatedRiskAmount = accountBalance * (riskPercentage / 100);
    // Position size (units) = RiskAmount / StopDistance (price units)
    const calculatedPositionSize = calculatedRiskAmount / stopDistance;

    setPositionSize(parseFloat(calculatedPositionSize.toFixed(4)));
    setRiskAmount(String(parseFloat(calculatedRiskAmount.toFixed(2))));
  }, [selectedAccountId, accountBalance, entryPrice, stopLoss, riskPercentage]);

  useEffect(() => {
    if (selectedChecklist.length > 0 && checklistItems.length > 0) {
      // Create a map of item IDs to their weights
      const itemWeights = new Map<string, number>();
      checklistItems.forEach(item => {
        itemWeights.set(item.id, item.weight);
      });
      
      // Calculate confluence score using the proper formula
      const score = calculateConfluenceScore(selectedChecklist, itemWeights);
      setConfluenceScore(parseFloat(score.toFixed(2)));
    } else {
      setConfluenceScore(null);
    }
  }, [selectedChecklist, checklistItems]);

  // Account modal and management handlers
  const openAccountModal = () => setAccountModalVisible(true);
  const closeAccountModal = () => {
    setAccountModalVisible(false);
    setEditingAccount(null);
  };

  const refreshAccounts = async () => {
    try {
      const userId = state.user?.uid;
      if (!userId) return;
      const accounts = await getUserAccounts(userId);
      dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
    } catch (err) {
      console.error('Failed to refresh accounts', err);
    }
  };

  const handleCreateAccount = async (name: string, startingBalance: number) => {
    try {
      const userId = state.user?.uid;
      if (!userId) throw new Error('Not authenticated');
      await createAccount(userId, name, startingBalance);
      await refreshAccounts();
    } catch (err) {
      console.error('Create account failed', err);
    }
  };

  const handleUpdateAccount = async (accountId: string, updates: Partial<any>) => {
    try {
      await updateAccount(accountId, updates as any);
      await refreshAccounts();
    } catch (err) {
      console.error('Update account failed', err);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteAccount(accountId);
      await refreshAccounts();
      if (selectedAccountId === accountId) setSelectedAccountId("");
    } catch (err) {
      console.error('Delete account failed', err);
    }
  };

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    const acc = state.accounts.find((a) => a.id === accountId);
    if (acc) setAccountBalance(Number(acc.currentBalance || acc.startingBalance || 0));
  };

  const handleSubmit = async () => {
    if (!entryPrice || !stopLoss || !takeProfit) {
      Alert.alert(
        "Validation Error",
        "Please fill in entry, stop loss, and take profit prices"
      );
      return;
    }

    if (!selectedAccountId) {
      Alert.alert("Validation Error", "Please select a trading account for this trade.");
      return;
    }

    // Directional price validation
    const e = Number(entryPrice);
    const sl = Number(stopLoss);
    const tp = Number(takeProfit);
    if (direction === "Buy") {
      if (!(sl < e && e < tp)) {
        Alert.alert("Validation Error", "For a Buy trade ensure Stop Loss < Entry < Take Profit.");
        return;
      }
    } else {
      if (!(tp < e && e < sl)) {
        Alert.alert("Validation Error", "For a Sell trade ensure Take Profit < Entry < Stop Loss.");
        return;
      }
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

    // Build trade timestamp combining date + time text (if provided)
    let tradeTimestamp = new Date(tradeDate);
    try {
      if (tradeTimeText && tradeTimeText.includes(':')) {
        const [hh, mm] = tradeTimeText.split(':').map((s) => parseInt(s, 10));
        if (!isNaN(hh) && !isNaN(mm)) {
          tradeTimestamp.setHours(hh, mm, 0, 0);
        }
      }
    } catch (err) {
      // keep default tradeDate if parsing fails
    }

    const previewTrade: any = {
      pair: pair as any,
      direction,
      session,
      accountId: selectedAccountId || undefined,
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
      screenshots: screenshots,
      notes,
      checklist: selectedChecklist,
      riskAmount: riskAmount ? Number(riskAmount) : undefined,
      marketCondition: marketCondition || undefined,
      tradeTime: tradeTimestamp,
    };

    // Show confirmation modal with previewTrade
    setPendingTrade(previewTrade);
    setShowConfirmation(true);
  };

  // Confirm and save the pending trade (uploads screenshots then persists)
  const confirmAndSaveTrade = async () => {
    if (!pendingTrade) return;
    try {
      const userId = state.user?.uid;
      if (!userId) throw new Error("User not authenticated");

      // Upload any local blobs from the labeled screenshots array
      let uploadedScreenshots = [...(pendingTrade.screenshots || [])];
      for (let i = 0; i < uploadedScreenshots.length; i++) {
        const sObj = uploadedScreenshots[i];
        if (sObj && String(sObj.uri).startsWith("blob:")) {
          const uploaded = (await uploadTradeImage("temp", sObj.uri as any)) || sObj.uri;
          uploadedScreenshots[i] = { ...sObj, uri: uploaded };
        }
      }

      const toSave = {
        ...pendingTrade,
        screenshots: uploadedScreenshots.filter(Boolean),
      } as Omit<Trade, "id">;

      await addTrade(userId, toSave);
      setShowConfirmation(false);
      setPendingTrade(null);
      navigation.goBack();
      Alert.alert("Success", `Trade recorded: ${pair} ${direction}`);
    } catch (err) {
      console.error('Error saving confirmed trade', err);
      Alert.alert('Error', 'Failed to save trade. Please try again.');
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
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ paddingBottom: 260, paddingTop: 12, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      nestedScrollEnabled={true}
    >
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

      {/* Account Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trading Account</Text>
          <TouchableOpacity onPress={openAccountModal}>
            <Text style={{ color: '#00d4d4', fontWeight: '700' }}>Manage Accounts</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {state.accounts && state.accounts.length > 0 ? (
            state.accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.gridButton,
                  selectedAccountId === acc.id && styles.gridButtonActive,
                ]}
                onPress={() => handleSelectAccount(acc.id)}
              >
                <Text style={[styles.gridButtonText, selectedAccountId === acc.id && styles.gridButtonTextActive]}>
                  {acc.name}
                </Text>
                <Text style={{ color: '#aaa', fontSize: 12 }}>${acc.currentBalance?.toFixed ? acc.currentBalance.toFixed(2) : acc.currentBalance}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity style={styles.gridButton} onPress={openAccountModal}>
              <Text style={styles.gridButtonText}>Create Account</Text>
            </TouchableOpacity>
          )}
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

      {/* Trade Context (collapsible)*/}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trade Context</Text>
            <TouchableOpacity onPress={() => { configureLayoutAnimationNext(); setShowTradeContextDetails(!showTradeContextDetails); }} style={{ padding: 8, borderRadius: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.sectionToggle}>{showTradeContextDetails ? 'Hide' : 'Show'}</Text>
                <Text
                  style={[styles.chevron, { transform: [{ rotate: showTradeContextDetails ? '180deg' : '0deg' }] }]}
                >
                  ▾
                </Text>
              </View>
            </TouchableOpacity>
        </View>

        {showTradeContextDetails && (
          <View>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.inputLabel}>Entry Date</Text>
              <TextInput
                style={styles.priceInput}
                value={tradeDate.toISOString().slice(0,10)}
                onChangeText={(t) => {
                  const d = new Date(t);
                  if (!isNaN(d.getTime())) setTradeDate(d);
                }}
              />
            </View>

            <View style={styles.priceInputWrapper}>
              <Text style={styles.inputLabel}>Entry Time (HH:MM)</Text>
              <TextInput
                style={styles.priceInput}
                value={tradeTimeText}
                onChangeText={setTradeTimeText}
                placeholder="14:30"
              />
            </View>

            <View style={{ marginTop: 8 }}>
              <Text style={styles.inputLabel}>Market Condition</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {['Trending','Ranging','Volatile','News'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.gridButton, marketCondition === c && styles.gridButtonActive]}
                    onPress={() => setMarketCondition(c as any)}
                  >
                    <Text style={[styles.gridButtonText, marketCondition === c && styles.gridButtonTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
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

      {/* Risk Management (collapsible) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Risk Management</Text>
            <TouchableOpacity onPress={() => { configureLayoutAnimationNext(); setShowRiskDetails(!showRiskDetails); }} style={{ padding: 8, borderRadius: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.sectionToggle}>{showRiskDetails ? 'Hide' : 'Show'}</Text>
                <Text
                  style={[styles.chevron, { transform: [{ rotate: showRiskDetails ? '180deg' : '0deg' }] }]}
                >
                  ▾
                </Text>
              </View>
            </TouchableOpacity>
        </View>

        {showRiskDetails && (
          <View>
            <Text style={styles.inputLabel}>Account Balance</Text>
            <Text style={{ color: '#f5f5f5', fontWeight: '700' }}>${accountBalance?.toFixed ? accountBalance.toFixed(2) : accountBalance}</Text>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>Risk %</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.priceInput}
                  value={String(riskPercentage)}
                  onChangeText={(t) => setRiskPercentage(Number(t) || 0)}
                  keyboardType="decimal-pad"
                />
                <Text style={{ color: '#aaa', fontWeight: '700' }}>%</Text>
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>Calculated Position Size</Text>
              <Text style={{ color: '#f5f5f5', fontWeight: '700' }}>{positionSize ? positionSize : '—'}</Text>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>Risk Amount</Text>
              <Text style={{ color: '#f5f5f5', fontWeight: '700' }}>${riskAmount || '—'}</Text>
            </View>
          </View>
        )}
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
              onPress={() => {
                setResult(r as any);
                setIsResultAutoCalculated(false);
              }}
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
                {selectedChecklist.length}/{checklistItems.length}
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
                  selectedChecklist.includes(item.id) && styles.checklistChipActive,
                ]}
                onPress={() =>
                  setSelectedChecklist(
                    selectedChecklist.includes(item.id)
                      ? selectedChecklist.filter((i) => i !== item.id)
                      : [...selectedChecklist, item.id]
                  )
                }
              >
                <View style={styles.checklistChipIcon}>
                  <Text style={styles.checklistChipIconText}>
                    {selectedChecklist.includes(item.id) ? '✓' : '○'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.checklistChipText,
                    selectedChecklist.includes(item.id) && styles.checklistChipTextActive,
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
              <Text style={styles.imageLabel}>Screenshots</Text>
              {screenshots.length > 0 && <Text style={styles.imageCheck}>✓</Text>}
            </View>
            <ImageUploader
              screenshots={screenshots}
              onAdd={(uri) => setScreenshots([...screenshots, { uri, label: 'Other' }])}
              onRemove={(uri) => setScreenshots(screenshots.filter((s) => s.uri !== uri))}
              onUpdateLabel={(uri, label) => setScreenshots(screenshots.map(s => s.uri === uri ? { ...s, label } : s))}
              maxImages={8}
              thumbnailSize={thumbnailSize}
              thumbnailMargin={isSmallScreen ? 8 : isMediumScreen ? 10 : 12}
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

      <AccountModal
        visible={accountModalVisible}
        accounts={state.accounts || []}
        selectedAccountId={selectedAccountId}
        onSelect={(id) => {
          handleSelectAccount(id);
          closeAccountModal();
        }}
        onAddAccount={() => {
          setEditingAccount(null);
          setAccountModalVisible(true);
        }}
        onClose={closeAccountModal}
        onCreateAccount={handleCreateAccount}
        onUpdateAccount={handleUpdateAccount}
        onDeleteAccount={handleDeleteAccount}
        editingAccount={editingAccount}
      />

      {/* Confirmation Modal */}
      <Modal visible={showConfirmation} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#0d0d0d', borderRadius: 12, padding: 16 }}>
            <Text style={{ color: '#f5f5f5', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Confirm Trade</Text>
            {pendingTrade && (
              <View>
                <Text style={{ color: '#aaa' }}>{pendingTrade.pair} • {pendingTrade.direction}</Text>
                <Text style={{ color: '#f5f5f5', fontWeight: '700', marginTop: 8 }}>Entry: {pendingTrade.entryPrice}</Text>
                <Text style={{ color: '#f5f5f5', fontWeight: '700' }}>SL: {pendingTrade.stopLoss} • TP: {pendingTrade.takeProfit}</Text>
                <Text style={{ color: '#aaa', marginTop: 8 }}>R:R: {pendingTrade.riskToReward ? `1:${pendingTrade.riskToReward.toFixed ? pendingTrade.riskToReward.toFixed(2) : pendingTrade.riskToReward}` : '—'}</Text>
                <Text style={{ color: '#aaa' }}>Confluence: {pendingTrade.confluenceScore ? `${pendingTrade.confluenceScore.toFixed ? pendingTrade.confluenceScore.toFixed(0) : pendingTrade.confluenceScore}%` : '—'}</Text>
                <Text style={{ color: '#aaa' }}>Account: {state.accounts.find(a => a.id === pendingTrade.accountId)?.name || '—'}</Text>
                <Text style={{ color: '#aaa' }}>Risk Amount: ${pendingTrade.riskAmount ?? '—'}</Text>
                <Text style={{ color: '#aaa' }}>Market: {pendingTrade.marketCondition || '—'}</Text>

                {/* Metrics preview */}
                <View style={{ marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#222' }}>
                  <Text style={{ color: '#aaa', marginBottom: 6, fontWeight: '700' }}>Projected Impact</Text>
                  <Text style={{ color: '#aaa' }}>
                    Win Rate: {calculateWinRate(state.trades || []).toFixed(1)}% → {pendingTrade.result ? calculateWinRate([...(state.trades || []), pendingTrade as any]).toFixed(1) : '—'}%
                  </Text>
                  <Text style={{ color: '#aaa' }}>
                    Avg R:R: {calculateAverageRR(state.trades || []).toFixed(2)} → {pendingTrade.riskToReward ? calculateAverageRR([...(state.trades || []), pendingTrade as any]).toFixed(2) : '—'}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#444', flex: 1, marginRight: 8 }]}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={styles.submitButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#00d4d4', flex: 1 }]}
                onPress={confirmAndSaveTrade}
              >
                <Text style={styles.submitButtonText}>Confirm & Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 140 }} />
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
  sectionToggle: {
    color: '#00d4d4',
    fontWeight: '700',
    fontSize: 13,
  },
  chevron: {
    color: '#00d4d4',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
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