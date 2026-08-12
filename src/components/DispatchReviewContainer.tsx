import React, { useState } from 'react';
import { Case } from '../lib/case-service';
import { dispatchService } from '../lib/dispatch-service';
import { DispatchReviewCard } from './DispatchReviewCard';
import { DispatchReview } from '../lib/types';

export interface DispatchReviewContainerProps {
  caseItem: Case;
  onUpdate?: () => void;
}

export const DispatchReviewContainer: React.FC<DispatchReviewContainerProps> = ({
  caseItem,
  onUpdate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviews = caseItem.dispatchReviews || [];
  if (reviews.length === 0) return null;

  const handleConfirm = (reviewId: string) => {
    setIsSubmitting(true);
    try {
      dispatchService.confirmDispatchReview(caseItem.id, reviewId);
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (reviewId: string, updatedData: Partial<DispatchReview>) => {
    setIsSubmitting(true);
    try {
      dispatchService.updateDispatchReview(caseItem.id, reviewId, updatedData);
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResources = (reviewId: string) => {
    setIsSubmitting(true);
    try {
      dispatchService.updateDispatchReview(caseItem.id, reviewId, {
        readiness: 'missing_resources'
      });
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <DispatchReviewCard
          key={review.id}
          review={review}
          onConfirm={() => handleConfirm(review.id)}
          onEdit={updatedData => handleEdit(review.id, updatedData)}
          onRequestResources={() => handleRequestResources(review.id)}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
};
