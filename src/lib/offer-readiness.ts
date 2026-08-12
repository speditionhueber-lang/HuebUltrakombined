import type { Case } from './case-service';
import type { Customer, OfferReadiness } from './types';

export function evaluateOfferReadiness(caseItem: Case, customer?: Customer | null): OfferReadiness {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  const draftFields = caseItem.customerDraft?.fields;

  const custName = customer?.name || draftFields?.name?.value || null;
  const custEmail = customer?.email || draftFields?.email?.value || null;
  const hasCustomerInfo = !!(custName || custEmail || customer?.id || caseItem.customerId);

  const pickupStr = customer?.abholadresse?.strasse || customer?.address?.street || draftFields?.pickupAddress?.street?.value || draftFields?.pickupAddress?.raw?.value || null;
  const destStr = customer?.zieladresse?.strasse || draftFields?.destinationAddress?.street?.value || draftFields?.destinationAddress?.raw?.value || null;
  const moveDateStr = customer?.umzugsdetails?.gewuenschterUmzugstermin || draftFields?.moveDate?.value || null;
  const sizeStr = customer?.umzugsdetails?.umzugsgroesse || draftFields?.apartmentSize?.value || null;
  const hasInventory = (customer?.gegenstaende && Object.values(customer.gegenstaende).some(v => typeof v === 'number' && v > 0)) || (customer?.geminiVolumeEstimate?.totalM3 && customer.geminiVolumeEstimate.totalM3 > 0) || !!sizeStr;

  if (!hasCustomerInfo) {
    missingFields.push('Kundenkontakt (Name/E-Mail)');
  }

  if (!pickupStr) {
    missingFields.push('Abholadresse');
  }

  if (!destStr) {
    missingFields.push('Zieladresse');
  }

  if (!moveDateStr) {
    missingFields.push('Umzugstermin');
  }

  if (!hasInventory) {
    missingFields.push('Inventar oder Wohnungsgröße');
  }

  // Warnings for non-critical information
  if (customer && !customer.abholadresse?.stockwerk && !customer.abholadresse?.aufzug) {
    warnings.push('Etagen- und Aufzugsdaten für Abholadresse unvollständig');
  }
  if (customer && !customer.zieladresse?.stockwerk && !customer.zieladresse?.aufzug) {
    warnings.push('Etagen- und Aufzugsdaten für Zieladresse unvollständig');
  }

  const readyForOrientationOffer = hasCustomerInfo && (!!pickupStr || !!destStr || !!sizeStr || !!moveDateStr);
  const readyForBindingOffer = hasCustomerInfo && !!pickupStr && !!destStr && !!moveDateStr && hasInventory;

  return {
    readyForOrientationOffer,
    readyForBindingOffer,
    missingFields,
    warnings
  };
}
