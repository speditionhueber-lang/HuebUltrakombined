import React, { useState, useEffect } from 'react';
import { workflowExceptionService } from '../lib/workflow-exception-service';
import { caseService } from '../lib/case-service';
import { crmLookupService } from '../lib/crm-lookup-service';
import { WorkflowException, WorkflowExceptionAction } from '../lib/types';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  UserCheck,
  FileText,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Ban,
  Trash2,
  User,
  Target,
} from 'lucide-react';

interface Props {
  caseId?: string;
  onOpenCase?: (caseId: string) => void;
  className?: string;
}

export const WorkflowExceptionsCenter: React.FC<Props> = ({ caseId, onOpenCase, className = '' }) => {
  const [exceptions, setExceptions] = useState<WorkflowException[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    exceptionId: string;
    action: WorkflowExceptionAction;
  } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadExceptions = () => {
    const list = workflowExceptionService.getExceptions({
      caseId,
      status: 'open',
    });
    setExceptions(list);
  };

  useEffect(() => {
    loadExceptions();
    const interval = setInterval(loadExceptions, 3000);
    return () => clearInterval(interval);
  }, [caseId]);

  const handleActionClick = (exception: WorkflowException, action: WorkflowExceptionAction) => {
    if (action.requiresConfirmation) {
      setConfirmAction({ exceptionId: exception.id, action });
      return;
    }
    executeAction(exception.id, action.id);
  };

  const executeAction = async (exceptionId: string, actionId: string) => {
    setProcessingId(exceptionId);
    setFeedback(null);
    try {
      const res = workflowExceptionService.resolveException(exceptionId, actionId, 'Benutzer');
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        loadExceptions();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Aktion fehlgeschlagen' });
    } finally {
      setProcessingId(null);
      setConfirmAction(null);
    }
  };

  // Groupings
  const criticalList = exceptions.filter(e => e.severity === 'critical');
  const todayList = exceptions.filter(e => e.severity !== 'critical' && (e.category === 'overdue_action' || e.title.toLowerCase().includes('heute') || e.metadata?.isOverdue));
  const blockedList = exceptions.filter(e => e.severity !== 'critical' && (e.category === 'ambiguous_match' || e.category === 'data_conflict' || e.category === 'reconciliation_required'));
  const automationList = exceptions.filter(e => e.sourceType === 'automation' || e.category === 'automation_blocked' || e.category === 'automation_failed');
  const missingInfoList = exceptions.filter(e => e.category === 'missing_information' || e.category === 'validation_error');
  const overdueList = exceptions.filter(e => e.category === 'overdue_action' && !todayList.includes(e));

  const totalOpenCount = exceptions.length;

  if (totalOpenCount === 0) {
    return (
      <div className={`bg-slate-50 border border-slate-200 rounded-xl p-6 text-center ${className}`}>
        <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">Keine Prüfungen oder Blockierungen offen</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Alle Prozesse laufen ordnungsgemäß oder wurden erfolgreich bearbeitet.
        </p>
      </div>
    );
  }

  const renderExceptionGroup = (title: string, items: WorkflowException[], icon: React.ReactNode, badgeColor: string) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColor}`}>
            {items.length}
          </span>
        </div>

        <div className="space-y-3">
          {items.map(exc => {
            const isProcessing = processingId === exc.id;
            const caseItem = exc.caseId ? caseService.getCase(exc.caseId) : null;
            const customerName = caseItem?.title || (exc.metadata as any)?.customerName || 'Spedition Kunde / Anfrager';

            let functionTarget = 'Automatische Verarbeitung & Vorgangsbearbeitung';
            if (exc.category === 'automation_blocked' || exc.category === 'automation_failed') {
              functionTarget = 'Automatische E-Mail-Triage & Angebotserstellung';
            } else if (exc.category === 'ambiguous_match') {
              functionTarget = 'Eindeutige Kunden-Zuordnung im CRM';
            } else if (exc.category === 'data_conflict') {
              functionTarget = 'Abgleich von Stamm- und Adressdaten';
            } else if (exc.category === 'reconciliation_required') {
              functionTarget = 'Gegenprüfung von Leistungsumfang & Betrag';
            } else if (exc.category === 'missing_information') {
              functionTarget = 'Vollständigkeitsprüfung der Anfrage-Details';
            }

            const handleDelete = () => {
              if (window.confirm('Möchtest du diese Ausnahme / diesen fehlerhaften Vorgang wirklich löschen?')) {
                workflowExceptionService.deleteException(exc.id);
                loadExceptions();
                setFeedback({ type: 'success', message: 'Vorgang / Ausnahme erfolgreich gelöscht.' });
              }
            };

            return (
              <div
                key={exc.id}
                className={`p-4 rounded-xl border transition-all ${
                  exc.severity === 'critical'
                    ? 'bg-rose-50/70 border-rose-200'
                    : exc.severity === 'warning'
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${
                        exc.severity === 'critical'
                          ? 'bg-rose-600 text-white'
                          : exc.severity === 'warning'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {exc.severity === 'critical' ? 'Kritisch' : exc.severity === 'warning' ? 'Warnung' : 'Hinweis'}
                    </span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {exc.sourceType}
                    </span>
                    {exc.caseId && (
                      <span className="text-xs text-indigo-600 font-medium">
                        Case: {exc.caseId.slice(0, 8)}...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {exc.caseId && onOpenCase && (
                      <button
                        onClick={() => onOpenCase(exc.caseId!)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                      >
                        Vorgang öffnen <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      title="Vorgang / Fehler löschen"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h5 className="text-sm font-bold text-slate-900 mb-1">{exc.title}</h5>
                <p className="text-xs text-slate-700 mb-2">{exc.description}</p>

                {/* Concrete Fall Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-500">Kunde:</span>
                    <span className="font-medium text-slate-900 truncate">{customerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Target className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-500">Ziel d. Funktion:</span>
                    <span className="font-medium text-slate-900 truncate">{functionTarget}</span>
                  </div>
                </div>

                {/* Problem & Blockiergrund */}
                {(exc.blockingReason || exc.description) && (
                  <div className="bg-rose-50/90 p-2.5 rounded-lg border border-rose-200 mb-3 text-xs text-slate-800">
                    <div className="font-bold text-rose-800 flex items-center gap-1 mb-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Problem / Grund der Blockierung:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {exc.blockingReason || exc.description}
                    </p>
                  </div>
                )}

                {exc.recommendedAction && (
                  <p className="text-xs text-slate-500 mb-3 italic">
                    Empfehlung: {exc.recommendedAction}
                  </p>
                )}

                {/* Available Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                  {exc.availableActions.map(action => (
                    <button
                      key={action.id}
                      disabled={isProcessing}
                      onClick={() => handleActionClick(exc, action)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        action.type === 'select_customer' || action.type === 'approve'
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                          : action.type === 'rollback'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : action.type === 'retry'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : action.type === 'disable_policy'
                          ? 'bg-slate-700 hover:bg-slate-800 text-white'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {action.type === 'retry' && <RotateCcw className="w-3.5 h-3.5" />}
                      {action.type === 'rollback' && <RefreshCw className="w-3.5 h-3.5" />}
                      {action.type === 'disable_policy' && <Ban className="w-3.5 h-3.5" />}
                      {action.label}
                    </button>
                  ))}
                  <button
                    onClick={handleDelete}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    Löschen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          <h3 className="text-base font-bold text-slate-800">Prüfungen & Ausnahmen</h3>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
          {totalOpenCount} offen
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg mb-4 text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal / Overlay */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Bestätigung erforderlich</h4>
            <p className="text-xs text-slate-600 mb-4">
              Möchtest du die Aktion <strong>"{confirmAction.action.label}"</strong> wirklich ausführen?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Abbrechen
              </button>
              <button
                onClick={() => executeAction(confirmAction.exceptionId, confirmAction.action.id)}
                className="px-3 py-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium"
              >
                Bestätigen & Ausführen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group 1: Critical */}
      {renderExceptionGroup(
        'KRITISCH',
        criticalList,
        <AlertTriangle className="w-4 h-4 text-rose-600" />,
        'bg-rose-100 text-rose-800'
      )}

      {/* Group 2: Heute erforderlich */}
      {renderExceptionGroup(
        'HEUTE ERFORDERLICH',
        todayList,
        <Clock className="w-4 h-4 text-amber-600" />,
        'bg-amber-100 text-amber-800'
      )}

      {/* Group 3: Blockierte Vorgänge */}
      {renderExceptionGroup(
        'BLOCKIERTE VORGÄNGE',
        blockedList,
        <Ban className="w-4 h-4 text-indigo-600" />,
        'bg-indigo-100 text-indigo-800'
      )}

      {/* Group 4: Automatisierungen prüfen */}
      {renderExceptionGroup(
        'AUTOMATISIERUNGEN PRÜFEN',
        automationList,
        <RefreshCw className="w-4 h-4 text-purple-600" />,
        'bg-purple-100 text-purple-800'
      )}

      {/* Group 5: Fehlende Informationen */}
      {renderExceptionGroup(
        'FEHLENDE INFORMATIONEN',
        missingInfoList,
        <Info className="w-4 h-4 text-blue-600" />,
        'bg-blue-100 text-blue-800'
      )}

      {/* Group 6: Überfällige Aufgaben */}
      {renderExceptionGroup(
        'ÜBERFÄLLIGE AUFGABEN',
        overdueList,
        <AlertCircle className="w-4 h-4 text-orange-600" />,
        'bg-orange-100 text-orange-800'
      )}
    </div>
  );
};
