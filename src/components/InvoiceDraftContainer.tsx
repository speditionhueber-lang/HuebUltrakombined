import React, { useState, useEffect } from 'react';
import { caseService, type Case } from '../lib/case-service';
import { invoiceDraftService } from '../lib/invoice-draft-service';
import { crmLookupService } from '../lib/crm-lookup-service';
import { InvoiceDraftCard } from './InvoiceDraftCard';
import type { InvoiceDraft, InvoiceDraftItem, Customer } from '../lib/types';
import { ReceiptEuro, Plus, AlertCircle, Sparkles } from 'lucide-react';

export interface InvoiceDraftContainerProps {
  caseId: string;
}

export const InvoiceDraftContainer: React.FC<InvoiceDraftContainerProps> = ({ caseId }) => {
  const [caseItem, setCaseItem] = useState<Case | null>(() => caseService.getCase(caseId) || null);
  const [draft, setDraft] = useState<InvoiceDraft | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const refreshData = () => {
    const c = caseService.getCase(caseId) || null;
    setCaseItem(c);
    if (c) {
      const drafts = c.invoiceDrafts || [];
      const activeDraft = drafts.find(d => d.status !== 'rejected' && d.status !== 'cancelled') || drafts[drafts.length - 1] || null;
      setDraft(activeDraft);
      const cust = crmLookupService.findCustomerForCase(c) || null;
      setCustomer(cust);
    }
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = caseService.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [caseId]);

  if (!caseItem) return null;

  // Check if operation execution review is completed
  const executionReviews = caseItem.operationExecutionReviews || [];
  const completedExec = executionReviews.find(r => r.status === 'completed');

  // If no draft exists yet, check if we can create one
  if (!draft) {
    if (!completedExec) {
      return null; // Invoice draft appears only after OPERATION_EXECUTION_COMPLETED
    }

    const handleCreateInitialDraft = () => {
      const newDraft = invoiceDraftService.createInvoiceDraftForCase(caseId, { reviewId: completedExec.id });
      if (newDraft) {
        setDraft(newDraft);
        refreshData();
      }
    };

    return (
      <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 my-4 flex items-center justify-between text-indigo-950">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-sm">
            <ReceiptEuro className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Einsatz abgeschlossen – Rechnungsentwurf bereit</h4>
            <p className="text-xs text-indigo-700 mt-0.5">
              Der Einsatz wurde erfolgreich durchgeführt. Erstellen Sie jetzt den kontrollierten Rechnungsentwurf.
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateInitialDraft}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Rechnungsentwurf Erstellen</span>
        </button>
      </div>
    );
  }

  const readiness = invoiceDraftService.evaluateInvoiceReadiness(draft, caseItem, customer || undefined);
  const validation = invoiceDraftService.validateInvoiceDraft(draft, caseItem, customer || undefined);

  const handleSaveDraft = (updatedDraft: InvoiceDraft) => {
    const saved = invoiceDraftService.updateInvoiceDraft(caseId, draft.id, updatedDraft);
    if (saved) refreshData();
  };

  const handleUpdateItem = (itemId: string, updates: Partial<InvoiceDraftItem>) => {
    const updated = invoiceDraftService.updateDraftItem(caseId, draft.id, itemId, updates);
    if (updated) refreshData();
  };

  const handleAddItem = (newItem: Omit<InvoiceDraftItem, 'id'>) => {
    const updated = invoiceDraftService.addDraftItem(caseId, draft.id, newItem);
    if (updated) refreshData();
  };

  const handleRemoveItem = (itemId: string) => {
    const updated = invoiceDraftService.removeDraftItem(caseId, draft.id, itemId);
    if (updated) refreshData();
  };

  const handleApproveDraft = () => {
    const approved = invoiceDraftService.approveInvoiceDraft(caseId, draft.id, 'Sachbearbeiter');
    if (approved) refreshData();
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await invoiceDraftService.generateInvoicePDFAndRegister(caseId, draft.id, { approvedBy: 'Sachbearbeiter' });
      if (res) {
        refreshData();
      }
    } catch (err) {
      console.error('Failed to generate invoice PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleRejectDraft = (reason: string) => {
    const rejected = invoiceDraftService.rejectInvoiceDraft(caseId, draft.id, reason);
    if (rejected) refreshData();
  };

  return (
    <InvoiceDraftCard
      draft={draft}
      customer={customer}
      caseTitle={caseItem.customerDraft?.fields?.name?.value || customer?.name}
      readiness={readiness}
      validationErrors={validation.errors}
      isGeneratingPdf={isGeneratingPdf}
      onSave={handleSaveDraft}
      onUpdateItem={handleUpdateItem}
      onAddItem={handleAddItem}
      onRemoveItem={handleRemoveItem}
      onApprove={handleApproveDraft}
      onGeneratePdf={handleGeneratePdf}
      onReject={handleRejectDraft}
    />
  );
};
