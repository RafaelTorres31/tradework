import { useEffect, useState } from 'react';

type NewsItem = {
  id: string;
  time: string;
  currency: string;
  impact: 'Low' | 'Medium' | 'High';
  event: string;
  actual?: string;
  forecast?: string;
  previous?: string;
};

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: '1',
    time: '09:30',
    currency: 'USD',
    impact: 'High',
    event: 'NFP Estados Unidos',
    actual: '210K',
    forecast: '185K',
    previous: '200K',
  },
  {
    id: '2',
    time: '11:00',
    currency: 'EUR',
    impact: 'Medium',
    event: 'Índice de Confianza del Consumidor',
    actual: '95.2',
    forecast: '94.5',
    previous: '94.3',
  },
  {
    id: '3',
    time: '13:00',
    currency: 'GBP',
    impact: 'High',
    event: 'Decisión de tipos del BoE',
    actual: '5.25%',
    forecast: '5.25%',
    previous: '5.00%',
  },
  {
    id: '4',
    time: '16:30',
    currency: 'USD',
    impact: 'Low',
    event: 'Inventarios de Petróleo Crudo',
    actual: '-2.1M',
    forecast: '-1.8M',
    previous: '-2.0M',
  },
  {
    id: '5',
    time: '18:00',
    currency: 'AUD',
    impact: 'Medium',
    event: 'Ventas Minoristas',
    actual: '0.3%',
    forecast: '0.2%',
    previous: '0.1%',
  },
];

const impactStyles: Record<NewsItem['impact'], string> = {
  High: 'bg-red-500/15 text-red-300 border-red-500/30',
  Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

export default function EconomicNews() {
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
        if (!response.ok) throw new Error('No se pudo cargar');
        const payload = await response.json();
        const items: any[] = Array.isArray(payload) ? payload : payload.events || [];
        const mapped = items
          .map((item, index) => ({
            id: String(item.id ?? index),
            time: item.time || item.date || '—',
            currency: item.currency || item.country || 'FX',
            impact: (item.impact && String(item.impact).toLowerCase().includes('high') ? 'High'
              : item.impact && String(item.impact).toLowerCase().includes('medium') ? 'Medium'
              : 'Low') as 'Low' | 'Medium' | 'High',
            event: item.event || item.title || item.description || 'Evento económico',
            actual: item.actual ? String(item.actual) : undefined,
            forecast: item.forecast ? String(item.forecast) : undefined,
            previous: item.previous ? String(item.previous) : undefined,
          }))
          .slice(0, 6);

        if (mapped.length > 0) {
          setNews(mapped);
        }
      } catch {
        // Mantener fallback si falla la carga externa.
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-400 font-semibold">Forex Factory</p>
          <h3 className="text-lg font-semibold text-white">Noticias Económicas</h3>
          <p className="text-gray-400 text-sm mt-1">Calendario económico y eventos clave actualizados para forex.</p>
        </div>
        <a href="https://www.forexfactory.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-gray-700/60 px-4 py-2 text-xs text-gray-300 hover:bg-gray-700/70 transition-all">
          Ver en Forex Factory
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Cargando noticias...</div>
      ) : (
        <div className="space-y-3">
          {news.map((item) => (
            <div key={item.id} className="rounded-3xl border border-gray-700/50 bg-gray-900/60 p-4 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300 font-semibold">{item.time}</span>
                    <span className={`text-[10px] uppercase px-2 py-1 rounded-full border font-semibold ${impactStyles[item.impact]}`}>{item.impact}</span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-2">{item.event}</p>
                </div>
                <span className="text-xs uppercase text-gray-400 tracking-[0.18em]">{item.currency}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-400">
                <div className="rounded-2xl bg-gray-800/70 p-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Actual</p>
                  <p className="mt-1 font-medium text-white">{item.actual || '—'}</p>
                </div>
                <div className="rounded-2xl bg-gray-800/70 p-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Pronóstico</p>
                  <p className="mt-1 font-medium text-white">{item.forecast || '—'}</p>
                </div>
                <div className="rounded-2xl bg-gray-800/70 p-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Previo</p>
                  <p className="mt-1 font-medium text-white">{item.previous || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
