import { TradeDirection, TradeGrade } from '../types';

const toDate = (value: any): Date | null => {
  if (!value && value !== 0) return null;
  if (typeof value?.toDate === 'function') {
    try {
      const d = value.toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Calculate Risk to Reward ratio
 * For Buy: (TP - Entry) / (Entry - SL)
 * For Sell: (Entry - TP) / (SL - Entry)
 */
export function calculateRiskToReward(
  entry: number,
  stopLoss: number,
  takeProfit: number,
  direction: TradeDirection
): number {
  if (direction === 'Buy') {
    const profit = takeProfit - entry;
    const risk = entry - stopLoss;
    return risk === 0 ? 0 : profit / risk;
  } else {
    // Sell
    const profit = entry - takeProfit;
    const risk = stopLoss - entry;
    return risk === 0 ? 0 : profit / risk;
  }
}

/**
 * Calculate confluence score based on checklist items selected
 * Score = (sum of weights of selected items) / (sum of all weights) * 100
 */
export function calculateConfluenceScore(
  selectedItemIds: string[],
  allItemIds: Map<string, number>
): number {
  let selectedWeight = 0;
  let totalWeight = 0;

  allItemIds.forEach((weight) => {
    totalWeight += weight;
  });

  selectedItemIds.forEach((itemId) => {
    const weight = allItemIds.get(itemId) || 0;
    selectedWeight += weight;
  });

  if (totalWeight === 0) return 0;
  return (selectedWeight / totalWeight) * 100;
}

/**
 * Assign grade based on confluence score
 * A+: 95-100
 * A: 85-94
 * B: 70-84
 * C: 50-69
 * D: Below 50
 */
export function assignGrade(confluenceScore: number): TradeGrade {
  if (confluenceScore >= 95) return 'A+';
  if (confluenceScore >= 85) return 'A';
  if (confluenceScore >= 70) return 'B';
  if (confluenceScore >= 50) return 'C';
  return 'D';
}

/**
 * Calculate win rate from trades
 */
export function calculateWinRate(
  trades: Array<{ result?: 'Win' | 'Loss' | 'Break-even' }>
): number {
  const completedTrades = trades.filter((t) => t.result);
  if (completedTrades.length === 0) return 0;
  const wins = completedTrades.filter((t) => t.result === 'Win').length;
  return (wins / completedTrades.length) * 100;
}

/**
 * Calculate average R:R from trades
 */
export function calculateAverageRR(
  trades: Array<{ riskToReward: number; result?: 'Win' | 'Loss' | 'Break-even' }>
): number {
  const completedTrades = trades.filter((t) => t.result);
  if (completedTrades.length === 0) return 0;
  const sum = completedTrades.reduce((acc, t) => acc + t.riskToReward, 0);
  return sum / completedTrades.length;
}

/**
 * Calculate profit factor
 * Profit Factor = Total Profit / Total Loss (absolute values)
 */
export function calculateProfitFactor(
  trades: Array<{
    result?: 'Win' | 'Loss' | 'Break-even';
    riskToReward: number;
    actualExit?: number;
    entryPrice: number;
    stopLoss: number;
  }>
): number {
  let grossProfit = 0;
  let grossLoss = 0;

  trades.forEach((trade) => {
    if (!trade.result || !trade.actualExit) return;

    const pnlAmount = Math.abs(trade.actualExit - trade.entryPrice);

    if (trade.result === 'Win') {
      grossProfit += pnlAmount;
    } else if (trade.result === 'Loss') {
      grossLoss += pnlAmount;
    }
  });

  if (grossLoss === 0) return grossProfit > 0 ? 999 : 0; // Return large number if only profits
  return grossProfit / grossLoss;
}

/**
 * Calculate deviation rate percentage
 */
export function calculateDeviationRate(
  trades: Array<{ ruleDeviation: boolean }>
): number {
  if (trades.length === 0) return 0;
  const deviations = trades.filter((t) => t.ruleDeviation).length;
  return (deviations / trades.length) * 100;
}

/**
 * Generate equity curve from trades
 */
export function generateEquityCurve(
  trades: Array<{
    createdAt: Date;
    result?: 'Win' | 'Loss' | 'Break-even';
    riskToReward: number;
    actualExit?: number;
    entryPrice: number;
  }>,
  initialCapital: number = 10000
): Array<{ date: Date; value: number }> {
  const withDates = trades
    .map((t) => ({ t, date: toDate((t as any).createdAt) }))
    .filter((x) => x.date !== null) as { t: any; date: Date }[];

  const sortedTrades = [...withDates].sort((a, b) => a.date.getTime() - b.date.getTime());

  const curve: Array<{ date: Date; value: number }> = [];
  let runningBalance = initialCapital;

  sortedTrades.forEach(({ t: trade, date }) => {
    if (!trade.result || !trade.actualExit) return;

    const pnlAmount = trade.actualExit - trade.entryPrice;
    runningBalance += pnlAmount;

    curve.push({
      date,
      value: runningBalance,
    });
  });

  return curve;
}

/**
 * Get performance grouped by a field
 */
export function getPerformanceBy(
  trades: Array<{
    result?: 'Win' | 'Loss' | 'Break-even';
    [key: string]: any;
  }>,
  groupBy: string
): Record<string, number> {
  const grouped: Record<string, { wins: number; total: number }> = {};

  trades.forEach((trade) => {
    if (!trade.result) return;

    const key = String(trade[groupBy]);
    if (!grouped[key]) {
      grouped[key] = { wins: 0, total: 0 };
    }

    grouped[key].total += 1;
    if (trade.result === 'Win') {
      grouped[key].wins += 1;
    }
  });

  const result: Record<string, number> = {};
  Object.entries(grouped).forEach(([key, value]) => {
    result[key] = (value.wins / value.total) * 100;
  });

  return result;
}
