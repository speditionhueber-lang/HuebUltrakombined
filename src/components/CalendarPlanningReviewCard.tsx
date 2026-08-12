import React, { useState } from 'react';
import {
  CalendarPlanningReview,
  ProposedSchedule,
  CalendarConflict,
  CalendarPlanningWarning,
  CalendarPlanningReadiness
} from '../lib/types';
import {
  Calendar,
  Clock,
  Truck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  MapPin,
  ArrowRight,
  Info
} from 'lucide-react';

export interface CalendarPlanningReviewCardProps {
  review: CalendarPlanningReview;
  onConfirm: () => void;
  onEdit: (updatedData: Partial<CalendarPlanningReview>) => void;
  onReject?: (reason?: string) => void;
  isSubmitting?: boolean;
}

const AVAILABLE_VEHICLES = [
  { id: 'v-3_5t', label: '3,5t Transporter (18m³)' },
  { id: 'v-7_5t', label: '7,5t LKW (36m³)' },
  { id: 'v-ext-elev', label: 'Außenaufzug-Fahrzeug' }
];

const AVAILABLE_EMPLOYEES = [
  { id: 'emp-fahrer-1', label: 'Marko (Fahrer)' },
  { id: 'emp-moebelpacker-1', label: 'Stefan (Möbelpacker)' },
  { id: 'emp-moebelpacker-2', label: 'Thomas (Möbelpacker)' },
  { id: 'emp-monteur-1', label: 'Andreas (Monteur)' }
];

export const CalendarPlanningReviewCard: React.FC<CalendarPlanningReviewCardProps> = ({
  review,
  onConfirm,
  onEdit,
  onReject,
  isSubmitting = false
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Local state for editing
  const [editDate, setEditDate] = useState(review.proposedSchedule?.date || '');
  const [editStartTime, setEditStartTime] = useState(review.proposedSchedule?.jobStartTime || '08:00');
  const [editDuration, setEditDuration] = useState(review.proposedSchedule?.estimatedDurationMinutes || 240);
  const [editBuffer, setEditBuffer] = useState(review.proposedSchedule?.bufferMinutes || 45);
  const [editVehicle, setEditVehicle] = useState(review.selectedVehicleId || 'v-3_5t');
  const [editEmployees, setEditEmployees] = useState<string[]>(review.selectedEmployeeIds || []);
  const [editNotes, setEditNotes] = useState(review.proposedSchedule?.notes || '');

  const isScheduled = review.status === 'scheduled';
  const isConfirmed = review.status === 'confirmed' || isScheduled;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit({
      proposedSchedule: {
        ...review.proposedSchedule,
        date: editDate,
        jobStartTime: editStartTime,
        estimatedDurationMinutes: editDuration,
        bufferMinutes: editBuffer,
        notes: editNotes
      },
      selectedVehicleId: editVehicle,
      selectedEmployeeIds: editEmployees
    });
    setIsEditing(false);
  };

  const toggleEmployee = (empId: string) => {
    setEditEmployees(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const renderReadinessBadge = (readiness: CalendarPlanningReadiness) => {
    switch (readiness) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Bereit für Kalendereintrag
          </span>
        );
      case 'missing_date':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            Datum fehlt
          </span>
        );
      case 'missing_time':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Startzeit fehlt
          </span>
        );
      case 'missing_vehicle':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            Kein Fahrzeug zugewiesen
          </span>
        );
      case 'missing_employees':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Keine Mitarbeiter zugewiesen
          </span>
        );
      case 'conflict':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Terminkonflikt vorhanden
          </span>
        );
      case 'incomplete_information':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            Angaben unvollständig
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            {readiness}
          </span>
        );
    }
  };

  const sched = review.proposedSchedule;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-5 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Kalender- & Einsatzplanung
              {isScheduled && (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                  GEPLANT & BESTÄTIGT
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Vorgeschlagener Termin basierend auf der bestätigten Disposition
            </p>
          </div>
        </div>
        <div>{renderReadinessBadge(review.readiness)}</div>
      </div>

      {review.errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{review.errorMessage}</span>
        </div>
      )}

      {/* Main View Mode */}
      {!isEditing ? (
        <div className="space-y-4">
          {/* Termin-Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Datum
              </div>
              <div className="text-sm font-bold text-white">
                {sched?.date || 'Nicht festgelegt'}
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Zeitfenster
              </div>
              <div className="text-sm font-bold text-white">
                {sched?.jobStartTime || '--:--'} - {sched?.estimatedEndTime || '--:--'} Uhr
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Dauer: {Math.floor((sched?.estimatedDurationMinutes || 0) / 60)}h {(sched?.estimatedDurationMinutes || 0) % 60}m (inkl. {sched?.bufferMinutes || 0}m Puffer)
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Truck className="w-3.5 h-3.5 text-indigo-400" />
                Zugewiesenes Fahrzeug
              </div>
              <div className="text-sm font-bold text-white">
                {AVAILABLE_VEHICLES.find(v => v.id === review.selectedVehicleId)?.label || review.selectedVehicleId || 'Keins'}
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Zugewiesenes Personal
              </div>
              <div className="text-sm font-bold text-white truncate" title={review.selectedEmployeeIds?.join(', ')}>
                {review.selectedEmployeeIds?.length
                  ? `${review.selectedEmployeeIds.length} Mitarbeiter (${review.selectedEmployeeIds.map(id => AVAILABLE_EMPLOYEES.find(e => e.id === id)?.label.split(' ')[0] || id).join(', ')})`
                  : 'Keins'}
              </div>
            </div>
          </div>

          {/* Addresses snapshot */}
          <div className="bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400">Abholung: </span>
                <span className="font-semibold text-slate-200">
                  {sched?.pickupAddress?.street}, {sched?.pickupAddress?.city}
                </span>
                <span className="text-slate-400 ml-1">(Etage {sched?.pickupAddress?.floor || '0'})</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 hidden md:block flex-shrink-0" />
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400">Ziel: </span>
                <span className="font-semibold text-slate-200">
                  {sched?.destinationAddress?.street}, {sched?.destinationAddress?.city}
                </span>
                <span className="text-slate-400 ml-1">(Etage {sched?.destinationAddress?.floor || '0'})</span>
              </div>
            </div>
          </div>

          {/* Conflicts Warning section */}
          {review.conflicts && review.conflicts.length > 0 && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Erkannte Konflikte ({review.conflicts.length})
              </div>
              <ul className="space-y-1.5 text-xs text-rose-200 pl-6 list-disc">
                {review.conflicts.map(conf => (
                  <li key={conf.id}>
                    <span className="font-semibold">{conf.title}: </span>
                    <span>{conf.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Footer */}
          {!isScheduled && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  Termin bearbeiten
                </button>
                {onReject && (
                  <button
                    type="button"
                    onClick={() => onReject('Benutzer hat die Planung abgelehnt')}
                    disabled={isSubmitting}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-rose-400" />
                    Ablehnen
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting || review.readiness === 'conflict' || review.readiness.startsWith('missing_')}
                className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                  review.readiness === 'ready'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-75'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Kalendereintrag erstellen
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Edit Mode Form */
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Datum
              </label>
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Startzeit (Uhr)
              </label>
              <input
                type="time"
                value={editStartTime}
                onChange={e => setEditStartTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Dauer (Minuten)
              </label>
              <input
                type="number"
                min="30"
                step="15"
                value={editDuration}
                onChange={e => setEditDuration(parseInt(e.target.value, 10) || 120)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Puffer (Minuten)
              </label>
              <input
                type="number"
                min="0"
                step="15"
                value={editBuffer}
                onChange={e => setEditBuffer(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Fahrzeug auswählen
              </label>
              <select
                value={editVehicle}
                onChange={e => setEditVehicle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {AVAILABLE_VEHICLES.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Personal auswählen
              </label>
              <div className="space-y-1.5 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50 max-h-36 overflow-y-auto">
                {AVAILABLE_EMPLOYEES.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editEmployees.includes(emp.id)}
                      onChange={() => toggleEmployee(emp.id)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0"
                    />
                    <span>{emp.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Anmerkungen / Besonderheiten
            </label>
            <input
              type="text"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="z. B. Be- und Entladevorschriften beachten"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-medium border border-slate-700"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Änderungen übernehmen
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
