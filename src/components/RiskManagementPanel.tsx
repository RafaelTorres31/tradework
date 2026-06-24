import { useState } from 'react';
import { RiskManagement, RiskRule } from '../types';

interface Props {
  plans: RiskManagement[];
  canManage: boolean;
  onSave: (plan: RiskManagement) => void;
  onDelete: (planId: string) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const defaultPlan: Omit<RiskManagement, 'id' | 'createdBy' | 'createdAt'> = {
  name: '',
  accountType: 'Ambos',
  description: '',
  rules: [],
  maxDailyLoss: 2,
  maxWeeklyLoss: 5,
  maxDrawdown: 10,
  riskPerTrade: 1,
  maxOpenTrades: 3,
};

export default function RiskManagementPanel({ plans, canManage, onSave, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RiskManagement | null>(null);
  const [formData, setFormData] = useState<Omit<RiskManagement, 'id' | 'createdBy' | 'createdAt'>>(defaultPlan);
  const [newRule, setNewRule] = useState({ title: '', description: '', type: 'tip' as RiskRule['type'] });
  const [filter, setFilter] = useState<'all' | 'Fondeo' | 'Capital Propio'>('all');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const filteredPlans = plans.filter(p => {
    if (filter === 'all') return true;
    return p.accountType === filter || p.accountType === 'Ambos';
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    const plan: RiskManagement = editingPlan
      ? { ...editingPlan, ...formData }
      : {
          ...formData,
          id: generateId(),
          createdBy: 'admin',
          createdAt: new Date().toISOString(),
        };

    onSave(plan);
    setShowForm(false);
    setEditingPlan(null);
    setFormData(defaultPlan);
  };

  const handleEdit = (plan: RiskManagement) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      accountType: plan.accountType,
      description: plan.description,
      rules: plan.rules,
      maxDailyLoss: plan.maxDailyLoss,
      maxWeeklyLoss: plan.maxWeeklyLoss,
      maxDrawdown: plan.maxDrawdown,
      riskPerTrade: plan.riskPerTrade,
      maxOpenTrades: plan.maxOpenTrades,
    });
    setShowForm(true);
  };

  const handleAddRule = () => {
    if (!newRule.title.trim()) return;
    const rule: RiskRule = { id: generateId(), ...newRule };
    setFormData(prev => ({ ...prev, rules: [...prev.rules, rule] }));
    setNewRule({ title: '', description: '', type: 'tip' });
  };

  const handleRemoveRule = (ruleId: string) => {
    setFormData(prev => ({ ...prev, rules: prev.rules.filter(r => r.id !== ruleId) }));
  };

  const getRuleIcon = (type: RiskRule['type']) => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'limit':
        return (
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      case 'tip':
        return (
          <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getRuleColor = (type: RiskRule['type']) => {
    switch (type) {
      case 'warning': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'limit': return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
      case 'tip': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Gestión de Riesgo
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {canManage ? 'Crea y administra planes de gestión de riesgo para tus traders' : 'Planes de gestión de riesgo asignados por tu mentor'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="Fondeo">Fondeo</option>
            <option value="Capital Propio">Capital Propio</option>
          </select>

          {canManage && (
            <button
              onClick={() => { setShowForm(true); setEditingPlan(null); setFormData(defaultPlan); }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              Nuevo Plan
            </button>
          )}
        </div>
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-gray-800/50 rounded-2xl p-12 text-center border border-gray-700 flex flex-col items-center justify-center">
          <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">
            {canManage ? 'No hay planes creados' : 'No hay planes disponibles'}
          </h3>
          <p className="text-gray-400 mb-6">
            {canManage 
              ? 'Crea tu primer plan de gestión de riesgo para tus traders'
              : 'Tu mentor aún no ha creado planes de gestión de riesgo'
            }
          </p>
          {canManage && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
            >
              Crear Primer Plan
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPlans.map(plan => (
            <div
              key={plan.id}
              className={`bg-gray-800/50 rounded-2xl border transition-all duration-300 ${
                expandedPlan === plan.id ? 'border-emerald-500/50' : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Plan Header */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        plan.accountType === 'Fondeo' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' 
                          : plan.accountType === 'Capital Propio'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/10'
                          : 'bg-gray-700/50 text-gray-300'
                      }`}>
                        {plan.accountType}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-gray-400 text-sm">{plan.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`transform transition-transform ${expandedPlan === plan.id ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-emerald-400 font-bold">{plan.riskPerTrade}%</div>
                    <div className="text-gray-500 text-xs">Riesgo/Trade</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-amber-400 font-bold">{plan.maxDailyLoss}%</div>
                    <div className="text-gray-500 text-xs">Max Pérdida Diaria</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-orange-400 font-bold">{plan.maxWeeklyLoss}%</div>
                    <div className="text-gray-500 text-xs">Max Pérdida Semanal</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-gray-400 font-bold">{plan.maxDrawdown}%</div>
                    <div className="text-gray-500 text-xs">Max Drawdown</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-emerald-500 font-bold">{plan.maxOpenTrades}</div>
                    <div className="text-gray-500 text-xs">Max Trades Abiertos</div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedPlan === plan.id && (
                <div className="border-t border-gray-700 p-5 space-y-4">
                  {/* Rules */}
                  {plan.rules.length > 0 && (
                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        Reglas del Plan
                      </h4>
                      <div className="space-y-2">
                        {plan.rules.map(rule => (
                          <div key={rule.id} className={`p-3 rounded-lg border ${getRuleColor(rule.type)}`}>
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0">{getRuleIcon(rule.type)}</span>
                              <div>
                                <div className="font-medium">{rule.title}</div>
                                {rule.description && (
                                  <div className="text-sm opacity-80 mt-1">{rule.description}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Actions */}
                  {canManage && (
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-700">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(plan); }}
                        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (confirm('¿Eliminar este plan?')) onDelete(plan.id); 
                        }}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg text-sm font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && canManage && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan de Riesgo'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingPlan(null); }}
                className="text-gray-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Nombre del Plan *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                    placeholder="Ej: Plan Conservador FTMO"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Tipo de Cuenta</label>
                  <select
                    value={formData.accountType}
                    onChange={e => setFormData(prev => ({ ...prev, accountType: e.target.value as RiskManagement['accountType'] }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="Ambos">Ambos</option>
                    <option value="Fondeo">Fondeo</option>
                    <option value="Capital Propio">Capital Propio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none"
                  rows={2}
                  placeholder="Descripción del plan..."
                />
              </div>

              {/* Risk Parameters */}
              <div>
                <h3 className="text-white font-semibold mb-3">Parámetros de Riesgo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Riesgo por Trade (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.riskPerTrade}
                      onChange={e => setFormData(prev => ({ ...prev, riskPerTrade: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Max Pérdida Diaria (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.maxDailyLoss}
                      onChange={e => setFormData(prev => ({ ...prev, maxDailyLoss: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Max Pérdida Semanal (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.maxWeeklyLoss}
                      onChange={e => setFormData(prev => ({ ...prev, maxWeeklyLoss: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Max Drawdown (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.maxDrawdown}
                      onChange={e => setFormData(prev => ({ ...prev, maxDrawdown: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Max Trades Abiertos</label>
                    <input
                      type="number"
                      value={formData.maxOpenTrades}
                      onChange={e => setFormData(prev => ({ ...prev, maxOpenTrades: parseInt(e.target.value) || 1 }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Rules */}
              <div>
                <h3 className="text-white font-semibold mb-3">Reglas del Plan</h3>
                
                {/* Existing Rules */}
                {formData.rules.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {formData.rules.map(rule => (
                      <div key={rule.id} className={`p-3 rounded-lg border ${getRuleColor(rule.type)} flex items-start justify-between gap-2`}>
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0">{getRuleIcon(rule.type)}</span>
                          <div>
                            <div className="font-medium">{rule.title}</div>
                            {rule.description && <div className="text-sm opacity-80">{rule.description}</div>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(rule.id)}
                          className="text-gray-500 hover:text-white p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Rule */}
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newRule.title}
                      onChange={e => setNewRule(prev => ({ ...prev, title: e.target.value }))}
                      className="sm:col-span-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="Título de la regla..."
                    />
                    <select
                      value={newRule.type}
                      onChange={e => setNewRule(prev => ({ ...prev, type: e.target.value as RiskRule['type'] }))}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="tip">Consejo</option>
                      <option value="warning">Advertencia</option>
                      <option value="limit">Límite</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={newRule.description}
                    onChange={e => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="Descripción (opcional)..."
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    Agregar Regla
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingPlan(null); }}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                >
                  {editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
