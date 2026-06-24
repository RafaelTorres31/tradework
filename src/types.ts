// Academia - agrupa mentores y traders
export interface Academy {
  id: string;
  name: string;
  color: string; // hex color (ej: #FF5733)
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: 'superadmin' | 'mentor' | 'trader';
  academyId?: string; // ID de la academia (mentores y traders)
  createdAt: string;
}

export type TradingSession = 'Asian' | 'London' | 'New York' | 'London/NY Overlap';
export type AccountType = 'Fondeo' | 'Capital Propio';
export type TradeResult = 'Win' | 'Loss' | 'Break Even';
export type TradeDirection = 'Long' | 'Short';

export interface Trade {
  id: string;
  userId: string;
  date: string;
  pair: string;
  direction: TradeDirection;
  session: TradingSession;
  accountType: AccountType;
  strategy: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  pips: number;
  profit: number;
  result: TradeResult;
  riskRewardRatio: string;
  notes: string;
  emotionalState: string;
  images: string[];
  screenshot?: string;
  createdAt: string;
}

export const FOREX_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CHF/JPY', 'EUR/AUD', 'EUR/CAD',
  'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/NZD', 'AUD/CAD', 'AUD/NZD',
  'XAU/USD', 'XAG/USD', 'US30', 'NAS100', 'SPX500'
];

export const STRATEGIES = [
  'Manipulacion', 'Descuento', 'El abusador'
];

export const EMOTIONAL_STATES = [
  'Confiado', 'Neutral', 'Ansioso', 'Frustrado',
  'Eufórico', 'Aburrido', 'Calmado', 'Con Miedo'
];

// Gestión de Riesgo - creado por admin, seguido por usuarios
export interface RiskManagement {
  id: string;
  name: string;
  accountType: 'Fondeo' | 'Capital Propio' | 'Ambos';
  description: string;
  rules: RiskRule[];
  maxDailyLoss: number; // porcentaje
  maxWeeklyLoss: number;
  maxDrawdown: number;
  riskPerTrade: number; // porcentaje
  maxOpenTrades: number;
  createdBy: string;
  academyId?: string;
  createdAt: string;
}

export interface RiskRule {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'limit' | 'tip';
}
