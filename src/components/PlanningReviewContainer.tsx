import React, { useState } from 'react';
import { Case } from '../lib/case-service';
import { planningService } from '../lib/planning-service';
import { PlanningReviewCard } from './PlanningReviewCard';
import { PlanningData } from '../lib/types';

export interface PlanningReviewContainerProps {
  caseItem: Case;
  onUpdate?: () => void;
}

export const PlanningReviewContainer: React.FC<PlanningReviewContainerProps> = ({
  caseItem,
  onUpdate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviews = caseItem.planningReviews || [];
  if (reviews.length === 0) return null;

  const handleConfirm = (reviewId: string) => {
    setIsSubmitting(true);
    try {
      planningService.confirmPlanningReview(caseItem.id, reviewId);
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (reviewId: string, updatedData: Partial<PlanningData>) => {
    setIsSubmitting(true);
    try {
      planningService.updatePlanningData(caseItem.id, reviewId, updatedData);
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestMissingInfo = async (reviewId: string) => {
    setIsSubmitting(true);
    try {
      await planningService.requestMissingInformation(caseItem.id, reviewId);
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <PlanningReviewCard
          key={review.id}
          review={review}
          onConfirm={() => handleConfirm(review.id)}
          onEdit={(updatedData) => handleEdit(review.id, updatedData)}
          onRequestMissingInfo={() => handleRequestMissingInfo(review.id)}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
};
