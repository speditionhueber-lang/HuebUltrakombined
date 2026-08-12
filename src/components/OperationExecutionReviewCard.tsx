import React, { useState } from 'react';
import {
  OperationExecutionReview,
  ActualOperationData,
  OperationServiceResult,
  OperationAdditionalService,
  OperationIncident,
  OperationIncidentType,
  CustomerConfirmationStatus,
  OperationCompletionReadiness
} from '../lib/types';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Users,
  FileText,
  Plus,
  XCircle,
  AlertOctagon,
  HelpCircle,
  Wrench,
  Package,
  ShieldAlert,
  ClipboardCheck,
  CheckSquare,
  Square
} from 'lucide-react';

export interface OperationExecutionReviewCardProps {
  review: OperationExecutionReview;
  onStartExecution: (startTime?: string) => void;
  onUpdateActuals: (updates: Partial<ActualOperationData>) => void;
  onAddAdditionalService: (service: {
    description: string;
    quantity: number;
    unit: string;
    suggestedUnitPrice?: number;
    billable: boolean;
  }) => void;
  onAddIncident: (incident: {
    type: OperationIncidentType;
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
  }) => void;
  onResolveIncident: (incidentId: string, resolutionNotes: string) => void;
  onCompleteExecution: (options?: { followUpRequired?: boolean; followUpNotes?: string }) => void;
  onCancelExecution: (reason: string) => void;
  isSubmitting?: boolean;
}

export const OperationExecutionReviewCard: React.FC<OperationExecutionReviewCardProps> = ({
  review,
  onStartExecution,
  onUpdateActuals,
  onAddAdditionalService,
  onAddIncident,
  onResolveIncident,
  onCompleteExecution,
  onCancelExecution,
  isSubmitting = false
}) => {
  const [showAddService, setShowAddService] = useState(false);
  const [addSrvDesc, setAddSrvDesc] = useState('');
  const [addSrvQty, setAddSrvQty] = useState(1);
  const [addSrvUnit, setAddSrvUnit] = useState('Stunde');
  const [addSrvBillable, setAddSrvBillable] = useState(true);

  const [showAddIncident, setShowAddIncident] = useState(false);
  const [incTitle, setIncTitle] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incType, setIncType] = useState<OperationIncidentType>('damage');
  const [incSeverity, setIncSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  const [resolvingIncId, setResolvingIncId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');

  const { plannedData, actualData, deviations, incidents, readiness, status } = review;

  const handleStart = () => {
    onStartExecution(new Date().toISOString());
  };

  const handleEndNow = () => {
    const endIso = new Date().toISOString();
    onUpdateActuals({ actualEnd: endIso });
  };

  const handleToggleService = (serviceId: string, currentCompleted: boolean) => {
    const updatedServices = actualData.completedServices.map(s => {
      if (s.id === serviceId) {
        return { ...s, completed: !currentCompleted, partiallyCompleted: false };
      }
      return s;
    });
    onUpdateActuals({ completedServices: updatedServices });
  };

  const handleCreateAdditionalService = () => {
    if (!addSrvDesc.trim()) return;
    onAddAdditionalService({
      description: addSrvDesc.trim(),
      quantity: addSrvQty,
      unit: addSrvUnit,
      billable: addSrvBillable
    });
    setAddSrvDesc('');
    setAddSrvQty(1);
    setShowAddService(false);
  };

  const handleCreateIncident = () => {
    if (!incTitle.trim() || !incDesc.trim()) return;
    onAddIncident({
      type: incType,
      severity: incSeverity,
      title: incTitle.trim(),
      description: incDesc.trim()
    });
    setIncTitle('');
    setIncDesc('');
    setShowAddIncident(false);
  };

  const handleResolveIncidentSubmit = (incidentId: string) => {
    if (!resolveNotes.trim()) return;
    onResolveIncident(incidentId, resolveNotes.trim());
    setResolvingIncId(null);
    setResolveNotes('');
  };

  const handleCancelSubmit = () => {
    if (!cancelReason.trim()) return;
    onCancelExecution(cancelReason.trim());
    setShowCancel(false);
    setCancelReason('');
  };

  const handleFollowUpSubmit = () => {
    onCompleteExecution({ followUpRequired: true, followUpNotes: followUpNotes.trim() });
    setShowFollowUp(false);
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Wartet auf Einsatzstart</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />Einsatz in Durchführung</span>;
      case 'completion_review':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Prüfung Einsatzabschluss</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Einsatz abgeschlossen</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Einsatz abgebrochen</span>;
      default:
        return null;
    }
  };

  const renderReadinessBadge = () => {
    switch (readiness) {
      case 'ready_to_complete':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Bereit für Abschluss</span>;
      case 'not_started':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700/50 text-slate-300">Nicht gestartet</span>;
      case 'missing_start_time':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">Einsatzbeginn fehlt</span>;
      case 'missing_end_time':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">Einsatzende fehlt</span>;
      case 'missing_service_confirmation':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">Leistungen ungeprüft</span>;
      case 'unresolved_incidents':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">Kritisches Vorkommnis ungeklärt</span>;
      case 'missing_customer_confirmation':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">Kundenbestätigung ausstehend</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">Prüfung offen</span>;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-6 shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-base">Einsatzdurchführung & Auftragsabschluss</h3>
          </div>
          <p className="text-xs text-slate-400">
            Erfassung tatsächlicher Einsatzdaten, Zusatzleistungen, Vorkommnisse und kontrollierter Abschluss.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {renderStatusBadge()}
          {renderReadinessBadge()}
        </div>
      </div>

      {review.errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{review.errorMessage}</span>
        </div>
      )}

      {/* Section 1: Times & Resources (Planned vs Actual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Geplante Einsatzdaten
          </h4>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Geplanter Start:</span>
              <span>{plannedData.scheduledStart ? new Date(plannedData.scheduledStart).toLocaleString('de-AT') : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Geplantes Ende:</span>
              <span>{plannedData.scheduledEnd ? new Date(plannedData.scheduledEnd).toLocaleString('de-AT') : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Geplante Dauer:</span>
              <span>{plannedData.plannedDurationMinutes} Min.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fahrzeug:</span>
              <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-slate-400" />{plannedData.vehicleId || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mitarbeiter:</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" />{plannedData.employeeIds.length} Person(en)</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Tatsächliche Einsatzzeiten
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Tatsächlicher Start:</span>
              {actualData.actualStart ? (
                <span className="font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {new Date(actualData.actualStart).toLocaleString('de-AT')}
                </span>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 text-xs"
                >
                  <Play className="w-3 h-3" /> Einsatz jetzt starten
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Tatsächliches Ende:</span>
              {actualData.actualEnd ? (
                <span className="font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {new Date(actualData.actualEnd).toLocaleString('de-AT')}
                </span>
              ) : actualData.actualStart ? (
                <button
                  onClick={handleEndNow}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1 text-xs"
                >
                  <Clock className="w-3 h-3" /> Einsatz jetzt beenden
                </button>
              ) : (
                <span className="text-slate-500 italic">Nach Start verfügbar</span>
              )}
            </div>

            {actualData.actualWorkingMinutes !== undefined && (
              <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1.5">
                <span className="text-slate-400 font-medium">Tatsächliche Arbeitszeit:</span>
                <span className="font-semibold text-indigo-300">{actualData.actualWorkingMinutes} Min.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Services & Additional Services */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            Erbrachte Leistungen
          </h4>
          <button
            onClick={() => setShowAddService(!showAddService)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Zusatzleistung erfassen
          </button>
        </div>

        {/* Planned services list */}
        <div className="space-y-1.5">
          {actualData.completedServices.map(srv => (
            <div
              key={srv.id}
              onClick={() => handleToggleService(srv.id, srv.completed)}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                srv.completed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {srv.completed ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>{srv.label}</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase">{srv.source}</span>
            </div>
          ))}
        </div>

        {/* Additional services list */}
        {actualData.additionalServices.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <span className="text-[11px] font-semibold text-amber-400">Erfasste Zusatzleistungen:</span>
            {actualData.additionalServices.map(addSrv => (
              <div key={addSrv.id} className="flex items-center justify-between p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                <div className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>{addSrv.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{addSrv.quantity} {addSrv.unit}</span>
                  {addSrv.billable && <span className="text-[10px] bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-300">Abrechenbar</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Service Form */}
        {showAddService && (
          <div className="p-3 bg-slate-950 rounded-lg border border-indigo-500/30 space-y-3">
            <h5 className="text-xs font-semibold text-indigo-300">Neue Zusatzleistung erfassen</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <input
                type="text"
                placeholder="Bezeichnung (z.B. Demontage Zusatzschrank)"
                value={addSrvDesc}
                onChange={e => setAddSrvDesc(e.target.value)}
                className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={addSrvQty}
                  onChange={e => setAddSrvQty(parseFloat(e.target.value) || 1)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Einheit"
                  value={addSrvUnit}
                  onChange={e => setAddSrvUnit(e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addSrvBillable}
                  onChange={e => setAddSrvBillable(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                Kostenpflichtig / Abrechenbar
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddService(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateAdditionalService}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Material Usage */}
      {actualData.materialsUsed.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-indigo-400" />
            Materialverbrauch
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {actualData.materialsUsed.map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800 text-xs">
                <span className="text-slate-300">{m.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Geplant: {m.plannedQuantity}</span>
                  <input
                    type="number"
                    min="0"
                    value={m.actualQuantity}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      const updated = actualData.materialsUsed.map(item =>
                        item.id === m.id ? { ...item, actualQuantity: val } : item
                      );
                      onUpdateActuals({ materialsUsed: updated });
                    }}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-emerald-300 font-mono"
                  />
                  <span className="text-slate-400">{m.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Incidents & Damage Reports */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Vorkommnisse & Schadensdokumentation
          </h4>
          <button
            onClick={() => setShowAddIncident(!showAddIncident)}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Vorkommnis melden
          </button>
        </div>

        {incidents.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Keine Vorkommnisse oder Schäden gemeldet.</p>
        ) : (
          <div className="space-y-2">
            {incidents.map(inc => (
              <div
                key={inc.id}
                className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                  inc.resolved
                    ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                    : inc.severity === 'high'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      inc.severity === 'high' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="font-semibold">{inc.title}</span>
                  </div>
                  {inc.resolved ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Geklärt
                    </span>
                  ) : (
                    <button
                      onClick={() => setResolvingIncId(inc.id)}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded"
                    >
                      Klärung erfassen
                    </button>
                  )}
                </div>
                <p className="text-slate-300 text-xs">{inc.description}</p>
                {inc.resolved && inc.resolutionNotes && (
                  <p className="text-emerald-400 text-[11px] italic">Klärung: {inc.resolutionNotes}</p>
                )}

                {resolvingIncId === inc.id && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex gap-2">
                    <input
                      type="text"
                      placeholder="Klärungshinweis (z.B. Vor Ort einvernehmlich geeinigt)"
                      value={resolveNotes}
                      onChange={e => setResolveNotes(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs"
                    />
                    <button
                      onClick={() => handleResolveIncidentSubmit(inc.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs"
                    >
                      Speichern
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Incident Form */}
        {showAddIncident && (
          <div className="p-3 bg-slate-950 rounded-lg border border-amber-500/30 space-y-3">
            <h5 className="text-xs font-semibold text-amber-300">Vorkommnis / Schaden melden</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Titel (z.B. Kratzer an Treppengeländer)"
                value={incTitle}
                onChange={e => setIncTitle(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100"
              />
              <div className="flex gap-2">
                <select
                  value={incSeverity}
                  onChange={e => setIncSeverity(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                >
                  <option value="low">Gering</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch (Kritisch)</option>
                </select>
                <select
                  value={incType}
                  onChange={e => setIncType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                >
                  <option value="damage">Schaden</option>
                  <option value="customer_complaint">Beschwerde</option>
                  <option value="access_problem">Zufahrt/Zugang</option>
                  <option value="vehicle_problem">Fahrzeug/Technik</option>
                  <option value="delay">Verzögerung</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>
            </div>
            <textarea
              placeholder="Beschreibung der Situation..."
              value={incDesc}
              onChange={e => setIncDesc(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 text-xs h-16"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddIncident(false)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateIncident}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium"
              >
                Meldung speichern
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 5: Customer Confirmation Status */}
      <div className="space-y-2 border-t border-slate-800 pt-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          Kundenbestätigung
        </h4>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="text-slate-400">Status der Abnahme:</label>
          <select
            value={actualData.customerConfirmationStatus || 'confirmation_pending'}
            onChange={e => onUpdateActuals({ customerConfirmationStatus: e.target.value as CustomerConfirmationStatus })}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs font-medium"
          >
            <option value="confirmation_pending">Ausstehend</option>
            <option value="confirmed">Bestätigt & Abgenommen</option>
            <option value="customer_absent">Kunde nicht anwesend</option>
            <option value="confirmation_refused">Unterschrift verweigert</option>
          </select>
        </div>
      </div>

      {/* Section 6: Deviations Summary */}
      {deviations.length > 0 && (
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Erkannte Abweichungen ({deviations.length})
          </h4>
          <div className="space-y-1.5">
            {deviations.map(dev => (
              <div
                key={dev.id}
                className={`p-2.5 rounded text-xs flex items-start gap-2 ${
                  dev.severity === 'critical'
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-200'
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">{dev.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 7: Final Controlled Action Bar */}
      <div className="border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          {showFollowUp ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Details zur Nacharbeit (z.B. Restgut nächste Woche liefern)"
                value={followUpNotes}
                onChange={e => setFollowUpNotes(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 w-64"
              />
              <button
                onClick={handleFollowUpSubmit}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium"
              >
                Nacharbeit dokumentieren
              </button>
            </div>
          ) : showCancel ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Grund für Einsatzabbruch..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 w-64"
              />
              <button
                onClick={handleCancelSubmit}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium"
              >
                Abbruch bestätigen
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setShowFollowUp(true)}
                className="text-amber-400 hover:text-amber-300 underline"
              >
                Nacharbeit erforderlich?
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => setShowCancel(true)}
                className="text-rose-400 hover:text-rose-300 underline"
              >
                Einsatz abbrechen
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'pending' ? (
            <button
              onClick={handleStart}
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Play className="w-4 h-4" /> Einsatz starten
            </button>
          ) : (
            <button
              onClick={() => onCompleteExecution()}
              disabled={isSubmitting || readiness === 'unresolved_incidents'}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Einsatz als abgeschlossen bestätigen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
