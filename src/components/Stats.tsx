import { useMemo, useState } from 'react';
import { Trade } from '../types';

interface Props {
  trades: Trade[];
}

export default function Stats({ trades }: Props) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const analysis = useMemo(() => {
    if (trades.length === 0) return null;

    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));

    // Equity curve data
    let equity = 0;
    const equityCurve = sorted.map(t => {
      equity += t.profit;
      return { date: t.date, equity, profit: t.profit };
    });

    // Group by date for daily P&L
    const dailyPnL: Record<string, number> = {};
    sorted.forEach(t => {
      dailyPnL[t.date] = (dailyPnL[t.date] || 0) + t.profit;
    });

    // Cumulative equity by day
    let cumulative = 0;
    const dailyEquity = Object.entries(dailyPnL).map(([date, pnl]) => {
      cumulative += pnl;
      return { date, pnl, cumulative };
    });

    // Max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    equityCurve.forEach(p => {
      if (p.equity > peak) peak = p.equity;
      const dd = peak - p.equity;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });

    // Best/Worst day
    const byDay: Record<string, number> = {};
    trades.forEach(t => {
      byDay[t.date] = (byDay[t.date] || 0) + t.profit;
    });
    const dayEntries = Object.entries(byDay).sort((a, b) => b[1] - a[1]);
    const bestDay = dayEntries[0] || ['', 0];
    const worstDay = dayEntries[dayEntries.length - 1] || ['', 0];

    // Consecutive wins/losses
    let maxConsWins = 0, maxConsLosses = 0;
    let cw = 0, cl = 0;
    sorted.forEach(t => {
      if (t.result === 'Win') { cw++; cl = 0; maxConsWins = Math.max(maxConsWins, cw); }
      else if (t.result === 'Loss') { cl++; cw = 0; maxConsLosses = Math.max(maxConsLosses, cl); }
      else { cw = 0; cl = 0; }
    });

    // By day of week
    const byDOW: Record<string, { count: number; profit: number; wins: number }> = {};
    const dowNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    trades.forEach(t => {
      const dow = dowNames[new Date(t.date + 'T12:00:00').getDay()];
      if (!byDOW[dow]) byDOW[dow] = { count: 0, profit: 0, wins: 0 };
      byDOW[dow].count++;
      byDOW[dow].profit += t.profit;
      if (t.result === 'Win') byDOW[dow].wins++;
    });

    // By session performance
    const bySess: Record<string, { count: number; profit: number; wins: number }> = {};
    trades.forEach(t => {
      if (!bySess[t.session]) bySess[t.session] = { count: 0, profit: 0, wins: 0 };
      bySess[t.session].count++;
      bySess[t.session].profit += t.profit;
      if (t.result === 'Win') bySess[t.session].wins++;
    });

    // Monthly breakdown
    const byMonth: Record<string, { count: number; profit: number; wins: number; losses: number }> = {};
    trades.forEach(t => {
      const m = t.date.substring(0, 7);
      if (!byMonth[m]) byMonth[m] = { count: 0, profit: 0, wins: 0, losses: 0 };
      byMonth[m].count++;
      byMonth[m].profit += t.profit;
      if (t.result === 'Win') byMonth[m].wins++;
      if (t.result === 'Loss') byMonth[m].losses++;
    });

    // Average RR
    const rrValues = trades.map(t => {
      const match = t.riskRewardRatio.match(/1:([\d.]+)/);
      return match ? parseFloat(match[1]) : 0;
    }).filter(v => v > 0);
    const avgRR = rrValues.length > 0 ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length : 0;

    // Fondeo vs Propio
    const fondeoTrades = trades.filter(t => t.accountType === 'Fondeo');
    const propioTrades = trades.filter(t => t.accountType === 'Capital Propio');

    const fondeoProfit = fondeoTrades.reduce((s, t) => s + t.profit, 0);
    const propioProfit = propioTrades.reduce((s, t) => s + t.profit, 0);

    const totalProfit = trades.reduce((s, t) => s + t.profit, 0);
    const totalWins = trades.filter(t => t.result === 'Win').length;
    const avgTradesPerDay = trades.length / (new Set(trades.map(t => t.date)).size || 1);

    return {
      equityCurve,
      dailyEquity,
      maxDrawdown,
      bestDay,
      worstDay,
      maxConsWins,
      maxConsLosses,
      byDOW,
      bySess,
      byMonth,
      avgRR,
      fondeoProfit,
      propioProfit,
      fondeoCount: fondeoTrades.length,
      propioCount: propioTrades.length,
      totalProfit,
      winRate: (totalWins / trades.length * 100),
      avgTradesPerDay,
    };
  }, [trades]);

  if (!analysis || trades.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <div className="flex justify-center mb-4 text-gray-600">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 015.82 5.521l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941M3 20.25h18" />
          </svg>
        </div>
        <p className="text-xl font-semibold">Sin datos suficientes</p>
        <p className="text-sm mt-2">Registra trades para ver tus estadísticas detalladas</p>
      </div>
    );
  }

  // Line chart calculations (last 30 days)
  const chartData = analysis.dailyEquity.slice(-30);
  const maxEquity = Math.max(...chartData.map(d => d.cumulative), 0);
  const minEquity = Math.min(...chartData.map(d => d.cumulative), 0);
  const equityRange = (maxEquity - minEquity) || 1;
  
  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Calculate points
  const points = chartData.map((d, i) => {
    const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth;
    const y = padding.top + (1 - (d.cumulative - minEquity) / equityRange) * chartHeight;
    return { x, y, ...d };
  });

  // Create line path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  // Create gradient area path
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
    : '';

  // Zero line Y position
  const zeroY = padding.top + (1 - (0 - minEquity) / equityRange) * chartHeight;

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-white">Estadísticas Avanzadas</h2>
        <p className="text-gray-400 text-sm mt-1">Análisis detallado de tu rendimiento</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Max Drawdown" value={`-${analysis.maxDrawdown.toFixed(2)}$`} color="gray" />
        <MetricCard label="Avg R:R" value={`1:${analysis.avgRR.toFixed(1)}`} color={analysis.avgRR >= 1.5 ? 'emerald' : 'yellow'} />
        <MetricCard label="Max Wins Seguidos" value={analysis.maxConsWins.toString()} color="emerald" />
        <MetricCard label="Max Losses Seguidos" value={analysis.maxConsLosses.toString()} color="gray" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Mejor Día" value={`+${(analysis.bestDay[1] as number).toFixed(0)}$`} subtext={analysis.bestDay[0] as string} color="emerald" />
        <MetricCard label="Peor Día" value={`${(analysis.worstDay[1] as number).toFixed(0)}$`} subtext={analysis.worstDay[0] as string} color="gray" />
        <MetricCard label="Trades/Día Avg" value={analysis.avgTradesPerDay.toFixed(1)} color="gray" />
        <MetricCard label="Días Operados" value={new Set(trades.map(t => t.date)).size.toString()} color="purple" />
      </div>

      {/* Line Chart - Trading Style Equity Curve */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">Curva de Crecimiento</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 rounded"></span>
              Balance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Punto de trade
            </span>
          </div>
        </div>
        
        {/* Summary stats above chart */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${analysis.totalProfit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
              {analysis.totalProfit >= 0 ? '+' : ''}{analysis.totalProfit.toFixed(2)}$
            </div>
            <div className="text-xs text-gray-500">P&L Total</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-emerald-400">
              {chartData.filter(d => d.pnl > 0).length}
            </div>
            <div className="text-xs text-gray-500">Días en verde</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-400">
              {chartData.filter(d => d.pnl < 0).length}
            </div>
            <div className="text-xs text-gray-500">Días en rojo</div>
          </div>
        </div>

        {/* SVG Line Chart */}
        <div className="relative overflow-x-auto">
          <svg 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
            className="w-full h-64 md:h-80"
            style={{ minWidth: '500px' }}
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={analysis.totalProfit >= 0 ? '#10b981' : '#6b7280'} stopOpacity="0.3" />
                <stop offset="100%" stopColor={analysis.totalProfit >= 0 ? '#10b981' : '#6b7280'} stopOpacity="0.05" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
              <line
                key={i}
                x1={padding.left}
                y1={padding.top + p * chartHeight}
                x2={svgWidth - padding.right}
                y2={padding.top + p * chartHeight}
                stroke="#374151"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            ))}

            {/* Y-axis labels */}
            {[0, 0.5, 1].map((p, i) => {
              const value = maxEquity - p * equityRange;
              return (
                <text
                  key={i}
                  x={padding.left - 10}
                  y={padding.top + p * chartHeight + 4}
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize="11"
                >
                  {value.toFixed(0)}$
                </text>
              );
            })}

            {/* Zero line if visible */}
            {minEquity < 0 && maxEquity > 0 && (
              <line
                x1={padding.left}
                y1={zeroY}
                x2={svgWidth - padding.right}
                y2={zeroY}
                stroke="#6b7280"
                strokeWidth="2"
                strokeDasharray="8,4"
              />
            )}

            {/* Area under curve */}
            {points.length > 1 && (
              <path
                d={areaPath}
                fill="url(#areaGradient)"
              />
            )}

            {/* Main line */}
            {points.length > 1 && (
              <path
                d={linePath}
                fill="none"
                stroke={analysis.totalProfit >= 0 ? '#10b981' : '#6b7280'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
            )}

            {/* Data points */}
            {points.map((p, i) => (
              <g key={i}>
                {/* Outer ring on hover */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint === i ? 12 : 6}
                  fill={hoveredPoint === i ? (p.pnl >= 0 ? '#10b98133' : '#6b728033') : 'transparent'}
                  className="transition-all duration-200"
                />
                {/* Main point */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint === i ? 6 : 4}
                  fill={p.pnl >= 0 ? '#10b981' : '#6b7280'}
                  stroke="#1f2937"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            ))}

            {/* X-axis labels (show some dates) */}
            {points.filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1).map((p, i) => (
              <text
                key={i}
                x={p.x}
                y={svgHeight - 10}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="10"
              >
                {p.date.slice(5)}
              </text>
            ))}
          </svg>

          {/* Tooltip */}
          {hoveredPoint !== null && points[hoveredPoint] && (
            <div 
              className="absolute bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl pointer-events-none z-10"
              style={{
                left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
                top: '20px',
                transform: 'translateX(-50%)'
              }}
            >
              <div className="text-gray-400 text-xs font-medium mb-1">
                {points[hoveredPoint].date}
              </div>
              <div className={`text-sm font-bold ${points[hoveredPoint].pnl >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                Día: {points[hoveredPoint].pnl >= 0 ? '+' : ''}{points[hoveredPoint].pnl.toFixed(2)}$
              </div>
              <div className={`text-sm font-bold ${points[hoveredPoint].cumulative >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                Total: {points[hoveredPoint].cumulative >= 0 ? '+' : ''}{points[hoveredPoint].cumulative.toFixed(2)}$
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Day of Week Performance */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Rendimiento por Día de la Semana</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => {
            const data = analysis.byDOW[day] || { count: 0, profit: 0, wins: 0 };
            const wr = data.count > 0 ? (data.wins / data.count * 100) : 0;
            return (
              <div key={day} className="bg-gray-700/30 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">{day}</div>
                <div className={`text-lg font-bold ${data.profit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {data.profit >= 0 ? '+' : ''}{data.profit.toFixed(0)}$
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.count} trades • {wr.toFixed(0)}% WR
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fondeo vs Capital Propio */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Fondeo vs Capital Propio</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2 text-gray-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.68 0-5.302.217-7.875.633V21m16.5 0h-18" />
              </svg>
            </div>
            <div className="text-sm text-gray-400 mb-2">Fondeo</div>
            <div className={`text-xl font-bold ${analysis.fondeoProfit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
              {analysis.fondeoProfit >= 0 ? '+' : ''}{analysis.fondeoProfit.toFixed(2)}$
            </div>
            <div className="text-xs text-gray-500 mt-1">{analysis.fondeoCount} trades</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2 text-emerald-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H3.75a1.125 1.125 0 01-1.125-1.125V5.625C2.625 5.004 3.129 4.5 3.75 4.5zM18 10a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-sm text-gray-400 mb-2">Capital Propio</div>
            <div className={`text-xl font-bold ${analysis.propioProfit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
              {analysis.propioProfit >= 0 ? '+' : ''}{analysis.propioProfit.toFixed(2)}$
            </div>
            <div className="text-xs text-gray-500 mt-1">{analysis.propioCount} trades</div>
          </div>
        </div>
      </div>

      {/* Session Performance */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Rendimiento por Sesión</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(analysis.bySess).map(([session, data]) => {
            const wr = data.count > 0 ? (data.wins / data.count * 100) : 0;
            return (
              <div key={session} className="bg-gray-700/30 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">{session}</div>
                <div className={`text-lg font-bold ${data.profit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {data.profit >= 0 ? '+' : ''}{data.profit.toFixed(0)}$
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.count} trades • {wr.toFixed(0)}% WR
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Performance Table */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">📊 Rendimiento Mensual</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-gray-700">
              <th className="text-left py-2 px-2">Mes</th>
              <th className="text-right py-2 px-2">Trades</th>
              <th className="text-right py-2 px-2">Wins</th>
              <th className="text-right py-2 px-2">Losses</th>
              <th className="text-right py-2 px-2">Win Rate</th>
              <th className="text-right py-2 px-2">P&L</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(analysis.byMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([month, data]) => {
              const wr = data.count > 0 ? (data.wins / data.count * 100) : 0;
              return (
                <tr key={month} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                  <td className="py-2 px-2 text-white font-medium">{month}</td>
                  <td className="py-2 px-2 text-right text-gray-400">{data.count}</td>
                  <td className="py-2 px-2 text-right text-emerald-400">{data.wins}</td>
                  <td className="py-2 px-2 text-right text-gray-400">{data.losses}</td>
                  <td className="py-2 px-2 text-right">
                    <span className={`px-2 py-0.5 rounded text-xs ${wr >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {wr.toFixed(0)}%
                    </span>
                  </td>
                  <td className={`py-2 px-2 text-right font-bold ${data.profit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {data.profit >= 0 ? '+' : ''}{data.profit.toFixed(2)}$
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtext, color }: { label: string; value: string; subtext?: string; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-400',
    gray: 'text-gray-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  };
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
      <div className={`text-lg font-bold ${colorClasses[color] || 'text-white'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {subtext && <div className="text-[10px] text-gray-600 mt-0.5">{subtext}</div>}
    </div>
  );
}
