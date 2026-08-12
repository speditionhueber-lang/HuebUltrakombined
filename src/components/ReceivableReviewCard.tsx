import React, { useState } from 'react';
import {
  Receivable,
  Case,
  EmailResponseDraft,
  PaymentRecord,
  ReceivableStatus
} from '../lib/types';
import {
  evaluateReceivableDueState,
  evaluatePaymentReminderReadiness,
  formatViennaDateString
} from '../lib/receivable-service';
import { formatGermanPrice, formatGermanDate } from '../lib/email-draft-generator';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Euro,
  PlusCircle,
  Send,
  FileText,
  Trash2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Mail,
  Loader2
} from 'lucide-react';

export interface ReceivableReviewCardProps {
  receivable: Receivable;
  caseItem: Case;
  emailDraft?: EmailResponseDraft | null;
  onRecordPayment: (payment: {
    amount: number;
    date: string;
    method?: 'bank_transfer' | 'cash' | 'card' | 'deposit' | 'other';
    source?: 'manual' | 'bank_import' | 'deposit' | 'credit_note';
    reference?: string;
    notes?: string;
  }) => void;
  onUpdatePayment?: (paymentId: string, updates: Partial<PaymentRecord>) => void;
  onDeletePayment?: (paymentId: string) => void;
  onMarkDisputed: (reason: string) => void;
  onPrepareReminder: () => void;
  onSendReminder?: (emailDraftId: string) => void;
  onViewInvoice?: () => void;
  isSending?: boolean;
  actionError?: string | null;
}

export const ReceivableReviewCard: React.FC<ReceivableReviewCardProps> = ({
  receivable,
  caseItem,
  emailDraft,
  onRecordPayment,
  onDeletePayment,
  onMarkDisputed,
  onPrepareReminder,
  onSendReminder,
  onViewInvoice,
  isSending = false,
  actionError
}) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Payment form state
  const [payAmount, setPayAmount] = useState<string>(
    receivable.outstandingAmount > 0 ? String(receivable.outstandingAmount) : ''
  );
  const [payDate, setPayDate] = useState<string>(formatViennaDateString());
  const [payMethod, setPayMethod] = useState<'bank_transfer' | 'cash' | 'card' | 'deposit' | 'other'>('bank_transfer');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Dispute form state
  const [disputeReason, setDisputeReason] = useState('');

  const dueState = evaluateReceivableDueState(receivable);
  const reminderReadiness = evaluatePaymentReminderReadiness(caseItem, receivable, emailDraft);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);
    const num = parseFloat(payAmount.replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      setPayError('Bitte geben Sie einen gültigen Betrag größer als 0 € ein.');
      return;
    }
    if (num > receivable.outstandingAmount && !allowOverpayment) {
      setPayError(
        `Der eingegebene Betrag (${formatGermanPrice(num)}) übersteigt den offenen Betrag (${formatGermanPrice(
          receivable.outstandingAmount
        )}). Aktivieren Sie "Überzahlung zulassen" zur Bestätigung.`
      );
      return;
    }

    onRecordPayment({
      amount: num,
      date: payDate,
      method: payMethod,
      source: 'manual',
      reference: payRef,
      notes: payNotes
    });

    setShowPaymentForm(false);
    setPayAmount('');
    setPayRef('');
    setPayNotes('');
    setAllowOverpayment(false);
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    onMarkDisputed(disputeReason.trim());
    setShowDisputeForm(false);
    setDisputeReason('');
  };

  const getStatusBadge = (status: ReceivableStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50">
            <CheckCircle2 className="w-3.5 h-3.5" /> Bezahlt
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/50">
            <Clock className="w-3.5 h-3.5" /> Teilbezahlt
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/50">
            <AlertTriangle className="w-3.5 h-3.5" /> Überfällig
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300/50">
            <ShieldAlert className="w-3.5 h-3.5" /> Strittig (Mahnstopp)
          </span>
        );
      case 'cancelled':
      case 'written_off':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/50">
            Storniert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/50">
            <Clock className="w-3.5 h-3.5" /> Offen
          </span>
        );
    }
  };

  const getDueBadge = () => {
    switch (dueState) {
      case 'paid':
        return <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Vollständig beglichen</span>;
      case 'blocked':
        return <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Mahnstopp / In Klärung</span>;
      case 'not_due':
        return <span className="text-xs text-slate-600 dark:text-slate-400">Fällig am {formatGermanDate(receivable.dueDate)}</span>;
      case 'due_today':
        return <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">Heute fällig!</span>;
      case 'overdue_1_7_days':
        return <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">1-7 Tage überfällig</span>;
      case 'overdue_8_14_days':
        return <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">8-14 Tage überfällig</span>;
      case 'overdue_over_14_days':
        return <span className="text-xs text-rose-700 dark:text-rose-300 font-extrabold underline">Mehr als 14 Tage überfällig!</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
            <Euro className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Rechnung {receivable.invoiceNumber}
              </h3>
              {getStatusBadge(receivable.status)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rechnungsdatum: {formatGermanDate(receivable.invoiceDate)} • Zahlungsziel: {formatGermanDate(receivable.dueDate)} ({getDueBadge()})
            </p>
          </div>
        </div>

        {onViewInvoice && (
          <button
            onClick={onViewInvoice}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
          >
            <FileText className="w-4 h-4" /> PDF anzeigen
          </button>
        )}
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Rechnungsbetrag</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatGermanPrice(receivable.originalAmount)}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Erfasste Zahlungen</span>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {formatGermanPrice(receivable.paidAmount)}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Offener Restbetrag</span>
          <span className={`text-base font-bold ${receivable.outstandingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {formatGermanPrice(receivable.outstandingAmount)}
          </span>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {receivable.status !== 'paid' && receivable.status !== 'cancelled' && receivable.status !== 'written_off' && (
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Zahlung erfassen
          </button>
        )}

        {reminderReadiness.ready && !emailDraft && (
          <button
            onClick={onPrepareReminder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60 rounded-lg transition-colors border border-amber-300/50"
          >
            <Mail className="w-3.5 h-3.5" /> Zahlungserinnerung vorbereiten
          </button>
        )}

        {receivable.status !== 'disputed' && receivable.status !== 'paid' && receivable.status !== 'cancelled' && (
          <button
            onClick={() => setShowDisputeForm(!showDisputeForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> als strittig markieren
          </button>
        )}

        {(receivable.payments || []).length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors ml-auto"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Zahlungshistorie ({(receivable.payments || []).length})</span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Payment Entry Form */}
      {showPaymentForm && (
        <form onSubmit={handlePaymentSubmit} className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
              Zahlung manuell erfassen
            </h4>
            <button
              type="button"
              onClick={() => setShowPaymentForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Abbrechen
            </button>
          </div>

          {payError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-2 rounded border border-rose-200">
              {payError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Zahlungsbetrag (€) *
              </label>
              <input
                type="text"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Zahlungsdatum *
              </label>
              <input
                type="date"
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Zahlungsart
              </label>
              <select
                value={payMethod}
                onChange={e => setPayMethod(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="bank_transfer">Überweisung (Bank)</option>
                <option value="cash">Barzahlung</option>
                <option value="card">Kartenzahlung</option>
                <option value="deposit">Anzahlung</option>
                <option value="other">Sonstige</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Referenz / Verwendungszweck
              </label>
              <input
                type="text"
                value={payRef}
                onChange={e => setPayRef(e.target.value)}
                placeholder="z.B. Bankgutschrift #123"
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Anmerkung (optional)
            </label>
            <input
              type="text"
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              placeholder="Zusätzliche Vermerke..."
              className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id={`overpay-${receivable.id}`}
              checked={allowOverpayment}
              onChange={e => setAllowOverpayment(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 text-xs"
            />
            <label htmlFor={`overpay-${receivable.id}`} className="text-xs text-slate-600 dark:text-slate-400">
              Überzahlung ausdrücklich zulassen
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Zahlung verbuchen
            </button>
          </div>
        </form>
      )}

      {/* Dispute Form */}
      {showDisputeForm && (
        <form onSubmit={handleDisputeSubmit} className="p-4 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
              Forderung als strittig markieren (Mahnstopp)
            </h4>
            <button
              type="button"
              onClick={() => setShowDisputeForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Abbrechen
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Grund der Einwandes / Reklamation des Kunden *
            </label>
            <textarea
              rows={2}
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              placeholder="z.B. Kunde reklamiert Beschädigung oder verlangt Korrektur der Arbeitsstunden..."
              className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
            >
              Strittig markieren & Mahnstopp aktivieren
            </button>
          </div>
        </form>
      )}

      {/* Payment History Section */}
      {showHistory && (receivable.payments || []).length > 0 && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Erfasste Zahlungseingänge
          </h4>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {receivable.payments.map((p) => (
              <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatGermanPrice(p.amount)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 ml-2">
                    am {formatGermanDate(p.date)} ({p.method || 'Überweisung'})
                  </span>
                  {p.reference && (
                    <span className="block text-slate-400 text-[11px]">
                      Ref: {p.reference}
                    </span>
                  )}
                </div>
                {onDeletePayment && (
                  <button
                    onClick={() => onDeletePayment(p.id)}
                    title="Zahlung löschen"
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Reminder Preview / Controlled Sending UI */}
      {emailDraft && emailDraft.purpose === 'payment_reminder' && (
        <div className="p-4 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-900/50 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Vorbereitete Zahlungserinnerung
              </h4>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
              {emailDraft.status === 'sent'
                ? 'Versendet'
                : emailDraft.status === 'sending'
                ? 'Wird versendet...'
                : emailDraft.status === 'approved'
                ? 'Freigegeben'
                : 'Entwurf'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <p>
              <strong className="font-semibold">Empfänger:</strong>{' '}
              {emailDraft.recipients?.[0]?.email || 'kundenanfrage@example.com'}
            </p>
            <p>
              <strong className="font-semibold">Betreff:</strong> {emailDraft.subject}
            </p>
            <div className="mt-2 p-2.5 bg-white dark:bg-slate-900 rounded border border-amber-200/60 dark:border-amber-900/40 text-xs whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 leading-relaxed max-h-48 overflow-y-auto">
              {emailDraft.bodyText}
            </div>
          </div>

          {emailDraft.status !== 'sent' && onSendReminder && (
            <div className="flex items-center justify-between pt-2 border-t border-amber-200/50 dark:border-amber-900/30">
              <span className="text-[11px] text-amber-800 dark:text-amber-300">
                Prüfen Sie Empfänger & Text. Erst nach Freigabe erfolgt der Versand über Outlook.
              </span>
              <button
                onClick={() => onSendReminder(emailDraft.id)}
                disabled={isSending || emailDraft.status === 'sending'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isSending || emailDraft.status === 'sending' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Kontrolliert über Outlook senden
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
