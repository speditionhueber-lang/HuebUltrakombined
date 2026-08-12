import { EmailResponseDraft, EmailDraftStatus } from './types';

export interface EmailDraftValidationResult {
  valid: boolean;
  errors: string[];
}

export function canTransitionEmailDraftStatus(from: EmailDraftStatus, to: EmailDraftStatus): boolean {
  if (from === 'sent' || from === 'rejected') {
    return false; // Terminal states
  }
  if (from === 'sending' && to === 'sending') {
    return false; // Prevent double trigger
  }

  switch (from) {
    case 'draft':
      return to === 'edited' || to === 'approved' || to === 'rejected' || to === 'sending';
    case 'edited':
      return to === 'approved' || to === 'rejected' || to === 'sending';
    case 'approved':
      return to === 'sending' || to === 'rejected';
    case 'sending':
      return to === 'sent' || to === 'failed';
    case 'failed':
      return to === 'approved' || to === 'sending' || to === 'rejected';
    default:
      return false;
  }
}

export function validateEmailResponseDraft(draft: EmailResponseDraft): EmailDraftValidationResult {
  const errors: string[] = [];

  // 1. Recipient check
  if (!draft.recipients || draft.recipients.length === 0) {
    errors.push('Es muss mindestens ein Empfänger angegeben werden.');
  } else {
    for (const recipient of draft.recipients) {
      if (!recipient.email || typeof recipient.email !== 'string' || !recipient.email.includes('@')) {
        errors.push(`Ungültige Empfänger-E-Mail-Adresse: "${recipient.email || ''}"`);
      }
    }
  }

  // CC check if present
  if (draft.ccRecipients && draft.ccRecipients.length > 0) {
    for (const recipient of draft.ccRecipients) {
      if (!recipient.email || typeof recipient.email !== 'string' || !recipient.email.includes('@')) {
        errors.push(`Ungültige CC-E-Mail-Adresse: "${recipient.email || ''}"`);
      }
    }
  }

  // 2. Subject check
  if (!draft.subject || typeof draft.subject !== 'string' || draft.subject.trim().length === 0) {
    errors.push('Der Betreff darf nicht leer sein.');
  }

  // 3. Body text check
  if (!draft.bodyText || typeof draft.bodyText !== 'string' || draft.bodyText.trim().length === 0) {
    errors.push('Der Nachrichtentext darf nicht leer sein.');
  } else {
    // Check if body is only signature
    const signatureMarkers = ['Spedition Hueber GmbH', 'office@spedition-hueber.at', 'Mit freundlichen Grüßen'];
    let textWithoutSig = draft.bodyText;
    for (const marker of signatureMarkers) {
      textWithoutSig = textWithoutSig.replace(marker, '');
    }
    if (textWithoutSig.trim().replace(/[-–—\n\r\t ]/g, '').length === 0) {
      errors.push('Der Nachrichtentext darf nicht nur aus der Signatur bestehen.');
    }
  }

  // 4. Template placeholder check (e.g. {{name}}, {{field}})
  if (draft.bodyText && /\{\{[^}]+\}\}/.test(draft.bodyText)) {
    errors.push('Der Nachrichtentext enthält noch unaufgelöste Template-Platzhalter (z.B. {{...}}).');
  }

  // 5. Access Token or secret metadata security check
  if (
    (draft.bodyText && (/Bearer\s+[A-Za-z0-9\-_~\+\/]{10,}/i.test(draft.bodyText) || draft.bodyText.includes('ms_graph_access_token'))) ||
    (draft.subject && (/Bearer\s+[A-Za-z0-9\-_~\+\/]{10,}/i.test(draft.subject) || draft.subject.includes('ms_graph_access_token')))
  ) {
    errors.push('Sicherheitswarnung: Es wurde ein Access Token oder sensibles Token in Betreff oder Text erkannt.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
