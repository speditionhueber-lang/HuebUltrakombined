import React, { useState } from 'react';
import {
  OperationPreparationReview,
  OperationPreparationData,
  OperationChecklistItem,
  OperationMaterialRequirement,
  OperationDocumentRequirement,
  CaseReminder,
  OperationPreparationReadiness
} from '../lib/types';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Users,
  MapPin,
  FileText,
  Package,
  Bell,
  CheckSquare,
  Square,
  Send,
  Save,
  XCircle,
  Calendar,
  Phone,
  Mail,
  ShieldAlert,
  Plus
} from 'lucide-react';

export interface OperationPreparationReviewCardProps {
  review: OperationPreparationReview;
  onConfirm: () => void;
  onEdit: (updatedData: {
    operationData?: Partial<OperationPreparationData>;
    checklist?: OperationChecklistItem[];
  }) => void;
  onRequestMissingInfo?: () => void;
  onCompleteReminder?: (reminderId: string) => void;
  onReject?: (reason?: string) => void;
  isSubmitting?: boolean;
}

export const OperationPreparationReviewCard: React.FC<OperationPreparationReviewCardProps> = ({
  review,
  onConfirm,
  onEdit,
  onRequestMissingInfo,
  onCompleteReminder,
  onReject,
  isSubmitting = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [checklist, setChecklist] = useState<OperationChecklistItem[]>(review.checklist || []);
  const [materials, setMaterials] = useState<OperationMaterialRequirement[]>(review.operationData.requiredMaterials || []);
  const [newMatName, setNewMatName] = useState('');
  const [newMatQty, setNewMatQty] = useState(1);
  const [newMatUnit, setNewMatUnit] = useState('Stück');

  const opData = review.operationData;

  const handleToggleChecklist = (id: string) => {
    const updated = checklist.map(c => c.id === id ? { ...c, completed: !c.completed } : c);
    setChecklist(updated);
    onEdit({ checklist: updated });
  };

  const handleMaterialStatusChange = (id: string, newStatus: OperationMaterialRequirement['status']) => {
    const updatedm = materials.map(m => m.id === id ? { ...m, status: newStatus } : m);
    setMaterials(updatedm);
    onEdit({
      operationData: { requiredMaterials: updatedm }
    });
  };

  const handleAddMaterial = () => {
    if (!newMatName.trim()) return;
    const newMat: OperationMaterialRequirement = {
      id: `mat_custom_${Date.now()}`,
      name: newMatName.trim(),
      category: 'Sonstiges',
      quantityNeeded: newMatQty,
      unit: newMatUnit,
      status: 'needed',
      source: 'manual'
    };
    const updatedm = [...materials, newMat];
    setMaterials(updatedm);
    setNewMatName('');
    onEdit({
      operationData: { requiredMaterials: updatedm }
    });
  };

  const renderReadinessBadge = (readiness: OperationPreparationReadiness) => {
    switch (readiness) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Einsatz bereit
          </span>
        );
      case 'missing_customer_contact':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Kundenkontakt fehlt
          </span>
        );
      case 'missing_vehicle':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Fahrzeug fehlt
          </span>
        );
      case 'missing_crew':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Mannschaft fehlt
          </span>
        );
      case 'missing_route':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Adressen/Route unvollständig
          </span>
        );
      case 'missing_documents':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Dokumente fehlen
          </span>
        );
      case 'missing_materials':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Materialien fehlen
          </span>
        );
      case 'unresolved_risks':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5" /> Unbestätigte Risiken
          </span>
        );
      case 'conflicting_information':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Widersprüchliche Angaben
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Clock className="w-3.5 h-3.5" /> Blockiert
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-6 text-slate-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-100">Kontrollierte Einsatzvorbereitung</h3>
            {review.status === 'confirmed' ? (
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Bestätigt
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                In Vorbereitung
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Qualitätsgesicherte Einsatzprüfung aus bestätigter Touren- und Auftragsplanung
          </p>
        </div>
        <div>{renderReadinessBadge(review.readiness)}</div>
      </div>

      {/* Warnings & Errors if any */}
      {review.errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <span>{review.errorMessage}</span>
        </div>
      )}

      {review.warnings && review.warnings.length > 0 && (
        <div className="space-y-2">
          {review.warnings.map(w => (
            <div key={w.id} className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Einsatztag & Zeiten
          </div>
          <div className="text-sm font-semibold text-slate-100">{opData.jobDate}</div>
          <div className="text-xs text-slate-300 space-y-0.5">
            <div>Vorbereitung: <span className="font-mono text-slate-200">{opData.preparationTime || '07:30'} Uhr</span></div>
            <div>Einsatzstart: <span className="font-mono text-slate-200">{opData.jobStartTime} Uhr</span></div>
            <div>Gepl. Ende: <span className="font-mono text-slate-200">{opData.estimatedEndTime} Uhr</span></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Truck className="w-3.5 h-3.5 text-cyan-400" /> Fahrzeug & Team
          </div>
          <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-400" /> {opData.vehicleId || 'Kein Fahrzeug'}
          </div>
          <div className="text-xs text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" /> {opData.employeeIds?.length || 0} Mitarbeiter zugewiesen
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Kunde & Adressen
          </div>
          <div className="text-sm font-semibold text-slate-100">{opData.customerName}</div>
          <div className="text-xs text-slate-300 space-y-0.5">
            {opData.customerPhone ? (
              <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {opData.customerPhone}</div>
            ) : (
              <div className="text-amber-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon fehlt</div>
            )}
            {opData.customerEmail ? (
              <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {opData.customerEmail}</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Adressübersicht */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-800/20 p-3 rounded-lg border border-slate-800">
        <div>
          <span className="text-slate-400 font-medium block mb-1">Start / Auszug:</span>
          <p className="text-slate-200 font-medium">
            {opData.pickupAddress?.street ? `${opData.pickupAddress.street}, ${opData.pickupAddress.zip || ''} ${opData.pickupAddress.city || ''}` : 'Adresse unvollständig'}
          </p>
        </div>
        <div>
          <span className="text-slate-400 font-medium block mb-1">Ziel / Einzug:</span>
          <p className="text-slate-200 font-medium">
            {opData.destinationAddress?.street ? `${opData.destinationAddress.street}, ${opData.destinationAddress.zip || ''} ${opData.destinationAddress.city || ''}` : 'Adresse unvollständig'}
          </p>
        </div>
      </div>

      {/* Checklist Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-cyan-400" /> Einsatz-Checkliste
          </h4>
          <span className="text-xs text-slate-400">
            {checklist.filter(c => c.completed).length} / {checklist.length} erledigt
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {checklist.map(item => (
            <div
              key={item.id}
              onClick={() => review.status !== 'confirmed' && handleToggleChecklist(item.id)}
              className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
                item.completed
                  ? 'bg-slate-800/30 border-slate-800 text-slate-300'
                  : 'bg-amber-500/5 border-amber-500/20 text-slate-100 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.completed ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-xs">{item.label}</span>
              </div>
              {item.required && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Pflicht</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Materials & Equipment */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-cyan-400" /> Ausrüstung & Materialbedarf
          </h4>
        </div>

        <div className="space-y-2">
          {materials.map(mat => (
            <div key={mat.id} className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-200">{mat.name}</span>
                <span className="text-slate-400 ml-2">({mat.quantityNeeded} {mat.unit})</span>
              </div>

              {review.status !== 'confirmed' ? (
                <select
                  value={mat.status}
                  onChange={(e) => handleMaterialStatusChange(mat.id, e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
                >
                  <option value="needed">Benötigt</option>
                  <option value="confirmed_available">Verfügbar</option>
                  <option value="missing">Fehlt</option>
                  <option value="not_required">Nicht benötigt</option>
                </select>
              ) : (
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  mat.status === 'confirmed_available' ? 'bg-emerald-500/20 text-emerald-300' :
                  mat.status === 'missing' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300'
                }`}>
                  {mat.status === 'confirmed_available' ? 'Verfügbar' : mat.status === 'missing' ? 'Fehlt' : 'Benötigt'}
                </span>
              )}
            </div>
          ))}

          {review.status !== 'confirmed' && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Material hinzufügen..."
                value={newMatName}
                onChange={(e) => setNewMatName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5"
              />
              <input
                type="number"
                min="1"
                value={newMatQty}
                onChange={(e) => setNewMatQty(Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 text-center"
              />
              <button
                onClick={handleAddMaterial}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Hinzufügen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="space-y-3">
        <div className="border-b border-slate-800 pb-2">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-400" /> Erforderliche Einsatzdokumente
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {opData.requiredDocuments?.map(doc => (
            <div key={doc.id} className="p-2.5 bg-slate-800/30 border border-slate-800 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-slate-200">{doc.title}</div>
              <div className="flex items-center justify-between">
                {doc.available ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Vorhanden
                  </span>
                ) : (
                  <span className="text-rose-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Fehlt
                  </span>
                )}
                {doc.required && <span className="text-[10px] text-slate-500">Erforderlich</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        <div className="border-b border-slate-800 pb-2">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-cyan-400" /> Automatische Erinnerungen
          </h4>
        </div>

        <div className="space-y-2">
          {review.reminders?.map(rem => (
            <div key={rem.id} className="p-2.5 bg-slate-800/30 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200">{rem.title}</span>
                <div className="text-[11px] text-slate-400">
                  Fällig: {rem.dueAt.replace('T', ' um ').substring(0, 19)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  rem.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                  rem.status === 'due' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {rem.status === 'completed' ? 'Erledigt' : rem.status === 'due' ? 'Fällig' : 'Geplant'}
                </span>

                {rem.status !== 'completed' && onCompleteReminder && (
                  <button
                    onClick={() => onCompleteReminder(rem.id)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded"
                  >
                    Erledigen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          {onRequestMissingInfo && (!opData.customerPhone || !opData.customerEmail) && (
            <button
              onClick={onRequestMissingInfo}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Fehlende Angaben anfordern
            </button>
          )}

          {onReject && review.status !== 'confirmed' && (
            <button
              onClick={() => onReject()}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Ablehnen
            </button>
          )}
        </div>

        {review.status !== 'confirmed' && (
          <button
            onClick={onConfirm}
            disabled={isSubmitting || review.readiness !== 'ready'}
            className={`px-5 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg transition-all ${
              review.readiness === 'ready' && !isSubmitting
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Wird bestätigt...' : 'Einsatz als vorbereitet bestätigen'}
          </button>
        )}
      </div>
    </div>
  );
};
