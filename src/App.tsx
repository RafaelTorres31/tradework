import { useState, useEffect, useCallback } from 'react';
import { User, Trade, RiskManagement, Academy } from './types';
import {
  getCurrentUser, logout, getUserTrades, addTrade, updateTrade,
  deleteTrade, getTradesByDate, initializeStore,
  getAllUsers, getAllAcademies,
  getRiskPlansStore, saveRiskPlanStore, deleteRiskPlanStore
} from './store';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import RiskManagementPanel from './components/RiskManagementPanel';
import TradeForm from './components/TradeForm';
import Calculator from './components/Calculator';
import Stats from './components/Stats';
import AdminPanel from './components/AdminPanel';
import DayDetail from './components/DayDetail';

type Page = 'dashboard' | 'calendar' | 'risk' | 'calculator' | 'stats' | 'admin';

// Los planes de riesgo ahora se gestionan a través del store asíncrono

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>();
  const [dayDetailDate, setDayDetailDate] = useState<string | null>(null);
  const [dayDetailTrades, setDayDetailTrades] = useState<Trade[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mentor mode - admin/mentor viewing student data (FULL ACCESS)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [viewingUserName, setViewingUserName] = useState<string>('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);

  // Risk Management Plans
  const [riskPlans, setRiskPlans] = useState<RiskManagement[]>([]);

  const isSuperAdmin = user?.role === 'superadmin';
  const isMentor = user?.role === 'mentor';
  const canViewStudents = isSuperAdmin || isMentor;
  const canManageRisk = isMentor;
  const isViewingStudent = canViewStudents && viewingUserId !== null;

  useEffect(() => {
    initializeStore();
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Load risk plans
  useEffect(() => {
    const loadRiskPlans = async () => {
      const plans = await getRiskPlansStore();
      setRiskPlans(plans);
    };
    loadRiskPlans();
  }, []);

  // Load all users and academies for admin/mentor
  useEffect(() => {
    const loadUsers = async () => {
      if (user && (user.role === 'superadmin' || user.role === 'mentor')) {
        const [users, acads] = await Promise.all([getAllUsers(), getAllAcademies()]);
        setAcademies(acads);

        // SuperAdmin sees all mentors y traders, Mentor sees only traders de su academia
        if (user.role === 'superadmin') {
          setAllUsers(users.filter(u => u.role !== 'superadmin'));
        } else if (user.role === 'mentor' && user.academyId) {
          setAllUsers(users.filter(u => u.role === 'trader' && u.academyId === user.academyId));
        } else {
          setAllUsers([]);
        }
      }
    };
    loadUsers();
  }, [user]);

  const refreshTrades = useCallback(async () => {
    const targetUserId = viewingUserId || user?.id;
    if (targetUserId) {
      setLoading(true);
      try {
        const t = await getUserTrades(targetUserId);
        setTrades(t);
      } catch (err) {
        console.error('Error loading trades:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [user, viewingUserId]);

  useEffect(() => {
    refreshTrades();
  }, [refreshTrades]);

  const handleLogin = (u: User) => {
    setUser(u);
    setPage('dashboard');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setTrades([]);
    setPage('dashboard');
    setViewingUserId(null);
  };

  const handleSaveTrade = async (tradeData: Omit<Trade, 'id' | 'createdAt'>) => {
    // Don't allow saving if viewing student (read-only mode)
    if (isViewingStudent) return;

    setLoading(true);
    try {
      if (editingTrade) {
        await updateTrade(editingTrade.id, tradeData);
      } else {
        await addTrade(tradeData);
      }
      setShowTradeForm(false);
      setEditingTrade(null);
      setFormInitialDate(undefined);
      await refreshTrades();

      // Refresh day detail if open
      if (dayDetailDate && user) {
        const targetId = viewingUserId || user.id;
        const dayTrades = await getTradesByDate(targetId, dayDetailDate);
        setDayDetailTrades(dayTrades);
      }
    } catch (err) {
      console.error('Error saving trade:', err);
      alert('Error al guardar el trade. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    // Don't allow deleting if viewing student (read-only mode)
    if (isViewingStudent) return;

    setLoading(true);
    try {
      await deleteTrade(tradeId);
      await refreshTrades();

      if (dayDetailDate && user) {
        const targetId = viewingUserId || user.id;
        const updated = await getTradesByDate(targetId, dayDetailDate);
        if (updated.length === 0) {
          setDayDetailDate(null);
        } else {
          setDayDetailTrades(updated);
        }
      }
    } catch (err) {
      console.error('Error deleting trade:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTrade = (trade: Trade) => {
    // Don't allow editing if viewing student (read-only mode)
    if (isViewingStudent) return;

    setEditingTrade(trade);
    setShowTradeForm(true);
  };

  const handleAddTradeForDate = (date: string) => {
    // Don't allow adding if viewing student (read-only mode)
    if (isViewingStudent) return;

    setFormInitialDate(date);
    setEditingTrade(null);
    setShowTradeForm(true);
  };

  const handleDayClick = async (date: string, dayTrades: Trade[]) => {
    if (dayTrades.length > 0) {
      setDayDetailDate(date);
      setDayDetailTrades(dayTrades);
    } else if (!isViewingStudent) {
      // Only allow adding trades if not viewing student
      handleAddTradeForDate(date);
    }
  };

  // Admin selects a student to view
  const handleSelectStudent = (studentId: string | null) => {
    if (studentId === null) {
      // Return to admin's own view
      setViewingUserId(null);
      setViewingUserName('');
    } else {
      const student = allUsers.find(u => u.id === studentId);
      if (student) {
        setViewingUserId(studentId);
        setViewingUserName(student.displayName);
        setPage('dashboard'); // Go to dashboard when selecting student
      }
    }
  };

  // Risk management handlers
  const handleSaveRiskPlan = async (plan: RiskManagement) => {
    const planWithAcademy: RiskManagement = {
      ...plan,
      academyId: user?.role === 'mentor' ? user.academyId : plan.academyId,
      createdBy: user?.id || plan.createdBy || 'unknown',
      createdAt: plan.createdAt || new Date().toISOString(),
    };

    const existingIndex = riskPlans.findIndex(p => p.id === plan.id);
    const updated = existingIndex >= 0
      ? riskPlans.map(p => p.id === plan.id ? planWithAcademy : p)
      : [...riskPlans, planWithAcademy];
    
    setRiskPlans(updated);
    try {
      await saveRiskPlanStore(planWithAcademy);
    } catch (err) {
      console.error('Error al guardar plan de riesgo:', err);
    }
  };

  const handleDeleteRiskPlan = async (planId: string) => {
    const updated = riskPlans.filter(p => p.id !== planId);
    setRiskPlans(updated);
    try {
      await deleteRiskPlanStore(planId);
    } catch (err) {
      console.error('Error al eliminar plan de riesgo:', err);
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Determine active user ID for trades
  const activeUserId = viewingUserId || user.id;

  const visibleRiskPlans = (() => {
    if (!user) return [];
    if (user.role === 'superadmin') return riskPlans;
    if ((user.role === 'mentor' || user.role === 'trader') && user.academyId) {
      return riskPlans.filter(p => p.academyId === user.academyId);
    }
    return [];
  })();

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            trades={trades}
            academies={academies}
            allUsers={canViewStudents && !viewingUserId ? allUsers : undefined}
            onSelectStudent={canViewStudents && !viewingUserId ? handleSelectStudent : undefined}
          />
        );
      case 'calendar':
        return (
          <Calendar
            trades={trades}
            onDayClick={handleDayClick}
            onAddTrade={isViewingStudent ? undefined : handleAddTradeForDate}
            readOnly={isViewingStudent}
          />
        );
      case 'risk':
        return (
          <RiskManagementPanel
            plans={visibleRiskPlans}
            canManage={canManageRisk}
            onSave={handleSaveRiskPlan}
            onDelete={handleDeleteRiskPlan}
          />
        );
      case 'calculator':
        return <Calculator />;
      case 'stats':
        return <Stats trades={trades} />;
      case 'admin':
        return isSuperAdmin ? <AdminPanel currentUserId={user.id} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar
        currentPage={page}
        onPageChange={(p) => { setPage(p); setMobileMenuOpen(false); }}
        onLogout={handleLogout}
        isAdmin={isSuperAdmin}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-bold">TradeWork</span>
          <div className="w-10" />
        </div>

        {/* Viewing Student Banner */}
        {isViewingStudent && (() => {
          const viewingStudent = allUsers.find(u => u.id === viewingUserId);
          const studentAcademy = viewingStudent?.academyId ? academies.find(a => a.id === viewingStudent.academyId) : null;
          return (
            <div className="border-b px-4 py-3" style={{ background: studentAcademy ? `linear-gradient(to right, ${studentAcademy.color}20, ${studentAcademy.color}10)` : 'linear-gradient(to right, rgba(245,158,11,0.13), rgba(249,115,22,0.13))', borderColor: studentAcademy ? `${studentAcademy.color}50` : 'rgba(245,158,11,0.3)' }}>
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-amber-400 font-semibold">Modo Mentor</span>
                    <span className="text-gray-300">—</span>
                    <span className="text-white font-medium">Viendo cuenta de: {viewingUserName}</span>
                    {studentAcademy && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${studentAcademy.color}30`, color: studentAcademy.color }}>
                        {studentAcademy.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSelectStudent(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Salir
                </button>
              </div>
            </div>
          );
        })()}

        {/* Read-only notice when viewing student */}
        {isViewingStudent && (
          <div className="bg-gray-800/50 border-b border-gray-700 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Modo solo lectura — No puedes agregar, editar ni eliminar trades del alumno</span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {loading && (
            <div className="fixed top-4 right-4 z-50 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
              <svg className="w-4 h-4 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span className="text-sm text-gray-300">Cargando...</span>
            </div>
          )}

          {renderPage()}
        </div>
      </div>

      {/* Trade Form Modal */}
      {showTradeForm && !isViewingStudent && (
        <TradeForm
          trade={editingTrade}
          userId={activeUserId}
          initialDate={formInitialDate}
          onSave={handleSaveTrade}
          onCancel={() => {
            setShowTradeForm(false);
            setEditingTrade(null);
            setFormInitialDate(undefined);
          }}
        />
      )}

      {/* Day Detail Modal */}
      {dayDetailDate && (
        <DayDetail
          date={dayDetailDate}
          trades={dayDetailTrades}
          onClose={() => setDayDetailDate(null)}
          onEdit={isViewingStudent ? undefined : handleEditTrade}
          onDelete={isViewingStudent ? undefined : handleDeleteTrade}
          onAddTrade={isViewingStudent ? undefined : () => handleAddTradeForDate(dayDetailDate)}
          readOnly={isViewingStudent}
        />
      )}

      {/* Floating Add Button (only when not viewing student) */}
      {page === 'calendar' && !showTradeForm && !dayDetailDate && !isViewingStudent && (
        <button
          onClick={() => {
            setEditingTrade(null);
            setFormInitialDate(undefined);
            setShowTradeForm(true);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center text-2xl transition-all hover:scale-110 z-40"
        >
          +
        </button>
      )}
    </div>
  );
}
