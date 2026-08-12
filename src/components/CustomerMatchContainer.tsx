import React, { useState, useEffect } from 'react';
import { caseService } from '../lib/case-service';
import { crmLookupService } from '../lib/crm-lookup-service';
import { CustomerMatchCard } from './CustomerMatchCard';
import { CustomerFieldComparison, compareCustomerWithExtractedData, buildCustomerUpdateFromComparisons } from '../lib/types';

export interface CustomerMatchContainerProps {
  caseId: string;
  onUpdated?: () => void;
}

export function CustomerMatchContainer({ caseId, onUpdated }: CustomerMatchContainerProps) {
  const caseItem = caseService.getCase(caseId);
  const review = caseItem?.customerMatchReview;

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    review?.selectedCustomerId || (review?.candidates.length === 1 ? review.candidates[0].customerId : '')
  );

  const [fieldComparisons, setFieldComparisons] = useState<CustomerFieldComparison[]>(
    review?.fieldComparisons || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync selected customer & recalculate comparison on candidate selection
  useEffect(() => {
    if (!review) return;

    if (review.selectedCustomerId && !selectedCustomerId) {
      setSelectedCustomerId(review.selectedCustomerId);
    }

    if (selectedCustomerId) {
      const customer = crmLookupService.getCustomers().find(c => c.id === selectedCustomerId);
      if (customer && caseItem) {
        const extracted = caseItem.customerDraft?.originalExtractedData || {};
        const comparisons = compareCustomerWithExtractedData(customer, extracted);
        setFieldComparisons(comparisons);
      }
    }
  }, [caseId, review, selectedCustomerId]);

  if (!review) return null;

  const handleSelectCandidate = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setError(null);
  };

  const handleToggleField = (fieldKey: string) => {
    setFieldComparisons(prev =>
      prev.map(item =>
        item.field === fieldKey
          ? { ...item, selectedForUpdate: !item.selectedForUpdate }
          : item
      )
    );
  };

  const handleConfirmMatchOnly = async () => {
    const targetCustomerId = selectedCustomerId || review.selectedCustomerId;
    if (!targetCustomerId) {
      setError('Bitte wähle zuerst einen Kunden aus.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      caseService.confirmCustomerMatch(caseId, targetCustomerId);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Bestätigen der Kundenzuordnung.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmWithUpdates = async () => {
    const targetCustomerId = selectedCustomerId || review.selectedCustomerId;
    if (!targetCustomerId) {
      setError('Bitte wähle zuerst einen Kunden aus.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const targetCustomer = crmLookupService.getCustomers().find(c => c.id === targetCustomerId);
      const updateData = buildCustomerUpdateFromComparisons(fieldComparisons, targetCustomer);
      
      // Update CRM customer record
      if (Object.keys(updateData).length > 0) {
        crmLookupService.updateCustomer(targetCustomerId, updateData);
      }

      // Complete review in caseService
      caseService.completeCustomerMatchReviewWithUpdate(caseId, targetCustomerId, fieldComparisons);

      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren der Kundendaten.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectMatch = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      caseService.rejectCustomerMatch(caseId);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Verwerfen der Zuordnung.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerMatchCard
      review={review}
      selectedCustomerId={selectedCustomerId}
      fieldComparisons={fieldComparisons}
      candidates={review.candidates}
      onSelectCandidate={handleSelectCandidate}
      onToggleField={handleToggleField}
      onConfirmMatchOnly={handleConfirmMatchOnly}
      onConfirmWithUpdates={handleConfirmWithUpdates}
      onRejectMatch={handleRejectMatch}
      isSubmitting={isSubmitting}
      error={error}
    />
  );
}
