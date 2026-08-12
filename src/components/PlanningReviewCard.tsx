import React, { useState } from 'react';
import {
  PlanningReview,
  PlanningData,
  PlanningAddressData
} from '../lib/types';
import {
  Calendar,
  MapPin,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Mail,
  Check,
  Building2,
  Box,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

export interface PlanningReviewCardProps {
  review: PlanningReview;
  onConfirm: () => void;
  onEdit: (updatedData: Partial<PlanningData>) => void;
  onRequestMissingInfo: () => void;
  isSubmitting?: boolean;
}

export const PlanningReviewCard: React.FC<PlanningReviewCardProps> = ({
  review,
  onConfirm,
  onEdit,
  onRequestMissingInfo,
  isSubmitting = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const data = review.planningData;

  // Local form state for editing
  const [editMoveDate, setEditMoveDate] = useState(data.moveDate || '');
  const [editTimeWindow, setEditTimeWindow] = useState(data.timeWindow || '08:00 - 12:00 Uhr');

  const [editPickupStreet, setEditPickupStreet] = useState(data.pickupAddress?.street || '');
  const [editPickupZip, setEditPickupZip] = useState(data.pickupAddress?.zip || '');
  const [editPickupCity, setEditPickupCity] = useState(data.pickupAddress?.city || '');
  const [editPickupFloor, setEditPickupFloor] = useState(data.pickupAddress?.floor || '');
  const [editPickupElevator, setEditPickupElevator] = useState(data.pickupAddress?.elevator || false);

  const [editDestStreet, setEditDestStreet] = useState(data.destinationAddress?.street || '');
  const [editDestZip, setEditDestZip] = useState(data.destinationAddress?.zip || '');
  const [editDestCity, setEditDestCity] = useState(data.destinationAddress?.city || '');
  const [editDestFloor, setEditDestFloor] = useState(data.destinationAddress?.floor || '');
  const [editDestElevator, setEditDestElevator] = useState(data.destinationAddress?.elevator || false);

  const [editVolume, setEditVolume] = useState(data.estimatedVolumeM3 || 25);
  const [editAssembly, setEditAssembly] = useState(data.assemblyService || false);
  const [editPacking, setEditPacking] = useState(data.packingService || false);
  const [editExternalElevator, setEditExternalElevator] = useState(data.externalElevatorNeeded || false);
  const [editPiano, setEditPiano] = useState(data.heavyItems?.piano || false);
  const [editSafe, setEditSafe] = useState(data.heavyItems?.safe || false);
  const [editNotes, setEditNotes] = useState(data.specialNotes || '');

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPickup: PlanningAddressData = {
      ...data.pickupAddress,
      street: editPickupStreet,
      zip: editPickupZip,
      city: editPickupCity,
      floor: editPickupFloor,
      elevator: editPickupElevator
    };

    const updatedDest: PlanningAddressData = {
      ...data.destinationAddress,
      street: editDestStreet,
      zip: editDestZip,
      city: editDestCity,
      floor: editDestFloor,
      elevator: editDestElevator
    };

    onEdit({
      moveDate: editMoveDate,
      timeWindow: editTimeWindow,
      pickupAddress: updatedPickup,
      destinationAddress: updatedDest,
      estimatedVolumeM3: Number(editVolume),
      assemblyService: editAssembly,
      packingService: editPacking,
      externalElevatorNeeded: editExternalElevator,
      heavyItems: {
        piano: editPiano,
        safe: editSafe
      },
      specialNotes: editNotes
    });

    setIsEditing(false);
  };

  const isConfirmed = review.status === 'confirmed' || review.status === 'completed';

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
              Auftragsplanung zur Disposition
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ref: Case {review.caseId.substring(0, 8)} • System-Review
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {review.readiness === 'ready' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Vollständig & bereit
            </span>
          )}

          {review.readiness === 'missing_information' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              Angaben unvollständig
            </span>
          )}

          {review.readiness === 'conflicting_information' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              Konflikt erkannt
            </span>
          )}

          {isConfirmed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Bestätigt
            </span>
          )}
        </div>
      </div>

      {/* Warnings / Alerts block */}
      {review.warnings && review.warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border-b border-amber-100">
          <div className="flex items-start gap-2.5 text-amber-900 text-xs font-medium mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Erkannte Planungs- und Dispositions-Hinweise:</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs text-amber-800">
            {review.warnings.map(warning => (
              <li key={warning.id}>
                <span className="font-medium">{warning.message}</span>
                {warning.severity === 'high' && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">
                    Erforderlich
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Content View */}
      {!isEditing ? (
        <div className="p-5 space-y-5">
          {/* Section 1: Termin & Time Window */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Umzugstermin
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {data.moveDate || <span className="text-rose-600 font-normal italic">Nicht angegeben</span>}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Zeitfenster
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {data.timeWindow || '08:00 - 12:00 Uhr'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pickup Address */}
            <div className="p-3.5 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-100 text-slate-900 font-semibold text-xs">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Abholadresse</span>
              </div>
              <div className="text-xs space-y-1 text-slate-700">
                <p className="font-medium text-slate-900">
                  {data.pickupAddress?.street || <span className="text-rose-500 italic">Fehlt</span>}
                </p>
                <p>{[data.pickupAddress?.zip, data.pickupAddress?.city].filter(Boolean).join(' ')}</p>
                <div className="pt-1 text-[11px] text-slate-500 flex flex-wrap gap-2">
                  <span>Etage: <strong>{data.pickupAddress?.floor ?? 'k.A.'}</strong></span>
                  <span>•</span>
                  <span>Aufzug: <strong>{data.pickupAddress?.elevator ? 'Ja' : 'Nein'}</strong></span>
                </div>
              </div>
            </div>

            {/* Destination Address */}
            <div className="p-3.5 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-100 text-slate-900 font-semibold text-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zieladresse</span>
              </div>
              <div className="text-xs space-y-1 text-slate-700">
                <p className="font-medium text-slate-900">
                  {data.destinationAddress?.street || <span className="text-rose-500 italic">Fehlt</span>}
                </p>
                <p>{[data.destinationAddress?.zip, data.destinationAddress?.city].filter(Boolean).join(' ')}</p>
                <div className="pt-1 text-[11px] text-slate-500 flex flex-wrap gap-2">
                  <span>Etage: <strong>{data.destinationAddress?.floor ?? 'k.A.'}</strong></span>
                  <span>•</span>
                  <span>Aufzug: <strong>{data.destinationAddress?.elevator ? 'Ja' : 'Nein'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Details & Services */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-md">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Volumen</span>
              <span className="font-semibold text-slate-900">{data.estimatedVolumeM3 || 0} m³</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-md">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Montage</span>
              <span className="font-semibold text-slate-900">{data.assemblyService ? 'Ja' : 'Nein'}</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-md">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Verpackung</span>
              <span className="font-semibold text-slate-900">{data.packingService ? 'Ja' : 'Nein'}</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-md">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Außenaufzug</span>
              <span className="font-semibold text-slate-900">{data.externalElevatorNeeded ? 'Ja' : 'Nein'}</span>
            </div>
          </div>

          {/* Section 4: Heavy items & Notes */}
          {(data.heavyItems?.piano || data.heavyItems?.safe || data.specialNotes) && (
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-md text-xs space-y-1">
              {data.heavyItems?.piano && <p className="font-semibold text-indigo-900">• Schwergut: Klavier transportieren</p>}
              {data.heavyItems?.safe && <p className="font-semibold text-indigo-900">• Schwergut: Tresor transportieren</p>}
              {data.specialNotes && <p className="text-slate-600 mt-1">Hinweis: {data.specialNotes}</p>}
            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isSubmitting || isConfirmed}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Angaben bearbeiten
              </button>

              {review.readiness !== 'ready' && !isConfirmed && (
                <button
                  type="button"
                  onClick={onRequestMissingInfo}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                  Fehlende Daten anfordern
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
              {isConfirmed ? 'Planung bereits bestätigt' : 'Planung bestätigen'}
            </button>
          </div>
        </div>
      ) : (
        /* Edit Form Mode */
        <form onSubmit={handleSaveEdit} className="p-5 space-y-4 bg-slate-50/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
            Planungsdaten bearbeiten
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Umzugstermin</label>
              <input
                type="text"
                value={editMoveDate}
                onChange={e => setEditMoveDate(e.target.value)}
                placeholder="z.B. 15.09.2026"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Zeitfenster</label>
              <input
                type="text"
                value={editTimeWindow}
                onChange={e => setEditTimeWindow(e.target.value)}
                placeholder="z.B. 08:00 - 12:00 Uhr"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Abholadresse Edit */}
          <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2 text-xs">
            <span className="font-semibold text-slate-800 block text-[11px]">Abholadresse</span>
            <input
              type="text"
              value={editPickupStreet}
              onChange={e => setEditPickupStreet(e.target.value)}
              placeholder="Straße & Hausnummer"
              className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={editPickupZip}
                onChange={e => setEditPickupZip(e.target.value)}
                placeholder="PLZ"
                className="px-2 py-1 border border-slate-300 rounded text-xs"
              />
              <input
                type="text"
                value={editPickupCity}
                onChange={e => setEditPickupCity(e.target.value)}
                placeholder="Ort"
                className="col-span-2 px-2 py-1 border border-slate-300 rounded text-xs"
              />
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-1 text-[11px]">
                Etage:
                <input
                  type="text"
                  value={editPickupFloor}
                  onChange={e => setEditPickupFloor(e.target.value)}
                  className="w-12 px-1 py-0.5 border border-slate-300 rounded text-xs ml-1"
                />
              </label>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input
                  type="checkbox"
                  checked={editPickupElevator}
                  onChange={e => setEditPickupElevator(e.target.checked)}
                />
                Aufzug vorhanden
              </label>
            </div>
          </div>

          {/* Zieladresse Edit */}
          <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2 text-xs">
            <span className="font-semibold text-slate-800 block text-[11px]">Zieladresse</span>
            <input
              type="text"
              value={editDestStreet}
              onChange={e => setEditDestStreet(e.target.value)}
              placeholder="Straße & Hausnummer"
              className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={editDestZip}
                onChange={e => setEditDestZip(e.target.value)}
                placeholder="PLZ"
                className="px-2 py-1 border border-slate-300 rounded text-xs"
              />
              <input
                type="text"
                value={editDestCity}
                onChange={e => setEditDestCity(e.target.value)}
                placeholder="Ort"
                className="col-span-2 px-2 py-1 border border-slate-300 rounded text-xs"
              />
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-1 text-[11px]">
                Etage:
                <input
                  type="text"
                  value={editDestFloor}
                  onChange={e => setEditDestFloor(e.target.value)}
                  className="w-12 px-1 py-0.5 border border-slate-300 rounded text-xs ml-1"
                />
              </label>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input
                  type="checkbox"
                  checked={editDestElevator}
                  onChange={e => setEditDestElevator(e.target.checked)}
                />
                Aufzug vorhanden
              </label>
            </div>
          </div>

          {/* Options & Heavy items */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-2">
            <label className="block col-span-2">
              <span className="text-[11px] font-medium text-slate-700 block mb-1">Volumen (m³)</span>
              <input
                type="number"
                value={editVolume}
                onChange={e => setEditVolume(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
              />
            </label>
            <div className="col-span-2 flex flex-col justify-end space-y-1">
              <label className="flex items-center gap-1.5 text-[11px]">
                <input
                  type="checkbox"
                  checked={editAssembly}
                  onChange={e => setEditAssembly(e.target.checked)}
                />
                Montageservice
              </label>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input
                  type="checkbox"
                  checked={editPacking}
                  onChange={e => setEditPacking(e.target.checked)}
                />
                Verpackungsservice
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs pt-1 border-t border-slate-200">
            <label className="flex items-center gap-1.5 text-[11px]">
              <input
                type="checkbox"
                checked={editExternalElevator}
                onChange={e => setEditExternalElevator(e.target.checked)}
              />
              Außenaufzug erforderlich
            </label>
            <label className="flex items-center gap-1.5 text-[11px]">
              <input
                type="checkbox"
                checked={editPiano}
                onChange={e => setEditPiano(e.target.checked)}
              />
              Klavier
            </label>
            <label className="flex items-center gap-1.5 text-[11px]">
              <input
                type="checkbox"
                checked={editSafe}
                onChange={e => setEditSafe(e.target.checked)}
              />
              Tresor
            </label>
          </div>

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
