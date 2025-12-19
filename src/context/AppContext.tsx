import React, { createContext, useReducer, ReactNode } from 'react';
import { User, Trade, ChecklistTemplate, PsychologyLog, ChecklistItem, Routine, TradingAccount } from '../types';

export interface AppState {
  user: User | null;
  trades: Trade[];
  checklistTemplate: ChecklistTemplate | null;
  psychologyLogs: PsychologyLog[];
  isLoading: boolean;
  error: string | null;
  routines: Routine[]; // Add routines property
  accounts: TradingAccount[]; // Add accounts property
}

export type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TRADES'; payload: Trade[] }
  | { type: 'ADD_TRADE'; payload: Trade }
  | { type: 'UPDATE_TRADE'; payload: Trade }
  | { type: 'DELETE_TRADE'; payload: string }
  | { type: 'SET_CHECKLIST_TEMPLATE'; payload: ChecklistTemplate | null }
  | { type: 'UPDATE_CHECKLIST_ITEM'; payload: ChecklistItem }
  | { type: 'ADD_CHECKLIST_ITEM'; payload: ChecklistItem }
  | { type: 'DELETE_CHECKLIST_ITEM'; payload: string }
  | { type: 'SET_PSYCHOLOGY_LOGS'; payload: PsychologyLog[] }
  | { type: 'ADD_PSYCHOLOGY_LOG'; payload: PsychologyLog }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROUTINES'; payload: Routine[] } // Add SET_ROUTINES action
  | { type: 'SET_ACCOUNTS'; payload: TradingAccount[] }; // Add SET_ACCOUNTS action

const initialState: AppState = {
  user: null,
  trades: [],
  checklistTemplate: null,
  psychologyLogs: [],
  isLoading: false,
  error: null,
  routines: [], // Initialize routines
  accounts: [], // Initialize accounts
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TRADES':
      return { ...state, trades: action.payload };
    case 'ADD_TRADE':
      return { ...state, trades: [...state.trades, action.payload] };
    case 'UPDATE_TRADE':
      return {
        ...state,
        trades: state.trades.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'DELETE_TRADE':
      return { ...state, trades: state.trades.filter((t) => t.id !== action.payload) };
    case 'SET_CHECKLIST_TEMPLATE':
      return { ...state, checklistTemplate: action.payload };
    case 'UPDATE_CHECKLIST_ITEM':
      return {
        ...state,
        checklistTemplate: state.checklistTemplate
          ? {
              ...state.checklistTemplate,
              items: state.checklistTemplate.items.map((item) =>
                item.id === action.payload.id ? action.payload : item
              ),
            }
          : null,
      };
    case 'ADD_CHECKLIST_ITEM':
      return {
        ...state,
        checklistTemplate: state.checklistTemplate
          ? {
              ...state.checklistTemplate,
              items: [...state.checklistTemplate.items, action.payload],
            }
          : null,
      };
    case 'DELETE_CHECKLIST_ITEM':
      return {
        ...state,
        checklistTemplate: state.checklistTemplate
          ? {
              ...state.checklistTemplate,
              items: state.checklistTemplate.items.filter(
                (item) => item.id !== action.payload
              ),
            }
          : null,
      };
    case 'SET_PSYCHOLOGY_LOGS':
      return { ...state, psychologyLogs: action.payload };
    case 'ADD_PSYCHOLOGY_LOG':
      return { ...state, psychologyLogs: [...state.psychologyLogs, action.payload] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ROUTINES': // Handle SET_ROUTINES action
      return { ...state, routines: action.payload };
    case 'SET_ACCOUNTS': // Handle SET_ACCOUNTS action
      return { ...state, accounts: action.payload };
    default:
      return state;
  }
}

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

export interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}
