import { Trade } from '../types';
import ImageGallery from './ImageGallery';

interface Props {
  date: string;
  trades: Trade[];
  onClose: () => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (tradeId: string) => void;
  onAddTrade?: (date: string) => void;
  readOnly?: boolean;
}

export default function DayDetail({ date, trades, onClose, onEdit, onDelete, onAddTrade, readOnly }: Props) {
  const totalProfit = trades.reduce((s, t) => s + t.profit, 0);
  const wins = trades.filter(t => t.result === 'Win').length;
  const losses = trades.filter(t => t.result === 'Loss').length;

  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('es', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-white capitalize">{dateFormatted}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{trades.length} trade{trades.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Day Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-700/30 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-500">P&L</p>
              <p className={`text-sm font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}$
              </p>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-500">Wins</p>
              <p className="text-sm font-bold text-emerald-400">{wins}</p>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-500">Losses</p>
              <p className="text-sm font-bold text-gray-400">{losses}</p>
            </div>
          </div>

          {/* Trades */}
          {trades.map(trade => (
            <div key={trade.id} className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold">{trade.pair}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${trade.direction === 'Long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {trade.direction}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-300">{trade.session}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">{trade.accountType}</span>
                </div>
                <span className={`font-bold ${trade.profit >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}$
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 flex-wrap">
                <span>Estrategia: {trade.strategy}</span>
                <span>Lotes: {trade.lotSize}</span>
                {trade.riskRewardRatio && <span>R:R: {trade.riskRewardRatio}</span>}
                <span>Estado: {trade.emotionalState}</span>
              </div>

              {trade.notes && (
                <p className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-2 mb-3">{trade.notes}</p>
              )}

              {/* Trade Images Gallery */}
              {trade.images && trade.images.length > 0 && (
                <ImageGallery images={trade.images} columns={3} />
              )}

              {!readOnly && (onEdit || onDelete) && (
                <div className="flex gap-2 justify-end mt-3">
                  {onEdit && (
                    <button onClick={() => onEdit(trade)}
                      className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => { if(confirm('¿Eliminar este trade?')) onDelete(trade.id); }}
                      className="px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium hover:bg-gray-500/30 transition-colors">
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add trade button */}
          {!readOnly && onAddTrade && (
            <button onClick={() => onAddTrade(date)}
              className="w-full py-3 border-2 border-dashed border-gray-600 hover:border-emerald-500/50 text-gray-400 hover:text-emerald-400 rounded-xl transition-colors flex items-center justify-center gap-2">
              Agregar Trade para este día
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
