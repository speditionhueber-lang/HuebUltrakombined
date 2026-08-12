import type { OfferDraft, OfferDraftStatus } from './types';

export function validateOfferDraft(draft: OfferDraft): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!draft) {
    return { valid: false, errors: ['Kein Angebotsentwurf vorhanden.'] };
  }

  const selectedItems = (draft.items || []).filter(item => item.selected !== false);

  if (selectedItems.length === 0) {
    errors.push('Der Angebotsentwurf muss mindestens eine ausgewählte Position enthalten.');
  }

  selectedItems.forEach((item, index) => {
    if (!item.description || !item.description.trim()) {
      errors.push(`Position #${index + 1}: Beschreibung darf nicht leer sein.`);
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Position "${item.description || `#${index + 1}`}": Menge muss größer als 0 sein.`);
    }
    if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
      errors.push(`Position "${item.description || `#${index + 1}`}": Einzelpreis darf nicht negativ sein.`);
    }
  });

  // Check unresolved placeholders
  const placeholderRegex = /\{\{.*?\}\}|\[[A-Z_0-9\s-]+\]|<[A-Z_0-9\s-]+>/i;
  selectedItems.forEach((item) => {
    if (item.description && placeholderRegex.test(item.description)) {
      errors.push(`Position "${item.description}": Enthält unersetzte Platzhalter.`);
    }
  });
  if (draft.notes && placeholderRegex.test(draft.notes)) {
    errors.push('Anmerkungen enthalten unersetzte Platzhalter.');
  }
  if (draft.paymentTerms && placeholderRegex.test(draft.paymentTerms)) {
    errors.push('Zahlungsbedingungen enthalten unersetzte Platzhalter.');
  }

  // Calculation consistency check
  const calculatedSubtotal = selectedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  if (Math.abs(calculatedSubtotal - draft.subtotalNet) > 0.05) {
    errors.push(`Zwischensumme netto (${draft.subtotalNet} €) weicht von der Berechnug (${calculatedSubtotal.toFixed(2)} €) ab.`);
  }

  if (draft.subtotalNet < 0) {
    errors.push('Zwischensumme netto darf nicht negativ sein.');
  }

  if (draft.vatRate < 0) {
    errors.push('Mehrwertsteuersatz darf nicht negativ sein.');
  }

  if (draft.discountValue && draft.discountType === 'percent' && (draft.discountValue < 0 || draft.discountValue > 100)) {
    errors.push('Prozentualer Rabatt muss zwischen 0 % und 100 % liegen.');
  }

  if (draft.discountValue && draft.discountType === 'fixed' && draft.discountValue > draft.subtotalNet) {
    errors.push('Festpreisrabatt darf nicht größer als die Zwischensumme netto sein.');
  }

  if (draft.depositAmount && draft.depositAmount > draft.grossTotal) {
    errors.push('Anzahlungsbetrag darf nicht größer als der Bruttogesamtbetrag sein.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function canTransitionOfferDraftStatus(currentStatus: OfferDraftStatus, targetStatus: OfferDraftStatus): boolean {
  if (currentStatus === targetStatus) return true;

  const allowedTransitions: Record<OfferDraftStatus, OfferDraftStatus[]> = {
    draft: ['edited', 'approved', 'rejected'],
    edited: ['approved', 'rejected'],
    approved: ['pdf_created', 'failed', 'rejected'],
    pdf_created: ['ready_to_send', 'failed'],
    ready_to_send: ['sent', 'failed'],
    failed: ['approved', 'pdf_created', 'ready_to_send'],
    sent: ['accepted', 'rejected'],
    accepted: [],
    rejected: []
  };

  const allowed = allowedTransitions[currentStatus] || [];
  return allowed.includes(targetStatus);
}
