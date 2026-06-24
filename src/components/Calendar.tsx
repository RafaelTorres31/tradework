import { useState, useMemo } from 'react';
import { Trade } from '../types';

interface Props {
  trades: Trade[];
  onDayClick: (date: string, dayTrades: Trade[]) => void;
  onAddTrade?: (date: string) => void;
  readOnly?: boolean;
}

export default function Calendar({ trades, onDayClick, onAddTrade, readOnly }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { day: number; date: string; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({ day: d, date: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({ day: d, date: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const tradesByDate = useMemo(() => {
    const map: Record<string, { trades: Trade[]; wins: number; losses: number; be: number; totalProfit: number; hasImages: boolean }> = {};
    trades.forEach(t => {
      if (!map[t.date]) map[t.date] = { trades: [], wins: 0, losses: 0, be: 0, totalProfit: 0, hasImages: false };
      map[t.date].trades.push(t);
      if (t.result === 'Win') map[t.date].wins++;
      else if (t.result === 'Loss') map[t.date].losses++;
      else map[t.date].be++;
      map[t.date].totalProfit += t.profit;
      if (t.images && t.images.length > 0) map[t.date].hasImages = true;
    });
    return map;
  }, [trades]);

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Monthly stats
  const monthTrades = trades.filter(t => {
    const parts = t.date.split('-');
    if (parts.length !== 3) return false;
    const tYear = parseInt(parts[0], 10);
    const tMonth = parseInt(parts[1], 10) - 1;
    return tYear === year && tMonth === month;
  });
  const monthProfit = monthTrades.reduce((s, t) => s + t.profit, 0);
  const monthWins = monthTrades.filter(t => t.result === 'Win').length;
  const monthLosses = monthTrades.filter(t => t.result === 'Loss').length;

  const handleDayClick = (date: string) => {
    const data = tradesByDate[date];
    if (data && data.trades.length > 0) {
      onDayClick(date, data.trades);
    } else if (!readOnly && onAddTrade) {
      onAddTrade(date);
    }
  };

  return (
    <div className="space-y-6">
      {/* Month stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-xs">Trades del Mes</p>
          <p className="text-xl font-bold text-white mt-1">{monthTrades.length}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-xs">P&L del Mes</p>
          <p className={`text-xl font-bold mt-1 ${monthProfit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
            {monthProfit >= 0 ? '+' : ''}{monthProfit.toFixed(2)}$
          </p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-xs">Wins</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{monthWins}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-xs">Losses</p>
          <p className="text-xl font-bold text-gray-400 mt-1">{monthLosses}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-bold text-white">{monthNames[month]} {year}</h3>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-gray-700/50">
          {dayNames.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const data = tradesByDate[day.date];
            const isToday = day.date === today;
            const hasTrades = data && data.trades.length > 0;
            return (
              <div
                key={i}
                onClick={() => day.isCurrentMonth && handleDayClick(day.date)}
                className={`relative min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-700/30 p-1.5 transition-colors cursor-pointer
                  ${day.isCurrentMonth ? 'hover:bg-gray-700/30' : 'opacity-30'}
                  ${isToday ? 'bg-emerald-500/5' : ''}`}
              >
                <span className={`text-xs font-medium ${isToday ? 'bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : day.isCurrentMonth ? 'text-gray-300' : 'text-gray-600'}`}>
                  {day.day}
                </span>
                {data && day.isCurrentMonth && (
                  <div className="mt-1 space-y-0.5">
                    {data.totalProfit !== 0 && (
                      <div className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded ${data.totalProfit > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {data.totalProfit > 0 ? '+' : ''}{data.totalProfit.toFixed(0)}$
                      </div>
                    )}
                    <div className="flex gap-1.5 items-center flex-wrap">
                      {data.wins > 0 && <span className="text-[9px] text-emerald-400 font-medium">W:{data.wins}</span>}
                      {data.losses > 0 && <span className="text-[9px] text-gray-400 font-medium">L:{data.losses}</span>}
                      {data.be > 0 && <span className="text-[9px] text-gray-500 font-medium">BE:{data.be}</span>}
                      {data.hasImages && <span className="text-[9px] text-blue-400 font-medium">Img</span>}
                    </div>
                  </div>
                )}
                {!hasTrades && day.isCurrentMonth && !readOnly && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-emerald-400 text-lg">+</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
