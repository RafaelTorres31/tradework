import { useState, useMemo } from 'react';
import { FOREX_PAIRS } from '../types';

export default function Calculator() {
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [accountSize, setAccountSize] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('1');
  const [stopLossPips, setStopLossPips] = useState('20');
  const [pair, setPair] = useState('XAU/USD');
  const [price, setPrice] = useState('2650');

  const results = useMemo(() => {
    const account = parseFloat(accountSize) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const sl = parseFloat(stopLossPips) || 0;
    const p = parseFloat(price) || 1;

    const riskAmount = account * (risk / 100);

    const isJPY = pair.includes('JPY');
    const isXAU = pair.includes('XAU');
    const isXAG = pair.includes('XAG');
    const isIndex = ['US30', 'NAS100', 'SPX500'].includes(pair);

    let pipValuePerLot: number;

    if (isXAU) {
      pipValuePerLot = 1; // $1 per 0.1 movement per 0.01 lot => $10 per pip per lot (pip = 0.1 for XAU)
      // For XAU: 1 pip = $0.10, pip value per standard lot = $10
      pipValuePerLot = 10;
    } else if (isXAG) {
      pipValuePerLot = 50;
    } else if (isIndex) {
      pipValuePerLot = 1;
    } else if (isJPY) {
      pipValuePerLot = 1000 / p;
    } else {
      // Standard forex pair - pip value depends on pair
      const base = pair.split('/')[1];
      if (base === 'USD' || base === accountCurrency) {
        pipValuePerLot = 10;
      } else {
        pipValuePerLot = 10 / p;
      }
    }

    const positionSizeLots = sl > 0 && pipValuePerLot > 0 ? riskAmount / (sl * pipValuePerLot) : 0;
    const units = positionSizeLots * 100000;
    const standardLots = positionSizeLots;
    const miniLots = positionSizeLots * 10;
    const microLots = positionSizeLots * 100;
    const pipValue = positionSizeLots * pipValuePerLot;

    return {
      riskAmount,
      positionSizeLots: standardLots,
      units: Math.round(units),
      standardLots,
      miniLots,
      microLots,
      pipValue,
      pipValuePerLot
    };
  }, [accountCurrency, accountSize, riskPercent, stopLossPips, pair, price]);

  const inputClass = "w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-white">Calculadora de Tamaño de Posición</h2>
        <p className="text-gray-400 text-sm mt-1">Calcula el tamaño óptimo de tu posición</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parameters */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">Parámetros de la Operación</h3>

          <div>
            <label className={labelClass}>Moneda de la Cuenta</label>
            <select value={accountCurrency} onChange={e => setAccountCurrency(e.target.value)} className={inputClass}>
              <option value="USD">USD - Dólar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - Libra</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Tamaño de la Cuenta</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" value={accountSize} onChange={e => setAccountSize(e.target.value)}
                className={`${inputClass} pl-8`} placeholder="10000" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Riesgo</label>
            <div className="flex gap-2 items-center">
              <input type="number" step="0.1" value={riskPercent} onChange={e => setRiskPercent(e.target.value)}
                className={`${inputClass} flex-1`} placeholder="1" />
              <span className="text-gray-400 text-sm">=</span>
              <span className="text-emerald-400 font-medium text-sm min-w-[80px] text-right">
                {results.riskAmount.toFixed(2)} {accountCurrency}
              </span>
            </div>
            {/* Quick risk buttons */}
            <div className="flex gap-2 mt-2">
              {['0.5', '1', '1.5', '2', '3'].map(r => (
                <button key={r} onClick={() => setRiskPercent(r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${riskPercent === r
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/30 hover:bg-gray-700'}`}>
                  {r}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Stop-Loss (Pips)</label>
            <input type="number" value={stopLossPips} onChange={e => setStopLossPips(e.target.value)}
              className={inputClass} placeholder="20" />
          </div>

          <div>
            <label className={labelClass}>Par de Divisas</label>
            <select value={pair} onChange={e => setPair(e.target.value)} className={inputClass}>
              {FOREX_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Precio {pair}</label>
            <input type="number" step="any" value={price} onChange={e => setPrice(e.target.value)}
              className={inputClass} placeholder="1.0000" />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4">Resultados</h3>

            {/* Main result */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-gray-800/10 border border-emerald-500/20 rounded-xl p-4 mb-4 text-center">
              <p className="text-gray-400 text-xs">Tamaño de Posición Recomendado</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{results.positionSizeLots.toFixed(2)} lotes</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ResultItem label="Unidades" value={results.units.toLocaleString()} />
              <ResultItem label="Lotes Estándar" value={results.standardLots.toFixed(2)} />
              <ResultItem label="Mini Lotes" value={results.miniLots.toFixed(2)} />
              <ResultItem label="Micro Lotes" value={results.microLots.toFixed(2)} />
            </div>

            <div className="border-t border-gray-700/50 mt-4 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Monto en Riesgo</span>
                <span className="text-sm text-red-400 font-medium">{results.riskAmount.toFixed(2)} {accountCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Valor por Pip</span>
                <span className="text-sm text-emerald-400 font-medium">{results.pipValue.toFixed(2)} {accountCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Valor del Pip (1 Lote)</span>
                <span className="text-sm text-white font-medium">{results.pipValuePerLot.toFixed(2)} {accountCurrency}</span>
              </div>
            </div>
          </div>

          {/* Formula */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-emerald-400 text-xs font-medium mb-1">Fórmula Utilizada</p>
            <p className="text-gray-300 text-sm font-mono">
              Tamaño = Riesgo ÷ (Stop Loss × Valor del Pip)
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-amber-400 text-xs font-medium mb-1">Nota</p>
            <p className="text-gray-400 text-xs">
              Los cálculos son aproximados y pueden variar según tu broker. Para pares con JPY, 1 pip = 0.01. Para otros pares, 1 pip = 0.0001. Para XAU/USD, 1 pip = 0.1.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-700/30 rounded-lg p-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white font-semibold mt-0.5">{value}</p>
    </div>
  );
}
