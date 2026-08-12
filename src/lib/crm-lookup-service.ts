import { Customer } from './types';
import { WorkflowEventConfidence } from './workflow-engine';

export interface CRMLookupResult {
  status: 'exact_match' | 'multiple_matches' | 'no_match';
  customers: Customer[];
  confidence: WorkflowEventConfidence;
  draftCustomer?: any;
}

/**
 * CRMLookupService Criteria for Exact vs. Multiple Matches:
 *
 * EXACT MATCH (High Confidence - score >= 60):
 * 1. Exact normalized email match (score: 60)
 * 2. Exact normalized phone match AND matching normalized name (score: 60)
 * 3. Multiple strong matching fields (e.g., Email + Phone + Name = score 100+)
 *
 * MULTIPLE MATCHES (Medium/Low Confidence):
 * 1. Only normalized phone match without name match (score: 30)
 * 2. Only normalized name match / similar name (score: 20)
 * 3. Multiple candidates matching with score >= 50
 *
 * NO MATCH:
 * 0 candidates with score > 0
 */
export class CRMLookupService {
  private currentCustomers: Customer[] = [];

  setCustomers(customers: Customer[]) {
    this.currentCustomers = customers;
  }

  normalizeEmail(email: string | number | null | undefined): string {
    if (!email) return '';
    return String(email).trim().toLowerCase();
  }

  normalizePhone(phone: string | number | null | undefined): string {
    if (phone === null || phone === undefined) return '';
    const phoneStr = typeof phone === 'string' ? phone : String(phone);
    if (!phoneStr) return '';
    // Replace 0043 with +43, remove spaces, dashes, parens, slashes
    let cleaned = phoneStr.replace(/[\s\-\(\)\/]/g, '').trim();
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    }
    return cleaned;
  }

  normalizeName(name: string | number | null | undefined): string {
    if (!name) return '';
    return String(name)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9 äöüßáéíóúàèìòùâêîôû]/g, '');
  }

  async lookup(extractedData: any): Promise<CRMLookupResult> {
    if (!extractedData) {
      return { status: 'no_match', customers: [], confidence: 'low' };
    }

    const searchEmail = this.normalizeEmail(extractedData.email?.value);
    const searchPhone = this.normalizePhone(extractedData.phone?.value);
    const searchName = this.normalizeName(extractedData.senderName?.value || extractedData.name?.value);
    const searchCompany = this.normalizeName(extractedData.company?.value || extractedData.firma?.value);

    let matches: Array<{
      customer: Customer;
      score: number;
      matchedFields: string[];
      conflictingFields: string[];
    }> = [];

    for (const customer of this.currentCustomers) {
      let score = 0;
      const matchedFields: string[] = [];
      const conflictingFields: string[] = [];

      const custEmail = this.normalizeEmail(customer.email);
      const custPhone = this.normalizePhone(customer.phone);
      const custName = this.normalizeName(customer.name);
      const custCompany = this.normalizeName((customer as any).firma);

      const emailMatch = searchEmail && custEmail && searchEmail === custEmail;
      const phoneMatch = searchPhone && custPhone && searchPhone === custPhone;
      const nameMatch = searchName && custName && (custName === searchName || custName.includes(searchName) || searchName.includes(custName));
      const companyMatch = searchCompany && custCompany && searchCompany === custCompany;

      if (emailMatch) {
        score += 60;
        matchedFields.push('email');
      } else if (searchEmail && custEmail && searchEmail !== custEmail) {
        conflictingFields.push('email');
      }

      if (phoneMatch) {
        if (nameMatch) {
          score += 60;
          matchedFields.push('phone', 'name');
        } else {
          score += 30;
          matchedFields.push('phone');
        }
      } else if (searchPhone && custPhone && searchPhone !== custPhone) {
        conflictingFields.push('phone');
      }

      if (nameMatch && !phoneMatch) {
        score += 20;
        matchedFields.push('name');
      } else if (searchName && custName && !nameMatch) {
        conflictingFields.push('name');
      }

      if (companyMatch) {
        score += 20;
        matchedFields.push('company');
      }

      if (score > 0) {
        matches.push({ customer, score, matchedFields, conflictingFields });
      }
    }

    matches.sort((a, b) => b.score - a.score);

    const highConfidenceMatches = matches.filter(m => m.score >= 60);
    const mediumConfidenceMatches = matches.filter(m => m.score > 0 && m.score < 60);

    let status: 'exact_match' | 'multiple_matches' | 'no_match' = 'no_match';
    let resultCustomers: Customer[] = [];
    let confidence: WorkflowEventConfidence = 'low';

    if (highConfidenceMatches.length === 1) {
      status = 'exact_match';
      resultCustomers = [highConfidenceMatches[0].customer];
      confidence = 'high';
    } else if (highConfidenceMatches.length > 1) {
      status = 'multiple_matches';
      resultCustomers = highConfidenceMatches.map(m => m.customer);
      confidence = 'medium';
    } else if (mediumConfidenceMatches.length > 0) {
      status = 'multiple_matches';
      resultCustomers = mediumConfidenceMatches.map(m => m.customer);
      confidence = 'low';
    }

    const draftCustomer = {
      name: extractedData.senderName?.value || extractedData.name?.value || '',
      email: extractedData.email?.value || '',
      phone: extractedData.phone?.value || '',
      firma: extractedData.company?.value || '',
      abholadresse: { strasse: extractedData.pickupAddress?.value || extractedData.sourceAddress?.value || '' },
      zieladresse: { strasse: extractedData.destinationAddress?.value || '' }
    };

    return {
      status,
      customers: resultCustomers,
      confidence,
      draftCustomer: status === 'no_match' ? draftCustomer : undefined
    };
  }

  getCustomers(): Customer[] {
    return this.currentCustomers;
  }

  getCustomerById(id: string): Customer | undefined {
    return this.currentCustomers.find(c => c.id === id);
  }

  findCustomerForCase(caseItem: { customerId?: string }): Customer | undefined {
    if (!caseItem.customerId) return undefined;
    return this.currentCustomers.find(c => c.id === caseItem.customerId);
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer | undefined {
    const index = this.currentCustomers.findIndex(c => c.id === id);
    if (index !== -1) {
      this.currentCustomers[index] = {
        ...this.currentCustomers[index],
        ...updates
      };
      return this.currentCustomers[index];
    }
    return undefined;
  }
}

export const crmLookupService = new CRMLookupService();

