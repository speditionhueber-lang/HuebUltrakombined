import React, { useState } from 'react';
import {
  TourPlanningReview,
  TourRoute,
  TourStop,
  TourRisk,
  TourPlanningWarning,
  TourPlanningReadiness
} from '../lib/types';
import {
  MapPin,
  Truck,
  Clock,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

export interface TourPlanningReviewCardProps {
  review: TourPlanningReview;
  onConfirm: () => void;
  onEdit: (updatedData: Partial<TourPlanningReview>) => void;
  onReject?: (reason?: string) => void;
  isSubmitting?: boolean;
}

const AVAILABLE_VEHICLES = [
  { id: 'v-3_5t', label: '3,5t Transporter (18m³)' },
  { id: 'v-7_5t', label: '7,5t LKW (36m³)' },
  { id: 'v-ext-elev', label: 'Außenaufzug-Fahrzeug' }
];

export const TourPlanningReviewCard: React.FC<TourPlanningReviewCardProps> = ({
  review,
  onConfirm,
  onEdit,
  onReject,
  isSubmitting = false
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Editable local state
  const [editVehicleId, setEditVehicleId] = useState(review.vehicleId || 'v-3_5t');
  const [editBufferMinutes, setEditBufferMinutes] = useState(review.route?.bufferMinutes || 45);
  const [editStops, setEditStops] = useState<TourStop[]>(review.route?.stops || []);
  const [localRisks, setLocalRisks] = useState<TourRisk[]>(review.risks || []);

  const route = review.route;

  const handleToggleRiskAcknowledge = (riskId: string) => {
    const updated = localRisks.map(r => r.id === riskId ? { ...r, acknowledged: !r.acknowledged } : r);
    setLocalRisks(updated);
    onEdit({ risks: updated });
  };

  const handleSaveEdits = () => {
    onEdit({
      vehicleId: editVehicleId,
      route: {
        ...review.route,
        bufferMinutes: editBufferMinutes,
        stops: editStops
      },
      risks: localRisks
    });
    setIsEditing(false);
  };

  const renderReadinessBadge = (readiness: TourPlanningReadiness) => {
    switch (readiness) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Bereit zur Bestätigung
          </span>
        );
      case 'missing_depot':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Depotadresse fehlt
          </span>
        );
      case 'missing_pickup':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Abholadresse fehlt
          </span>
        );
      case 'missing_destination':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Zieladresse fehlt
          </span>
        );
      case 'conflicting_schedule':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Zeitfenster-Konflikt
          </span>
        );
      case 'invalid_address':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Ungültige Adressen
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <X className="w-3.5 h-3.5" /> Blockiert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Info className="w-3.5 h-3.5" /> Unvollständig
          </span>
        );
    }
  };

  const isConfirmed = review.status === 'confirmed' || review.status === 'completed';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Tourenvorbereitung (1 Fahrzeug)</h3>
              {renderReadinessBadge(review.readiness)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kontrollierte Routen-, Zeit- und Risikoplanung aus bestätigtem Kalendereintrag
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isConfirmed && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditing ? 'Abbrechen' : 'Tour anpassen'}
            </button>
          )}
        </div>
      </div>

      {/* Vehicle & Key Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Truck className="w-3 h-3 text-blue-400" /> Fahrzeug
          </span>
          <span className="text-xs font-medium text-slate-200 block mt-1">
            {AVAILABLE_VEHICLES.find(v => v.id === review.vehicleId)?.label || review.vehicleId}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-cyan-400" /> Gesamtstrecke
          </span>
          <span className="text-xs font-bold text-cyan-300 block mt-1">
            {route.totalDistanceKm} km
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Fahrzeit
          </span>
          <span className="text-xs font-medium text-slate-200 block mt-1">
            ca. {Math.floor(route.totalDrivingMinutes / 60)}h {route.totalDrivingMinutes % 60}m
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" /> Arbeits- & Pufferzeit
          </span>
          <span className="text-xs font-medium text-slate-200 block mt-1">
            {route.estimatedJobMinutes}m Job + {route.bufferMinutes}m Puffer
          </span>
        </div>

        <div className="col-span-2 md:col-span-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-400" /> Gesamtzeitraum
          </span>
          <span className="text-xs font-bold text-emerald-300 block mt-1">
            ca. {Math.floor(route.totalPlannedMinutes / 60)}h {route.totalPlannedMinutes % 60}m
          </span>
        </div>
      </div>

      {/* Editing Mode Controls */}
      {isEditing && (
        <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4 space-y-4">
          <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-blue-400" />
            Tour bearbeiten
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Fahrzeugzuordnung
              </label>
              <select
                value={editVehicleId}
                onChange={e => setEditVehicleId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {AVAILABLE_VEHICLES.map(v => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Zeitpuffer (Minuten)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                step="15"
                value={editBufferMinutes}
                onChange={e => setEditBufferMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-blue-900/40">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSaveEdits}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Ähnliche Tour neu berechnen
            </button>
          </div>
        </div>
      )}

      {/* Route Timeline & Stops */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-400" />
            Routen- & Stoppabfolge ({1 + route.stops.length + (route.depotReturn ? 1 : 0)} Stopps)
          </span>

          {route.navigationUrl && (
            <a
              href={route.navigationUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Navigation in Google Maps
            </a>
          )}
        </h4>

        <div className="space-y-2 border-l-2 border-slate-800 pl-4 relative ml-2">
          {/* Depot Start */}
          <div className="relative">
            <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900" />
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    1. Start Betrieb
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {route.depotStart.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {route.depotStart.address.street}, {route.depotStart.address.zip} {route.depotStart.address.city}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-400 block">Abfahrt ca.</span>
                <span className="text-xs font-bold text-blue-300">
                  {route.depotStart.plannedDepartureTime || '07:30'} Uhr
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Intermediate Stops */}
          {route.stops.map((stop, index) => (
            <div key={stop.id} className="relative">
              <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-slate-900 ${
                stop.type === 'pickup' ? 'bg-amber-500' :
                stop.type === 'destination' ? 'bg-emerald-500' : 'bg-purple-500'
              }`} />

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      stop.type === 'pickup' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      stop.type === 'destination' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      {2 + index}. {stop.type === 'pickup' ? 'Abholung' : stop.type === 'destination' ? 'Entladung' : 'Zwischenstopp'}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {stop.address.street}, {stop.address.city}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    {stop.address.floor && stop.address.floor !== '0' ? `${stop.address.floor}. Stock` : 'EG'}
                    {stop.address.elevator ? ' (Aufzug vorhanden)' : ''}
                    {stop.notes ? ` • ${stop.notes}` : ''}
                  </p>
                </div>

                <div className="text-right shrink-0 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">Dauer {stop.estimatedServiceMinutes} Min</span>
                  {stop.plannedArrivalTime && (
                    <span className="text-xs font-semibold text-slate-300 block">
                      Ankunft: {stop.plannedArrivalTime} Uhr
                    </span>
                  )}
                  {stop.plannedDepartureTime && (
                    <span className="text-[11px] text-slate-400 block">
                      Weiterfahrt: {stop.plannedDepartureTime} Uhr
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Depot Return */}
          {route.depotReturn && (
            <div className="relative">
              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-500 ring-4 ring-slate-900" />
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      {2 + route.stops.length}. Rückkehr Betrieb
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {route.depotReturn.label}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block">Ankunft ca.</span>
                  <span className="text-xs font-bold text-slate-200">
                    {route.depotReturn.plannedArrivalTime || '17:30'} Uhr
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warnings & Risks Section */}
      {(review.warnings.length > 0 || review.risks.length > 0) && (
        <div className="space-y-3 pt-3 border-t border-slate-800">
          {/* Warnings */}
          {review.warnings.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Hinweise & Einwände ({review.warnings.length})
              </h5>
              <div className="space-y-1.5">
                {review.warnings.map(w => (
                  <div key={w.id} className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks Analysis */}
          {review.risks.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Risikoanalyse ({review.risks.length})
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {review.risks.map(risk => (
                  <div
                    key={risk.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 transition ${
                      risk.acknowledged
                        ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                        : risk.severity === 'high'
                        ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                        : 'bg-amber-950/20 border-amber-500/20 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <AlertCircle className={`w-3.5 h-3.5 ${
                          risk.severity === 'high' ? 'text-rose-400' : 'text-amber-400'
                        }`} />
                        {risk.title}
                      </span>

                      {!isConfirmed && (
                        <button
                          type="button"
                          onClick={() => handleToggleRiskAcknowledge(risk.id)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition ${
                            risk.acknowledged
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {risk.acknowledged ? '✓ Zur Kenntnis genommen' : 'Bestätigen'}
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] opacity-90">{risk.description}</p>
                    <p className="text-[10px] text-slate-400">Grund: {risk.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      {!isConfirmed && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Stopps: <strong className="text-slate-200">{route.stops.length + 1}</strong> • Distanz: <strong className="text-slate-200">{route.totalDistanceKm} km</strong>
          </div>

          <div className="flex items-center gap-2">
            {onReject && (
              <button
                type="button"
                onClick={() => onReject()}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Ablehnen
              </button>
            )}

            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting || review.readiness === 'missing_depot' || review.readiness === 'missing_pickup' || review.readiness === 'missing_destination' || review.readiness === 'blocked'}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Tour verbindlich bestätigen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
