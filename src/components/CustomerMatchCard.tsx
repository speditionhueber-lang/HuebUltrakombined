import React from 'react';
import { CustomerMatchReview, CustomerFieldComparison, CustomerMatchCandidate } from '../lib/types';
import { UserCheck, CheckCircle2, AlertTriangle, XCircle, ArrowRight, RefreshCw, UserX, ShieldCheck } from 'lucide-react';

export interface CustomerMatchCardProps {
  review: CustomerMatchReview;
  selectedCustomerId?: string;
  fieldComparisons: CustomerFieldComparison[];
  candidates?: CustomerMatchCandidate[];
  onSelectCandidate: (customerId: string) => void;
  onToggleField: (field: string) => void;
  onConfirmMatchOnly: () => void;
  onConfirmWithUpdates: () => void;
  onRejectMatch: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function CustomerMatchCard({
  review,
  selectedCustomerId,
  fieldComparisons,
  candidates = [],
  onSelectCandidate,
  onToggleField,
  onConfirmMatchOnly,
  onConfirmWithUpdates,
  onRejectMatch,
  isSubmitting = false,
  error = null
}: CustomerMatchCardProps) {
  const isMultiple = review.matchType === 'multiple' && !selectedCustomerId;
  const activeCandidate = (candidates.length > 0 && selectedCustomerId)
    ? candidates.find(c => c.customerId === selectedCustomerId)
    : (candidates[0] || null);

  const selectedCount = fieldComparisons.filter(c => c.selectedForUpdate).length;
  const differences = fieldComparisons.filter(c => c.matchStatus === 'missing_in_crm' || c.matchStatus === 'conflicting');
  const hasDifferences = differences.length > 0;

  if (review.status === 'confirmed' || review.status === 'updated') {
    return (
      <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 text-emerald-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-emerald-300">
              {review.status === 'updated' ? 'Kundendaten im CRM aktualisiert' : 'Kundenzuordnung bestätigt'}
            </h4>
            <p className="text-xs text-emerald-400/80">
              Der Vorgang ist mit dem Kunden verknüpft.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">
              {isMultiple ? 'Mögliche Kunden erkannt' : 'Kunde im CRM erkannt'}
            </h4>
            <p className="text-xs text-slate-400">
              {isMultiple
                ? `${review.candidates.length} Treffer im System gefunden`
                : activeCandidate ? activeCandidate.customerName : 'Eindeutiger CRM-Treffer'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
          {isMultiple ? 'Mehrfachauswahl' : 'Eindeutiger Treffer'}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Multiple Candidates Selection View */}
      {isMultiple && (
        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            Bitte wähle den passenden Kunden aus oder markiere die Anforderung als neuen Kunden:
          </p>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {review.candidates.map((cand) => (
              <button
                type="button"
                key={cand.customerId}
                onClick={() => onSelectCandidate(cand.customerId)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                  selectedCustomerId === cand.customerId
                    ? 'bg-indigo-950/40 border-indigo-500 text-slate-100 shadow-inner'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="font-medium text-slate-100">{cand.customerName}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    {cand.customerEmail && <span>{cand.customerEmail}</span>}
                    {cand.customerPhone && <span>• {cand.customerPhone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                    Treffer: {cand.score}%
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-wrap gap-2 justify-between items-center border-t border-slate-800">
            <button
              type="button"
              onClick={onRejectMatch}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <UserX className="w-3.5 h-3.5" />
              Keiner dieser Kunden
            </button>
          </div>
        </div>
      )}

      {/* Field Comparison View (Exact Match or Selected Candidate) */}
      {!isMultiple && (
        <div className="space-y-4">
          {activeCandidate && (
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Verknüpfter Kunde</span>
                <span className="text-sm font-semibold text-slate-100">{activeCandidate.customerName}</span>
                <div className="text-xs text-slate-400 flex gap-2">
                  {activeCandidate.customerEmail && <span>{activeCandidate.customerEmail}</span>}
                  {activeCandidate.customerPhone && <span>• {activeCandidate.customerPhone}</span>}
                </div>
              </div>
              {review.matchType === 'multiple' && (
                <button
                  type="button"
                  onClick={() => onSelectCandidate('')}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Andere wählen
                </button>
              )}
            </div>
          )}

          {!hasDifferences ? (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Alle erkannten E-Mail-Daten stimmen mit den bestehenden CRM-Daten überein.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>Erkannte Daten im Vergleich zu CRM:</span>
                <span className="text-[11px] text-slate-400">{selectedCount} ausgewählt</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {fieldComparisons.map((comp) => {
                  const isDiff = comp.matchStatus === 'missing_in_crm' || comp.matchStatus === 'conflicting';
                  if (!isDiff && comp.matchStatus === 'equal') {
                    return (
                      <div key={comp.field} className="p-2 bg-slate-800/30 rounded border border-slate-800/50 text-xs flex justify-between items-center opacity-70">
                        <span className="text-slate-400 font-medium">{comp.label}</span>
                        <span className="text-slate-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {comp.currentValue || comp.detectedValue}
                        </span>
                      </div>
                    );
                  }

                  const isConflicting = comp.matchStatus === 'conflicting';

                  return (
                    <label
                      key={comp.field}
                      className={`block p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        comp.selectedForUpdate
                          ? 'bg-indigo-950/40 border-indigo-500 text-slate-100'
                          : isConflicting
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={comp.selectedForUpdate}
                          onChange={() => onToggleField(comp.field)}
                          disabled={isSubmitting}
                          className="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-200">{comp.label}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                              isConflicting
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}>
                              {isConflicting ? 'Abweichung' : 'Neu in E-Mail'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="text-slate-400">
                              <span className="block text-[9px] uppercase tracking-wider text-slate-500">CRM Aktuell</span>
                              <span className={comp.currentValue ? 'text-slate-300' : 'italic text-slate-500'}>
                                {comp.currentValue || 'nicht vorhanden'}
                              </span>
                            </div>
                            <div className="text-slate-200">
                              <span className="block text-[9px] uppercase tracking-wider text-slate-400">E-Mail Wert</span>
                              <span className="font-medium text-indigo-300">
                                {comp.detectedValue || '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap gap-2 justify-end items-center border-t border-slate-800">
            <button
              type="button"
              onClick={onRejectMatch}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 mr-auto"
            >
              <UserX className="w-3.5 h-3.5" />
              Falscher Kunde
            </button>

            {hasDifferences && selectedCount > 0 && (
              <button
                type="button"
                onClick={onConfirmWithUpdates}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Ausgewählte Daten übernehmen
              </button>
            )}

            <button
              type="button"
              onClick={onConfirmMatchOnly}
              disabled={isSubmitting}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                !hasDifferences || selectedCount === 0
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isSubmitting && (!hasDifferences || selectedCount === 0) ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserCheck className="w-3.5 h-3.5" />
              )}
              {hasDifferences ? 'Nur Kundenverknüpfung bestätigen' : 'Zuordnung bestätigen'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
