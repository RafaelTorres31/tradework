import { useState, useEffect, useCallback } from 'react';
import { User, Academy } from '../types';
import { getAllUsers, createUser, deleteUser, updateUserPassword, getUserTradeStats, getBackendMode, getAllAcademies, createAcademy, deleteAcademy, updateAcademy } from '../store';
import AcademyManager from './AcademyManager';

interface Props { currentUserId: string; }
type UserRole = 'superadmin' | 'mentor' | 'trader';

const roleInfo: Record<UserRole, { label: string; icon: string; badge: string; avatar: string; border: string }> = {
  superadmin: { label: 'Super Admin', icon: '', badge: 'bg-red-500/20 text-red-400', avatar: 'bg-gradient-to-br from-red-500 to-rose-600', border: 'border-red-500/30' },
  mentor: { label: 'Mentor', icon: '', badge: 'bg-amber-500/20 text-amber-400', avatar: 'bg-gradient-to-br from-amber-500 to-orange-600', border: 'border-amber-500/30' },
  trader: { label: 'Trader', icon: '', badge: 'bg-emerald-500/20 text-emerald-400', avatar: 'bg-gradient-to-br from-emerald-500 to-teal-600', border: 'border-gray-700/50' },
};

export default function AdminPanel({ currentUserId }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('trader');
  const [newAcademyId, setNewAcademyId] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editPasswordId, setEditPasswordId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState('');
  const [userStats, setUserStats] = useState<Record<string, { trades: number; profit: number }>>({});
  const [loading, setLoading] = useState(false);
  const backendMode = getBackendMode();
  const inputClass = "w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all";

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [u, a] = await Promise.all([getAllUsers(), getAllAcademies()]);
      setUsers(u); setAcademies(a);
      const stats: Record<string, { trades: number; profit: number }> = {};
      for (const user of u) stats[user.id] = await getUserTradeStats(user.id);
      setUserStats(stats);
    } catch { setError('Error al cargar datos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (newPassword.length < 4) { setError('Contraseña mínimo 4 caracteres'); return; }
    if ((newRole === 'mentor' || newRole === 'trader') && !newAcademyId) { setError('Selecciona una academia'); return; }
    setLoading(true);
    try {
      const result = await createUser(newUsername, newPassword, newDisplayName, newRole, newRole === 'superadmin' ? undefined : newAcademyId);
      if (typeof result === 'string') { setError(result); }
      else {
        const ri = roleInfo[newRole];
        setSuccess(`${ri.label} "${newDisplayName}" creado`);
        setNewUsername(''); setNewPassword(''); setNewDisplayName(''); setNewRole('trader'); setNewAcademyId('');
        setShowForm(false); await refresh(); setTimeout(() => setSuccess(''), 3000);
      }
    } catch { setError('Error al crear usuario'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (userId: string, name: string, role: UserRole) => {
    if (userId === currentUserId) { setError('No puedes eliminarte'); setTimeout(() => setError(''), 3000); return; }
    if (confirm(`¿Eliminar ${roleInfo[role].label.toLowerCase()} "${name}"?`)) {
      setLoading(true);
      try { await deleteUser(userId); await refresh(); setSuccess(`"${name}" eliminado`); setTimeout(() => setSuccess(''), 3000); }
      catch { setError('Error al eliminar'); } finally { setLoading(false); }
    }
  };

  const handleUpdatePassword = async (userId: string) => {
    if (newPass.length < 4) { setError('Contraseña mínimo 4 caracteres'); return; }
    setLoading(true);
    try { await updateUserPassword(userId, newPass); setEditPasswordId(null); setNewPass(''); setSuccess('Contraseña actualizada'); setTimeout(() => setSuccess(''), 3000); }
    catch { setError('Error al actualizar'); } finally { setLoading(false); }
  };

  const getAcademy = (id?: string) => id ? academies.find(a => a.id === id) : null;

  const renderUserCard = (user: User) => {
    const stats = userStats[user.id] || { trades: 0, profit: 0 };
    const isCurrent = user.id === currentUserId;
    const ri = roleInfo[user.role as UserRole];
    const academy = getAcademy(user.academyId);

    return (
      <div key={user.id} className={`bg-gray-800/50 border rounded-xl p-3 hover:border-gray-600/50 transition-colors ${ri.border}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${ri.avatar}`}>
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white font-semibold text-sm">{user.displayName}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded-full">@{user.username}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${ri.badge}`}>{ri.label}</span>
              {academy && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${academy.color}25`, color: academy.color }}>{academy.name}</span>}
              {isCurrent && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">(Tú)</span>}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
              <span>{stats.trades} trades</span>
              <span className={stats.profit >= 0 ? 'text-emerald-400' : 'text-gray-400'}>{stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(2)}$</span>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => { setEditPasswordId(editPasswordId === user.id ? null : user.id); setNewPass(''); }} className="p-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-xs" title="Cambiar Contraseña">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2 4a5 5 0 11-5-5h.01M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {!isCurrent && (
              <button onClick={() => handleDelete(user.id, user.displayName, user.role as UserRole)} className="p-1.5 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600 hover:text-red-400 text-xs" title="Eliminar">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {editPasswordId === user.id && (
          <div className="mt-2 pt-2 border-t border-gray-700/50 flex gap-2">
            <input type="text" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nueva contraseña..."
              className="flex-1 px-2 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none" />
            <button onClick={() => handleUpdatePassword(user.id)} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium">Guardar</button>
          </div>
        )}
      </div>
    );
  };

  const superAdmins = users.filter(u => u.role === 'superadmin');
  const mentors = users.filter(u => u.role === 'mentor');
  const traders = users.filter(u => u.role === 'trader');

  const renderAcademyFolder = (academy: Academy) => {
    const academyMentors = mentors.filter(m => m.academyId === academy.id);
    const academyTraders = traders.filter(t => t.academyId === academy.id);
    return (
      <div key={academy.id} className="rounded-3xl border border-gray-700/50 overflow-hidden">
        <div className="px-5 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ background: `${academy.color}15` }}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ background: academy.color }} />
              <h3 className="text-sm font-semibold text-white">{academy.name}</h3>
            </div>
            <p className="text-xs text-gray-400">Color distintivo: <span className="font-semibold" style={{ color: academy.color }}>{academy.color}</span></p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-300">
            <span className="rounded-full px-3 py-1 bg-white/5">Mentores: {academyMentors.length}</span>
            <span className="rounded-full px-3 py-1 bg-white/5">Alumnos: {academyTraders.length}</span>
          </div>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Mentores</div>
            {academyMentors.length === 0 ? (
              <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 px-4 py-5 text-sm text-gray-500">No hay mentores asignados a esta academia.</div>
            ) : (
              <div className="space-y-3">{academyMentors.map(renderUserCard)}</div>
            )}
          </div>
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Alumnos</div>
            {academyTraders.length === 0 ? (
              <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 px-4 py-5 text-sm text-gray-500">No hay alumnos asignados a esta academia.</div>
            ) : (
              <div className="space-y-3">{academyTraders.map(renderUserCard)}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const unassignedMentors = mentors.filter(m => !m.academyId);
  const unassignedTraders = traders.filter(t => !t.academyId);

  const roleBtnCls = (r: UserRole, sel: boolean) => sel
    ? (r === 'superadmin' ? 'bg-red-500/30 border-2 border-red-500 text-red-300' : r === 'mentor' ? 'bg-amber-500/30 border-2 border-amber-500 text-amber-300' : 'bg-emerald-500/30 border-2 border-emerald-500 text-emerald-300')
    : 'bg-gray-700/50 border-2 border-gray-600/50 text-gray-400 hover:border-gray-500';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Panel de Super Administración
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${backendMode === 'supabase' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {backendMode === 'supabase' ? 'Supabase' : 'Local'}
            </span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">Gestiona academias, mentores y traders</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50">
          {showForm ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm">{success}</div>}

      {showForm && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Crear Nuevo Usuario</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-xs text-gray-400 mb-1">Nombre</label><input type="text" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} className={inputClass} placeholder="Juan" required /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Usuario</label><input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className={inputClass} placeholder="juantrader" required /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Contraseña</label><input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} placeholder="mín 4 chars" required /></div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Rol</label>
              <div className="flex gap-2">
                {(['trader', 'mentor', 'superadmin'] as UserRole[]).map(r => (
                  <button key={r} type="button" onClick={() => { setNewRole(r); if (r === 'superadmin') setNewAcademyId(''); }}
                    className={`flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${roleBtnCls(r, newRole === r)}`}>
                    {roleInfo[r].label}
                  </button>
                ))}
              </div>
            </div>
            {newRole !== 'superadmin' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Academia</label>
                {academies.length === 0 ? (
                  <p className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">Crea una academia primero antes de asignar usuarios</p>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {academies.map(a => (
                      <button key={a.id} type="button" onClick={() => setNewAcademyId(a.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${newAcademyId === a.id ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'}`}
                        style={{ background: `${a.color}25`, color: a.color, borderColor: `${a.color}50` }}>
                        <div className="w-3 h-3 rounded" style={{ background: a.color }} />
                        {a.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {newRole === 'superadmin' && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-xs">Control TOTAL del sistema</div>}
            {newRole === 'mentor' && <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-2 rounded-xl text-xs">Puede ver traders de su academia en modo lectura</div>}
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className={`px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${newRole === 'superadmin' ? 'bg-red-500 hover:bg-red-600' : newRole === 'mentor' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {loading ? 'Cargando...' : `Crear ${roleInfo[newRole].label}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3"><p className="text-gray-400 text-[10px]">Total</p><p className="text-xl font-bold text-white">{users.length}</p></div>
        <div className="bg-gray-800/50 border border-red-500/20 rounded-xl p-3"><p className="text-gray-400 text-[10px]">Admins</p><p className="text-xl font-bold text-red-400">{superAdmins.length}</p></div>
        <div className="bg-gray-800/50 border border-amber-500/20 rounded-xl p-3"><p className="text-gray-400 text-[10px]">Mentores</p><p className="text-xl font-bold text-amber-400">{mentors.length}</p></div>
        <div className="bg-gray-800/50 border border-emerald-500/20 rounded-xl p-3"><p className="text-gray-400 text-[10px]">Traders</p><p className="text-xl font-bold text-emerald-400">{traders.length}</p></div>
        <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-3"><p className="text-gray-400 text-[10px]">Academias</p><p className="text-xl font-bold text-purple-400">{academies.length}</p></div>
      </div>

      {loading && <div className="text-center py-2 text-gray-400 text-sm animate-pulse">Cargando...</div>}

      {/* Academy Manager */}
      <AcademyManager academies={academies}
        onCreateAcademy={async (n, c) => { const r = await createAcademy(n, c); if (typeof r === 'string') setError(r); else { setSuccess(`Academia "${n}" creada`); setTimeout(() => setSuccess(''), 3000); await refresh(); } }}
        onDeleteAcademy={async (id) => { await deleteAcademy(id); setSuccess('Academia eliminada'); setTimeout(() => setSuccess(''), 3000); await refresh(); }}
        onUpdateAcademy={async (id, n, c) => { await updateAcademy(id, n, c); setSuccess('Academia actualizada'); setTimeout(() => setSuccess(''), 3000); await refresh(); }}
      />

      {/* Super Admins */}
      {superAdmins.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-red-400">Super Administradores ({superAdmins.length})</h3>
          {superAdmins.map(renderUserCard)}
        </div>
      )}

      {/* Academy folder view */}
      {academies.length > 0 ? (
        <div className="space-y-4">
          {academies.map(renderAcademyFolder)}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-500 flex flex-col items-center justify-center">
          <svg className="w-12 h-12 mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm">No hay academias. Crea una academia para organizar mentores y alumnos.</p>
        </div>
      )}

      {(unassignedMentors.length > 0 || unassignedTraders.length > 0) && (
        <div className="rounded-3xl border border-gray-700/50 overflow-hidden">
          <div className="px-5 py-5 bg-gray-900/70">
            <h3 className="text-sm font-semibold text-white">Sin academia asignada</h3>
            <p className="text-xs text-gray-400">Mentores y alumnos sin academia pueden asignarse después.</p>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Mentores</div>
              {unassignedMentors.length === 0 ? (
                <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 px-4 py-5 text-sm text-gray-500">No hay mentores sin academia.</div>
              ) : (
                <div className="space-y-3">{unassignedMentors.map(renderUserCard)}</div>
              )}
            </div>
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Alumnos</div>
              {unassignedTraders.length === 0 ? (
                <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 px-4 py-5 text-sm text-gray-500">No hay alumnos sin academia.</div>
              ) : (
                <div className="space-y-3">{unassignedTraders.map(renderUserCard)}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
