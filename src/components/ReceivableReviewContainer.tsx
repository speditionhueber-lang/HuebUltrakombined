import React, { useState, useEffect } from 'react';
import { Case, Receivable, EmailResponseDraft } from '../lib/types';
import { caseService } from '../lib/case-service';
import { receivableService } from '../lib/receivable-service';
import { ReceivableReviewCard } from './ReceivableReviewCard';

export interface ReceivableReviewContainerProps {
  caseId: string;
  onInvoiceViewRequested?: (documentId?: string) => void;
}

export const ReceivableReviewContainer: React.FC<ReceivableReviewContainerProps> = ({
  caseId,
  onInvoiceViewRequested
}) => {
  const [caseItem, setCaseItem] = useState<Case | null>(() => caseService.getCase(caseId) || null);
  const [isSendingMap, setIsSendingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  const refreshCase = () => {
    const updated = caseService.getCase(caseId);
    setCaseItem(updated ? { ...updated } : null);
  };

  useEffect(() => {
    refreshCase();
    const handleStorage = () => refreshCase();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [caseId]);

  if (!caseItem || !caseItem.receivables || caseItem.receivables.length === 0) {
    return null;
  }

  const handleRecordPayment = (
    receivableId: string,
    payment: {
      amount: number;
      date: string;
      method?: any;
      source?: any;
      reference?: string;
      notes?: string;
    }
  ) => {
    setErrorMap(prev => ({ ...prev, [receivableId]: null }));
    const result = receivableService.recordPayment(caseId, receivableId, payment);
    if (!result.success) {
      setErrorMap(prev => ({ ...prev, [receivableId]: result.error || 'Fehler beim Verbuchen der Zahlung.' }));
    } else {
      refreshCase();
    }
  };

  const handleDeletePayment = (receivableId: string, paymentId: string) => {
    setErrorMap(prev => ({ ...prev, [receivableId]: null }));
    const result = receivableService.deletePayment(caseId, receivableId, paymentId);
    if (!result.success) {
      setErrorMap(prev => ({ ...prev, [receivableId]: result.error || 'Fehler beim Löschen der Zahlung.' }));
    } else {
      refreshCase();
    }
  };

  const handleMarkDisputed = (receivableId: string, reason: string) => {
    setErrorMap(prev => ({ ...prev, [receivableId]: null }));
    const result = receivableService.markReceivableDisputed(caseId, receivableId, reason);
    if (!result.success) {
      setErrorMap(prev => ({ ...prev, [receivableId]: result.error || 'Fehler beim Markieren als strittig.' }));
    } else {
      refreshCase();
    }
  };

  const handlePrepareReminder = (receivableId: string) => {
    setErrorMap(prev => ({ ...prev, [receivableId]: null }));
    const result = receivableService.preparePaymentReminder(caseId, receivableId);
    if (!result.success) {
      setErrorMap(prev => ({ ...prev, [receivableId]: result.error || 'Fehler beim Vorbereiten der Mahnung.' }));
    } else {
      refreshCase();
    }
  };

  const handleSendReminder = async (receivableId: string, emailDraftId: string) => {
    setIsSendingMap(prev => ({ ...prev, [receivableId]: true }));
    setErrorMap(prev => ({ ...prev, [receivableId]: null }));

    try {
      const result = await receivableService.sendPaymentReminder(caseId, receivableId, emailDraftId);
      if (!result.success) {
        setErrorMap(prev => ({ ...prev, [receivableId]: result.error || 'Fehler beim E-Mail-Versand.' }));
      }
    } catch (err: any) {
      setErrorMap(prev => ({ ...prev, [receivableId]: err?.message || 'Unerwarteter Fehler beim E-Mail-Versand.' }));
    } finally {
      setIsSendingMap(prev => ({ ...prev, [receivableId]: false }));
      refreshCase();
    }
  };

  return (
    <div className="space-y-4 my-3">
      {caseItem.receivables.map(receivable => {
        // Find matching email draft if exists
        const reminderDraft = (caseItem.emailDrafts || []).find(
          d => d.receivableId === receivable.id && d.purpose === 'payment_reminder'
        ) || null;

        return (
          <ReceivableReviewCard
            key={receivable.id}
            receivable={receivable}
            caseItem={caseItem}
            emailDraft={reminderDraft}
            onRecordPayment={payment => handleRecordPayment(receivable.id, payment)}
            onDeletePayment={paymentId => handleDeletePayment(receivable.id, paymentId)}
            onMarkDisputed={reason => handleMarkDisputed(receivable.id, reason)}
            onPrepareReminder={() => handlePrepareReminder(receivable.id)}
            onSendReminder={emailDraftId => handleSendReminder(receivable.id, emailDraftId)}
            onViewInvoice={
              onInvoiceViewRequested
                ? () => onInvoiceViewRequested(receivable.invoiceDraftId)
                : undefined
            }
            isSending={!!isSendingMap[receivable.id]}
            actionError={errorMap[receivable.id]}
          />
        );
      })}
    </div>
  );
};
