import React, { useState } from 'react';
import { Case } from '../lib/case-service';
import { tourPlanningService } from '../lib/tour-planning-service';
import { TourPlanningReviewCard } from './TourPlanningReviewCard';
import { TourPlanningReview } from '../lib/types';

export interface TourPlanningReviewContainerProps {
  caseItem: Case;
  onUpdate?: () => void;
}

export const TourPlanningReviewContainer: React.FC<TourPlanningReviewContainerProps> = ({
  caseItem,
  onUpdate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviews = caseItem.tourPlanningReviews || [];
  if (reviews.length === 0) return null;

  const handleConfirm = (reviewId: string) => {
    setIsSubmitting(true);
    try {
      tourPlanningService.confirmTourPlanningReview(caseItem.id, reviewId);
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (reviewId: string, updatedData: Partial<TourPlanningReview>) => {
    setIsSubmitting(true);
    try {
      tourPlanningService.updateTourPlanningReview(caseItem.id, reviewId, updatedData);
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = (reviewId: string, reason?: string) => {
    setIsSubmitting(true);
    try {
      tourPlanningService.rejectTourPlanningReview(caseItem.id, reviewId, reason);
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <TourPlanningReviewCard
          key={review.id}
          review={review}
          onConfirm={() => handleConfirm(review.id)}
          onEdit={updatedData => handleEdit(review.id, updatedData)}
          onReject={reason => handleReject(review.id, reason)}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
};
