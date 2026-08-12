import React, { useState } from 'react';
import { caseService } from '../lib/case-service';
import { operationExecutionService } from '../lib/operation-execution-service';
import { OperationExecutionReviewCard } from './OperationExecutionReviewCard';

export interface OperationExecutionReviewContainerProps {
  caseId: string;
}

export const OperationExecutionReviewContainer: React.FC<OperationExecutionReviewContainerProps> = ({ caseId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setRefreshKey] = useState(0);

  const caseItem = caseService.getCase(caseId);
  const reviews = caseItem?.operationExecutionReviews || [];

  if (reviews.length === 0) return null;

  const handleStart = (reviewId: string, startTime?: string) => {
    setIsSubmitting(true);
    try {
      operationExecutionService.startOperationExecution(caseId, reviewId, startTime);
      setRefreshKey(k => k + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateActuals = (reviewId: string, updates: any) => {
    operationExecutionService.updateActualData(caseId, reviewId, updates);
    setRefreshKey(k => k + 1);
  };

  const handleAddAdditionalService = (reviewId: string, service: any) => {
    operationExecutionService.addAdditionalService(caseId, reviewId, service);
    setRefreshKey(k => k + 1);
  };

  const handleAddIncident = (reviewId: string, incident: any) => {
    operationExecutionService.addIncident(caseId, reviewId, incident);
    setRefreshKey(k => k + 1);
  };

  const handleResolveIncident = (reviewId: string, incidentId: string, notes: string) => {
    operationExecutionService.resolveIncident(caseId, reviewId, incidentId, notes);
    setRefreshKey(k => k + 1);
  };

  const handleComplete = (reviewId: string, options?: any) => {
    setIsSubmitting(true);
    try {
      operationExecutionService.completeOperationExecution(caseId, reviewId, options);
      setRefreshKey(k => k + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (reviewId: string, reason: string) => {
    setIsSubmitting(true);
    try {
      operationExecutionService.cancelOperationExecution(caseId, reviewId, reason);
      setRefreshKey(k => k + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 my-4">
      {reviews.map(review => (
        <OperationExecutionReviewCard
          key={review.id}
          review={review}
          onStartExecution={(startTime) => handleStart(review.id, startTime)}
          onUpdateActuals={(updates) => handleUpdateActuals(review.id, updates)}
          onAddAdditionalService={(service) => handleAddAdditionalService(review.id, service)}
          onAddIncident={(incident) => handleAddIncident(review.id, incident)}
          onResolveIncident={(incidentId, notes) => handleResolveIncident(review.id, incidentId, notes)}
          onCompleteExecution={(options) => handleComplete(review.id, options)}
          onCancelExecution={(reason) => handleCancel(review.id, reason)}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
};
