import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Trade } from "../types";
import { useTheme } from "./ThemeProvider";
import { useAppContext } from "../hooks/useAppContext";

interface TradeCardProps {
  trade: Trade;
  onPress?: () => void;
}

export default function TradeCard({ trade, onPress }: TradeCardProps) {
  const { colors } = useTheme();
  const { state } = useAppContext();
  const uiScale = state.uiScale || "normal";
  const scaleMultiplier =
    uiScale === "small" ? 0.86 : uiScale === "large" ? 1.12 : 1;
  const parseToDate = (v: any) => {
    if (!v) return new Date();
    if (typeof v === "string") return new Date(v);
    if (v instanceof Date) return v;
    if (v.toDate && typeof v.toDate === "function") return v.toDate();
    try {
      return new Date(v);
    } catch (e) {
      return new Date();
    }
  };

  const displayDate = parseToDate(
    (trade as any).tradeTime || (trade as any).createdAt
  );

  // Dynamic color assignment with gradient effect
  const getResultColors = () => {
    switch (trade.result) {
      case "Win":
        return {
          bg: colors.profitStart,
          text: colors.profitEnd,
          glow: colors.profitEnd,
        };
      case "Loss":
        return {
          bg: colors.lossStart,
          text: colors.lossEnd,
          glow: colors.lossEnd,
        };
      default:
        return {
          bg: colors.neutral,
          text: colors.breakEven,
          glow: colors.breakEven,
        };
    }
  };

  const resultColors = getResultColors();
  const bgColor = colors.card ?? colors.surface;

  // Grade badge color
  const getGradeColor = () => {
    switch (trade.grade) {
      case "A+":
      case "A":
        return colors.profitEnd;
      case "B":
        return colors.highlight;
      case "C":
        return "#ffa726";
      case "D":
        return colors.lossEnd;
      default:
        return colors.subtext;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          borderLeftWidth: 4 * scaleMultiplier,
          borderLeftColor: resultColors.glow,
          shadowColor: resultColors.glow,
          shadowOffset: { width: 0, height: 4 * scaleMultiplier },
          shadowOpacity: 0.15,
          shadowRadius: 8 * scaleMultiplier,
          elevation: 6,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.pairSection}>
          <Text
            style={[
              styles.pair,
              { color: colors.text, fontSize: 20 * scaleMultiplier },
            ]}
          >
            {trade.pair}
          </Text>
          <View
            style={[
              styles.directionBadge,
              {
                backgroundColor:
                  trade.direction === "Buy"
                    ? "rgba(76, 175, 80, 0.15)"
                    : "rgba(239, 83, 80, 0.15)",
              },
            ]}
          >
            <Text
              style={[
                styles.directionText,
                {
                  color:
                    trade.direction === "Buy"
                      ? colors.profitEnd
                      : colors.lossEnd,
                  fontSize: 11 * scaleMultiplier,
                },
              ]}
            >
              {trade.direction.toUpperCase()}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.resultBadge,
            {
              backgroundColor: `${resultColors.glow}20`,
              borderWidth: 1 * scaleMultiplier,
              borderColor: `${resultColors.glow}40`,
            },
          ]}
        >
          <Text
            style={[
              styles.resultText,
              { color: resultColors.text, fontSize: 13 * scaleMultiplier },
            ]}
          >
            {trade.result || "Pending"}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text
            style={[
              styles.statLabel,
              { color: colors.subtext, fontSize: 11 * scaleMultiplier },
            ]}
          >
            Risk:Reward
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color: colors.highlight,
                fontWeight: "800",
                fontSize: 18 * scaleMultiplier,
              },
            ]}
          >
            1:{trade.riskToReward.toFixed(2)}
          </Text>
        </View>

        <View
          style={[
            styles.divider,
            { backgroundColor: colors.neutral, height: 32 * scaleMultiplier },
          ]}
        />

        <View style={styles.statBox}>
          <Text
            style={[
              styles.statLabel,
              { color: colors.subtext, fontSize: 11 * scaleMultiplier },
            ]}
          >
            Confluence
          </Text>
          <View style={styles.scoreContainer}>
            <Text
              style={[
                styles.statValue,
                {
                  color: colors.text,
                  fontWeight: "800",
                  fontSize: 18 * scaleMultiplier,
                },
              ]}
            >
              {trade.confluenceScore}
            </Text>
            <Text
              style={[
                styles.scoreUnit,
                { color: colors.subtext, fontSize: 12 * scaleMultiplier },
              ]}
            >
              /100
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.divider,
            { backgroundColor: colors.neutral, height: 32 * scaleMultiplier },
          ]}
        />

        <View style={styles.statBox}>
          <Text
            style={[
              styles.statLabel,
              { color: colors.subtext, fontSize: 11 * scaleMultiplier },
            ]}
          >
            Grade
          </Text>
          <View
            style={[
              styles.gradeBadge,
              {
                backgroundColor: `${getGradeColor()}15`,
                borderWidth: 1.5 * scaleMultiplier,
                borderColor: `${getGradeColor()}50`,
              },
            ]}
          >
            <Text
              style={[
                styles.gradeText,
                {
                  color: getGradeColor(),
                  fontWeight: "900",
                  fontSize: 16 * scaleMultiplier,
                },
              ]}
            >
              {trade.grade}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer Info */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: `${colors.text}10`,
            borderTopWidth: 1 * scaleMultiplier,
          },
        ]}
      >
        <View style={styles.footerLeft}>
          <View
            style={[
              styles.setupBadge,
              { backgroundColor: `${colors.highlight}15` },
            ]}
          >
            <Text
              style={[
                styles.setupText,
                { color: colors.highlight, fontSize: 11 * scaleMultiplier },
              ]}
            >
              {trade.setupType}
            </Text>
          </View>
          {trade.ruleDeviation && (
            <View
              style={[
                styles.deviationBadge,
                { backgroundColor: `${colors.lossEnd}20` },
              ]}
            >
              <Text
                style={[
                  styles.deviationText,
                  { color: colors.lossEnd, fontSize: 10 * scaleMultiplier },
                ]}
              >
                ⚠ Deviation
              </Text>
            </View>
          )}
        </View>
        <View style={styles.footerRight}>
          <Text
            style={[
              styles.sessionText,
              { color: colors.subtext, fontSize: 11 * scaleMultiplier },
            ]}
          >
            {trade.session}
          </Text>
          <Text
            style={[
              styles.dateText,
              { color: colors.subtext, fontSize: 10 * scaleMultiplier },
            ]}
          >
            {displayDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>

      {/* Emotion indicator (optional visual) */}
      {trade.emotionalRating && (
        <View style={styles.emotionBar}>
          <View
            style={[
              styles.emotionFill,
              {
                width: `${trade.emotionalRating * 10}%`,
                backgroundColor:
                  trade.emotionalRating >= 7
                    ? colors.profitEnd
                    : trade.emotionalRating >= 4
                    ? "#ffa726"
                    : colors.lossEnd,
              },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 2,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pairSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pair: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  directionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  directionText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  resultText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingVertical: 12,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  scoreUnit: {
    fontSize: 12,
    fontWeight: "600",
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  gradeText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 32,
    opacity: 0.3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  setupBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  setupText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  deviationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deviationText: {
    fontSize: 10,
    fontWeight: "700",
  },
  footerRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  sessionText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 10,
    fontWeight: "500",
  },
  emotionBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  emotionFill: {
    height: "100%",
    borderRadius: 2,
  },
});
