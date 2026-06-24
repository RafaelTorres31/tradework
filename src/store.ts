import { User, Trade, Academy } from './types';

const USERS_KEY = 'tj_users';
const TRADES_KEY = 'tj_trades';
const SESSION_KEY = 'tj_session';
const ACADEMIES_KEY = 'tj_academies';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================
function getLocalUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getLocalTrades(): Trade[] {
  const data = localStorage.getItem(TRADES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalTrades(trades: Trade[]) {
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
}

function getLocalAcademies(): Academy[] {
  const data = localStorage.getItem(ACADEMIES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalAcademies(academies: Academy[]) {
  localStorage.setItem(ACADEMIES_KEY, JSON.stringify(academies));
}

function initLocalStore() {
  const users = getLocalUsers();
  if (!users.find(u => u.role === 'superadmin')) {
    const superAdmin: User = {
      id: generateId(),
      username: 'superadmin',
      password: 'super123',
      displayName: 'Super Administrador',
      role: 'superadmin',
      createdAt: new Date().toISOString()
    };
    saveLocalUsers([superAdmin, ...users]);
  }
}

// ==========================================
// PUBLIC API
// ==========================================

export function getBackendMode(): 'supabase' | 'local' {
  return 'local';
}

// --- AUTH ---

export async function login(username: string, password: string): Promise<User | null> {
  initLocalStore();
  const users = getLocalUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }
  return null;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// --- ACADEMY MANAGEMENT ---

export async function getAllAcademies(): Promise<Academy[]> {
  return getLocalAcademies();
}

export async function createAcademy(name: string, color: string): Promise<Academy | string> {
  const academies = getLocalAcademies();
  if (academies.find(a => a.name.toLowerCase() === name.toLowerCase())) {
    return 'Ya existe una academia con ese nombre';
  }
  const academy: Academy = {
    id: generateId(),
    name,
    color,
    createdAt: new Date().toISOString()
  };
  saveLocalAcademies([...academies, academy]);
  return academy;
}

export async function updateAcademy(academyId: string, name: string, color: string): Promise<void> {
  const academies = getLocalAcademies();
  const idx = academies.findIndex(a => a.id === academyId);
  if (idx >= 0) {
    academies[idx].name = name;
    academies[idx].color = color;
    saveLocalAcademies(academies);
  }
}

export async function deleteAcademy(academyId: string): Promise<void> {
  // Remove academy_id from users
  const users = getLocalUsers();
  users.forEach(u => {
    if (u.academyId === academyId) {
      u.academyId = undefined;
    }
  });
  saveLocalUsers(users);

  const academies = getLocalAcademies().filter(a => a.id !== academyId);
  saveLocalAcademies(academies);
}

// --- USER MANAGEMENT ---

export async function getAllUsers(): Promise<User[]> {
  initLocalStore();
  return getLocalUsers();
}

export async function createUser(
  username: string,
  password: string,
  displayName: string,
  role: 'superadmin' | 'mentor' | 'trader' = 'trader',
  academyId?: string
): Promise<User | string> {
  const users = getLocalUsers();
  if (users.find(u => u.username === username)) {
    return 'El nombre de usuario ya existe';
  }
  const user: User = {
    id: generateId(),
    username,
    password,
    displayName,
    role,
    academyId: academyId || undefined,
    createdAt: new Date().toISOString()
  };
  saveLocalUsers([...users, user]);
  return user;
}

export async function deleteUser(userId: string): Promise<void> {
  const users = getLocalUsers().filter(u => u.id !== userId);
  saveLocalUsers(users);
  const trades = getLocalTrades().filter(t => t.userId !== userId);
  saveLocalTrades(trades);
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const users = getLocalUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    users[idx].password = newPassword;
    saveLocalUsers(users);
  }
}

export async function updateUserAcademy(userId: string, academyId: string | null): Promise<void> {
  const users = getLocalUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    users[idx].academyId = academyId || undefined;
    saveLocalUsers(users);
  }
}

// --- TRADE MANAGEMENT ---

export async function getUserTrades(userId: string): Promise<Trade[]> {
  return getLocalTrades().filter(t => t.userId === userId);
}

export async function addTrade(trade: Omit<Trade, 'id' | 'createdAt'>): Promise<Trade> {
  const newTrade: Trade = {
    ...trade,
    images: trade.images || [],
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  saveLocalTrades([...getLocalTrades(), newTrade]);
  return newTrade;
}

export async function updateTrade(tradeId: string, updates: Partial<Trade>): Promise<void> {
  const trades = getLocalTrades();
  const idx = trades.findIndex(t => t.id === tradeId);
  if (idx >= 0) {
    trades[idx] = { ...trades[idx], ...updates };
    saveLocalTrades(trades);
  }
}

export async function deleteTrade(tradeId: string): Promise<void> {
  saveLocalTrades(getLocalTrades().filter(t => t.id !== tradeId));
}

export async function getTradesByDate(userId: string, date: string): Promise<Trade[]> {
  return getLocalTrades().filter(t => t.userId === userId && t.date === date);
}

export async function getUserTradeStats(userId: string): Promise<{ trades: number; profit: number }> {
  const trades = getLocalTrades().filter(t => t.userId === userId);
  return {
    trades: trades.length,
    profit: trades.reduce((s, t) => s + t.profit, 0),
  };
}

export function initializeStore() {
  initLocalStore();
}
