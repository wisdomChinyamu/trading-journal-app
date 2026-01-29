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
  calculateEffectiveRR,
  calculateConfluenceScore,
  assignGrade,
  calculateWinRate,
  calculateAverageRR,
} from "../utils/calculations";
import { Trade, TradeDirection, TradeSession, Strategy } from "../types";
import {
  getUserStrategies,
  addTrade,
  getUserAccounts,
  updateAccount,
  updateTrade,
} from "../services/firebaseService";
import { useAppContext } from "../hooks/useAppContext";
import AccountModal from "../components/AccountModal";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/ConfirmModal";
import { useTheme } from "../components/ThemeProvider";
import computeTradePnl from "../utils/tradeUtils";
import {
  calculatePositionSize,
  getFXSpecs,
  getCommoditySpecs,
  GOLD_SPECS,
  type InstrumentType,
  type RiskConfig,
  type AccountForPositionSizing,
  type TradeForPositionSizing,
} from "../utils/positionSizingUtils";

type LabeledScreenshot = { uri: string; label?: string };

interface AddTradeScreenProps {
  navigation: any;
  route?: any;
}

const PAIRS = [
  "GBPUSD",
  "GBPJPY",
  "EURUSD",
  "USDJPY",
  "USDCAD",
  "XAUUSD",
  "XAUEUR",
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
  const { colors } = useTheme();
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
  const [screenshots, setScreenshots] = useState<
    Array<{ uri: string; label?: string }>
  >([]);
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
  const [riskInputMode, setRiskInputMode] = useState<"percentage" | "amount">(
    "percentage",
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [riskPercentage, setRiskPercentage] = useState<string>("2");
  const [positionSize, setPositionSize] = useState<number | null>(null);
  const [instrumentType, setInstrumentType] = useState<InstrumentType>("FX");
  const [positionSizingErrors, setPositionSizingErrors] = useState<string[]>([]);
  const [isResultAutoCalculated, setIsResultAutoCalculated] =
    useState<boolean>(false);
  const [tradeDate, setTradeDate] = useState<Date>(new Date());
  const [tradeTimeText, setTradeTimeText] = useState<string>(
    new Date().toISOString().slice(11, 16),
  );
  const [dateInputSupported, setDateInputSupported] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [marketCondition, setMarketCondition] = useState<
    "Trending" | "Ranging" | "Volatile" | "News" | ""
  >("");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [pendingTrade, setPendingTrade] = useState<any | null>(null);
  const editingTrade = route?.params?.trade || null;
  const toast = useToast();

  // Debug / assist: notify when confirmation modal opens so we can verify web/native behavior
  useEffect(() => {
    try {
      if (showConfirmation) {
        console.warn("showConfirmation toggled true, platform:", Platform.OS);
        try {
          toast?.show?.("Opening confirmation", "info", 1200);
        } catch (e) {}
      }
    } catch (e) {}
  }, [showConfirmation]);

  const showValidation = (msg: string) => {
    try {
      console.warn("Validation failed:", msg);
      toast?.show?.(msg, "error");
    } catch (e) {}
    try {
      Alert.alert("Validation Error", msg);
    } catch (e) {}
  };

  const parseDate = (value: any): Date | null => {
    if (value === undefined || value === null) return null;
    if (typeof value?.toDate === "function") {
      try {
        const d = value.toDate();
        return isNaN(d.getTime()) ? null : d;
      } catch (e) {
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
  // Responsive / layout
  const [screenWidth, setScreenWidth] = useState<number>(
    Dimensions.get("window").width,
  );
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(
    screenWidth < 380,
  );
  const [isMediumScreen, setIsMediumScreen] = useState<boolean>(
    screenWidth >= 380 && screenWidth < 640,
  );

  // Collapsible optional sections
  const [showRiskDetails, setShowRiskDetails] =
    useState<boolean>(!isSmallScreen);
  const [showTradeContextDetails, setShowTradeContextDetails] =
    useState<boolean>(!isSmallScreen);
  const thumbnailSize = isSmallScreen ? 72 : isMediumScreen ? 88 : 100;

  useEffect(() => {
    // detect native date input support on web
    if (typeof document !== "undefined") {
      try {
        const input = document.createElement("input");
        input.setAttribute("type", "date");
        setDateInputSupported(input.type === "date");
      } catch (e) {
        setDateInputSupported(false);
      }
    }

    // build year/month/day helpers for dropdown fallback
    // keep selected values synced to tradeDate below (see effect later)
  }, []);

  // helpers for web dropdowns
  const webToday = typeof window !== "undefined" ? new Date() : new Date();
  const webCurrentYear = webToday.getFullYear();
  const years = Array.from({ length: webCurrentYear - 1900 + 1 }, (_, i) =>
    (1900 + i).toString(),
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0"),
  );
  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const days = (() => {
    const y = selectedYear ? parseInt(selectedYear, 10) : webCurrentYear;
    const m = selectedMonth ? parseInt(selectedMonth, 10) : 1;
    const max = daysInMonth(y, m);
    return Array.from({ length: max }, (_, i) =>
      (i + 1).toString().padStart(2, "0"),
    );
  })();

  // Sync dropdown selections into tradeDate
  useEffect(() => {
    if (selectedYear && selectedMonth && selectedDay) {
      const parsed = new Date(
        `${selectedYear}-${selectedMonth}-${selectedDay}`,
      );
      if (!isNaN(parsed.getTime())) setTradeDate(parsed);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  const webInputStyle: any = {
    padding: 12,
    borderRadius: 8,
    width: "100%",
    backgroundColor: colors.surface,
    color: colors.text,
    border: `1px solid ${colors.neutral}`,
    fontSize: 15,
    boxSizing: "border-box",
  };
  const webSelectStyle: any = {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    color: colors.text,
    border: `1px solid ${colors.neutral}`,
    fontSize: 15,
  };

  // Calculate effective R:R when price inputs change
  useEffect(() => {
    if (entryPrice && stopLoss && takeProfit) {
      const effective = calculateEffectiveRR(
        Number(entryPrice),
        Number(stopLoss),
        Number(takeProfit),
        direction,
        actualExit ? Number(actualExit) : undefined,
      );
      setRR(parseFloat(Number(effective || 0).toFixed(2)));
    } else {
      setRR(null);
    }
  }, [entryPrice, stopLoss, takeProfit, direction, actualExit]);

  useEffect(() => {
    // Enable LayoutAnimation on Android
    if (
      Platform.OS === "android" &&
      UIManager &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      try {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      } catch (e) {
        /* ignore */
      }
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

    const subscription: any = Dimensions.addEventListener(
      "change",
      onChange as any,
    );
    return () => {
      try {
        if (subscription && typeof subscription.remove === "function")
          subscription.remove();
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  // Safe LayoutAnimation caller (fallback no-op for unsupported platforms)
  const configureLayoutAnimationNext = () => {
    try {
      if (
        Platform.OS === "android" &&
        UIManager &&
        UIManager.setLayoutAnimationEnabledExperimental
      ) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
      if (LayoutAnimation && LayoutAnimation.configureNext) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
    } catch (e) {
      // noop fallback
    }
  };

  // Debug: log modal visibility flags so we can confirm overlays aren't unintentionally blocking scroll
  useEffect(() => {
    try {
      // Use console.warn so devtools show this prominently during debugging
      console.warn(
        "AddTradeScreen modal flags -> accountModalVisible:",
        accountModalVisible,
        "showConfirmation:",
        showConfirmation,
      );
    } catch (e) {
      // ignore
    }
  }, [accountModalVisible, showConfirmation]);

  // Initialize selected account from context if available
  useEffect(() => {
    // If opened in edit mode, populate fields from the trade passed in
    try {
      if (editingTrade) {
        setPair(editingTrade.pair || "GBPUSD");
        setDirection(editingTrade.direction || "Buy");
        setSession(editingTrade.session || "London");
        setInstrumentType(editingTrade.instrumentType || "FX");
        setEntryPrice(
          editingTrade.entryPrice ? String(editingTrade.entryPrice) : "",
        );
        setStopLoss(editingTrade.stopLoss ? String(editingTrade.stopLoss) : "");
        setTakeProfit(
          editingTrade.takeProfit ? String(editingTrade.takeProfit) : "",
        );
        setActualExit(
          editingTrade.actualExit ? String(editingTrade.actualExit) : "",
        );
        setResult(editingTrade.result || "");
        setSetupType(editingTrade.setupType || "");
        setEmotion(String(editingTrade.emotionalRating || 5));
        setRuleDeviation(!!editingTrade.ruleDeviation);
        setNotes(editingTrade.notes || "");
        setSelectedChecklist(editingTrade.checklist || []);
        setScreenshots(editingTrade.screenshots || []);
        setSelectedAccountId(
          editingTrade.accountId ||
            (state.accounts && state.accounts[0]?.id) ||
            "",
        );
        setRiskAmount(
          editingTrade.riskAmount ? String(editingTrade.riskAmount) : "",
        );
        // Derive and populate riskPercentage when editing an existing trade
        try {
          if (
            editingTrade.riskPercentage !== undefined &&
            editingTrade.riskPercentage !== null
          ) {
            setRiskPercentage(String(editingTrade.riskPercentage));
          } else if (editingTrade.riskAmount) {
            const account =
              (state.accounts &&
                state.accounts.find((a) => a.id === editingTrade.accountId)) ||
              (state.accounts && state.accounts[0]);
            const base = account
              ? Number(account.currentBalance || account.startingBalance || 0)
              : 0;
            if (base > 0) {
              const pct = (Number(editingTrade.riskAmount) / base) * 100;
              if (!isNaN(pct) && isFinite(pct))
                setRiskPercentage(String(parseFloat(pct.toFixed(3))));
            }
          }
        } catch (e) {
          // ignore
        }
        const parsed =
          parseDate(editingTrade.tradeTime) ||
          parseDate(editingTrade.createdAt) ||
          new Date();
        setTradeDate(parsed);
        if (parsed) {
          setTradeTimeText(parsed.toISOString().slice(11, 16));
        }
      }
    } catch (e) {
      // ignore
    }
    if (state.accounts && state.accounts.length > 0) {
      // If no selected account yet, pick the first
      if (!selectedAccountId) setSelectedAccountId(state.accounts[0].id);
      // Update account balance when selected changes
      const acc =
        state.accounts.find((a) => a.id === selectedAccountId) ||
        state.accounts[0];
      if (acc)
        setAccountBalance(
          Number(acc.currentBalance || acc.startingBalance || 0),
        );
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
        // If exit is between entry and TP -> treat as a partial win
        if (ax > e && ax < tp) return "Win";
        // If exit is between SL and entry -> treat as a partial loss
        if (ax < e && ax > sl) return "Loss";
        return "";
      } else {
        // Sell
        if (ax >= sl) return "Loss";
        if (ax <= tp) return "Win";
        if (ax === e) return "Break-even";
        // For sell, profit if actual exit < entry
        if (ax < e && ax > tp) return "Win";
        if (ax > e && ax < sl) return "Loss";
        return "";
      }
    };

    const autoRes = determineResult();
    if (autoRes) {
      setResult(autoRes as any);
      setIsResultAutoCalculated(true);
    }
  }, [actualExit, entryPrice, stopLoss, takeProfit, direction]);

  // Position size & risk amount calculation using Risk Engine
  useEffect(() => {
    if (!selectedAccountId) return;
    if (!entryPrice || !stopLoss) return;

    const account: AccountForPositionSizing = {
      balance: accountBalance,
      currency: "USD",
    };

    const trade: TradeForPositionSizing = {
      instrumentType,
      entryPrice: Number(entryPrice),
      stopLossPrice: Number(stopLoss),
      direction,
    };

    const riskConfig: RiskConfig = {
      riskType: riskInputMode === "percentage" ? "PERCENT" : "FIXED",
      riskValue:
        riskInputMode === "percentage"
          ? parseFloat(riskPercentage || "0")
          : parseFloat(riskAmount || "0"),
    };

    let instrumentSpecs: any;
    let exchangeRate = 1;

    switch (instrumentType) {
      case "FX":
        instrumentSpecs = getFXSpecs(pair);
        break;
      case "GOLD":
        instrumentSpecs = GOLD_SPECS;
        break;
      case "COMMODITY":
        instrumentSpecs = getCommoditySpecs(pair);
        break;
      case "STOCK":
        instrumentSpecs = {};
        break;
      default:
        setPositionSize(null);
        return;
    }

    const result = calculatePositionSize(
      trade,
      account,
      riskConfig,
      instrumentSpecs,
      exchangeRate
    );

    setPositionSizingErrors(result.validationErrors);

    if (result.validationErrors.length === 0) {
      setPositionSize(
        parseFloat(result.positionSize.toFixed(instrumentType === "STOCK" ? 0 : 4))
      );
      setRiskAmount(String(parseFloat(result.riskAmount.toFixed(2))));
    } else {
      setPositionSize(null);
    }
  }, [
    selectedAccountId,
    accountBalance,
    entryPrice,
    stopLoss,
    riskPercentage,
    riskAmount,
    riskInputMode,
    instrumentType,
    pair,
    direction,
  ]);

  useEffect(() => {
    if (selectedChecklist.length > 0 && checklistItems.length > 0) {
      // Create a map of item IDs to their weights
      const itemWeights = new Map<string, number>();
      checklistItems.forEach((item) => {
        itemWeights.set(item.id, item.weight);
      });

      // Calculate confluence score using the proper formula
      const score = calculateConfluenceScore(selectedChecklist, itemWeights);
      setConfluenceScore(parseFloat(score.toFixed(2)));
    } else {
      setConfluenceScore(null);
    }
  }, [selectedChecklist, checklistItems]);

  const refreshAccounts = async () => {
    try {
      const userId = state.user?.uid;
      if (!userId) return;
      const accounts = await getUserAccounts(userId);
      dispatch({ type: "SET_ACCOUNTS", payload: accounts });
    } catch (err) {
      console.error("Failed to refresh accounts", err);
    }
  };

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    const acc = state.accounts.find((a) => a.id === accountId);
    if (acc)
      setAccountBalance(Number(acc.currentBalance || acc.startingBalance || 0));
  };

  const handleSubmit = async () => {
    console.warn("handleSubmit called", {
      entryPrice,
      stopLoss,
      takeProfit,
      selectedAccountId,
      tradeDate: tradeDate?.toString(),
      tradeTimeText,
    });

    if (!entryPrice || !stopLoss || !takeProfit) {
      showValidation("Please fill in entry, stop loss, and take profit prices");
      return;
    }

    if (!selectedAccountId) {
      showValidation("Please select a trading account for this trade.");
      return;
    }

    // Directional price validation
    const e = Number(entryPrice);
    const sl = Number(stopLoss);
    const tp = Number(takeProfit);
    if (direction === "Buy") {
      if (!(sl < e && e < tp)) {
        console.warn("Directional validation failed for Buy", { e, sl, tp });
        showValidation(
          "For a Buy trade ensure Stop Loss < Entry < Take Profit.",
        );
        return;
      }
    } else {
      if (!(tp < e && e < sl)) {
        console.warn("Directional validation failed for Sell", { e, sl, tp });
        showValidation(
          "For a Sell trade ensure Take Profit < Entry < Stop Loss.",
        );
        return;
      }
    }

    if (
      Number(entryPrice) <= 0 ||
      Number(stopLoss) <= 0 ||
      Number(takeProfit) <= 0
    ) {
      console.warn("Price positive validation failed", {
        entryPrice,
        stopLoss,
        takeProfit,
      });
      showValidation("Prices must be greater than 0");
      return;
    }

    if (!rr) {
      console.warn("RR missing or zero", { rr });
      showValidation("Could not calculate R:R ratio. Check price inputs.");
      return;
    }

    // Build trade timestamp combining date + time text (if provided)
    // Ensure tradeDate is a valid date
    if (!tradeDate || isNaN(new Date(tradeDate).getTime())) {
      showValidation("Please enter a valid entry date.");
      return;
    }
    let tradeTimestamp = new Date(tradeDate);

    // If user provided a time string, enforce HH:MM 24-hour format
    if (tradeTimeText && tradeTimeText.length > 0) {
      const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(tradeTimeText)) {
        showValidation(
          "Please enter time in 24-hour format HH:MM (e.g. 14:30).",
        );
        return;
      }
    }
    try {
      if (tradeTimeText && tradeTimeText.includes(":")) {
        const [hh, mm] = tradeTimeText.split(":").map((s) => parseInt(s, 10));
        if (!isNaN(hh) && !isNaN(mm)) {
          tradeTimestamp.setHours(hh, mm, 0, 0);
        }
      }
    } catch (err) {
      // keep default tradeDate if parsing fails
    }

    const effectiveRR = calculateEffectiveRR(
      Number(entryPrice),
      Number(stopLoss),
      Number(takeProfit),
      direction,
      actualExit ? Number(actualExit) : undefined,
    );

    try {
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
        riskToReward: parseFloat(Number(effectiveRR || rr || 0).toFixed(2)),
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
        instrumentType: instrumentType || "FX",
        positionSize: positionSize || undefined,
      };

      // Debug: log preview before showing confirmation
      try {
        console.warn("previewTrade prepared", previewTrade);
      } catch (e) {}

      // Show confirmation modal with previewTrade
      setPendingTrade(previewTrade);
      setShowConfirmation(true);
      try {
        console.warn("setPendingTrade/setShowConfirmation called");
      } catch (e) {}
    } catch (err) {
      console.error("Error preparing previewTrade:", err);
      showValidation(
        "Unexpected error preparing trade preview. Check console.",
      );
      return;
    }
  };

  // Confirm and save the pending trade (uploads screenshots then persists)
  const confirmAndSaveTrade = async () => {
    if (!pendingTrade) return;
    try {
      console.warn("confirmAndSaveTrade called", { pendingTrade });
      const userId = state.user?.uid;
      console.warn("current user id", userId);
      if (!userId) throw new Error("User not authenticated");

      // Upload any local blobs from the labeled screenshots array
      let uploadedScreenshots = [...(pendingTrade.screenshots || [])];
      for (let i = 0; i < uploadedScreenshots.length; i++) {
        const sObj = uploadedScreenshots[i];
        if (sObj && String(sObj.uri).startsWith("blob:")) {
          const uploaded =
            (await uploadTradeImage("temp", sObj.uri as any)) || sObj.uri;
          uploadedScreenshots[i] = { ...sObj, uri: uploaded };
        }
      }

      const toSave = {
        ...pendingTrade,
        screenshots: uploadedScreenshots.filter(Boolean),
      } as Omit<Trade, "id">;
      if (editingTrade && editingTrade.id) {
        // Update existing trade
        await updateTrade(editingTrade.id, toSave as any);
        try {
          dispatch({
            type: "UPDATE_TRADE",
            payload: {
              ...(editingTrade as any),
              ...(toSave as any),
              id: editingTrade.id,
            },
          });
        } catch {}

        // If linked to an account, adjust balance by difference between new and old pnl
        try {
          const accountId = (toSave as any).accountId || editingTrade.accountId;
          if (accountId) {
            const calcPnl = (t: any) => {
              if (t?.pnl !== undefined && t?.pnl !== null)
                return Number(t.pnl) || 0;
              const risk = Math.abs(Number(t?.riskAmount) || 0);
              const rr = Number(t?.riskToReward) || 1;
              if (t?.result === "Win") return Math.round(risk * rr * 100) / 100;
              if (t?.result === "Loss") return Math.round(-risk * 100) / 100;
              return 0;
            };

            const oldPnl = computeTradePnl(editingTrade);
            const newPnl = computeTradePnl(toSave as any);
            const delta = newPnl - oldPnl;

            if (delta !== 0) {
              const currentAccounts = await getUserAccounts(userId);
              const acc = currentAccounts.find((a) => a.id === accountId);
              if (acc) {
                const newBalance = Number(acc.currentBalance || 0) + delta;
                await updateAccount(accountId, { currentBalance: newBalance });
                const updatedAccounts = await getUserAccounts(userId);
                try {
                  dispatch({ type: "SET_ACCOUNTS", payload: updatedAccounts });
                } catch {}
              }
            }
          }
        } catch (errAcc) {
          console.error(
            "Failed to update account balance after trade update",
            errAcc,
          );
        }

        setShowConfirmation(false);
        setPendingTrade(null);
        const updatedTrade = {
          ...(editingTrade as any),
          ...(toSave as any),
          id: editingTrade.id,
        };
        try {
          dispatch({ type: "UPDATE_TRADE", payload: updatedTrade });
        } catch {}
        try {
          toast.show("Trade updated", "success");
        } catch (e) {}
        if (route?.params?.origin === "Journal") {
          try {
            (navigation as any).navigate("Journal", {
              screen: "TradeDetail",
              params: { trade: updatedTrade },
            });
          } catch (e) {
            navigation.goBack();
          }
        } else {
          navigation.goBack();
        }
      } else {
        console.warn("Saving new trade to backend...", { toSave });
        const newId = await addTrade(userId, toSave);
        console.warn("addTrade returned id", newId);
        try {
          dispatch({
            type: "ADD_TRADE",
            payload: {
              ...(toSave as any),
              id: newId,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        } catch (e) {}

        // If the trade is linked to an account, update the account balance by applying the trade PnL
        try {
          const accountId = (toSave as any).accountId;
          if (accountId) {
            const tradePnl = computeTradePnl(toSave as any);

            const currentAccounts = await getUserAccounts(userId);
            const acc = currentAccounts.find((a) => a.id === accountId);
            if (acc) {
              const newBalance = Number(acc.currentBalance || 0) + tradePnl;
              await updateAccount(accountId, { currentBalance: newBalance });
              const updatedAccounts = await getUserAccounts(userId);
              try {
                dispatch({ type: "SET_ACCOUNTS", payload: updatedAccounts });
              } catch {}
            }
          }
        } catch (errAcc) {
          console.error("Failed to update account balance after trade", errAcc);
        }

        setShowConfirmation(false);
        setPendingTrade(null);
        try {
          toast.show(`Trade recorded: ${pair} ${direction}`, "success");
        } catch (e) {}
        if (route?.params?.origin === "Journal") {
          try {
            (navigation as any).navigate("Journal");
          } catch {
            navigation.goBack();
          }
        } else {
          navigation.goBack();
        }
      }
    } catch (err) {
      console.error("Error saving confirmed trade", err);
      try {
        toast.show("Failed to save trade. Please try again.", "error");
      } catch (e) {}
      Alert.alert("Error", "Failed to save trade. Please try again.");
    }
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return "#4caf50";
    if (score >= 70) return "#81c784";
    if (score >= 50) return "#00d4d4";
    if (score >= 30) return "#ffa500";
    return "#f44336";
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{
        paddingBottom: 260,
        paddingTop: 12,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      nestedScrollEnabled={true}
    >
      {/* Header with back button */}
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonIcon}>←</Text>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.title}>
              {editingTrade ? "Edit Trade" : "Add New Trade"}
            </Text>
            <Text style={styles.subtitle}>
              Record your trading setup and execution
            </Text>
          </View>

          <View style={{ width: 64 }} />
        </View>
      </View>

      {/* Live Calculation Cards */}
      <View style={styles.calculationCards}>
        <View style={[styles.calcCard, { borderColor: "#00d4d4" }]}>
          <Text style={styles.calcLabel}>Risk:Reward</Text>
          <Text style={[styles.calcValue, { color: "#00d4d4" }]}>
            {rr !== null ? `1:${rr.toFixed(2)}` : "—"}
          </Text>
          <View style={styles.calcIndicator}>
            {rr !== null && rr >= 2 ? (
              <Text style={styles.calcBadge}>✓ Good R:R</Text>
            ) : (
              <Text style={[styles.calcBadge, { opacity: 0.5 }]}>
                Calculating...
              </Text>
            )}
          </View>
        </View>

        <View
          style={[
            styles.calcCard,
            {
              borderColor: confluenceScore
                ? getGradeColor(confluenceScore)
                : "#444",
            },
          ]}
        >
          <Text style={styles.calcLabel}>Confluence</Text>
          <Text
            style={[
              styles.calcValue,
              {
                color: confluenceScore
                  ? getGradeColor(confluenceScore)
                  : "#666",
              },
            ]}
          >
            {confluenceScore !== null ? `${confluenceScore.toFixed(0)}%` : "—"}
          </Text>
          <View style={styles.calcIndicator}>
            <Text style={styles.calcBadge}>
              Grade: {confluenceScore ? assignGrade(confluenceScore) : "—"}
            </Text>
          </View>
        </View>
        {/* moved custom pair input to pair section as requested */}
      </View>

      {/* Account Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trading Account</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Settings", { screen: "Accounts" })
            }
          >
            <Text style={{ color: "#00d4d4", fontWeight: "700" }}>
              Manage Accounts
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
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
                <Text
                  style={[
                    styles.gridButtonText,
                    selectedAccountId === acc.id && styles.gridButtonTextActive,
                  ]}
                >
                  {acc.name}
                </Text>
                <Text style={{ color: "#aaa", fontSize: 12 }}>
                  $
                  {acc.currentBalance?.toFixed
                    ? acc.currentBalance.toFixed(2)
                    : acc.currentBalance}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              style={styles.gridButton}
              onPress={() =>
                navigation.navigate("Settings", { screen: "Accounts" })
              }
            >
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
        <View style={{ marginTop: 12 }}>
          <Text style={styles.inputLabel}>Custom Pair (e.g., EURGBP)</Text>
          <TextInput
            style={[styles.priceInput, { marginTop: 8 }]}
            placeholder="Enter custom pair"
            placeholderTextColor="#666"
            value={pair}
            onChangeText={(t) => setPair(t.toUpperCase())}
            autoCapitalize="characters"
          />
        </View>
      </View>

      {/* Instrument Type Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Instrument Type</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{instrumentType}</Text>
          </View>
        </View>
        <View style={styles.buttonGrid}>
          {["FX", "GOLD", "COMMODITY", "STOCK"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.gridButton,
                instrumentType === type && styles.gridButtonActive,
              ]}
              onPress={() => setInstrumentType(type as InstrumentType)}
            >
              <Text
                style={[
                  styles.gridButtonText,
                  instrumentType === type && styles.gridButtonTextActive,
                ]}
              >
                {type}
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
                d === "Buy" &&
                  direction === d && {
                    backgroundColor: "#4caf50",
                    borderColor: "#4caf50",
                  },
                d === "Sell" &&
                  direction === d && {
                    backgroundColor: "#f44336",
                    borderColor: "#f44336",
                  },
              ]}
              onPress={() => setDirection(d as TradeDirection)}
            >
              <Text style={styles.directionIcon}>
                {d === "Buy" ? "↑" : "↓"}
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
              style={[
                styles.sessionButton,
                session === s && styles.sessionButtonActive,
              ]}
              onPress={() => setSession(s as TradeSession)}
            >
              <Text style={styles.sessionEmoji}>
                {s === "London" ? "🇬🇧" : s === "NY" ? "🇺🇸" : "🌏"}
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
          <TouchableOpacity
            onPress={() => {
              configureLayoutAnimationNext();
              setShowTradeContextDetails(!showTradeContextDetails);
            }}
            style={{ padding: 8, borderRadius: 8 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.sectionToggle}>
                {showTradeContextDetails ? "Hide" : "Show"}
              </Text>
              <Text
                style={[
                  styles.chevron,
                  {
                    transform: [
                      { rotate: showTradeContextDetails ? "180deg" : "0deg" },
                    ],
                  },
                ]}
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
              {Platform.OS === "web" ? (
                dateInputSupported ? (
                  <input
                    type="date"
                    min="1900-01-01"
                    max={new Date().toISOString().slice(0, 10)}
                    value={
                      tradeDate && !isNaN(tradeDate.getTime())
                        ? tradeDate.toISOString().slice(0, 10)
                        : ""
                    }
                    onChange={(e: any) => {
                      const v = e?.target?.value;
                      if (!v) return;
                      const d = new Date(v);
                      if (!isNaN(d.getTime())) setTradeDate(d);
                    }}
                    style={webInputStyle}
                  />
                ) : (
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    {/* Year */}
                    {/* @ts-ignore */}
                    <select
                      value={selectedYear}
                      onChange={(e: any) => setSelectedYear(e.target.value)}
                      style={webSelectStyle}
                    >
                      <option value="">Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <span style={{ color: colors.subtext }}>-</span>
                    {/* Month */}
                    {/* @ts-ignore */}
                    <select
                      value={selectedMonth}
                      onChange={(e: any) => setSelectedMonth(e.target.value)}
                      style={webSelectStyle}
                    >
                      <option value="">Month</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <span style={{ color: colors.subtext }}>-</span>
                    {/* Day */}
                    {/* @ts-ignore */}
                    <select
                      value={selectedDay}
                      onChange={(e: any) => setSelectedDay(e.target.value)}
                      style={webSelectStyle}
                    >
                      <option value="">Day</option>
                      {days.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              ) : (
                <TextInput
                  style={styles.priceInput}
                  value={
                    tradeDate && !isNaN(tradeDate.getTime())
                      ? tradeDate.toISOString().slice(0, 10)
                      : ""
                  }
                  onChangeText={(t) => {
                    const d = new Date(t);
                    if (!isNaN(d.getTime())) setTradeDate(d);
                  }}
                />
              )}
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
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                {["Trending", "Ranging", "Volatile", "News"].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.gridButton,
                      marketCondition === c && styles.gridButtonActive,
                    ]}
                    onPress={() => setMarketCondition(c as any)}
                  >
                    <Text
                      style={[
                        styles.gridButtonText,
                        marketCondition === c && styles.gridButtonTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Price Inputs + Actual Exit + Result Section (moved as per instructions) */}
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

          {/* Actual Exit and Result Section (placed below Take Profit) */}
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
                  {r === "Win" ? "✓" : r === "Loss" ? "✗" : "—"}
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
      </View>

      {/* Risk Management (collapsible) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Risk Management</Text>
          <TouchableOpacity
            onPress={() => {
              configureLayoutAnimationNext();
              setShowRiskDetails(!showRiskDetails);
            }}
            style={{ padding: 8, borderRadius: 8 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.sectionToggle}>
                {showRiskDetails ? "Hide" : "Show"}
              </Text>
              <Text
                style={[
                  styles.chevron,
                  {
                    transform: [
                      { rotate: showRiskDetails ? "180deg" : "0deg" },
                    ],
                  },
                ]}
              >
                ▾
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {showRiskDetails && (
          <View>
            <Text style={styles.inputLabel}>Account Balance</Text>
            <Text style={{ color: "#f5f5f5", fontWeight: "700" }}>
              $
              {accountBalance?.toFixed
                ? accountBalance.toFixed(2)
                : accountBalance}
            </Text>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>Risk</Text>

              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={() => setRiskInputMode("percentage")}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor:
                      riskInputMode === "percentage"
                        ? colors.highlight
                        : colors.neutral,
                  }}
                >
                  <Text
                    style={{
                      color:
                        riskInputMode === "percentage"
                          ? "#0d0d0d"
                          : colors.text,
                    }}
                  >
                    % Percent
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRiskInputMode("amount")}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor:
                      riskInputMode === "amount"
                        ? colors.highlight
                        : colors.neutral,
                  }}
                >
                  <Text
                    style={{
                      color:
                        riskInputMode === "amount" ? "#0d0d0d" : colors.text,
                    }}
                  >
                    $ Amount
                  </Text>
                </TouchableOpacity>
              </View>

              {riskInputMode === "percentage" ? (
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.priceInput}
                    value={riskPercentage}
                    onChangeText={(t) => {
                      // Allow up to 3 integer digits and up to 3 decimal places, clamp 0-100.
                      // Preserve an in-progress trailing dot so the user can type decimals (e.g., "34.").
                      const cleaned = t.replace(/[^0-9.]/g, "");
                      // Collapse multiple dots but remember if the user ended with a dot
                      const endsWithDot = cleaned.endsWith(".");
                      const parts = cleaned.split(".").filter(Boolean);
                      const intPartRaw = parts[0] || "";
                      const intPart = intPartRaw.slice(0, 3);
                      let decPart = "";
                      if (cleaned.includes(".")) {
                        // Get the substring after the FIRST dot in the original cleaned input
                        const firstDotIndex = cleaned.indexOf(".");
                        decPart = cleaned
                          .slice(firstDotIndex + 1)
                          .replace(/\./g, "")
                          .slice(0, 3);
                      }

                      // Build display value, preserving a trailing dot if present
                      let display = intPart;
                      if (
                        cleaned.includes(".") &&
                        (decPart.length > 0 || endsWithDot)
                      ) {
                        display = display + "." + decPart;
                        if (endsWithDot && decPart.length === 0)
                          display = display + ""; // keep the trailing dot visually by not stripping
                      }

                      // If user cleared input, allow empty string
                      if (display === "") {
                        setRiskPercentage("");
                        return;
                      }

                      // Clamp numeric value to 0-100, but preserve the user's decimal precision where reasonable
                      const asNum = parseFloat(display);
                      if (isNaN(asNum)) {
                        setRiskPercentage("");
                        return;
                      }
                      const clamped = Math.min(100, Math.max(0, asNum));

                      // If user typed a trailing dot, keep it (as "34.") so they can continue typing decimals.
                      if (
                        endsWithDot &&
                        cleaned.indexOf(".") === cleaned.length - 1
                      ) {
                        setRiskPercentage(String(Math.floor(clamped)) + ".");
                        return;
                      }

                      // Otherwise format preserving up to 3 decimals
                      const decimals = (decPart && decPart.length) || 0;
                      const formatted =
                        decimals > 0
                          ? clamped.toFixed(Math.min(3, decimals))
                          : String(Math.floor(clamped));
                      setRiskPercentage(formatted);
                    }}
                    keyboardType="decimal-pad"
                  />
                  <Text style={{ color: "#aaa", fontWeight: "700" }}>%</Text>
                </View>
              ) : (
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.priceInput}
                    value={riskAmount}
                    onChangeText={(t) => {
                      const cleaned = t.replace(/[^0-9.]/g, "");
                      if (cleaned === "") {
                        setRiskAmount("");
                        setRiskPercentage("");
                        return;
                      }
                      // allow numeric with decimals
                      if (!/^\d*\.?\d*$/.test(cleaned)) return;
                      setRiskAmount(cleaned);
                      const asNum = parseFloat(cleaned);
                      if (!isNaN(asNum) && accountBalance > 0) {
                        const pct = (asNum / accountBalance) * 100;
                        setRiskPercentage(String(parseFloat(pct.toFixed(3))));
                      }
                    }}
                    keyboardType="decimal-pad"
                  />
                </View>
              )}
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>Calculated Position Size</Text>
              <Text style={{ color: "#f5f5f5", fontWeight: "700" }}>
                {positionSize ? positionSize : "—"}
              </Text>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>Risk Amount</Text>
              <Text style={{ color: "#f5f5f5", fontWeight: "700" }}>
                ${riskAmount || "—"}
              </Text>
            </View>
          </View>
        )}
      </View>

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

      {/* Before/After Images */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chart Screenshots</Text>

        <View style={styles.imageSection}>
          <View style={styles.imageCard}>
            <View style={styles.imageHeader}>
              <Text style={styles.imageLabel}>Screenshots</Text>
              {screenshots.length > 0 && (
                <Text style={styles.imageCheck}>✓</Text>
              )}
            </View>
            <ImageUploader
              screenshots={screenshots}
              onAdd={(uri) =>
                setScreenshots([...screenshots, { uri, label: "Other" }])
              }
              onRemove={(uri) =>
                setScreenshots(screenshots.filter((s) => s.uri !== uri))
              }
              onUpdateLabel={(uri, label) =>
                setScreenshots(
                  screenshots.map((s) => (s.uri === uri ? { ...s, label } : s)),
                )
              }
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
      <TouchableOpacity
        style={styles.submitButton}
        onPress={() => {
          try {
            console.warn("Record Trade button pressed");
          } catch (e) {}
          handleSubmit();
        }}
      >
        <Text style={styles.submitButtonIcon}>✓</Text>
        <Text style={styles.submitButtonText}>Record Trade</Text>
      </TouchableOpacity>

      {/* Account management moved to Settings -> Accounts */}

      {/* Confirmation Modal: use ConfirmModal on web (fixed overlay fallback), keep native Modal elsewhere */}
      {Platform.OS === "web" ? (
        <ConfirmModal
          visible={showConfirmation}
          title={"Confirm Trade"}
          confirmText={"Save"}
          cancelText={"Cancel"}
          onConfirm={() => {
            try {
              toast?.show?.("Saving trade...", "info");
            } catch (e) {}
            confirmAndSaveTrade();
          }}
          onCancel={() => {
            setShowConfirmation(false);
            setPendingTrade(null);
          }}
        >
          {pendingTrade ? (
            <View>
              <Text style={{ color: "#aaa" }}>
                {pendingTrade.pair} • {pendingTrade.direction}
              </Text>
              <Text
                style={{ color: "#f5f5f5", fontWeight: "700", marginTop: 8 }}
              >
                Entry: {pendingTrade.entryPrice}
              </Text>
              <Text style={{ color: "#f5f5f5", fontWeight: "700" }}>
                SL: {pendingTrade.stopLoss} • TP: {pendingTrade.takeProfit}
              </Text>
              <Text style={{ color: "#aaa", marginTop: 8 }}>
                R:R:{" "}
                {pendingTrade.riskToReward
                  ? `1:${pendingTrade.riskToReward.toFixed ? pendingTrade.riskToReward.toFixed(2) : pendingTrade.riskToReward}`
                  : "—"}
              </Text>
              <Text style={{ color: "#aaa" }}>
                Confluence:{" "}
                {pendingTrade.confluenceScore
                  ? `${pendingTrade.confluenceScore.toFixed ? pendingTrade.confluenceScore.toFixed(0) : pendingTrade.confluenceScore}%`
                  : "—"}
              </Text>
              <Text style={{ color: "#aaa" }}>
                Account:{" "}
                {state.accounts.find((a) => a.id === pendingTrade.accountId)
                  ?.name || "—"}
              </Text>
              <Text style={{ color: "#aaa" }}>
                Risk Amount: ${pendingTrade.riskAmount ?? "—"}
              </Text>
              <Text style={{ color: "#aaa" }}>
                Market: {pendingTrade.marketCondition || "—"}
              </Text>

              <View
                style={{
                  marginTop: 12,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: "#222",
                }}
              >
                <Text
                  style={{ color: "#aaa", marginBottom: 6, fontWeight: "700" }}
                >
                  Projected Impact
                </Text>
                <Text style={{ color: "#aaa" }}>
                  Win Rate: {calculateWinRate(state.trades || []).toFixed(1)}% →{" "}
                  {pendingTrade.result
                    ? calculateWinRate([
                        ...(state.trades || []),
                        pendingTrade as any,
                      ]).toFixed(1)
                    : "—"}
                  %
                </Text>
                <Text style={{ color: "#aaa" }}>
                  Avg R:R: {calculateAverageRR(state.trades || []).toFixed(2)} →{" "}
                  {pendingTrade.riskToReward
                    ? calculateAverageRR([
                        ...(state.trades || []),
                        pendingTrade as any,
                      ]).toFixed(2)
                    : "—"}
                </Text>
              </View>
            </View>
          ) : null}
        </ConfirmModal>
      ) : (
        <Modal visible={showConfirmation} animationType="slide" transparent>
          <View
            pointerEvents="box-none"
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "#0d0d0d",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text
                style={{
                  color: "#f5f5f5",
                  fontSize: 18,
                  fontWeight: "800",
                  marginBottom: 8,
                }}
              >
                Confirm Trade
              </Text>
              {pendingTrade && (
                <View>
                  <Text style={{ color: "#aaa" }}>
                    {pendingTrade.pair} • {pendingTrade.direction}
                  </Text>
                  <Text
                    style={{
                      color: "#f5f5f5",
                      fontWeight: "700",
                      marginTop: 8,
                    }}
                  >
                    Entry: {pendingTrade.entryPrice}
                  </Text>
                  <Text style={{ color: "#f5f5f5", fontWeight: "700" }}>
                    SL: {pendingTrade.stopLoss} • TP: {pendingTrade.takeProfit}
                  </Text>
                  <Text style={{ color: "#aaa", marginTop: 8 }}>
                    R:R:{" "}
                    {pendingTrade.riskToReward
                      ? `1:${pendingTrade.riskToReward.toFixed ? pendingTrade.riskToReward.toFixed(2) : pendingTrade.riskToReward}`
                      : "—"}
                  </Text>
                  <Text style={{ color: "#aaa" }}>
                    Confluence:{" "}
                    {pendingTrade.confluenceScore
                      ? `${pendingTrade.confluenceScore.toFixed ? pendingTrade.confluenceScore.toFixed(0) : pendingTrade.confluenceScore}%`
                      : "—"}
                  </Text>
                  <Text style={{ color: "#aaa" }}>
                    Account:{" "}
                    {state.accounts.find((a) => a.id === pendingTrade.accountId)
                      ?.name || "—"}
                  </Text>
                  <Text style={{ color: "#aaa" }}>
                    Risk Amount: ${pendingTrade.riskAmount ?? "—"}
                  </Text>
                  <Text style={{ color: "#aaa" }}>
                    Market: {pendingTrade.marketCondition || "—"}
                  </Text>

                  <View
                    style={{
                      marginTop: 12,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#222",
                    }}
                  >
                    <Text
                      style={{
                        color: "#aaa",
                        marginBottom: 6,
                        fontWeight: "700",
                      }}
                    >
                      Projected Impact
                    </Text>
                    <Text style={{ color: "#aaa" }}>
                      Win Rate:{" "}
                      {calculateWinRate(state.trades || []).toFixed(1)}% →{" "}
                      {pendingTrade.result
                        ? calculateWinRate([
                            ...(state.trades || []),
                            pendingTrade as any,
                          ]).toFixed(1)
                        : "—"}
                      %
                    </Text>
                    <Text style={{ color: "#aaa" }}>
                      Avg R:R:{" "}
                      {calculateAverageRR(state.trades || []).toFixed(2)} →{" "}
                      {pendingTrade.riskToReward
                        ? calculateAverageRR([
                            ...(state.trades || []),
                            pendingTrade as any,
                          ]).toFixed(2)
                        : "—"}
                    </Text>
                  </View>
                </View>
              )}

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 16,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: "#444", flex: 1, marginRight: 8 },
                  ]}
                  onPress={() => setShowConfirmation(false)}
                >
                  <Text style={styles.submitButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: "#00d4d4", flex: 1 },
                  ]}
                  onPress={() => {
                    try {
                      toast?.show?.("Saving trade...", "info");
                    } catch (e) {}
                    confirmAndSaveTrade();
                  }}
                >
                  <Text style={styles.submitButtonText}>Confirm & Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonIcon: {
    color: "#00d4d4",
    fontSize: 18,
    fontWeight: "800",
  },
  backButtonText: {
    color: "#00d4d4",
    fontSize: 16,
    fontWeight: "700",
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
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  calcCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  calcLabel: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  calcValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  calcIndicator: {
    backgroundColor: "rgba(0, 212, 212, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  calcBadge: {
    color: "#00d4d4",
    fontSize: 11,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionBadge: {
    backgroundColor: "#00d4d420",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    color: "#00d4d4",
    fontSize: 12,
    fontWeight: "700",
  },
  optionalBadge: {
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
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
    flexDirection: "row",
    gap: 12,
  },
  directionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "700",
    color: "#fff",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4caf50",
  },
  sessionText: {
    color: "#4caf50",
    fontSize: 12,
    fontWeight: "600",
  },
  sessionGroup: {
    flexDirection: "row",
    gap: 12,
  },
  sessionButton: {
    flex: 1,
    alignItems: "center",
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
    color: "#aaa",
    fontSize: 13,
    fontWeight: "600",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
  },
  resultGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  resultButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#4caf50",
    borderColor: "#4caf50",
  },
  resultLoss: {
    backgroundColor: "#f44336",
    borderColor: "#f44336",
  },
  resultBreakeven: {
    backgroundColor: "#ffa500",
    borderColor: "#ffa500",
  },
  resultIcon: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
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
    flexDirection: "row",
    gap: 12,
  },
  strategyCard: {
    minWidth: 120,
    alignItems: "center",
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
    backgroundColor: "rgba(0, 212, 212, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  strategyIconText: {
    fontSize: 20,
  },
  strategyName: {
    color: "#f5f5f5",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  strategyNameActive: {
    color: "#00d4d4",
  },
  emotionDisplay: {
    backgroundColor: "#ffa50020",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emotionValue: {
    color: "#ffa500",
    fontSize: 14,
    fontWeight: "700",
  },
  emotionSlider: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  emotionDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  emotionDotActive: {
    backgroundColor: "#ffa500",
    borderColor: "#ffa500",
  },
  emotionDotText: {
    color: "#f5f5f5",
    fontSize: 11,
    fontWeight: "700",
  },
  emotionLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  emotionLabel: {
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
  },
  deviationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
    borderRadius: 12,
    padding: 16,
  },
  deviationContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  deviationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(244, 67, 54, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  deviationIconText: {
    fontSize: 20,
  },
  deviationInfo: {
    flex: 1,
  },
  deviationTitle: {
    color: "#f5f5f5",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  deviationSubtitle: {
    color: "#aaa",
    fontSize: 12,
  },
  checklistCounter: {
    backgroundColor: "#00d4d420",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checklistCounterText: {
    color: "#00d4d4",
    fontSize: 12,
    fontWeight: "700",
  },
  checklistGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  checklistChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 10,
    gap: 8,
  },
  checklistChipActive: {
    backgroundColor: "#00d4d420",
    borderColor: "#00d4d4",
  },
  checklistChipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0, 212, 212, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  checklistChipIconText: {
    color: "#00d4d4",
    fontSize: 12,
    fontWeight: "700",
  },
  checklistChipText: {
    color: "#f5f5f5",
    fontSize: 13,
    fontWeight: "600",
  },
  checklistChipTextActive: {
    color: "#00d4d4",
  },
  imageSection: {
    gap: 16,
  },
  imageCard: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.2)",
    borderRadius: 12,
    padding: 12,
  },
  imageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  imageLabel: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "600",
  },
  imageCheck: {
    color: "#4caf50",
    fontSize: 18,
    fontWeight: "700",
  },
  notesContainer: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#00d4d4",
    borderRadius: 12,
    padding: 4,
  },
  notesInput: {
    color: "#f5f5f5",
    fontSize: 14,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00d4d4",
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  sectionToggle: {
    color: "#00d4d4",
    fontWeight: "700",
    fontSize: 13,
  },
  chevron: {
    color: "#00d4d4",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
  },
  submitButtonIcon: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0d0d0d",
  },
  submitButtonText: {
    color: "#0d0d0d",
    fontSize: 16,
    fontWeight: "700",
  },
});
