export function computeTradePnl(trade: any): number {
  try {
    if (!trade) return 0;
    if (trade?.pnl !== undefined && trade?.pnl !== null)
      return Number(trade.pnl) || 0;

    const risk = Math.abs(Number(trade?.riskAmount) || 0);
    const entry = Number(trade?.entryPrice);
    const sl = Number(trade?.stopLoss);
    const tp =
      trade?.takeProfit !== undefined ? Number(trade.takeProfit) : null;
    const ax =
      trade?.actualExit !== undefined && trade?.actualExit !== null
        ? Number(trade.actualExit)
        : null;

    const stopDistance = Math.abs(entry - sl);
    const tpDistance = tp !== null ? Math.abs(tp - entry) : null;

    // If we have an explicit actual exit and a valid stop distance, prorate PnL
    if (ax !== null && !isNaN(ax) && stopDistance > 0) {
      // positiveDistance is how far the exit moved from entry in the "favourable" direction
      let exitDistance = 0;
      let sign = 0;
      if (trade.direction === "Buy") {
        exitDistance = ax - entry;
        sign = exitDistance > 0 ? 1 : exitDistance < 0 ? -1 : 0;
      } else {
        exitDistance = entry - ax;
        sign = exitDistance > 0 ? 1 : exitDistance < 0 ? -1 : 0;
      }

      // PnL scales linearly with exitDistance relative to stopDistance.
      // This yields fractional losses when the exit is between entry and stop,
      // full risk when exit equals the stop, and larger losses if exit goes beyond stop.
      const pnl = sign * ((Math.abs(exitDistance) / stopDistance) * risk);
      return Math.round(pnl * 100) / 100;
    }

    // No actual exit: fall back to result / planned TP
    const rr =
      Number(trade?.riskToReward) ||
      (tpDistance && stopDistance ? tpDistance / stopDistance : 1);
    if (trade?.result === "Win") return Math.round(risk * rr * 100) / 100;
    if (trade?.result === "Loss") return Math.round(-risk * 100) / 100;

    return 0;
  } catch (e) {
    return 0;
  }
}

export default computeTradePnl;
