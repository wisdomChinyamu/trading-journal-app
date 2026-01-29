/**
 * Professional Risk Engine for Position Sizing
 * Implements logic matching prop firm risk engines
 * Supports: FX, GOLD, COMMODITY, STOCK instruments
 */

export type InstrumentType = "FX" | "GOLD" | "COMMODITY" | "STOCK";

/**
 * Risk Configuration - how user wants to specify risk
 */
export interface RiskConfig {
  riskType: "PERCENT" | "FIXED"; // percent of balance or fixed amount
  riskValue: number; // e.g., 1 (for 1%) or 100 (for $100)
}

/**
 * Account data needed for position sizing
 */
export interface AccountForPositionSizing {
  balance: number;
  currency?: string; // e.g., "USD" - defaults to USD
}

/**
 * Trade data needed for position sizing
 */
export interface TradeForPositionSizing {
  instrumentType: InstrumentType;
  entryPrice: number;
  stopLossPrice: number;
  direction: "Buy" | "Sell";
}

/**
 * FX instrument specifications
 */
export interface FXSpecs {
  lotSize: number; // 100000 for standard lot
  pipSize: number; // 0.0001 or 0.01 for JPY pairs
  quoteCurrency: string; // e.g., "USD", "EUR"
}

/**
 * Gold instrument specifications
 */
export interface GoldSpecs {
  contractSize: number; // 100 oz (standard)
  tickSize: number; // 0.01
  tickValue: number; // 1.00 USD per tick
}

/**
 * General commodity specifications
 */
export interface CommoditySpecs {
  tickSize: number;
  tickValue: number;
  minContractSize?: number; // optional minimum contract increment
}

/**
 * Stock specifications
 */
export interface StockSpecs {
  // Stocks have no special specs - just share count
}

/**
 * Unified instrument specs type
 */
export type InstrumentSpecs = FXSpecs | GoldSpecs | CommoditySpecs | StockSpecs;

/**
 * Position sizing result
 */
export interface PositionSizingResult {
  positionSize: number;
  riskAmount: number;
  stopDistancePriceUnits: number;
  validationErrors: string[];
}

/**
 * Core Risk Engine (shared logic - never changes)
 * Calculate how much money to risk based on account balance and risk config
 */
export function calculateRiskAmount(
  account: AccountForPositionSizing,
  riskConfig: RiskConfig,
): number {
  if (riskConfig.riskType === "PERCENT") {
    return account.balance * (riskConfig.riskValue / 100);
  }
  if (riskConfig.riskType === "FIXED") {
    return riskConfig.riskValue;
  }
  throw new Error("Invalid risk configuration");
}

/**
 * Mandatory safety checks - don't skip these
 */
export function validateTrade(trade: TradeForPositionSizing): string[] {
  const errors: string[] = [];

  if (trade.entryPrice === trade.stopLossPrice) {
    errors.push("Stop loss cannot equal entry price");
  }

  if (trade.entryPrice <= 0) errors.push("Entry price must be greater than 0");
  if (trade.stopLossPrice <= 0)
    errors.push("Stop loss price must be greater than 0");

  return errors;
}

/**
 * FX Position Size Calculator
 * Works for currency pairs (GBPUSD, EURUSD, USDJPY, etc.)
 */
export function calculateFXPositionSize(
  trade: TradeForPositionSizing,
  fxSpecs: FXSpecs,
  account: AccountForPositionSizing,
  riskAmount: number,
  exchangeRate: number = 1, // if quote currency differs from account currency
): number {
  // Calculate stop loss in pips
  const stopLossPrice = Math.abs(trade.entryPrice - trade.stopLossPrice);
  const stopLossPips = stopLossPrice / fxSpecs.pipSize;

  // Calculate pip value per lot
  let pipValuePerLot: number;
  const accountCurrency = account.currency || "USD";

  if (fxSpecs.quoteCurrency === accountCurrency) {
    // Quote currency matches account currency - direct calculation
    pipValuePerLot = fxSpecs.lotSize * fxSpecs.pipSize;
  } else {
    // Quote currency differs - need to convert via exchange rate
    pipValuePerLot = (fxSpecs.lotSize * fxSpecs.pipSize) / exchangeRate;
  }

  // Calculate risk per lot
  const riskPerLot = stopLossPips * pipValuePerLot;

  // Calculate lot size
  const lotSize = riskAmount / riskPerLot;

  // Round down to 0.01 lot increments (broker standard)
  return roundDown(lotSize, 0.01);
}

/**
 * Gold (XAUUSD) Position Size Calculator
 * Gold is a special commodity with standard specs
 */
export function calculateGoldPositionSize(
  trade: TradeForPositionSizing,
  goldSpecs: GoldSpecs,
  riskAmount: number,
): number {
  // Calculate stop loss in ticks
  const stopLossTicks =
    Math.abs(trade.entryPrice - trade.stopLossPrice) / goldSpecs.tickSize;

  // Calculate risk per contract
  const riskPerContract = stopLossTicks * goldSpecs.tickValue;

  // Calculate number of contracts
  const contracts = riskAmount / riskPerContract;

  // Round down to 0.01 contract increments
  return roundDown(contracts, 0.01);
}

/**
 * General Commodity Position Size Calculator
 * Works for Oil, Silver, Indices, etc.
 */
export function calculateCommodityPositionSize(
  trade: TradeForPositionSizing,
  commoditySpecs: CommoditySpecs,
  riskAmount: number,
): number {
  // Calculate stop loss in ticks
  const stopLossTicks =
    Math.abs(trade.entryPrice - trade.stopLossPrice) / commoditySpecs.tickSize;

  // Calculate risk per contract
  const riskPerContract = stopLossTicks * commoditySpecs.tickValue;

  // Calculate number of contracts
  const contracts = riskAmount / riskPerContract;

  // Round down to minimum contract size (default 0.01, or as specified)
  const minContractSize = commoditySpecs.minContractSize || 0.01;
  return roundDown(contracts, minContractSize);
}

/**
 * Stock Position Size Calculator
 * Simple: shares = riskAmount / riskPerShare (always floor to whole shares)
 */
export function calculateStockPositionSize(
  trade: TradeForPositionSizing,
  _stockSpecs: StockSpecs,
  riskAmount: number,
): number {
  // Calculate risk per share
  const riskPerShare = Math.abs(trade.entryPrice - trade.stopLossPrice);

  // Calculate number of shares
  const shares = riskAmount / riskPerShare;

  // ALWAYS floor to whole shares - no partial shares
  return Math.floor(shares);
}

/**
 * Main Dispatcher - the entry point
 * Routes to instrument-specific calculator based on instrumentType
 * This keeps the app scalable and maintainable
 */
export function calculatePositionSize(
  trade: TradeForPositionSizing,
  account: AccountForPositionSizing,
  riskConfig: RiskConfig,
  instrumentSpecs: InstrumentSpecs,
  exchangeRate?: number,
): PositionSizingResult {
  const validationErrors = validateTrade(trade);

  if (validationErrors.length > 0) {
    return {
      positionSize: 0,
      riskAmount: 0,
      stopDistancePriceUnits: 0,
      validationErrors,
    };
  }

  try {
    const riskAmount = calculateRiskAmount(account, riskConfig);

    let positionSize = 0;

    switch (trade.instrumentType) {
      case "FX":
        positionSize = calculateFXPositionSize(
          trade,
          instrumentSpecs as FXSpecs,
          account,
          riskAmount,
          exchangeRate || 1,
        );
        break;

      case "GOLD":
        positionSize = calculateGoldPositionSize(
          trade,
          instrumentSpecs as GoldSpecs,
          riskAmount,
        );
        break;

      case "COMMODITY":
        positionSize = calculateCommodityPositionSize(
          trade,
          instrumentSpecs as CommoditySpecs,
          riskAmount,
        );
        break;

      case "STOCK":
        positionSize = calculateStockPositionSize(
          trade,
          instrumentSpecs as StockSpecs,
          riskAmount,
        );
        break;

      default:
        return {
          positionSize: 0,
          riskAmount: 0,
          stopDistancePriceUnits: 0,
          validationErrors: [
            `Unsupported instrument type: ${trade.instrumentType}`,
          ],
        };
    }

    // Validate final position size
    if (positionSize <= 0) {
      return {
        positionSize: 0,
        riskAmount,
        stopDistancePriceUnits: Math.abs(
          trade.entryPrice - trade.stopLossPrice,
        ),
        validationErrors: ["Position size too small for selected risk"],
      };
    }

    return {
      positionSize,
      riskAmount,
      stopDistancePriceUnits: Math.abs(trade.entryPrice - trade.stopLossPrice),
      validationErrors: [],
    };
  } catch (error) {
    return {
      positionSize: 0,
      riskAmount: 0,
      stopDistancePriceUnits: 0,
      validationErrors: [
        `Error calculating position size: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}

/**
 * Utility: Round DOWN to specified increment
 * Used for final position size (always round down, never up)
 */
function roundDown(value: number, increment: number): number {
  return Math.floor(value / increment) * increment;
}

/**
 * Predefined Instrument Specs (constants)
 * These match industry standards and broker requirements
 */

export const FX_SPECS: Record<string, FXSpecs> = {
  // Major pairs (standard lot = 100,000 units)
  EURUSD: { lotSize: 100000, pipSize: 0.0001, quoteCurrency: "USD" },
  GBPUSD: { lotSize: 100000, pipSize: 0.0001, quoteCurrency: "USD" },
  USDCHF: { lotSize: 100000, pipSize: 0.0001, quoteCurrency: "CHF" },
  USDJPY: { lotSize: 100000, pipSize: 0.01, quoteCurrency: "JPY" }, // JPY pairs use 0.01
  EURGBP: { lotSize: 100000, pipSize: 0.0001, quoteCurrency: "GBP" },
  GBPJPY: { lotSize: 100000, pipSize: 0.01, quoteCurrency: "JPY" },

  // Add more pairs as needed
};

export const GOLD_SPECS: GoldSpecs = {
  contractSize: 100, // 100 oz (standard lot)
  tickSize: 0.01,
  tickValue: 1.0, // 1 USD per tick
};

export const COMMODITY_SPECS: Record<string, CommoditySpecs> = {
  CRUDE_OIL: {
    tickSize: 0.01,
    tickValue: 10, // $10 per barrel tick
    minContractSize: 0.01,
  },
  NATURAL_GAS: {
    tickSize: 0.001,
    tickValue: 10,
    minContractSize: 0.01,
  },
  SILVER: {
    tickSize: 0.001,
    tickValue: 50, // $50 per oz tick
    minContractSize: 0.01,
  },
  // Add more commodities as needed
};

/**
 * Helper: Get FX specs for a pair
 */
export function getFXSpecs(pair: string): FXSpecs {
  const upper = pair.toUpperCase();
  return (
    FX_SPECS[upper] || {
      lotSize: 100000,
      pipSize: 0.0001,
      quoteCurrency: "USD",
    }
  );
}

/**
 * Helper: Get commodity specs by name
 */
export function getCommoditySpecs(name: string): CommoditySpecs {
  const upper = name.toUpperCase();
  return (
    COMMODITY_SPECS[upper] || {
      tickSize: 0.01,
      tickValue: 1,
      minContractSize: 0.01,
    }
  );
}
