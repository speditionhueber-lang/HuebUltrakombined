
import React, { useState } from 'react';
import { CustomerDraft, DraftCorrection, Customer } from '../lib/types';
import { Case, caseService } from '../lib/case-service';
import { useCustomer } from '../contexts/customer-context';
import { useWorkflow } from '../contexts/workflow-context';
import { learningService } from '../lib/learning-service';
import { crmLookupService, CRMLookupResult } from '../lib/crm-lookup-service';
import { validateCustomerDraft } from '../lib/customer-draft-validator';
import { CustomerDraftCard } from './CustomerDraftCard';

export function CustomerDraftContainer({ caseItem }: { caseItem: Case }) {
  const { addCustomer } = useCustomer();
  const { emitEvent } = useWorkflow();
  const draft = caseItem.customerDraft;
  
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lookupResult, setLookupResult] = useState<CRMLookupResult | null>(null);

  if (!draft || draft.status === 'converted' || draft.status === 'rejected') {
    return null;
  }

  const handleSave = async (updatedDraft: CustomerDraft, newCorrections: DraftCorrection[]) => {
    // Save to service
    const draftToSave = { ...updatedDraft };
    if (newCorrections.length > 0) {
      draftToSave.corrections = [...(draftToSave.corrections || []), ...newCorrections];
    }
    
    draftToSave.status = 'edited';
    draftToSave.updatedAt = new Date().toISOString();
    
    caseService.updateCustomerDraft(caseItem.id, draftToSave);
    
    // Send corrections to learning service
    for (const correction of newCorrections) {
      learningService.recordCorrection(
        'current-user',
        caseItem.id,
        correction.field
      );
    }
    
    emitEvent('CUSTOMER_DRAFT_UPDATED', 'System', { caseId: caseItem.id });
  };

  const handleReject = async () => {
    caseService.rejectCustomerDraft(caseItem.id);
    emitEvent('CUSTOMER_DRAFT_REJECTED', 'System', { caseId: caseItem.id });
    
    caseService.cancelTaskByReference(caseItem.id, 'CUSTOMER_DRAFT_REVIEW', draft.id);
    
    caseService.addTimelineEntry(caseItem.id, {
      timestamp: new Date().toISOString(),
      type: 'CUSTOMER_DRAFT_REJECTED',
      category: 'Customer',
      title: 'Kundenentwurf abgelehnt',
      description: 'Der automatisch generierte Kundenentwurf wurde abgelehnt.',
      source: 'current-user'
    });
  };

  const handleConvert = async (draftToConvert: CustomerDraft) => {
    setIsSaving(true);
    setError(null);
    setLookupResult(null);
    try {
      // Validate
      const validation = validateCustomerDraft(draftToConvert);
      if (!validation.valid) {
        throw new Error(validation.generalError || 'Bitte füllen Sie alle Pflichtfelder aus.');
      }

      // Check for duplicates
      const lookup = await crmLookupService.lookup({
        senderName: { value: draftToConvert.fields.name.value || '', confidence: 'high' },
        email: { value: draftToConvert.fields.email?.value || '', confidence: 'high' }
      });

      if (lookup.status !== 'no_match') {
         setLookupResult(lookup);
         // Do not throw, just show the result and stop conversion
         setIsSaving(false);
         return;
      }

      // Convert
      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        name: draftToConvert.fields.name.value!,
        nameLower: draftToConvert.fields.name.value!.toLowerCase(),
        email: draftToConvert.fields.email?.value || '',
        phone: draftToConvert.fields.phone?.value || '',
        address: {
          street: '',
          zip: '',
          city: '',
          country: 'Österreich'
        },
        createdAt: new Date().toISOString(),
        avatarUrl: ''
      };

      if (draftToConvert.fields.pickupAddress?.raw?.value) {
        newCustomer.abholadresse = { 
          strasse: draftToConvert.fields.pickupAddress.raw.value 
        };
      }
      if (draftToConvert.fields.destinationAddress?.raw?.value) {
        newCustomer.zieladresse = { 
          strasse: draftToConvert.fields.destinationAddress.raw.value 
        };
      }
      if (draftToConvert.fields.moveDate?.value) {
        newCustomer.umzugsdetails = {
          gewuenschterUmzugstermin: draftToConvert.fields.moveDate.value
        };
      }
      if (draftToConvert.fields.apartmentSize?.value) {
        newCustomer.umzugsdetails = {
          ...(newCustomer.umzugsdetails || {}),
          umzugsgroesse: draftToConvert.fields.apartmentSize.value
        };
      }
      if (draftToConvert.fields.notes?.value) {
        newCustomer.anmerkungen = draftToConvert.fields.notes.value;
      }

      await addCustomer(newCustomer);
      
      caseService.convertCustomerDraft(caseItem.id, newCustomer.id);
      
      emitEvent('CUSTOMER_DRAFT_CONVERTED', 'System', { caseId: caseItem.id, customerId: newCustomer.id });
      
      caseService.completeTaskByReference(caseItem.id, 'CUSTOMER_DRAFT_REVIEW', draft.id);

      caseService.addTimelineEntry(caseItem.id, {
        timestamp: new Date().toISOString(),
        type: 'CUSTOMER_CREATED',
        category: 'Customer',
        title: 'Kunde im CRM angelegt',
        description: `Kunde ${newCustomer.name} wurde aus Entwurf erstellt.`,
        source: 'current-user'
      });

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Anlegen des Kunden');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CustomerDraftCard 
      draft={draft}
      onSave={handleSave}
      onConvert={handleConvert}
      onReject={handleReject}
      isSaving={isSaving}
      error={error}
      lookupResult={lookupResult}
    />
  );
}
