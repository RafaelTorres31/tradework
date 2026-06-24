import { useState } from 'react';
import { Academy } from '../types';

interface Props {
  academies: Academy[];
  onCreateAcademy: (name: string, color: string) => Promise<void>;
  onDeleteAcademy: (id: string) => Promise<void>;
  onUpdateAcademy: (id: string, name: string, color: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#F43F5E', '#14B8A6', '#0EA5E9', '#A855F7', '#D946EF',
];

export default function AcademyManager({ academies, onCreateAcademy, onDeleteAcademy, onUpdateAcademy }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onCreateAcademy(name.trim(), color);
    setName(''); setColor(PRESET_COLORS[0]); setShowForm(false);
    setLoading(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setLoading(true);
    await onUpdateAcademy(id, editName.trim(), editColor);
    setEditId(null);
    setLoading(false);
  };

  const startEdit = (a: Academy) => {
    setEditId(a.id); setEditName(a.name); setEditColor(a.color);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
          Academias ({academies.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg text-xs font-medium transition-colors">
          {showForm ? 'Cancelar' : 'Nueva Academia'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="flex gap-3">
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Nombre de la academia (ej: GV Academy)"
              className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50" required />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Color distintivo</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg transition-all ${color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: color }} />
            <span className="text-gray-300 text-sm">{name || 'Vista previa'}</span>
            <div className="flex-1" />
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? 'Cargando...' : 'Crear Academia'}
            </button>
          </div>
        </form>
      )}

      {academies.length === 0 ? (
        <div className="text-center py-8 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-500 flex flex-col items-center justify-center">
          <svg className="w-12 h-12 mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm">No hay academias. Crea una para organizar mentores y traders.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {academies.map(a => (
            <div key={a.id} className="bg-gray-800/50 border rounded-xl p-3 flex items-center gap-3" style={{ borderColor: `${a.color}40` }}>
              {editId === a.id ? (
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="flex-1 min-w-[120px] px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm" />
                  <div className="flex gap-1">
                    {PRESET_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setEditColor(c)}
                        className={`w-5 h-5 rounded ${editColor === c ? 'ring-2 ring-white' : ''}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                  <button onClick={() => handleUpdate(a.id)} className="px-3 py-1 bg-emerald-500 text-white rounded text-xs">Guardar</button>
                  <button onClick={() => setEditId(null)} className="px-3 py-1 bg-gray-600 text-white rounded text-xs">Cancelar</button>
                </div>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-md flex-shrink-0" style={{ background: a.color }} />
                  <span className="text-white font-medium text-sm flex-1">{a.name}</span>
                  <button onClick={() => startEdit(a)} className="p-1.5 text-gray-400 hover:text-white" title="Editar">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => { if (confirm(`¿Eliminar academia "${a.name}"?`)) onDeleteAcademy(a.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-400" title="Eliminar">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
