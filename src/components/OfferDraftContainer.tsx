import React, { useState, useEffect } from 'react';
import { caseService, Case } from '../lib/case-service';
import { offerDraftService } from '../lib/offer-draft-service';
import { evaluateOfferReadiness } from '../lib/offer-readiness';
import { OfferDraftCard } from './OfferDraftCard';
import type { Customer, OfferDraft } from '../lib/types';
import { FileText, AlertCircle, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

interface OfferDraftContainerProps {
  caseId: string;
  customer?: Customer | null;
  onRefresh?: () => void;
}

export function OfferDraftContainer({ caseId, customer, onRefresh }: OfferDraftContainerProps) {
  const [caseItem, setCaseItem] = useState<Case | undefined>(() => caseService.getCase(caseId));
  const [activeDraft, setActiveDraft] = useState<OfferDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    const syncCase = () => {
      const updatedCase = caseService.getCase(caseId);
      setCaseItem(updatedCase);
      if (updatedCase?.offerDrafts && updatedCase.offerDrafts.length > 0) {
        // Find latest active draft
        const draft = updatedCase.offerDrafts.find(d => d.status !== 'rejected') || updatedCase.offerDrafts[updatedCase.offerDrafts.length - 1];
        setActiveDraft(draft || null);
      } else {
        setActiveDraft(null);
      }
    };

    syncCase();
    return caseService.subscribe(syncCase);
  }, [caseId]);

  if (!caseItem) return null;

  const readiness = evaluateOfferReadiness(caseItem, customer);

  const handleCreateDraft = (offerType: 'orientation' | 'binding') => {
    setErrorMessage(undefined);
    const newDraft = offerDraftService.createOfferDraftForCase(caseId, { offerType });
    if (newDraft) {
      setActiveDraft(newDraft);
      if (onRefresh) {
        onRefresh();
      }
    } else {
      setErrorMessage('Der Angebotsentwurf konnte nicht erstellt werden. Bitte erforderliche Kundendaten prüfen.');
    }
  };

  const handleSaveDraft = (updates: Partial<OfferDraft>) => {
    if (!activeDraft) return;
    setIsSaving(true);
    setErrorMessage(undefined);
    const res = offerDraftService.updateOfferDraft(caseId, activeDraft.id, updates);
    setIsSaving(false);
    if (res.success && res.draft) {
      setActiveDraft(res.draft);
      if (onRefresh) onRefresh();

      // ML Learning: Record price adjustment if costs or lineItems are updated
      if (updates.items || updates.grossTotal !== undefined) {
        import('@/src/lib/learning-service').then(({ learningService }) => {
          learningService.recordLearningRecord({
            actionType: 'adjust_offer_pricing',
            contextType: 'offer_management',
            detectedDecision: 'none',
            finalDecision: 'adjusted_price',
            result: 'corrected',
            confidence: 'high',
            originalData: { 
              caseId, 
              originalTotal: activeDraft.grossTotal,
              newTotal: updates.grossTotal || res.draft?.grossTotal
            }
          });
        });
      }
    } else {
      setErrorMessage(res.error || 'Fehler beim Speichern des Entwurfs.');
    }
  };

  const handleApproveDraft = () => {
    if (!activeDraft) return;
    setIsSaving(true);
    setErrorMessage(undefined);
    const res = offerDraftService.approveOfferDraft(caseId, activeDraft.id);
    setIsSaving(false);
    if (res.success && res.draft) {
      setActiveDraft(res.draft);
      if (onRefresh) onRefresh();
    } else {
      setErrorMessage(res.error || 'Fehler bei der Freigabe des Entwurfs.');
    }
  };

  const handleGeneratePDF = async () => {
    if (!activeDraft) return;
    setIsGeneratingPDF(true);
    setErrorMessage(undefined);
    const res = await offerDraftService.generateOfferPDFForDraft(caseId, activeDraft.id);
    setIsGeneratingPDF(false);
    if (res.success && res.draft) {
      setActiveDraft(res.draft);
      if (onRefresh) onRefresh();
    } else {
      setErrorMessage(res.error || 'Fehler beim Erzeugen des Angebot-PDFs.');
    }
  };

  const handleRejectDraft = () => {
    if (!activeDraft) return;
    setErrorMessage(undefined);
    const res = offerDraftService.rejectOfferDraft(caseId, activeDraft.id, 'Vom Anwender in der Benutzeroberfläche abgelehnt.');
    if (res.success) {
      setActiveDraft(null);
      if (onRefresh) onRefresh();
    } else {
      setErrorMessage(res.error || 'Fehler beim Verwerfen des Entwurfs.');
    }
  };

  return (
    <div className="space-y-4">
      {/* If an active draft exists, render the card */}
      {activeDraft ? (
        <OfferDraftCard
          draft={activeDraft}
          customer={customer}
          onSave={handleSaveDraft}
          onApprove={handleApproveDraft}
          onGeneratePDF={handleGeneratePDF}
          onReject={handleRejectDraft}
          isSaving={isSaving}
          isGeneratingPDF={isGeneratingPDF}
          errorMessage={errorMessage}
        />
      ) : (
        /* Readiness Banner and Offer Creation Options */
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Angebotsstatus & Freigabe</h4>
                <p className="text-xs text-slate-500">
                  Aktivitätsdaten aus E-Mail, Kundenkartei und Umzugsdetails auswerten.
                </p>
              </div>
            </div>

            {/* Status indicators */}
            {readiness.readyForBindingOffer ? (
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bereits für verbindliches Angebot
              </span>
            ) : readiness.readyForOrientationOffer ? (
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Bereits für Orientierungsangebot
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Unvollständig
              </span>
            )}
          </div>

          {/* Missing fields alert if any */}
          {readiness.missingFields.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
              <div className="font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Fehlende Angaben für ein verbindliches Angebot:
              </div>
              <ul className="list-disc list-inside text-amber-700 pl-1 space-y-0.5">
                {readiness.missingFields.map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Creation action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => handleCreateDraft('orientation')}
              disabled={!readiness.readyForOrientationOffer}
              className="px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Orientierungsangebot entwerfen
            </button>

            <button
              onClick={() => handleCreateDraft('binding')}
              disabled={!readiness.readyForBindingOffer}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Verbindliches Angebot entwerfen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
