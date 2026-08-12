import type { Customer } from './types';

export interface EmailMatchItem {
  id: string;
  senderName?: string;
  senderEmail?: string;
  recipientEmail?: string;
  subject?: string;
  body?: string;
}

export interface CalendarMatchItem {
  id: string;
  title?: string;
  customerId?: string;
  description?: string;
}

/**
 * Checks if a Customer has a matching email in the provided email list.
 */
export function checkCustomerEmailMatch(customer: Customer, emails: EmailMatchItem[]): boolean {
  if (!customer || !emails || emails.length === 0) return false;
  const custEmail = (customer.email || '').toLowerCase().trim();
  const custName = (customer.name || '').toLowerCase().trim();
  const custNr = (customer.kundenNummer || '').toLowerCase().trim();

  return emails.some(e => {
    const sEmail = (e.senderEmail || '').toLowerCase().trim();
    const rEmail = (e.recipientEmail || '').toLowerCase().trim();
    const sName = (e.senderName || '').toLowerCase().trim();
    const subj = (e.subject || '').toLowerCase().trim();
    const body = (e.body || '').toLowerCase().trim();

    if (custEmail && custEmail.length > 3 && (sEmail === custEmail || rEmail === custEmail)) {
      return true;
    }
    if (custName && custName.length > 2) {
      if (sName.includes(custName) || custName.includes(sName)) return true;
      if (subj.includes(custName) || body.includes(custName)) return true;
    }
    if (custNr && custNr.length > 3) {
      if (subj.includes(custNr) || body.includes(custNr)) return true;
    }
    return false;
  });
}

/**
 * Checks if a Customer has a matching calendar event in the provided event list.
 */
export function checkCustomerCalendarMatch(customer: Customer, events: CalendarMatchItem[]): boolean {
  if (!customer || !events || events.length === 0) return false;
  const custId = customer.id;
  const custName = (customer.name || '').toLowerCase().trim();
  const custNr = (customer.kundenNummer || '').toLowerCase().trim();

  return events.some(evt => {
    if (evt.customerId && evt.customerId === custId) return true;
    const title = (evt.title || '').toLowerCase().trim();
    const desc = (evt.description || '').toLowerCase().trim();

    if (custName && custName.length > 2 && (title.includes(custName) || desc.includes(custName))) {
      return true;
    }
    if (custNr && custNr.length > 3 && (title.includes(custNr) || desc.includes(custNr))) {
      return true;
    }
    return false;
  });
}

/**
 * Finds a matching Customer in database for a given Email message.
 */
export function findCustomerForEmail(email: EmailMatchItem, customers: Customer[]): Customer | null {
  if (!email || !customers || customers.length === 0) return null;
  const sEmail = (email.senderEmail || '').toLowerCase().trim();
  const sName = (email.senderName || '').toLowerCase().trim();
  const subj = (email.subject || '').toLowerCase().trim();

  for (const c of customers) {
    const cEmail = (c.email || '').toLowerCase().trim();
    const cName = (c.name || '').toLowerCase().trim();
    const cNr = (c.kundenNummer || '').toLowerCase().trim();

    if (cEmail && cEmail.length > 3 && cEmail === sEmail) {
      return c;
    }
    if (cName && cName.length > 2) {
      if (sName && (sName === cName || sName.includes(cName) || cName.includes(sName))) return c;
      if (subj && subj.includes(cName)) return c;
    }
    if (cNr && cNr.length > 3 && subj && subj.includes(cNr)) {
      return c;
    }
  }
  return null;
}

/**
 * Checks if an Email message matches a Calendar event.
 */
export function checkEmailCalendarMatch(email: EmailMatchItem, events: CalendarMatchItem[]): boolean {
  if (!email || !events || events.length === 0) return false;
  const sName = (email.senderName || '').toLowerCase().trim();
  const subj = (email.subject || '').toLowerCase().trim();

  return events.some(evt => {
    const title = (evt.title || '').toLowerCase().trim();
    const desc = (evt.description || '').toLowerCase().trim();

    if (sName && sName.length > 2 && (title.includes(sName) || desc.includes(sName))) return true;
    if (subj && subj.length > 3 && (title.includes(subj) || desc.includes(subj))) return true;
    return false;
  });
}

/**
 * Finds a matching Customer in database for a given Calendar event.
 */
export function findCustomerForCalendarEvent(evt: CalendarMatchItem, customers: Customer[]): Customer | null {
  if (!evt || !customers || customers.length === 0) return null;
  if (evt.customerId) {
    const found = customers.find(c => c.id === evt.customerId);
    if (found) return found;
  }

  const title = (evt.title || '').toLowerCase().trim();
  const desc = (evt.description || '').toLowerCase().trim();

  for (const c of customers) {
    const cName = (c.name || '').toLowerCase().trim();
    const cNr = (c.kundenNummer || '').toLowerCase().trim();

    if (cName && cName.length > 2 && (title.includes(cName) || desc.includes(cName))) {
      return c;
    }
    if (cNr && cNr.length > 3 && (title.includes(cNr) || desc.includes(cNr))) {
      return c;
    }
  }
  return null;
}

/**
 * Checks if a Calendar event matches an email in the email list.
 */
export function checkCalendarEmailMatch(evt: CalendarMatchItem, emails: EmailMatchItem[]): boolean {
  if (!evt || !emails || emails.length === 0) return false;
  const title = (evt.title || '').toLowerCase().trim();
  const desc = (evt.description || '').toLowerCase().trim();

  return emails.some(e => {
    const sName = (e.senderName || '').toLowerCase().trim();
    const sEmail = (e.senderEmail || '').toLowerCase().trim();
    const subj = (e.subject || '').toLowerCase().trim();

    if (sName && sName.length > 2 && (title.includes(sName) || desc.includes(sName))) return true;
    if (sEmail && sEmail.length > 3 && (title.includes(sEmail) || desc.includes(sEmail))) return true;
    if (subj && subj.length > 3 && title.includes(subj)) return true;
    return false;
  });
}
