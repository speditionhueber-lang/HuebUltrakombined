import { CustomerDraft } from './types';

export type CustomerDraftFieldKey = 'name' | 'email' | 'phone' | 'company' | 'moveDate' | 'apartmentSize' | 'notes';
export type CustomerDraftAddressKey = 'pickupAddress' | 'destinationAddress';

export interface CustomerDraftValidationResult {
  valid: boolean;
  fieldErrors: Partial<Record<CustomerDraftFieldKey | CustomerDraftAddressKey, string>>;
  generalError?: string;
}

export function validateCustomerDraft(draft: CustomerDraft): CustomerDraftValidationResult {
  const errors: Partial<Record<CustomerDraftFieldKey | CustomerDraftAddressKey, string>> = {};
  
  if (!draft.fields.name?.value?.trim()) {
    errors.name = 'Der Name ist ein Pflichtfeld.';
  }
  
  if (draft.fields.email?.value && !/^\\S+@\\S+\\.\\S+$/.test(draft.fields.email.value)) {
    errors.email = 'Die E-Mail-Adresse ist ungültig.';
  }
  
  // Need either name or phone or email? Name is required above anyway.
  
  const valid = Object.keys(errors).length === 0;
  
  return {
    valid,
    fieldErrors: errors,
    generalError: !valid ? 'Bitte korrigieren Sie die markierten Felder.' : undefined
  };
}
