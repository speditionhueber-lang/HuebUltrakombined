import React, { useState } from 'react';
import {
  DispatchReview,
  VehicleSuggestion,
  CrewSuggestion,
  DurationSuggestion,
  DispatchRisk,
  DispatchReadiness
} from '../lib/types';
import {
  Truck,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Edit3,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';

export interface DispatchReviewCardProps {
  review: DispatchReview;
  onConfirm: () => void;
  onEdit: (updatedData: Partial<DispatchReview>) => void;
  onRequestResources?: () => void;
  onBackToPlanning?: () => void;
  isSubmitting?: boolean;
}

export const DispatchReviewCard: React.FC<DispatchReviewCardProps> = ({
  review,
  onConfirm,
  onEdit,
  onRequestResources,
  onBackToPlanning,
  isSubmitting = false
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Local state for editing
  const [editVehicles, setEditVehicles] = useState<VehicleSuggestion[]>(
    JSON.parse(JSON.stringify(review.vehicleSuggestion || []))
  );
  const [editCrew, setEditCrew] = useState<CrewSuggestion[]>(
    JSON.parse(JSON.stringify(review.crewSuggestion || []))
  );
  const [editDuration, setEditDuration] = useState<DurationSuggestion>({
    estimatedHours: review.durationSuggestion?.estimatedHours || 4,
    bufferHours: review.durationSuggestion?.bufferHours || 1,
    reason: review.durationSuggestion?.reason || ''
  });
  const [editRisks, setEditRisks] = useState<DispatchRisk[]>(
    JSON.parse(JSON.stringify(review.riskAnalysis || []))
  );

  const isConfirmed = review.status === 'confirmed' || review.status === 'completed';

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit({
      vehicleSuggestion: editVehicles,
      crewSuggestion: editCrew,
      durationSuggestion: editDuration,
      riskAnalysis: editRisks
    });
    setIsEditing(false);
  };

  const handleToggleRiskIgnored = (riskId: string) => {
    const updatedRisks = editRisks.map(r => {
      if (r.id === riskId) {
        return { ...r, ignored: !r.ignored };
      }
      return r;
    });
    setEditRisks(updatedRisks);
  };

  const handleVehicleCountChange = (id: string, count: number) => {
    setEditVehicles(prev =>
      prev.map(v => (v.id === id ? { ...v, count: Math.max(0, count) } : v))
    );
  };

  const handleCrewCountChange = (id: string, count: number) => {
    setEditCrew(prev =>
      prev.map(c => (c.id === id ? { ...c, count: Math.max(0, count) } : c))
    );
  };

  const renderReadinessBadge = (readiness: DispatchReadiness) => {
    switch (readiness) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Vollständig & bereit
          </span>
        );
      case 'missing_resources':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Ressourcen fehlen
          </span>
        );
      case 'missing_information':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Angaben unvollständig
          </span>
        );
      case 'conflicting_information':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Konflikt erkannt
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Blockiert
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-slate-800">
      {/* Top Header Bar */}
      <div className="bg-slate-900 text-white p-4 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600/30 border border-indigo-400/40 rounded-lg text-indigo-300">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base flex items-center gap-2">
              Disposition & Einsatzplanung (Vorschlag)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ref: Case {review.caseId.substring(0, 8)} • KI-Empfehlung
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {renderReadinessBadge(review.readiness)}
          {isConfirmed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Bestätigt
            </span>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {!isEditing ? (
        <div className="p-5 space-y-5">
          {/* Section 1: Vehicles & Crew Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vehicle Suggestions */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 mb-3 text-slate-900 font-semibold text-xs border-b border-slate-200 pb-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Fahrzeug-Empfehlung</span>
              </div>
              <div className="space-y-2 text-xs">
                {review.vehicleSuggestion?.map(v => (
                  <div
                    key={v.id}
                    className="flex items-start justify-between p-2.5 bg-white rounded border border-slate-200"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 block">
                        {v.count}x {v.vehicleType}
                      </span>
                      <span className="text-[11px] text-slate-500">{v.reason}</span>
                    </div>
                    {v.recommended && (
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                        Empfohlen
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Crew Suggestions */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 mb-3 text-slate-900 font-semibold text-xs border-b border-slate-200 pb-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Mannschafts-Empfehlung</span>
              </div>
              <div className="space-y-2 text-xs">
                {review.crewSuggestion?.map(c => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between p-2.5 bg-white rounded border border-slate-200"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 block">
                        {c.count}x {c.role}
                      </span>
                      <span className="text-[11px] text-slate-500">{c.reason}</span>
                    </div>
                    {c.recommended && (
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                        Empfohlen
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Duration */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 block">
                  Einsatzdauer: {review.durationSuggestion?.estimatedHours || 0} Std (+ {review.durationSuggestion?.bufferHours || 0} Std Puffer)
                </span>
                <span className="text-[11px] text-slate-500">
                  {review.durationSuggestion?.reason}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Risk Analysis */}
          {review.riskAnalysis && review.riskAnalysis.length > 0 && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Dispositionsrisiken & Hinweise ({review.riskAnalysis.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {review.riskAnalysis.map(risk => (
                  <div
                    key={risk.id}
                    className={`p-2.5 rounded border ${
                      risk.ignored
                        ? 'bg-slate-100 border-slate-200 opacity-60'
                        : risk.severity === 'high'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{risk.title}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          risk.severity === 'high'
                            ? 'bg-rose-200 text-rose-800'
                            : 'bg-amber-200 text-amber-800'
                        }`}
                      >
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1">{risk.description}</p>
                    <p className="text-[10px] opacity-75 mt-0.5 italic">{risk.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isSubmitting || isConfirmed}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Vorschläge bearbeiten
              </button>

              {onRequestResources && !isConfirmed && (
                <button
                  type="button"
                  onClick={onRequestResources}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors disabled:opacity-50"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Fehlende Ressourcen markieren
                </button>
              )}

              {onBackToPlanning && !isConfirmed && (
                <button
                  type="button"
                  onClick={onBackToPlanning}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Zur Planung zurück
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting || isConfirmed}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-md transition-all shadow-sm ${
                isConfirmed
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
              }`}
            >
              <Check className="w-4 h-4" />
              {isConfirmed ? 'Disposition bereits bestätigt' : 'Disposition bestätigen'}
            </button>
          </div>
        </div>
      ) : (
        /* Edit Form Mode */
        <form onSubmit={handleSaveEdit} className="p-5 space-y-4 bg-slate-50/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
            Dispositions-Vorschläge anpassen
          </h4>

          {/* Vehicle Edits */}
          <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2 text-xs">
            <span className="font-semibold text-slate-800 block text-[11px]">Fahrzeuge</span>
            {editVehicles.map(v => (
              <div key={v.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                <span className="text-xs font-medium text-slate-700">{v.vehicleType}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-500">Anzahl:</span>
                  <input
                    type="number"
                    min="0"
                    value={v.count}
                    onChange={e => handleVehicleCountChange(v.id, parseInt(e.target.value, 10) || 0)}
                    className="w-16 px-2 py-0.5 border border-slate-300 rounded text-xs text-center font-bold"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Crew Edits */}
          <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2 text-xs">
            <span className="font-semibold text-slate-800 block text-[11px]">Mannschaft</span>
            {editCrew.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                <span className="text-xs font-medium text-slate-700">{c.role}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-500">Anzahl:</span>
                  <input
                    type="number"
                    min="0"
                    value={c.count}
                    onChange={e => handleCrewCountChange(c.id, parseInt(e.target.value, 10) || 0)}
                    className="w-16 px-2 py-0.5 border border-slate-300 rounded text-xs text-center font-bold"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Duration Edit */}
          <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2 text-xs">
            <span className="font-semibold text-slate-800 block text-[11px]">Einsatzdauer & Puffer</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Geschätzte Stunden</label>
                <input
                  type="number"
                  min="1"
                  value={editDuration.estimatedHours}
                  onChange={e =>
                    setEditDuration({
                      ...editDuration,
                      estimatedHours: parseInt(e.target.value, 10) || 1
                    })
                  }
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Pufferstunden</label>
                <input
                  type="number"
                  min="0"
                  value={editDuration.bufferHours}
                  onChange={e =>
                    setEditDuration({
                      ...editDuration,
                      bufferHours: parseInt(e.target.value, 10) || 0
                    })
                  }
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          </div>

          {/* Risks toggle */}
          {editRisks.length > 0 && (
            <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2 text-xs">
              <span className="font-semibold text-slate-800 block text-[11px]">Risikohinweise ignorieren / bestätigen</span>
              <div className="space-y-1.5">
                {editRisks.map(r => (
                  <label key={r.id} className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={!r.ignored}
                      onChange={() => handleToggleRiskIgnored(r.id)}
                    />
                    <span className={r.ignored ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
                      {r.title} ({r.severity})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Save/Cancel Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-200 hover:bg-slate-300 rounded"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-semibold rounded"
            >
              Änderungen speichern
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
