import React from 'react';
import { Case } from '../lib/case-service';
import { OfferResponseReviewCard } from './OfferResponseReviewCard';
import { offerResponseService } from '../lib/offer-response-service';
import { OfferResponseIntent } from '../lib/types';

interface OfferResponseReviewContainerProps {
  caseItem: Case;
  onUpdate: () => void;
}

export const OfferResponseReviewContainer: React.FC<OfferResponseReviewContainerProps> = ({ caseItem, onUpdate }) => {
  const reviews = caseItem.offerResponseReviews?.filter(r => r.status === 'pending') || [];
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (reviews.length === 0) {
    return null;
  }

  const handleConfirm = (reviewId: string, intent: OfferResponseIntent) => {
    try {
      setErrorMessage(null);
      offerResponseService.confirmReview(caseItem.id, reviewId, intent, 'User');
      onUpdate();
    } catch (error) {
      console.error('Failed to confirm review:', error);
      setErrorMessage('Fehler beim Bestätigen. Bitte prüfen Sie die Konsole.');
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
          {errorMessage}
        </div>
      )}
      {reviews.map(review => (
        <OfferResponseReviewCard 
          key={review.id} 
          review={review} 
          onConfirm={(intent) => handleConfirm(review.id, intent)} 
        />
      ))}
    </div>
  );
};
