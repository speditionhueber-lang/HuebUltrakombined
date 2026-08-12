import React, { useState } from 'react';
import { Case, caseService } from '../lib/case-service';
import { learningService } from '../lib/learning-service';
import { EmailResponseDraft } from '../lib/types';
import { EmailResponseDraftCard } from './EmailResponseDraftCard';

export interface EmailResponseDraftContainerProps {
  caseItem: Case;
  onCaseUpdated?: (updatedCase: Case) => void;
}

export const EmailResponseDraftContainer: React.FC<EmailResponseDraftContainerProps> = ({
  caseItem,
  onCaseUpdated
}) => {
  const [isSending, setIsSending] = useState(false);

  if (!caseItem.emailDrafts || caseItem.emailDrafts.length === 0) {
    return null;
  }

  // Find most relevant non-rejected draft or latest draft
  const activeDraft = caseItem.emailDrafts.find(d => 
    d.status === 'draft' || d.status === 'edited' || d.status === 'sending' || d.status === 'failed'
  ) || caseItem.emailDrafts[caseItem.emailDrafts.length - 1];

  if (!activeDraft || activeDraft.status === 'rejected') {
    return null;
  }

  const handleSaveDraft = (updatedDraft: EmailResponseDraft) => {
    // Record correction if user modified original generated text
    if (activeDraft.bodyText !== updatedDraft.bodyText || activeDraft.subject !== updatedDraft.subject) {
      learningService.recordCorrection(updatedDraft.id, activeDraft.sourceEventId, {
        originalSubject: activeDraft.subject,
        newSubject: updatedDraft.subject,
        originalBody: activeDraft.bodyText,
        newBody: updatedDraft.bodyText,
        purpose: updatedDraft.purpose
      });
    }

    const res = caseService.updateEmailDraft(caseItem.id, updatedDraft);
    if (res && onCaseUpdated) {
      onCaseUpdated(res);
    }
  };

  const handleConfirmSend = async (draftToSend: EmailResponseDraft) => {
    setIsSending(true);
    try {
      const res = await caseService.confirmEmailDraftSend(caseItem.id, draftToSend.id);
      const updatedCase = caseService.getCase(caseItem.id);
      if (updatedCase && onCaseUpdated) {
        onCaseUpdated(updatedCase);
      }
      if (!res.success) {
        throw new Error(res.error || 'Versand fehlgeschlagen');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleRejectDraft = (draftToReject: EmailResponseDraft) => {
    learningService.recordRejection(draftToReject.id, draftToReject.sourceEventId, 'Benutzer hat Entwurf verworfen');
    const res = caseService.rejectEmailDraft(caseItem.id, draftToReject.id);
    if (res && onCaseUpdated) {
      onCaseUpdated(res);
    }
  };

  return (
    <div className="mt-4">
      <EmailResponseDraftCard
        draft={activeDraft}
        onSaveDraft={handleSaveDraft}
        onConfirmSend={handleConfirmSend}
        onRejectDraft={handleRejectDraft}
        isSending={isSending}
      />
    </div>
  );
};
