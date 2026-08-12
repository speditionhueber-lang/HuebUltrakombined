import React, { useState } from 'react';
import { caseService } from '../lib/case-service';
import { operationPreparationService } from '../lib/operation-preparation-service';
import { OperationPreparationReviewCard } from './OperationPreparationReviewCard';

export interface OperationPreparationReviewContainerProps {
  caseId: string;
}

export const OperationPreparationReviewContainer: React.FC<OperationPreparationReviewContainerProps> = ({ caseId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setRefreshKey] = useState(0);

  const caseItem = caseService.getCase(caseId);
  const reviews = caseItem?.operationPreparationReviews || [];

  if (reviews.length === 0) return null;

  const handleConfirm = async (reviewId: string) => {
    setIsSubmitting(true);
    try {
      operationPreparationService.confirmOperationPreparationReview(caseId, reviewId);
      setRefreshKey(k => k + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (
    reviewId: string,
    updates: { operationData?: any; checklist?: any }
  ) => {
    operationPreparationService.updateOperationPreparationReview(caseId, reviewId, updates);
    setRefreshKey(k => k + 1);
  };

  const handleRequestMissingInfo = (reviewId: string) => {
    operationPreparationService.requestMissingCustomerInfo(caseId, reviewId);
    setRefreshKey(k => k + 1);
  };

  const handleCompleteReminder = (reminderId: string) => {
    operationPreparationService.completeReminder(caseId, reminderId);
    setRefreshKey(k => k + 1);
  };

  const handleReject = (reviewId: string, reason?: string) => {
    operationPreparationService.rejectOperationPreparationReview(caseId, reviewId, reason);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-4 my-4">
      {reviews.map(review => (
        <OperationPreparationReviewCard
          key={review.id}
          review={review}
          onConfirm={() => handleConfirm(review.id)}
          onEdit={(updates) => handleEdit(review.id, updates)}
          onRequestMissingInfo={() => handleRequestMissingInfo(review.id)}
          onCompleteReminder={handleCompleteReminder}
          onReject={(reason) => handleReject(review.id, reason)}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
};
