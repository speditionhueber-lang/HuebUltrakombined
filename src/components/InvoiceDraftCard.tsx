import React, { useState } from 'react';
import type {
  InvoiceDraft,
  InvoiceDraftItem,
  InvoiceDraftReadiness,
  Customer
} from '../lib/types';
import {
  ReceiptEuro,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Save,
  Download,
  Check,
  X,
  Building2,
  Calendar,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface InvoiceDraftCardProps {
  draft: InvoiceDraft;
  customer?: Customer | null;
  caseTitle?: string;
  readiness: InvoiceDraftReadiness;
  validationErrors?: string[];
  isGeneratingPdf?: boolean;
  onSave?: (updatedDraft: InvoiceDraft) => void;
  onUpdateItem?: (itemId: string, updates: Partial<InvoiceDraftItem>) => void;
  onAddItem?: (item: Omit<InvoiceDraftItem, 'id'>) => void;
  onRemoveItem?: (itemId: string) => void;
  onApprove?: () => void;
  onGeneratePdf?: () => void;
  onReject?: (reason: string) => void;
}

export const InvoiceDraftCard: React.FC<InvoiceDraftCardProps> = ({
  draft,
  customer,
  caseTitle,
  readiness,
  validationErrors = [],
  isGeneratingPdf = false,
  onSave,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onApprove,
  onGeneratePdf,
  onReject
}) => {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [billingAddress, setBillingAddress] = useState(draft.billingAddress);
  const [discountValue, setDiscountValue] = useState(draft.discountValue || 0);
  const [surchargeValue, setSurchargeValue] = useState(draft.surchargeValue || 0);
  const [paymentTerms, setPaymentTerms] = useState(draft.paymentTerms || '');
  const [notes, setNotes] = useState(draft.notes || '');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // New Item State
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState('Psch');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [newItemCategory, setNewItemCategory] = useState('Manuelle Leistung');

  const isLocked = draft.status === 'pdf_created' || draft.status === 'paid' || draft.status === 'storno';

  const handleSaveAddress = () => {
    setIsEditingAddress(false);
    if (onSave) {
      onSave({
        ...draft,
        billingAddress,
        discountValue,
        surchargeValue,
        paymentTerms,
        notes
      });
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim()) return;
    if (onAddItem) {
      onAddItem({
        description: newItemDesc,
        quantity: newItemQty,
        unit: newItemUnit,
        unitPrice: newItemPrice,
        total: Math.round(newItemQty * newItemPrice * 100) / 100,
        category: newItemCategory,
        source: 'manual',
        selected: true,
        editable: true,
        billable: true,
        customerApproved: true
      });
    }
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemPrice(0);
    setShowAddItemModal(false);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'offer':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">Angebot</span>;
      case 'execution':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200">Einsatzbericht</span>;
      case 'additional_service':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200">Zusatzleistung</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">Manuell</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pdf_created':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Gebucht & Erzeugt</span>;
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Freigegeben</span>;
      case 'edited':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> In Bearbeitung</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Abgelehnt</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Entwurf</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-800 my-4">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/30">
            <ReceiptEuro className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-white">Rechnungsentwurf</h3>
              {draft.invoiceNumber && (
                <span className="text-xs bg-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                  {draft.invoiceNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {caseTitle ? `Fall: ${caseTitle}` : `Abrechnung für Einsatzabschluss`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {getStatusBadge(draft.status)}
        </div>
      </div>

      {/* Dates & Billing Address Row */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dates */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-medium text-slate-700">Rechnungsdatum:</span>
            <span className="font-mono text-slate-900">{draft.invoiceDate}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium text-slate-700">Leistungsdatum:</span>
            <span className="font-mono text-slate-900">{draft.serviceDate}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-rose-600" />
            <span className="font-medium text-slate-700">Zahlungsziel:</span>
            <span className="font-mono text-slate-900 font-bold">{draft.dueDate}</span>
          </div>
        </div>

        {/* Billing Address */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs relative">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-500" /> Rechnungsadresse
            </span>
            {!isLocked && (
              <button
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> {isEditingAddress ? 'Abbrechen' : 'Bearbeiten'}
              </button>
            )}
          </div>

          {isEditingAddress ? (
            <div className="space-y-1.5 pt-1">
              <input
                type="text"
                placeholder="Name / Firma"
                value={billingAddress.name || ''}
                onChange={e => setBillingAddress({ ...billingAddress, name: e.target.value })}
                className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Straße & Hausnummer"
                value={billingAddress.street || ''}
                onChange={e => setBillingAddress({ ...billingAddress, street: e.target.value })}
                className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
              />
              <div className="grid grid-cols-3 gap-1">
                <input
                  type="text"
                  placeholder="PLZ"
                  value={billingAddress.zip || ''}
                  onChange={e => setBillingAddress({ ...billingAddress, zip: e.target.value })}
                  className="text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Ort"
                  value={billingAddress.city || ''}
                  onChange={e => setBillingAddress({ ...billingAddress, city: e.target.value })}
                  className="col-span-2 text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleSaveAddress}
                className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded text-xs font-medium transition-colors"
              >
                Adresse Übernehmen
              </button>
            </div>
          ) : (
            <div className="text-slate-800 space-y-0.5 font-medium">
              <div>{billingAddress.name || customer?.name || 'Kunde nicht angegeben'}</div>
              <div>{billingAddress.street || 'Keine Straße angegeben'}</div>
              <div>
                {billingAddress.zip} {billingAddress.city} {billingAddress.country && `(${billingAddress.country})`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warnings & Readiness Box */}
      {(readiness.warnings.length > 0 || readiness.blockers.length > 0 || validationErrors.length > 0 || draft.errorMessage) && (
        <div className="p-3 bg-amber-50/80 border-b border-amber-200 text-xs text-amber-900 space-y-1">
          {draft.errorMessage && (
            <div className="flex items-start gap-1.5 text-rose-700 font-semibold mb-1">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{draft.errorMessage}</span>
            </div>
          )}
          {readiness.blockers.map((blocker, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-rose-700 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Blocker: {blocker}</span>
            </div>
          ))}
          {readiness.warnings.map((warn, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>{warn}</span>
            </div>
          ))}
          {validationErrors.map((err, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-rose-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Items Table */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-600" /> Abrechnungspositionen
          </h4>

          {!isLocked && (
            <button
              onClick={() => setShowAddItemModal(true)}
              className="flex items-center space-x-1 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1 rounded-md font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Position Hinzufügen</span>
            </button>
          )}
        </div>

        {/* Modal / Form for adding item */}
        {showAddItemModal && (
          <form onSubmit={handleAddNewItem} className="mb-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs space-y-2">
            <div className="font-semibold text-indigo-900">Manuelle Position hinzufügen</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Beschreibung"
                value={newItemDesc}
                onChange={e => setNewItemDesc(e.target.value)}
                required
                className="md:col-span-2 p-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="Menge"
                  value={newItemQty}
                  onChange={e => setNewItemQty(parseFloat(e.target.value) || 1)}
                  className="w-1/2 p-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Einheit"
                  value={newItemUnit}
                  onChange={e => setNewItemUnit(e.target.value)}
                  className="w-1/2 p-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="Einzelpreis (€)"
                value={newItemPrice}
                onChange={e => setNewItemPrice(parseFloat(e.target.value) || 0)}
                className="p-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="px-2.5 py-1 text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-white bg-indigo-600 rounded hover:bg-indigo-700 font-medium"
              >
                Hinzufügen
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2 px-2 w-8 text-center">Abrev.</th>
                <th className="py-2 px-2">Quelle</th>
                <th className="py-2 px-2">Bezeichnung</th>
                <th className="py-2 px-2 text-right">Menge</th>
                <th className="py-2 px-2 text-right">Einheit</th>
                <th className="py-2 px-2 text-right">Einzelpreis</th>
                <th className="py-2 px-2 text-right">Gesamt (€)</th>
                {!isLocked && <th className="py-2 px-2 w-8 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {draft.items.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${!item.selected ? 'opacity-50 bg-slate-50' : ''}`}>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      disabled={isLocked}
                      onChange={e => onUpdateItem && onUpdateItem(item.id, { selected: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-2">
                    {getSourceBadge(item.source)}
                  </td>
                  <td className="py-2 px-2 font-medium text-slate-800">
                    {!isLocked && item.editable ? (
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => onUpdateItem && onUpdateItem(item.id, { description: e.target.value })}
                        className="w-full p-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      <span>{item.description}</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-mono">
                    {!isLocked && item.editable ? (
                      <input
                        type="number"
                        step="0.1"
                        value={item.quantity}
                        onChange={e => onUpdateItem && onUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                        className="w-16 p-1 border border-slate-200 rounded text-xs text-right focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      <span>{item.quantity}</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-500 font-mono">{item.unit}</td>
                  <td className="py-2 px-2 text-right font-mono">
                    {!isLocked && item.editable ? (
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={e => onUpdateItem && onUpdateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-20 p-1 border border-slate-200 rounded text-xs text-right focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      <span>{item.unitPrice.toFixed(2)} €</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900 font-mono">
                    {(item.selected ? item.total : 0).toFixed(2)} €
                  </td>
                  {!isLocked && (
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => onRemoveItem && onRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Position löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Summary */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Payment Terms & Notes */}
        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Zahlungsbedingungen</label>
            {!isLocked ? (
              <input
                type="text"
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                placeholder="Zahlungsziel eintragen"
                className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
              />
            ) : (
              <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-700">{paymentTerms || 'Keine Angabe'}</div>
            )}
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Hinweise / Anmerkungen</label>
            {!isLocked ? (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
              />
            ) : (
              <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-700">{notes || 'Keine Anmerkungen'}</div>
            )}
          </div>
        </div>

        {/* Totals Box */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs font-medium">
          <div className="flex justify-between text-slate-600">
            <span>Zwischensumme (Netto):</span>
            <span className="font-mono text-slate-900">{draft.subtotalNet.toFixed(2)} €</span>
          </div>

          {draft.discountValue > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Rabatt:</span>
              <span className="font-mono">- {draft.discountValue.toFixed(2)} €</span>
            </div>
          )}

          {draft.surchargeValue > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>Zuschlag:</span>
              <span className="font-mono">+ {draft.surchargeValue.toFixed(2)} €</span>
            </div>
          )}

          <div className="flex justify-between text-slate-700 border-t border-slate-100 pt-1">
            <span>Nettobetrag:</span>
            <span className="font-mono text-slate-900 font-semibold">{draft.netTotal.toFixed(2)} €</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Umsatzsteuer ({Math.round(draft.vatRate * 100)} %):</span>
            <span className="font-mono text-slate-900">{draft.vatAmount.toFixed(2)} €</span>
          </div>

          <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5 text-sm">
            <span>Gesamtrechnungsbetrag:</span>
            <span className="font-mono text-indigo-700">{draft.grossTotal.toFixed(2)} €</span>
          </div>

          {draft.depositPaid > 0 && (
            <div className="flex justify-between text-emerald-700 pt-1 border-t border-slate-100">
              <span>Bestätigte Anzahlung / Zahlungen:</span>
              <span className="font-mono font-semibold">- {draft.depositPaid.toFixed(2)} €</span>
            </div>
          )}

          <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t-2 border-slate-800 bg-indigo-50/50 p-2 rounded">
            <span className="uppercase tracking-wider text-indigo-900">Offener Restbetrag:</span>
            <span className="font-mono text-indigo-900 text-base">{draft.outstandingAmount.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {!isLocked && showRejectInput ? (
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                placeholder="Grund für Ablehnung"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="p-1.5 border border-slate-300 rounded text-xs bg-white"
              />
              <button
                onClick={() => {
                  if (onReject) onReject(rejectReason);
                  setShowRejectInput(false);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded text-xs font-medium"
              >
                Bestätigen
              </button>
              <button
                onClick={() => setShowRejectInput(false)}
                className="bg-white border border-slate-300 text-slate-600 px-2 py-1.5 rounded text-xs"
              >
                Abbrechen
              </button>
            </div>
          ) : !isLocked ? (
            <button
              onClick={() => setShowRejectInput(true)}
              className="px-3 py-1.5 border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 rounded text-xs font-medium transition-colors"
            >
              Entwurf ablehnen
            </button>
          ) : null}
        </div>

        <div className="flex items-center space-x-2">
          {!isLocked && (
            <button
              onClick={handleSaveAddress}
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Entwurf Speichern</span>
            </button>
          )}

          {!isLocked && draft.status !== 'approved' && (
            <button
              onClick={onApprove}
              disabled={!readiness.ready}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                readiness.ready
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Entwurf Freigeben</span>
            </button>
          )}

          {(draft.status === 'approved' || draft.status === 'draft' || draft.status === 'edited') && !isLocked && (
            <button
              onClick={onGeneratePdf}
              disabled={isGeneratingPdf}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              {isGeneratingPdf ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Rechnungs-PDF erzeugen & buchen</span>
            </button>
          )}

          {draft.status === 'pdf_created' && (
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
              <CheckCircle2 className="w-4 h-4" />
              <span>Rechnung erfolgreich gebucht ({draft.invoiceNumber})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
