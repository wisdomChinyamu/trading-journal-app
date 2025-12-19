// Trading Account type
export interface TradingAccount {
  id: string;
  userId: string;
  name: string;
  startingBalance: number;
  currentBalance: number;
  createdAt: Date;
  updatedAt: Date;
}
// Strategy type
export interface Strategy {
  id: string;
  userId: string;
  name: string;
  checklist: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}
// User type
export interface User {
  uid: string;
  email: string;
  username: string;
  timezone: string;
  createdAt: Date;
}

// Checklist Item type
export type ChecklistCategory = "Critical" | "Important" | "Optional";

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  weight: number; // max points for this item
  category: ChecklistCategory;
  createdAt: Date;
}

export interface ChecklistTemplate {
  id: string;
  userId: string;
  items: ChecklistItem[];
  updatedAt: Date;
}

// Trade type
export type TradeResult = "Win" | "Loss" | "Break-even";
export type TradePair = string; // e.g., "GBPUSD"
export type TradeDirection = "Buy" | "Sell";
export type TradeSession = "London" | "NY" | "Asia";
export type TradeGrade = "A+" | "A" | "B" | "C" | "D";

export interface Trade {
  id: string;
  userId: string;
  pair: TradePair;
  direction: TradeDirection;
  session: TradeSession;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  actualExit?: number;
  result?: TradeResult;
  riskToReward: number; // auto-calculated
  confluenceScore: number; // calculated from checklist
  grade: TradeGrade; // A+, A, B, C, D
  setupType: string; // from user's SMC notes
  emotionalRating: number; // 1-10
  ruleDeviation: boolean;
  screenshots: Array<{ uri: string; label?: string }>; // Labeled screenshots
  notes: string;
  strategyId?: string; // Link to strategy checklist
  checklist?: string[]; // Selected checklist item IDs
  createdAt: Date;
  updatedAt: Date;
  riskAmount?: number; // Add this new optional field for storing actual monetary risk
  accountId?: string; // Link to specific trading account
  marketCondition?: string; // Optional market condition (Trending, Ranging, Volatile, News)
  tradeTime?: Date; // Optional timestamp for the trade (entry time override)
}

// Psychology Log type
export interface PsychologyLog {
  id: string;
  userId: string;
  date: Date;
  emotionalState: number; // 1-10
  notes: string;
  deviations: string[];
  confidenceRating: number; // 1-10
  sessionIntentions: string;
}

// Routine Item type
export interface RoutineItem {
  id: string;
  label: string;
  description?: string;
  category: 'Critical' | 'Important' | 'Optional';
  completed: boolean;
  completedAt?: Date;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  items: RoutineItem[];
  schedule: 'weekday' | 'weekend' | 'both';
  streak: number;
  lastCompleted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Checklist Record (for tracking which items were selected for a trade)
export interface ChecklistRecord {
  id: string;
  tradeId: string;
  selectedItemIds: string[];
  computedScore: number;
  createdAt: Date;
}

// Analytics data type
export interface AnalyticsMetrics {
  winRate: number; // percentage
  averageRR: number;
  profitFactor: number;
  deviationRate: number;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  equityCurve: { date: Date; value: number }[];
  performanceByPair: Record<string, number>;
  performanceBySession: Record<string, number>;
  performanceBySetup: Record<string, number>;
  performanceByEmotion: Record<number, number>;
  psychologyCorrelation: { emotionalRating: number; winRate: number }[];
}
