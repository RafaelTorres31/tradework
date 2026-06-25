import { User, Trade, Academy, RiskManagement } from './types';
import { supabase } from './utils/supabase';

const USERS_KEY = 'tj_users';
const TRADES_KEY = 'tj_trades';
const SESSION_KEY = 'tj_session';
const ACADEMIES_KEY = 'tj_academies';
const RISK_KEY = 'tj_risk_plans';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Helper para comprobar si Supabase está configurado en las variables de entorno
const isSupabaseConfigured = (): boolean => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};

export function getBackendMode(): 'supabase' | 'local' {
  return isSupabaseConfigured() ? 'supabase' : 'local';
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

// ==========================================
// LOCAL STORAGE TRADES
// ==========================================
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

// --- AUTH ---

export async function login(username: string, password: string): Promise<User | null> {
  if (getBackendMode() === 'supabase') {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) return null;
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    return data as User;
  } else {
    initLocalStore();
    const users = getLocalUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  }
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
  if (getBackendMode() === 'supabase') {
    const { data, error } = await supabase
      .from('academies')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error cargando academias desde Supabase:', error);
      return [];
    }
    return data as Academy[];
  } else {
    return getLocalAcademies();
  }
}

export async function createAcademy(name: string, color: string): Promise<Academy | string> {
  if (getBackendMode() === 'supabase') {
    const { data: existing } = await supabase
      .from('academies')
      .select('id')
      .ilike('name', name)
      .limit(1);

    if (existing && existing.length > 0) {
      return 'Ya existe una academia con ese nombre';
    }

    const academy: Academy = {
      id: generateId(),
      name,
      color,
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('academies')
      .insert(academy);

    if (error) {
      console.error('Error insertando academia:', error);
      return 'Error al crear la academia';
    }
    return academy;
  } else {
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
}

export async function updateAcademy(academyId: string, name: string, color: string): Promise<void> {
  if (getBackendMode() === 'supabase') {
    await supabase
      .from('academies')
      .update({ name, color })
      .eq('id', academyId);
  } else {
    const academies = getLocalAcademies();
    const idx = academies.findIndex(a => a.id === academyId);
    if (idx >= 0) {
      academies[idx].name = name;
      academies[idx].color = color;
      saveLocalAcademies(academies);
    }
  }
}

export async function deleteAcademy(academyId: string): Promise<void> {
  if (getBackendMode() === 'supabase') {
    // La eliminación de cascada en la base de datos manejará el set null en users
    await supabase
      .from('academies')
      .delete()
      .eq('id', academyId);
  } else {
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
}

// --- USER MANAGEMENT ---

export async function getAllUsers(): Promise<User[]> {
  if (getBackendMode() === 'supabase') {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('displayName', { ascending: true });

    if (error) {
      console.error('Error obteniendo usuarios de Supabase:', error);
      return [];
    }
    return data as User[];
  } else {
    initLocalStore();
    return getLocalUsers();
  }
}

export async function createUser(
  username: string,
  password: string,
  displayName: string,
  role: 'superadmin' | 'mentor' | 'trader' = 'trader',
  academyId?: string
): Promise<User | string> {
  if (getBackendMode() === 'supabase') {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .limit(1);

    if (existing && existing.length > 0) {
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

    const { error } = await supabase
      .from('users')
      .insert(user);

    if (error) {
      console.error('Error insertando usuario:', error);
      return 'Error al crear usuario';
    }
    return user;
  } else {
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
}

export async function deleteUser(userId: string): Promise<void> {
  if (getBackendMode() === 'supabase') {
    // cascade eliminará automáticamente sus trades vinculados
    await supabase
      .from('users')
      .delete()
      .eq('id', userId);
  } else {
    const users = getLocalUsers().filter(u => u.id !== userId);
    saveLocalUsers(users);
    const trades = getLocalTrades().filter(t => t.userId !== userId);
    saveLocalTrades(trades);
  }
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  if (getBackendMode() === 'supabase') {
    await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', userId);
  } else {
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx].password = newPassword;
      saveLocalUsers(users);
    }
  }
}

export async function updateUserAcademy(userId: string, academyId: string | null): Promise<void> {
  if (getBackendMode() === 'supabase') {
    await supabase
      .from('users')
      .update({ academyId: academyId || null })
      .eq('id', userId);
  } else {
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx].academyId = academyId || undefined;
      saveLocalUsers(users);
    }
  }
}

// --- TRADE MANAGEMENT ---

export async function getUserTrades(userId: string): Promise<Trade[]> {
  if (getBackendMode() === 'supabase') {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error al obtener trades:', error);
      return [];
    }
    return data as Trade[];
  } else {
    return getLocalTrades().filter(t => t.userId === userId);
  }
}

export async function addTrade(trade: Omit<Trade, 'id' | 'createdAt'>): Promise<Trade> {
  const newTrade: Trade = {
    ...trade,
    images: trade.images || [],
    id: generateId(),
    createdAt: new Date().toISOString()
  };

  if (getBackendMode() === 'supabase') {
    const { error } = await supabase
      .from('trades')
      .insert(newTrade);

    if (error) {
      console.error('Error insertando trade:', error);
      throw error;
    }
  } else {
    saveLocalTrades([...getLocalTrades(), newTrade]);
  }
  return newTrade;
}

export async function updateTrade(tradeId: string, updates: Partial<Trade>): Promise<void> {
  if (getBackendMode() === 'supabase') {
    const { error } = await supabase
      .from('trades')
      .update(updates)
      .eq('id', tradeId);

    if (error) {
      console.error('Error al actualizar trade:', error);
      throw error;
    }
  } else {
    const trades = getLocalTrades();
    const idx = trades.findIndex(t => t.id === tradeId);
    if (idx >= 0) {
      trades[idx] = { ...trades[idx], ...updates };
      saveLocalTrades(trades);
    }
  }
}

export async function deleteTrade(tradeId: string): Promise<void> {
  if (getBackendMode() === 'supabase') {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', tradeId);

    if (error) {
      console.error('Error al borrar trade:', error);
      throw error;
    }
  } else {
    saveLocalTrades(getLocalTrades().filter(t => t.id !== tradeId));
  }
}

export async function getTradesByDate(userId: string, date: string): Promise<Trade[]> {
  if (getBackendMode() === 'supabase') {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('userId', userId)
      .eq('date', date);

    if (error) {
      console.error('Error al obtener trades por fecha:', error);
      return [];
    }
    return data as Trade[];
  } else {
    return getLocalTrades().filter(t => t.userId === userId && t.date === date);
  }
}

export async function getUserTradeStats(userId: string): Promise<{ trades: number; profit: number }> {
  if (getBackendMode() === 'supabase') {
    const { data, error } = await supabase
      .from('trades')
      .select('profit')
      .eq('userId', userId);

    if (error || !data) {
      console.error('Error obteniendo estadísticas del trade:', error);
      return { trades: 0, profit: 0 };
    }

    return {
      trades: data.length,
      profit: data.reduce((s, t) => s + Number(t.profit), 0),
    };
  } else {
    const trades = getLocalTrades().filter(t => t.userId === userId);
    return {
      trades: trades.length,
      profit: trades.reduce((s, t) => s + t.profit, 0),
    };
  }
}

// --- RISK MANAGEMENT (STORE-BASED) ---

export async function getRiskPlansStore(): Promise<RiskManagement[]> {
  if (getBackendMode() === 'supabase') {
    const { data, error } = await supabase
      .from('risk_plans')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error cargando planes de riesgo de Supabase:', error);
      return [];
    }
    return data as RiskManagement[];
  } else {
    const data = localStorage.getItem(RISK_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function saveRiskPlanStore(plan: RiskManagement): Promise<void> {
  if (getBackendMode() === 'supabase') {
    const { data: existing } = await supabase
      .from('risk_plans')
      .select('id')
      .eq('id', plan.id)
      .limit(1);

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('risk_plans')
        .update(plan)
        .eq('id', plan.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('risk_plans')
        .insert(plan);
      if (error) throw error;
    }
  } else {
    const data = localStorage.getItem(RISK_KEY);
    const plans: RiskManagement[] = data ? JSON.parse(data) : [];
    const idx = plans.findIndex(p => p.id === plan.id);
    const updated = idx >= 0
      ? plans.map(p => p.id === plan.id ? plan : p)
      : [...plans, plan];
    localStorage.setItem(RISK_KEY, JSON.stringify(updated));
  }
}

export async function deleteRiskPlanStore(planId: string): Promise<void> {
  if (getBackendMode() === 'supabase') {
    const { error } = await supabase
      .from('risk_plans')
      .delete()
      .eq('id', planId);
    if (error) throw error;
  } else {
    const data = localStorage.getItem(RISK_KEY);
    if (data) {
      const plans: RiskManagement[] = JSON.parse(data);
      const updated = plans.filter(p => p.id !== planId);
      localStorage.setItem(RISK_KEY, JSON.stringify(updated));
    }
  }
}

// --- INITIALIZE ---

export async function initializeStore() {
  initLocalStore();
  if (getBackendMode() === 'supabase') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'superadmin')
        .limit(1);

      if (!error && (!data || data.length === 0)) {
        await supabase.from('users').insert({
          id: 'superadmin',
          username: 'superadmin',
          password: 'super123',
          displayName: 'Super Administrador',
          role: 'superadmin',
          createdAt: new Date().toISOString()
        });
        console.log('Creado superadmin por defecto en Supabase');
      }
    } catch (err) {
      console.error('Error al inicializar la base de datos de Supabase:', err);
    }
  }
}
