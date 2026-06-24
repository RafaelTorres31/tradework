import { useMemo } from 'react';
import { Trade, User, Academy } from '../types';

interface Props {
  trades: Trade[];
  academies?: Academy[];
  allUsers?: User[];
  onSelectStudent?: (studentId: string | null) => void;
}

export default function Dashboard({ trades, academies, allUsers, onSelectStudent }: Props) {
  const stats = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.result === 'Win').length;
    const losses = trades.filter(t => t.result === 'Loss').length;
    const be = trades.filter(t => t.result === 'Break Even').length;
    const totalProfit = trades.reduce((s, t) => s + t.profit, 0);
    const totalPips = trades.reduce((s, t) => s + t.pips, 0);
    const winRate = totalTrades > 0 ? (wins / totalTrades * 100) : 0;
    const avgWin = wins > 0 ? trades.filter(t => t.result === 'Win').reduce((s, t) => s + t.profit, 0) / wins : 0;
    const avgLoss = losses > 0 ? trades.filter(t => t.result === 'Loss').reduce((s, t) => s + t.profit, 0) / losses : 0;
    const profitFactor = avgLoss !== 0 ? Math.abs(avgWin * wins / (avgLoss * losses)) : 0;
    const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.profit)) : 0;
    const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.profit)) : 0;

    // Streak
    let currentStreak = 0;
    let streakType: 'win' | 'loss' | null = null;
    const sorted = [...trades].sort((a, b) => b.date.localeCompare(a.date));
    for (const t of sorted) {
      if (t.result === 'Break Even') continue;
      const r = t.result === 'Win' ? 'win' : 'loss';
      if (!streakType) { streakType = r; currentStreak = 1; }
      else if (r === streakType) currentStreak++;
      else break;
    }

    // By session
    const sessions: Record<string, {count: number, profit: number}> = {};
    trades.forEach(t => {
      if (!sessions[t.session]) sessions[t.session] = {count: 0, profit: 0};
      sessions[t.session].count++;
      sessions[t.session].profit += t.profit;
    });

    // By pair
    const pairs: Record<string, {count: number, profit: number, wins: number}> = {};
    trades.forEach(t => {
      if (!pairs[t.pair]) pairs[t.pair] = {count: 0, profit: 0, wins: 0};
      pairs[t.pair].count++;
      pairs[t.pair].profit += t.profit;
      if (t.result === 'Win') pairs[t.pair].wins++;
    });

    // By strategy
    const strategies: Record<string, {count: number, profit: number, wins: number}> = {};
    trades.forEach(t => {
      if (!strategies[t.strategy]) strategies[t.strategy] = {count: 0, profit: 0, wins: 0};
      strategies[t.strategy].count++;
      strategies[t.strategy].profit += t.profit;
      if (t.result === 'Win') strategies[t.strategy].wins++;
    });

    // Last 7 days P&L
    const last7: {date: string, profit: number}[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayProfit = trades.filter(t => t.date === ds).reduce((s, t) => s + t.profit, 0);
      last7.push({ date: ds, profit: dayProfit });
    }

    // Account type distribution
    const fondeo = trades.filter(t => t.accountType === 'Fondeo').length;
    const propio = trades.filter(t => t.accountType === 'Capital Propio').length;

    return { totalTrades, wins, losses, be, totalProfit, totalPips, winRate, avgWin, avgLoss, profitFactor, bestTrade, worstTrade, currentStreak, streakType, sessions, pairs, strategies, last7, fondeo, propio };
  }, [trades]);

  const maxBarValue = Math.max(...stats.last7.map(d => Math.abs(d.profit)), 1);

  const academyMap = useMemo(() => {
    return (academies || []).reduce<Record<string, Academy>>((acc, academy) => {
      acc[academy.id] = academy;
      return acc;
    }, {});
  }, [academies]);

  const groupedStudents = useMemo(() => {
    if (!allUsers?.length) return {} as Record<string, User[]>;
    return allUsers.reduce<Record<string, User[]>>((acc, student) => {
      const key = student.academyId || 'none';
      if (!acc[key]) acc[key] = [];
      acc[key].push(student);
      return acc;
    }, {});
  }, [allUsers]);

  return (
    <div className="space-y-6">
      {/* Student Selector for Admin */}
      {allUsers && allUsers.length > 0 && onSelectStudent && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              Modo Mentor — Ver cuenta de alumno
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Selecciona un alumno para ver su dashboard, calendario, estadísticas y todos sus trades.
            </p>
          </div>
          <div className="space-y-4">
            {Object.entries(groupedStudents).map(([academyId, students]) => {
              const academy = academyId !== 'none' ? academyMap[academyId] : null;
              return (
                <div key={academyId} className="rounded-3xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ background: academy ? `${academy.color}15` : '#1f2937' }}>
                    <div>
                      <p className="text-sm font-semibold text-white">{academy ? academy.name : 'Sin academia asignada'}</p>
                      <p className="text-xs text-gray-400">{students.length} alumno{students.length === 1 ? '' : 's'}</p>
                    </div>
                    {academy && (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1" style={{ background: `${academy.color}20`, color: academy.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: academy.color }} />
                        {academy.name}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                    {students.map(student => (
                      <button
                        key={student.id}
                        onClick={() => onSelectStudent(student.id)}
                        className="p-3 bg-gray-800/70 hover:bg-amber-500/10 border border-gray-700/50 rounded-2xl transition-all text-left flex flex-col gap-3"
                        style={academy ? { borderColor: `${academy.color}30`, boxShadow: `0 0 0 1px ${academy.color}12` } : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white font-bold text-base">
                            {student.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-semibold truncate">{student.displayName}</p>
                            <p className="text-gray-400 text-xs truncate">@{student.username}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">Click para ver →</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Welcome */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-gray-800/10 border border-emerald-500/20 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white">Resumen de Trading</h2>
        <p className="text-gray-400 text-sm mt-1">Aquí tienes un resumen de tu rendimiento</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Trades" value={stats.totalTrades.toString()} icon="" />
        <StatCard label="P&L Total" value={`${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}$`} icon=""
          color={stats.totalProfit >= 0 ? 'emerald' : 'gray'} />
        <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon=""
          color={stats.winRate >= 50 ? 'emerald' : 'gray'} />
        <StatCard label="Profit Factor" value={stats.profitFactor.toFixed(2)} icon=""
          color={stats.profitFactor >= 1 ? 'emerald' : 'gray'} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Wins / Losses / BE" value={`${stats.wins} / ${stats.losses} / ${stats.be}`} icon="" />
        <StatCard label="Total Pips" value={stats.totalPips.toFixed(1)} icon=""
          color={stats.totalPips >= 0 ? 'emerald' : 'gray'} />
        <StatCard label="Mejor Trade" value={`+${stats.bestTrade.toFixed(2)}$`} icon="" color="emerald" />
        <StatCard label="Peor Trade" value={`${stats.worstTrade.toFixed(2)}$`} icon="" color="gray" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Avg Win" value={`+${stats.avgWin.toFixed(2)}$`} icon="" color="emerald" />
        <StatCard label="Avg Loss" value={`${stats.avgLoss.toFixed(2)}$`} icon="" color="gray" />
        <StatCard label="Racha Actual" value={`${stats.currentStreak} ${stats.streakType === 'win' ? 'W' : stats.streakType === 'loss' ? 'L' : '-'}`} icon="" />
        <StatCard label="Fondeo / Propio" value={`${stats.fondeo} / ${stats.propio}`} icon="" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last 7 days */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">P&L Últimos 7 Días</h3>
          <div className="flex items-end gap-2 h-40">
            {stats.last7.map((d, i) => {
              const height = Math.max(Math.abs(d.profit) / maxBarValue * 100, 4);
              const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'short' });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-medium ${d.profit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {d.profit !== 0 ? `${d.profit > 0 ? '+' : ''}${d.profit.toFixed(0)}` : ''}
                  </span>
                  <div className="w-full flex items-end justify-center" style={{height: '100px'}}>
                    <div
                      className={`w-full max-w-8 rounded-t-md transition-all ${d.profit >= 0 ? 'bg-emerald-500/60' : 'bg-gray-500/60'}`}
                      style={{height: `${height}%`}}
                    ></div>
                  </div>
                  <span className="text-[10px] text-gray-500 capitalize">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Win Rate Donut */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Distribución de Resultados</h3>
          <div className="flex items-center justify-center gap-8">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#374151" strokeWidth="3" />
                {stats.totalTrades > 0 && (
                  <>
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="3"
                      strokeDasharray={`${stats.winRate * 0.974} ${97.4 - stats.winRate * 0.974}`} strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6b7280" strokeWidth="3"
                      strokeDasharray={`${(stats.losses/stats.totalTrades*100) * 0.974} ${97.4 - (stats.losses/stats.totalTrades*100) * 0.974}`}
                      strokeDashoffset={`${-stats.winRate * 0.974}`} />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{stats.winRate.toFixed(0)}%</span>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-gray-300">Wins: {stats.wins}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-sm text-gray-300">Losses: {stats.losses}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                <span className="text-sm text-gray-300">BE: {stats.be}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Session */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Por Sesión</h3>
          <div className="space-y-2">
            {Object.entries(stats.sessions).sort((a, b) => b[1].profit - a[1].profit).map(([session, data]) => (
              <div key={session} className="flex items-center justify-between p-2.5 bg-gray-700/30 rounded-lg">
                <span className="text-sm text-gray-300">{session}</span>
                <div className="text-right">
                  <span className={`text-sm font-medium ${data.profit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {data.profit >= 0 ? '+' : ''}{data.profit.toFixed(2)}$
                  </span>
                  <span className="text-xs text-gray-500 ml-2">({data.count})</span>
                </div>
              </div>
            ))}
            {Object.keys(stats.sessions).length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin datos</p>}
          </div>
        </div>

        {/* By Pair */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Por Par</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(stats.pairs).sort((a, b) => b[1].profit - a[1].profit).map(([pair, data]) => (
              <div key={pair} className="flex items-center justify-between p-2.5 bg-gray-700/30 rounded-lg">
                <div>
                  <span className="text-sm text-gray-300">{pair}</span>
                  <span className="text-xs text-gray-500 ml-1">WR: {(data.wins/data.count*100).toFixed(0)}%</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${data.profit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {data.profit >= 0 ? '+' : ''}{data.profit.toFixed(2)}$
                  </span>
                </div>
              </div>
            ))}
            {Object.keys(stats.pairs).length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin datos</p>}
          </div>
        </div>

        {/* By Strategy */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Por Estrategia</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(stats.strategies).sort((a, b) => b[1].profit - a[1].profit).map(([strat, data]) => (
              <div key={strat} className="flex items-center justify-between p-2.5 bg-gray-700/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-300 truncate block">{strat}</span>
                  <span className="text-xs text-gray-500">WR: {(data.wins/data.count*100).toFixed(0)}% ({data.count})</span>
                </div>
                <span className={`text-sm font-medium ml-2 ${data.profit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {data.profit >= 0 ? '+' : ''}{data.profit.toFixed(0)}$
                </span>
              </div>
            ))}
            {Object.keys(stats.strategies).length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin datos</p>}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Últimos Trades</h3>
        {trades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium text-xs">Fecha</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium text-xs">Par</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium text-xs">Dir</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium text-xs">P&L</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium text-xs hidden sm:table-cell">Sesión</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium text-xs hidden sm:table-cell">Estrategia</th>
                </tr>
              </thead>
              <tbody>
                {[...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(t => (
                  <tr key={t.id} className="border-b border-gray-700/20 hover:bg-gray-700/20">
                    <td className="py-2.5 px-2 text-gray-300">{t.date}</td>
                    <td className="py-2.5 px-2 text-white font-medium">{t.pair}</td>
                    <td className="py-2.5 px-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.direction === 'Long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className={`py-2.5 px-2 font-medium ${t.profit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {t.profit >= 0 ? '+' : ''}{t.profit.toFixed(2)}$
                    </td>
                    <td className="py-2.5 px-2 text-gray-400 hidden sm:table-cell">{t.session}</td>
                    <td className="py-2.5 px-2 text-gray-400 hidden sm:table-cell text-xs">{t.strategy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No hay trades registrados aún. ¡Empieza a registrar!</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color?: string }) {
  const colorClass = color === 'emerald' ? 'text-emerald-400' : color === 'gray' ? 'text-gray-400' : 'text-white';
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <p className="text-gray-400 text-xs">{label}</p>
      </div>
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}
