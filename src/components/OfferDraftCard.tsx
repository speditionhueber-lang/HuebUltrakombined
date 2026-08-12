import React, { useState } from 'react';
import type { OfferDraft, OfferDraftItem, Customer } from '../lib/types';
import { validateOfferDraft } from '../lib/offer-draft-validator';
import { 
  FileText, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  History, 
  Euro, 
  Lock,
  Sparkles,
  Loader2
} from 'lucide-react';

interface OfferDraftCardProps {
  draft: OfferDraft;
  customer?: Customer | null;
  onSave: (updates: Partial<OfferDraft>) => void;
  onApprove: () => void;
  onGeneratePDF: () => void;
  onReject: () => void;
  isSaving?: boolean;
  isGeneratingPDF?: boolean;
  errorMessage?: string;
}

export function OfferDraftCard({
  draft,
  customer,
  onSave,
  onApprove,
  onGeneratePDF,
  onReject,
  isSaving = false,
  isGeneratingPDF = false,
  errorMessage
}: OfferDraftCardProps) {
  const [items, setItems] = useState<OfferDraftItem[]>(draft.items || []);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(draft.discountType || 'percent');
  const [discountValue, setDiscountValue] = useState<number>(draft.discountValue || 0);
  const [surchargeType, setSurchargeType] = useState<'percent' | 'fixed'>(draft.surchargeType || 'percent');
  const [surchargeValue, setSurchargeValue] = useState<number>(draft.surchargeValue || 0);
  const [vatRate, setVatRate] = useState<number>(draft.vatRate ?? 20);
  const [depositPercent, setDepositPercent] = useState<number>(draft.depositPercent ?? (draft.offerType === 'binding' ? 30 : 0));
  const [notes, setNotes] = useState<string>(draft.notes || '');
  const [paymentTerms, setPaymentTerms] = useState<string>(draft.paymentTerms || '14 Tage ohne Abzug');
  const [showHistory, setShowHistory] = useState(false);

  const isLocked = draft.status === 'pdf_created' || draft.status === 'ready_to_send' || draft.status === 'sent';

  // Live calculation for UI
  const activeItems = items.filter(i => i.selected !== false);
  const subtotalNet = activeItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);

  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = Math.round(subtotalNet * (discountValue / 100) * 100) / 100;
  } else {
    discountAmount = Math.min(subtotalNet, Math.max(0, discountValue));
  }

  let surchargeAmount = 0;
  if (surchargeType === 'percent') {
    surchargeAmount = Math.round(subtotalNet * (surchargeValue / 100) * 100) / 100;
  } else {
    surchargeAmount = Math.max(0, surchargeValue);
  }

  const netTotal = Math.max(0, Math.round((subtotalNet - discountAmount + surchargeAmount) * 100) / 100);
  const vatAmount = Math.round(netTotal * (vatRate / 100) * 100) / 100;
  const grossTotal = Math.round((netTotal + vatAmount) * 100) / 100;
  const depositAmount = depositPercent > 0 ? Math.round(grossTotal * (depositPercent / 100) * 100) / 100 : 0;
  const remainingAmount = Math.max(0, Math.round((grossTotal - depositAmount) * 100) / 100);

  // Validate live state
  const tempDraft: OfferDraft = {
    ...draft,
    items,
    subtotalNet,
    discountType,
    discountValue,
    surchargeType,
    surchargeValue,
    netTotal,
    vatRate,
    vatAmount,
    grossTotal,
    depositPercent,
    depositAmount,
    remainingAmount,
    notes,
    paymentTerms
  };

  const validation = validateOfferDraft(tempDraft);

  const handleItemChange = (index: number, field: keyof OfferDraftItem, value: any) => {
    if (isLocked) return;
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : Number(item.quantity);
      const p = field === 'unitPrice' ? Number(value) : Number(item.unitPrice);
      item.total = Math.round(q * p * 100) / 100;
    }
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    if (isLocked) return;
    setItems(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        description: 'Neue Leistung',
        quantity: 1,
        unit: 'Stk',
        unitPrice: 50,
        total: 50,
        selected: true,
        source: 'Manual',
        editable: true
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (isLocked) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    onSave({
      items,
      discountType,
      discountValue,
      surchargeType,
      surchargeValue,
      vatRate,
      depositPercent,
      notes,
      paymentTerms
    });
  };

  const getStatusBadge = () => {
    switch (draft.status) {
      case 'draft': return <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">Entwurf</span>;
      case 'edited': return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">Bearbeitet</span>;
      case 'approved': return <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-medium">Freigegeben</span>;
      case 'pdf_created': return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> PDF Erzeugt</span>;
      case 'ready_to_send': return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">Bereit zum Versand</span>;
      case 'sent': return <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">Versendet</span>;
      case 'rejected': return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-medium">Abgelehnt</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-800">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30 text-indigo-300">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              {draft.offerType === 'binding' ? 'Verbindliches Angebot (Entwurf)' : 'Orientierungsangebot (Entwurf)'}
              {getStatusBadge()}
            </h3>
            <div className="text-xs text-slate-400 mt-0.5">
              Ref: {draft.documentNumber || draft.id} • Kunde: {customer?.name || 'Vorgangskunde'}
            </div>
          </div>
        </div>
        {draft.corrections && draft.corrections.length > 0 && (
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <History className="w-3.5 h-3.5" />
            Änderungen ({draft.corrections.length})
          </button>
        )}
      </div>

      {/* History panel */}
      {showHistory && draft.corrections && draft.corrections.length > 0 && (
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-2">
          <div className="font-semibold text-slate-700">Protokollierte Änderungen:</div>
          <div className="space-y-1">
            {draft.corrections.map((c, i) => (
              <div key={i} className="text-slate-600 flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                <span>Feld <strong>{c.field}</strong> von {c.user} geändert.</span>
                <span className="text-[10px] text-slate-400">{new Date(c.timestamp).toLocaleTimeString('de-DE')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-5 space-y-6">
        {/* Items Table */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              Positionen & Leistungen
              {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
            </h4>
            {!isLocked && (
              <button
                onClick={handleAddItem}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Position hinzufügen
              </button>
            )}
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-center w-10">Aktiv</th>
                  <th className="p-2.5">Beschreibung</th>
                  <th className="p-2.5 text-right w-20">Menge</th>
                  <th className="p-2.5 text-right w-28">Einzelpreis (€)</th>
                  <th className="p-2.5 text-right w-28">Gesamt (€)</th>
                  {!isLocked && <th className="p-2.5 text-center w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className={item.selected === false ? 'opacity-40 bg-slate-50' : 'hover:bg-slate-50'}>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={item.selected !== false}
                        disabled={isLocked}
                        onChange={e => handleItemChange(idx, 'selected', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.description}
                        disabled={isLocked}
                        onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded px-2 py-1 transition-colors"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        disabled={isLocked}
                        onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded px-2 py-1 transition-colors"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        disabled={isLocked}
                        onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded px-2 py-1 transition-colors"
                      />
                    </td>
                    <td className="p-2 text-right font-semibold text-slate-900">
                      {(item.selected !== false ? item.quantity * item.unitPrice : 0).toFixed(2)} €
                    </td>
                    {!isLocked && (
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
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

        {/* Adjustments & Totals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Controls Section */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">Konditionen & Zu- / Abschläge</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Rabatt Typ</label>
                <select
                  value={discountType}
                  disabled={isLocked}
                  onChange={e => setDiscountType(e.target.value as any)}
                  className="w-full text-xs border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="percent">Prozentual (%)</option>
                  <option value="fixed">Festbetrag (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Rabatt Wert</label>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  disabled={isLocked}
                  onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Zuschlag Typ</label>
                <select
                  value={surchargeType}
                  disabled={isLocked}
                  onChange={e => setSurchargeType(e.target.value as any)}
                  className="w-full text-xs border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="percent">Prozentual (%)</option>
                  <option value="fixed">Festbetrag (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Zuschlag Wert</label>
                <input
                  type="number"
                  min="0"
                  value={surchargeValue}
                  disabled={isLocked}
                  onChange={e => setSurchargeValue(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">MwSt. Satz (%)</label>
                <input
                  type="number"
                  value={vatRate}
                  disabled={isLocked}
                  onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Anzahlung (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={depositPercent}
                  disabled={isLocked}
                  onChange={e => setDepositPercent(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg flex flex-col justify-between space-y-2 text-xs">
            <h4 className="font-semibold text-xs text-indigo-300 uppercase tracking-wider mb-1">Berechnungszusammenfassung</h4>
            
            <div className="space-y-1.5 border-b border-slate-800 pb-2">
              <div className="flex justify-between text-slate-300">
                <span>Zwischensumme netto:</span>
                <span>{subtotalNet.toFixed(2)} €</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Rabatt:</span>
                  <span>- {discountAmount.toFixed(2)} €</span>
                </div>
              )}
              {surchargeAmount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Zuschlag:</span>
                  <span>+ {surchargeAmount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-white pt-1">
                <span>Netto gesamt:</span>
                <span>{netTotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>MwSt. ({vatRate}%):</span>
                <span>{vatAmount.toFixed(2)} €</span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-base font-bold text-white">
                <span>Brutto gesamt:</span>
                <span className="text-emerald-400">{grossTotal.toFixed(2)} €</span>
              </div>
              {depositPercent > 0 && (
                <>
                  <div className="flex justify-between text-xs text-indigo-300 pt-1">
                    <span>Anzahlung ({depositPercent}%):</span>
                    <span>{depositAmount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Restbetrag:</span>
                    <span>{remainingAmount.toFixed(2)} €</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes & Payment Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Zahlungsbedingungen</label>
            <input
              type="text"
              value={paymentTerms}
              disabled={isLocked}
              onChange={e => setPaymentTerms(e.target.value)}
              className="w-full text-xs border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Anmerkungen zum Angebot</label>
            <input
              type="text"
              value={notes}
              disabled={isLocked}
              onChange={e => setNotes(e.target.value)}
              placeholder="Z. B. Gültig für 14 Tage..."
              className="w-full text-xs border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Validation Errors Panel */}
        {!validation.valid && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Validierungsfehler:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-600">
              {validation.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="flex gap-2">
            {!isLocked && (
              <button
                onClick={onReject}
                className="px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
              >
                Entwurf verworfen
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {!isLocked && (
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit2 className="w-3.5 h-3.5" />}
                Änderungen speichern
              </button>
            )}

            {(draft.status === 'draft' || draft.status === 'edited') && (
              <button
                onClick={onApprove}
                disabled={!validation.valid || isSaving}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Angebot freigeben
              </button>
            )}

            {(draft.status === 'approved' || draft.status === 'pdf_created' || draft.status === 'ready_to_send') && (
              <button
                onClick={onGeneratePDF}
                disabled={isGeneratingPDF}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> PDF wird erstellt...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    {draft.status === 'pdf_created' ? 'PDF erneut erzeugen' : 'PDF erzeugen'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
