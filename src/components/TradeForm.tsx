import { useState, useEffect, useRef, useCallback } from 'react';
import { Trade, FOREX_PAIRS, STRATEGIES, EMOTIONAL_STATES, TradingSession, AccountType, TradeDirection, TradeResult } from '../types';

interface Props {
  trade?: Trade | null;
  userId: string;
  initialDate?: string;
  onSave: (trade: Omit<Trade, 'id' | 'createdAt'>) => void | Promise<void>;
  onCancel: () => void;
}

export default function TradeForm({ trade, userId, initialDate, onSave, onCancel }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: trade?.date || initialDate || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })(),
    pair: trade?.pair || 'XAU/USD',
    direction: (trade?.direction || 'Long') as TradeDirection,
    session: (trade?.session || 'New York') as TradingSession,
    accountType: (trade?.accountType || 'Capital Propio') as AccountType,
    strategy: trade?.strategy || 'Order Block',
    lotSize: trade?.lotSize?.toString() || '0.01',
    profit: trade?.profit ? Math.abs(trade.profit).toString() : '',
    result: (trade?.result || 'Win') as TradeResult,
    riskRewardRatio: trade?.riskRewardRatio || '',
    notes: trade?.notes || '',
    emotionalState: trade?.emotionalState || 'Calmado',
  });

  const [images, setImages] = useState<string[]>(trade?.images || []);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Auto-set result based on profit when typing
  useEffect(() => {
    const profitValue = parseFloat(form.profit);
    if (!isNaN(profitValue) && profitValue > 0) {
      // If user typed a positive value and result is Loss, keep Loss (they want loss)
      // Otherwise auto-detect
    }
  }, [form.profit]);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error('Imagen demasiado grande (máx 2MB)'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Compress image if needed
  const compressImage = (base64: string, maxWidth = 1200): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxWidth) {
          resolve(base64);
          return;
        }
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = base64;
    });
  };

  // Process files
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    for (const file of fileArray) {
      try {
        const base64 = await fileToBase64(file);
        const compressed = await compressImage(base64);
        setImages(prev => [...prev, compressed]);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al procesar imagen');
      }
    }
  }, []);

  // Handle paste event (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        processFiles(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processFiles]);

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Calculate final profit based on result
      let finalProfit = parseFloat(form.profit) || 0;
      
      // If result is Loss, make profit negative automatically
      if (form.result === 'Loss') {
        finalProfit = -Math.abs(finalProfit);
      } else if (form.result === 'Win') {
        finalProfit = Math.abs(finalProfit);
      } else {
        // Break Even
        finalProfit = 0;
      }

      await onSave({
        userId,
        date: form.date,
        pair: form.pair,
        direction: form.direction,
        session: form.session,
        accountType: form.accountType,
        strategy: form.strategy,
        entryPrice: 0, // Simplified - not used
        exitPrice: 0,  // Simplified - not used
        stopLoss: 0,   // Simplified - not used
        takeProfit: 0, // Simplified - not used
        lotSize: parseFloat(form.lotSize) || 0.01,
        pips: 0, // Simplified - not calculated
        profit: finalProfit,
        result: form.result,
        riskRewardRatio: form.riskRewardRatio,
        notes: form.notes,
        emotionalState: form.emotionalState,
        images,
      });
    } catch (err) {
      console.error('Error saving trade:', err);
      alert('Error al guardar el trade');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";
  const selectClass = "w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700/50 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {trade ? 'Editar Trade' : 'Nuevo Trade'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Row 1: Date, Pair, Direction */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Fecha</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Par</label>
              <select value={form.pair} onChange={e => setForm({...form, pair: e.target.value})} className={selectClass}>
                {FOREX_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Dirección</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({...form, direction: 'Long'})}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${form.direction === 'Long' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'}`}>
                  Long
                </button>
                <button type="button" onClick={() => setForm({...form, direction: 'Short'})}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${form.direction === 'Short' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'}`}>
                  Short
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Session, Account Type, Strategy */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Sesión</label>
              <select value={form.session} onChange={e => setForm({...form, session: e.target.value as TradingSession})} className={selectClass}>
                <option value="Asian">Asian</option>
                <option value="London">London</option>
                <option value="New York">New York</option>
                <option value="London/NY Overlap">London/NY Overlap</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tipo de Cuenta</label>
              <select value={form.accountType} onChange={e => setForm({...form, accountType: e.target.value as AccountType})} className={selectClass}>
                <option value="Capital Propio">Capital Propio</option>
                <option value="Fondeo">Fondeo</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Estrategia</label>
              <select value={form.strategy} onChange={e => setForm({...form, strategy: e.target.value})} className={selectClass}>
                {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: SIMPLIFIED - Result, Profit Amount, Lot Size */}
          <div className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-4">
            <label className="block text-sm font-semibold text-white mb-4">Resultado del Trade</label>
            
            {/* Result Buttons - BIG and prominent */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setForm({...form, result: 'Win'})}
                className={`py-4 rounded-xl text-lg font-bold transition-all ${
                  form.result === 'Win' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105' 
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/50 hover:border-emerald-500/50'
                }`}
              >
                WIN
              </button>
              <button
                type="button"
                onClick={() => setForm({...form, result: 'Loss'})}
                className={`py-4 rounded-xl text-lg font-bold transition-all ${
                  form.result === 'Loss' 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105' 
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/50 hover:border-red-500/50'
                }`}
              >
                LOSS
              </button>
              <button
                type="button"
                onClick={() => setForm({...form, result: 'Break Even'})}
                className={`py-4 rounded-xl text-lg font-bold transition-all ${
                  form.result === 'Break Even' 
                    ? 'bg-gray-500 text-white shadow-lg shadow-gray-500/30 scale-105' 
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/50 hover:border-gray-400/50'
                }`}
              >
                BE
              </button>
            </div>

            {/* Profit input - only show for Win/Loss */}
            {form.result !== 'Break Even' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {form.result === 'Win' ? 'Ganancia ($)' : 'Pérdida ($)'}
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${
                      form.result === 'Win' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {form.result === 'Win' ? '+' : '-'}
                    </span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={form.profit} 
                      onChange={e => setForm({...form, profit: e.target.value})} 
                      className={`${inputClass} pl-8 text-lg font-semibold ${
                        form.result === 'Win' ? 'text-emerald-400' : 'text-red-400'
                      }`} 
                      placeholder="0.00" 
                      required 
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Solo escribe el monto (sin signo negativo)
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Tamaño Lote</label>
                  <input type="number" step="0.01" value={form.lotSize} onChange={e => setForm({...form, lotSize: e.target.value})} className={inputClass} placeholder="0.01" />
                </div>
              </div>
            )}

            {form.result === 'Break Even' && (
              <p className="text-center text-gray-400 text-sm py-2">
                Break Even = Sin ganancia ni pérdida (0$)
              </p>
            )}
          </div>

          {/* Row 4: R:R, Emotional State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Risk:Reward</label>
              <input type="text" value={form.riskRewardRatio} onChange={e => setForm({...form, riskRewardRatio: e.target.value})} className={inputClass} placeholder="1:2" />
            </div>
            <div>
              <label className={labelClass}>Estado Emocional</label>
              <select value={form.emotionalState} onChange={e => setForm({...form, emotionalState: e.target.value})} className={selectClass}>
                {EMOTIONAL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notas / Análisis</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3}
              className={`${inputClass} resize-none`} placeholder="Describe tu análisis, razones de entrada, lecciones aprendidas..." />
          </div>

          {/* ========== IMAGE UPLOAD SECTION ========== */}
          <div>
            <label className={labelClass}>Screenshots / Imágenes del Trade</label>

            {/* Drop Zone */}
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]'
                  : 'border-gray-600/50 bg-gray-700/20 hover:border-emerald-500/50 hover:bg-gray-700/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isDragging ? 'bg-emerald-500/20' : 'bg-gray-700/50'
                }`}>
                  <svg className={`w-6 h-6 transition-colors ${isDragging ? 'text-emerald-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>

                {isDragging ? (
                  <div>
                    <p className="text-emerald-400 font-medium text-sm">¡Suelta las imágenes aquí!</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-300 text-sm font-medium">
                      Arrastra imágenes aquí, haz click para subir
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      o pega con <kbd className="px-1.5 py-0.5 bg-gray-600 rounded text-gray-300 text-[10px] font-mono">Ctrl+V</kbd> — PNG, JPG hasta 2MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-600/30 bg-gray-700/30 aspect-video">
                    <img
                      src={img}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                      onClick={(e) => { e.stopPropagation(); setLightboxImage(img); }}
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLightboxImage(img); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white mr-1"
                        title="Ver imagen"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </button>
                    </div>
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-gray-500/80 hover:bg-gray-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs shadow-lg"
                      title="Eliminar imagen"
                    >
                      ✕
                    </button>
                    {/* Image number badge */}
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-gray-300 font-medium">
                      {index + 1}/{images.length}
                    </div>
                  </div>
                ))}

                {/* Add more button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video border-2 border-dashed border-gray-600/50 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-[10px] font-medium">Agregar más</span>
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                trade ? 'Actualizar Trade' : 'Guardar Trade'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ========== LIGHTBOX MODAL ========== */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt="Trade screenshot ampliado"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
