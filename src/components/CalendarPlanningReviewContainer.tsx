import React, { useState } from 'react';
import { Case } from '../lib/case-service';
import { calendarPlanningService } from '../lib/calendar-planning-service';
import { CalendarPlanningReviewCard } from './CalendarPlanningReviewCard';
import { CalendarPlanningReview } from '../lib/types';

export interface CalendarPlanningReviewContainerProps {
  caseItem: Case;
  onUpdate?: () => void;
}

export const CalendarPlanningReviewContainer: React.FC<CalendarPlanningReviewContainerProps> = ({
  caseItem,
  onUpdate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviews = caseItem.calendarPlanningReviews || [];
  if (reviews.length === 0) return null;

  const handleConfirm = (reviewId: string) => {
    setIsSubmitting(true);
    try {
      calendarPlanningService.confirmCalendarPlanningReview(caseItem.id, reviewId);
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (reviewId: string, updatedData: Partial<CalendarPlanningReview>) => {
    setIsSubmitting(true);
    try {
      calendarPlanningService.updateCalendarPlanningReview(caseItem.id, reviewId, updatedData);
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = (reviewId: string, reason?: string) => {
    setIsSubmitting(true);
    try {
      calendarPlanningService.rejectCalendarPlanningReview(caseItem.id, reviewId, reason);
      if (onUpdate) onUpdate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <CalendarPlanningReviewCard
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
