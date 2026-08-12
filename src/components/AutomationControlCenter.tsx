import React, { useState, useEffect } from 'react';
import {
  automationService,
  INITIAL_LOW_RISK_ACTIONS
} from '../lib/automation-service';
import { learningService } from '../lib/learning-service';
import {
  AutomationPolicy,
  AutomationExecution,
  LearningStatistics,
  AutomationLevel
} from '../lib/types';
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Zap,
  Play,
  Pause,
  RotateCcw as ResetIcon,
  ShieldCheck,
  Info
} from 'lucide-react';
import { WorkflowExceptionsCenter } from './WorkflowExceptionsCenter';

export function AutomationControlCenter() {
  const [policies, setPolicies] = useState<AutomationPolicy[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, LearningStatistics>>({});
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const refreshData = () => {
    const pols = automationService.getPolicies();
    setPolicies(pols);

    const execs = automationService.getExecutions();
    setExecutions(execs.slice(-20).reverse()); // show last 20

    const map: Record<string, LearningStatistics> = {};
    for (const item of INITIAL_LOW_RISK_ACTIONS) {
      map[item.actionType] = learningService.getStatisticsForAction(item.actionType);
    }
    setStatsMap(map);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleEnable = (actionType: string, mode: 'dry_run' | 'active' = 'active') => {
    const res = automationService.userEnablePolicy(actionType, mode);
    setMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    refreshData();
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSetMode = (actionType: string, mode: 'dry_run' | 'active') => {
    const res = automationService.userSetMode(actionType, mode);
    setMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    refreshData();
    setTimeout(() => setMessage(null), 4000);
  };

  const handleDisable = (actionType: string) => {
    const res = automationService.userDisablePolicy(actionType);
    setMessage({ text: res.message, type: 'info' });
    refreshData();
    setTimeout(() => setMessage(null), 4000);
  };

  const handleResetManual = (actionType: string) => {
    const res = automationService.userResetPolicyToManual(actionType);
    setMessage({ text: res.message, type: 'info' });
    refreshData();
    setTimeout(() => setMessage(null), 4000);
  };

  const handleRollback = async (executionId: string) => {
    const success = await automationService.rollbackExecution(executionId);
    if (success) {
      setMessage({ text: 'Automatische Aktion wurde erfolgreich zurückgenommen und die Policy pausiert.', type: 'info' });
    } else {
      setMessage({ text: 'Rücknahme der Aktion fehlgeschlagen.', type: 'error' });
    }
    refreshData();
    setTimeout(() => setMessage(null), 4000);
  };

  const getLevelBadge = (policy: AutomationPolicy) => {
    if (!policy.enabled) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Deaktiviert ({policy.level})
        </span>
      );
    }
    if (policy.mode === 'dry_run') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          Simulationsmodus (Dry Run)
        </span>
      );
    }
    if (policy.level === 'auto_execute_reversible') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Aktiv (Reversibel)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
        Vollautomatisierung
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3">
        <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Automatisierung Control Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Schrittweise Vollautomatisierung basierend auf Lerndaten und Sicherheitsstufen. Kritische Aktionen (z.B. E-Mail-Versand, Rechnungsfreigabe) verbleiben zwingend unter Benutzerkontrolle.
          </p>
        </div>
      </div>

      {/* Central Exception, Approval & Automation Control */}
      <WorkflowExceptionsCenter />

      {message && (
        <div className={`p-3 rounded-lg text-xs font-medium border flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          message.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Policies List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Zulässige Automatisierungen ({INITIAL_LOW_RISK_ACTIONS.length})
        </h3>

        <div className="space-y-3">
          {INITIAL_LOW_RISK_ACTIONS.map(item => {
            const policy = policies.find(p => p.actionType === item.actionType);
            const stats = statsMap[item.actionType];

            if (!policy) return null;

            const total = stats?.totalDecisions || 0;
            const appRate = stats ? (stats.approvalRate * 100).toFixed(1) : '0.0';
            const corrRate = stats ? (stats.correctionRate * 100).toFixed(1) : '0.0';
            const failRate = stats ? (stats.failureRate * 100).toFixed(1) : '0.0';
            const isEligible = stats?.eligibleForAutomation;

            return (
              <div key={item.actionType} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-xs text-slate-800">{item.name}</span>
                  </div>
                  <div>{getLevelBadge(policy)}</div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg text-center text-[10px]">
                  <div>
                    <div className="text-slate-400 uppercase text-[9px] font-semibold">Entscheidungen</div>
                    <div className="font-bold text-slate-700 mt-0.5">{total}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase text-[9px] font-semibold">Bestätigt</div>
                    <div className="font-bold text-emerald-600 mt-0.5">{appRate}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase text-[9px] font-semibold">Korrigiert</div>
                    <div className="font-bold text-amber-600 mt-0.5">{corrRate}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase text-[9px] font-semibold">Fehler</div>
                    <div className="font-bold text-rose-600 mt-0.5">{failRate}%</div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <div className="text-slate-500 flex items-center space-x-1">
                    <span className="font-medium">Empfehlung:</span>
                    <span className={`font-semibold ${isEligible ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {isEligible ? 'Reversible Automatisierung möglich' : (stats?.totalDecisions && stats.totalDecisions >= 3 ? 'Vorbereiten (Entwurf)' : 'Manuell / Vorschlag')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Zuletzt: {stats?.lastUsedAt ? new Date(stats.lastUsedAt).toLocaleDateString('de-DE') : 'Nie'}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                  {!policy.enabled ? (
                    <>
                      <button
                        onClick={() => handleEnable(item.actionType, 'dry_run')}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Dry-Run aktivieren</span>
                      </button>
                      <button
                        onClick={() => handleEnable(item.actionType, 'active')}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Aktiv schalten</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {policy.mode === 'dry_run' ? (
                        <button
                          onClick={() => handleSetMode(item.actionType, 'active')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Auf Aktiv umschalten</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSetMode(item.actionType, 'dry_run')}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Auf Dry-Run wechseln</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDisable(item.actionType)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pausieren</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleResetManual(item.actionType)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center space-x-1 transition-colors"
                  >
                    <ResetIcon className="w-3.5 h-3.5" />
                    <span>Auf Manuell</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution Audit Trail & Rollback */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Automations-Historie & Rücknahme
        </h3>

        {executions.length === 0 ? (
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            Bisher keine automatischen Ausführungen protokolliert.
          </div>
        ) : (
          <div className="space-y-2">
            {executions.map(exec => (
              <div key={exec.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">{exec.actionType}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      exec.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      exec.status === 'dry_run' ? 'bg-amber-100 text-amber-800' :
                      exec.status === 'blocked' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                      exec.status === 'failed' ? 'bg-rose-100 text-rose-800' :
                      exec.status === 'reverted' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {exec.status === 'dry_run' ? 'Dry-Run (Simuliert)' : exec.status}
                    </span>
                    {exec.mode && (
                      <span className="text-[9px] text-slate-400 font-mono">
                        [{exec.mode}]
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(exec.startedAt).toLocaleString('de-DE')}
                    {exec.errorMessage && <span className="text-rose-600 ml-2">— {exec.errorMessage}</span>}
                  </div>
                </div>

                {exec.status === 'completed' && exec.reversible && (
                  <button
                    onClick={() => handleRollback(exec.id)}
                    className="bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Rückgängig machen</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
