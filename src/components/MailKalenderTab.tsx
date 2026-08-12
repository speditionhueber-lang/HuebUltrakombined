import React, { useState, useEffect } from 'react';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { LogOut,
  Mail, Calendar as CalendarIcon, Inbox, Send, FileText, Trash2, Paperclip, Download, Reply, ReplyAll, Forward,
  Plus, RefreshCw, Search, CheckCircle, User, Clock, MapPin,
  ChevronLeft, ChevronRight, LayoutGrid, List, AlertCircle, X,
  UserPlus, CalendarPlus, Sparkles, Printer, Loader2, Settings2, Key, AlertTriangle, Check, ExternalLink } from 'lucide-react';
import logo2 from '@/src/LOgo2.png';
import { generateLieferscheinPDF } from '@/src/lib/pdf-generator';
import { normalizeCustomerData, mergeCustomerData } from '@/src/lib/customer-adapter';
import { getOrCreateCustomerFolder, uploadFileToDrive } from '@/src/lib/drive';
import { GlobalDeleteDialog } from '@/src/components/GlobalDeleteDialog';
import { useCustomer } from '@/src/contexts/customer-context';
import { useWorkflow } from '@/src/contexts/workflow-context';
import { apiFetch } from '@/src/lib/api-client';
import { caseService } from '@/src/lib/case-service';
import { emailDraftService } from '@/src/lib/email-draft-service';
import { learningService } from '@/src/lib/learning-service';
import { normalizeEmailBody } from '@/src/lib/email-normalizer';
import type { Customer, RequestedInformationField } from '@/src/lib/types';
import {
  checkCustomerEmailMatch,
  checkCustomerCalendarMatch,
  findCustomerForEmail,
  checkEmailCalendarMatch,
  findCustomerForCalendarEvent,
  checkCalendarEmailMatch
} from '@/src/lib/match-checker';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export type EmailCategoryType = 'Kunden' | 'Wichtig' | 'Sonstige' | 'Junk' | 'Anfrage' | 'Auftrag' | 'Rechnung' | 'Allgemein';

export interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
  isInline?: boolean;
  contentId?: string;
}

export interface EmailMessage {
  id: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  bodyPreview?: string;
  preview?: string;
  htmlBody?: string;
  timestamp: string;
  isRead: boolean;
  category: EmailCategoryType;
  hasAttachment?: boolean;
  attachments?: EmailAttachment[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
  description?: string;
  category: 'Umzug' | 'Besichtigung' | 'Büro' | 'Wartung';
  customerId?: string;
  moveDetails?: {
    abholadresse?: string;
    abholStockwerk?: string;
    abholLift?: string;
    zieladresse?: string;
    zielStockwerk?: string;
    zielLift?: string;
    m3?: string;
    personenCount?: string;
    montageInfo?: string;
    eingeteiltePersonen?: string;
    anmerkungen?: string;
  };
}

function isGebruederWeissSender(senderEmail = '', senderName = ''): boolean {
  const normalizedEmail = senderEmail.toLowerCase();
  const normalizedName = senderName.toLowerCase();
  return normalizedEmail.includes('gw-world.com') || normalizedName.includes('gebrüder weiss');
}

async function persistentGet<T>(key: string): Promise<T | undefined> {
  if (typeof indexedDB !== 'undefined') {
    try {
      return await idbGet<T>(key);
    } catch (error) {
      console.warn(`IndexedDB konnte für ${key} nicht gelesen werden:`, error);
    }
  }
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : undefined;
  } catch {
    return undefined;
  }
}

async function persistentSet<T>(key: string, value: T): Promise<void> {
  if (typeof indexedDB !== 'undefined') {
    try {
      await idbSet(key, value);
      return;
    } catch (error) {
      console.warn(`IndexedDB konnte für ${key} nicht geschrieben werden:`, error);
    }
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export function MailKalenderTab({
  target
}: {
  target?: { type: 'mail' | 'calendar', emailStr?: string, openReply?: boolean } | null
}) {
  const { customers, activeCustomer, setActiveCustomer, addCustomer, updateCustomer } = useCustomer();
  const { emitEvent } = useWorkflow();
  const [activeSubView, setActiveSubView] = useState<'mail' | 'calendar'>('mail');

  // AI extraction states
  const [isExtractingCustomer, setIsExtractingCustomer] = useState(false);
  const [isExtractingCalendar, setIsExtractingCalendar] = useState(false);
  const [isSavingAttachments, setIsSavingAttachments] = useState(false);
  const [successModalInfo, setSuccessModalInfo] = useState<{ title: string; message: string; customerId?: string } | null>(null);

  // Storage keys
  const EMAILS_KEY = 'outlook_emails_list_v2';
  const EVENTS_KEY = 'outlook_calendar_events_v2';

  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Helper: Gather full chronological email thread for a selected email

  // Local Category Helper
  const getLocalCategory = (m: any, custs: Customer[], events: CalendarEvent[], rules: any): EmailCategoryType => {
    const senderEmail = (m.senderEmail || m.from?.emailAddress?.address || '').toLowerCase();
    const senderName = (m.senderName || m.from?.emailAddress?.name || '').toLowerCase();
    const recipientEmail = (m.recipientEmail || m.toRecipients?.[0]?.emailAddress?.address || '').toLowerCase();
    const subject = (m.subject || '').toLowerCase();
    const body = (m.preview || m.bodyPreview || m.body || '').toLowerCase();

    // GW Rule (Rule 4)
    if (isGebruederWeissSender(senderEmail, senderName)) {
      if (rules[senderEmail]) return rules[senderEmail];
      return 'Sonstige';
    }

    // 1. User Rules have highest priority
    if (rules[senderEmail]) {
        return rules[senderEmail];
    }

    // 2. Spam
    if (subject.includes('*****spam*****')) return 'Junk';

    // 3. Rule 3: Website Contact
    if (senderName === 'website contact') return 'Kunden';

    // 4. Rule 2: Termin vereinbart
    if (subject.includes('besichtigungstermin vereinbart') || body.includes('besichtigungstermin vereinbart') || subject.includes('termin vereinbart') || body.includes('termin vereinbart')) {
        return 'Kunden';
    }

    // 5. Rule 1: Kunde DB / Termin DB
    const mockMail = { senderEmail, senderName, subject, preview: body };
    const hasCustomerMatch = !!findCustomerForEmail(mockMail as any, custs);
    const hasCalendarMatch = !!checkEmailCalendarMatch(mockMail as any, events);
    if (hasCustomerMatch || hasCalendarMatch) return 'Kunden';

    // 6. Wichtig Check
    const textToSearch = `${subject} ${senderEmail} ${senderName} ${body}`;
    const wichtigKeywords = ['mahnung', 'rechnung', 'schaden', 'klage', 'dokument', 'strafe', 'summe', 'förderung', 'abgabe', 'streitfall', 'unfall', 'vermietung', 'verpachtung'];
    const wichtigSenders = ['ams', 'finanzamt', 'gebietskrankenkasse', 'ögk', 'bauamt', 'polizei', 'rechtsanwalt', 'steuerberater', 'arbeiterkammer', 'lager', 'strafamt', 'unternehmensportal', 'statistik austria', 'unternehmensberatung'];

    if (wichtigKeywords.some(kw => textToSearch.includes(kw)) || wichtigSenders.some(s => textToSearch.includes(s))) {
        return 'Wichtig';
    }

    return m.category && m.category !== 'Allgemein' ? m.category : 'Sonstige';
  };

  const getEmailThreadForSelectedEmail = (email: EmailMessage, allEmails: EmailMessage[]): EmailMessage[] => {
    const senderEmailLower = (email.senderEmail || '').toLowerCase().trim();
    const cleanSubject = (email.subject || '').replace(/^(re|fwd|aw|antwort):\s*/i, '').trim().toLowerCase();

    const thread = allEmails.filter(m => {
      const mSenderLower = (m.senderEmail || '').toLowerCase().trim();
      const mSubjectClean = (m.subject || '').replace(/^(re|fwd|aw|antwort):\s*/i, '').trim().toLowerCase();

      if (senderEmailLower && mSenderLower === senderEmailLower) return true;
      if (cleanSubject && mSubjectClean && cleanSubject === mSubjectClean) return true;
      return false;
    });

    // Sort chronologically (oldest message first, newest message last)
    thread.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return thread.length > 0 ? thread : [email];
  };

  // Handler 1: Create or Update customer from current email thread via AI
  const handleCreateCustomerFromEmail = async () => {
    if (!selectedEmail) return;
    setIsExtractingCustomer(true);
    try {
      const threadMails = getEmailThreadForSelectedEmail(selectedEmail, emails);
      const emailContent = threadMails.map((mail, idx) => `
=== E-MAIL NACHRICHT ${idx + 1} VON ${threadMails.length} ${idx === threadMails.length - 1 ? '(NEUESTE NACHRICHT - HAT VORRANG BEI ÄNDERUNGEN!)' : ''} ===
Datum: ${format(new Date(mail.timestamp), 'dd.MM.yyyy HH:mm')}
Von: ${mail.senderName} <${mail.senderEmail}>
Betreff: ${mail.subject}

Inhalt / Text:
${mail.body || (mail.htmlBody ? mail.htmlBody.replace(/<[^>]+>/g, ' ') : '')}
`).join('\n\n--------------------------------------------------\n\n');

      // Find existing customer match in DB
      const senderEmailLower = (selectedEmail.senderEmail || '').toLowerCase();
      const existingCust = customers.find(c => {
        if (c.email && c.email.toLowerCase() === senderEmailLower) return true;
        if (activeCustomer && c.id === activeCustomer.id) return true;
        return false;
      });

      const res = await apiFetch('/api/ai/extract-customer-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: emailContent,
          existingCustomer: existingCust || null
        })
      });

      if (res.ok) {
        const parsed = await res.json();
        if (!parsed.email || !parsed.email.includes('@')) {
          parsed.email = selectedEmail.senderEmail;
        }
        if (!parsed.name || parsed.name.trim() === '') {
          parsed.name = selectedEmail.senderName;
        }

        const normalizedCustomer = normalizeCustomerData(parsed);

        if (existingCust) {
          // MERGE & UPDATE existing customer file
          const mergedCustomer = mergeCustomerData(existingCust, normalizedCustomer);
          await updateCustomer(existingCust.id, mergedCustomer);
          setActiveCustomer(mergedCustomer);

          setSuccessModalInfo({
            title: 'Kundendatei erfolgreich aktualisiert',
            message: `Die Kundendatei von "${mergedCustomer.name}" wurde mit den neuesten Informationen aus dem gesamten E-Mail-Verlauf überarbeitet und auf den aktuellsten Stand gebracht.`,
            customerId: mergedCustomer.id
          });
          
          learningService.recordLearningRecord({
            actionType: 'create_customer_from_email',
            contextType: 'customer_management',
            detectedDecision: 'none',
            finalDecision: 'updated_customer',
            result: 'accepted',
            confidence: 'high',
            originalData: { customerId: mergedCustomer.id, emailSubject: selectedEmail.subject }
          });
        } else {
          // CREATE new customer file
          await addCustomer(normalizedCustomer);
          setActiveCustomer(normalizedCustomer);

          setSuccessModalInfo({
            title: 'Kunde erfolgreich importiert',
            message: `Der Kunde "${normalizedCustomer.name}" wurde erfolgreich aus dem gesamten E-Mail-Verlauf extrahiert und neu in der Kundendatenbank angelegt.`,
            customerId: normalizedCustomer.id
          });
          
          learningService.recordLearningRecord({
            actionType: 'create_customer_from_email',
            contextType: 'customer_management',
            detectedDecision: 'none',
            finalDecision: 'created_customer',
            result: 'accepted',
            confidence: 'high',
            originalData: { customerId: normalizedCustomer.id, emailSubject: selectedEmail.subject }
          });
        }
      } else {
        alert('Fehler bei der KI-Kundendatenextraktion.');
      }
    } catch (err) {
      console.error('Customer extraction error:', err);
      alert('Es gab ein Problem beim Extrahieren oder Aktualisieren der Kundendaten.');
    } finally {
      setIsExtractingCustomer(false);
    }
  };

  // Handler 1b: Save attachments to Google Drive and ensure customer exists/is updated
  const handleSaveAttachmentsToDriveAndCustomer = async () => {
    if (!selectedEmail) return;
    setIsSavingAttachments(true);
    try {
      const threadMails = getEmailThreadForSelectedEmail(selectedEmail, emails);
      const emailContent = threadMails.map((mail, idx) => `
=== E-MAIL NACHRICHT ${idx + 1} VON ${threadMails.length} ===
Datum: ${format(new Date(mail.timestamp), 'dd.MM.yyyy HH:mm')}
Von: ${mail.senderName} <${mail.senderEmail}>
Betreff: ${mail.subject}

Inhalt:
${mail.body || (mail.htmlBody ? mail.htmlBody.replace(/<[^>]+>/g, ' ') : '')}
`).join('\n\n--------------------------------------------------\n\n');

      // 1. Find existing customer match or extract with AI
      const senderEmailLower = (selectedEmail.senderEmail || '').toLowerCase();
      let targetCustomer = customers.find(c => {
        if (c.email && c.email.toLowerCase() === senderEmailLower) return true;
        if (activeCustomer && c.id === activeCustomer.id) return true;
        return false;
      });

      let statusMessagePrefix = '';

      // Extract KI customer data
      const extractRes = await apiFetch('/api/ai/extract-customer-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: emailContent,
          existingCustomer: targetCustomer || null
        })
      });

      let extractedData: any = {};
      if (extractRes.ok) {
        extractedData = await extractRes.json();
      }

      if (!extractedData.email || !extractedData.email.includes('@')) {
        extractedData.email = selectedEmail.senderEmail;
      }
      if (!extractedData.name || !extractedData.name.trim()) {
        extractedData.name = selectedEmail.senderName;
      }

      const normalizedData = normalizeCustomerData(extractedData);

      if (targetCustomer) {
        const merged = mergeCustomerData(targetCustomer, normalizedData);
        await updateCustomer(targetCustomer.id, merged);
        targetCustomer = merged;
        setActiveCustomer(merged);
        statusMessagePrefix = `Kundendatei von "${merged.name}" wurde mit KI-Erkenntnissen aktualisiert.`;
      } else {
        const nameMatch = customers.find(c => c.name?.toLowerCase().trim() === normalizedData.name?.toLowerCase().trim());
        if (nameMatch) {
          const merged = mergeCustomerData(nameMatch, normalizedData);
          await updateCustomer(nameMatch.id, merged);
          targetCustomer = merged;
          setActiveCustomer(merged);
          statusMessagePrefix = `Kundendaten für "${merged.name}" wurden zugeordnet & aktualisiert.`;
        } else {
          await addCustomer(normalizedData);
          targetCustomer = normalizedData;
          setActiveCustomer(normalizedData);
          statusMessagePrefix = `Neuer Kunde "${normalizedData.name}" wurde erfolgreich aus der E-Mail angelegt.`;
        }
      }

      // 1.5 Create Email Draft if data is missing
      if (extractedData.fehlendeDaten && Array.isArray(extractedData.fehlendeDaten) && extractedData.fehlendeDaten.length > 0 && targetCustomer) {
        let caseItem = caseService.getCases().find(c => c.customerId === targetCustomer?.id);
        if (!caseItem) {
          caseItem = caseService.createCase({
            customerId: targetCustomer.id,
            status: 'Analyzing',
            source: 'Email',
            title: `Anfrage ${targetCustomer.name}`
          });
        }
        
        emailDraftService.createDraftForCase(caseItem.id, {
          purpose: 'request_missing_information',
          originalSenderEmail: selectedEmail.senderEmail,
          originalSenderName: selectedEmail.senderName,
          originalSubject: selectedEmail.subject,
          requestedFields: extractedData.fehlendeDaten.map((field: string) => ({
            field: field,
            label: field,
            reason: 'Für die Angebotserstellung benötigt',
            required: true
          } as RequestedInformationField)),
          createdBy: 'ai'
        });
        statusMessagePrefix += `\n(KI hat einen E-Mail-Entwurf für fehlende Daten vorbereitet.)`;
      }

      // 2. Process Attachments and upload to Google Drive
      const driveToken = localStorage.getItem('google_access_token') || localStorage.getItem('ms_graph_access_token');
      const attachmentsToSave = selectedEmail.attachments ? selectedEmail.attachments.filter(a => !a.isInline) : [];

      let savedCount = 0;
      let driveFolderUploaded = false;

      let folderId: string | null = null;
      if (driveToken && targetCustomer?.name) {
        try {
          folderId = await getOrCreateCustomerFolder(driveToken, targetCustomer.name);
        } catch (fErr) {
          console.warn('Google Drive Ordner konnte nicht geöffnet oder erstellt werden:', fErr);
        }
      }

      if (attachmentsToSave.length > 0) {
        for (const att of attachmentsToSave) {
          let fileObj: File | null = null;
          if (att.contentBytes) {
            try {
              const byteCharacters = atob(att.contentBytes);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: att.contentType || 'application/octet-stream' });
              fileObj = new File([blob], att.name, { type: att.contentType || 'application/octet-stream' });
            } catch (e) {
              console.warn('Error converting attachment base64:', e);
            }
          }

          if (!fileObj) {
            const blob = new Blob([`Anhang aus E-Mail: ${att.name}\nAbsender: ${selectedEmail.senderName}\nBetreff: ${selectedEmail.subject}`], { type: 'text/plain' });
            fileObj = new File([blob], att.name, { type: 'text/plain' });
          }

          if (driveToken && folderId && fileObj) {
            try {
              await uploadFileToDrive(driveToken, fileObj, folderId);
              driveFolderUploaded = true;
            } catch (uErr) {
              console.warn(`Drive upload failed for ${att.name}:`, uErr);
            }
          }
          savedCount++;
        }
      } else {
        const emailFileName = `E-Mail_${(selectedEmail.subject || 'Anfrage').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30)}.txt`;
        const emailBlob = new Blob([emailContent], { type: 'text/plain;charset=utf-8' });
        const emailFile = new File([emailBlob], emailFileName, { type: 'text/plain' });

        if (driveToken && folderId) {
          try {
            await uploadFileToDrive(driveToken, emailFile, folderId);
            driveFolderUploaded = true;
          } catch (uErr) {
            console.warn('Drive upload failed for email file:', uErr);
          }
        }
        savedCount = 1;
      }

      setSuccessModalInfo({
        title: 'Anhänge & Dokumente gespeichert',
        message: `${statusMessagePrefix}\n\nEs wurden ${savedCount} Dokument(e)/Anhang(e) für "${targetCustomer.name}" verarbeitet${driveFolderUploaded ? ' und direkt in Google Drive gespeichert' : ' und zu den Kundendokumenten hinzugefügt'}.`,
        customerId: targetCustomer.id
      });

    } catch (err: any) {
      console.error('Error saving attachments:', err);
      alert(`Fehler beim Speichern der Anhänge: ${err?.message || err}`);
    } finally {
      setIsSavingAttachments(false);
    }
  };

  // Handler 2: Create or Update calendar event from email thread via AI
  const handleCreateCalendarEventFromEmail = async () => {
    if (!selectedEmail) return;
    setIsExtractingCalendar(true);
    try {
      const threadMails = getEmailThreadForSelectedEmail(selectedEmail, emails);
      const emailContent = threadMails.map((mail, idx) => `
=== E-MAIL NACHRICHT ${idx + 1} VON ${threadMails.length} ${idx === threadMails.length - 1 ? '(NEUESTE NACHRICHT - HAT VORRANG BEI ÄNDERUNGEN!)' : ''} ===
Datum: ${format(new Date(mail.timestamp), 'dd.MM.yyyy HH:mm')}
Von: ${mail.senderName} <${mail.senderEmail}>
Betreff: ${mail.subject}

Inhalt / Text:
${mail.body || (mail.htmlBody ? mail.htmlBody.replace(/<[^>]+>/g, ' ') : '')}
`).join('\n\n--------------------------------------------------\n\n');

      const senderEmailLower = selectedEmail.senderEmail.toLowerCase();

      // Check database for matching customer
      const matchedCustomer = customers.find(c => {
        if (c.email && c.email.toLowerCase() === senderEmailLower) return true;
        if (c.name && selectedEmail.senderName && c.name.toLowerCase().includes(selectedEmail.senderName.toLowerCase())) return true;
        return false;
      });

      const res = await apiFetch('/api/ai/extract-customer-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: emailContent,
          existingCustomer: matchedCustomer || null
        })
      });

      let extractedData: any = {};
      if (res.ok) {
        extractedData = await res.json();
      }

      const customerName = matchedCustomer ? matchedCustomer.name : (extractedData.name || selectedEmail.senderName);
      const eventTitle = `KOMM: ${customerName}`;

      // Date logic
      let targetDate = format(new Date(), 'yyyy-MM-dd');
      if (extractedData.umzugsdetails?.gewuenschterUmzugstermin) {
        const rawDate = extractedData.umzugsdetails.gewuenschterUmzugstermin;
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(rawDate)) {
          const parts = rawDate.split('.');
          targetDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          targetDate = rawDate;
        }
      } else {
        const match = (selectedEmail.subject + ' ' + selectedEmail.body).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (match) {
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          const year = match[3];
          targetDate = `${year}-${month}-${day}`;
        }
      }

      const startTime = extractedData.umzugsdetails?.voraussichtlicheStartzeit || '08:00';
      const endTime = '12:00';

      const abholStrasse = extractedData.abholadresse?.strasse || (matchedCustomer?.abholadresse as any)?.strasse || '';
      const abholStock = extractedData.abholadresse?.stockwerk || extractedData.abholadresse?.etage || (matchedCustomer?.abholadresse as any)?.stockwerk || (matchedCustomer?.abholadresse as any)?.etage || '';
      const abholLift = extractedData.abholadresse?.aufzug || ((matchedCustomer?.abholadresse as any)?.lift ? 'Ja' : 'Nein');

      const zielStrasse = extractedData.zieladresse?.strasse || (matchedCustomer?.zieladresse as any)?.strasse || '';
      const zielStock = extractedData.zieladresse?.stockwerk || extractedData.zieladresse?.etage || (matchedCustomer?.zieladresse as any)?.stockwerk || (matchedCustomer?.zieladresse as any)?.etage || '';
      const zielLift = extractedData.zieladresse?.aufzug || ((matchedCustomer?.zieladresse as any)?.lift ? 'Ja' : 'Nein');

      let m3Val = '25';
      if ((matchedCustomer as any)?.volumenM3) {
        m3Val = String((matchedCustomer as any).volumenM3);
      } else if (extractedData.gegenstaende) {
        let countSum = 0;
        Object.values(extractedData.gegenstaende).forEach((v: any) => {
          const n = parseInt(String(v), 10);
          if (!isNaN(n)) countSum += n;
        });
        if (countSum > 0) m3Val = String(Math.max(10, Math.round(countSum * 0.8)));
      }

      const personenCount = '3 Personen';
      const montageInfo = extractedData.nebenleistungen?.moebelmontage ? 'Ja' : (extractedData.anmerkungen?.toLowerCase().includes('montage') ? 'Ja' : 'Nein');
      const eingeteiltePersonen = 'Noch nicht eingeteilt';

      const descLines = [
        `Abholadresse: ${abholStrasse || 'Nicht angegeben'}${abholStock ? `, Stockwerk: ${abholStock}` : ''}${abholLift ? ` (Lift: ${abholLift})` : ''}`,
        `Zieladresse / Zubringadresse: ${zielStrasse || 'Nicht angegeben'}${zielStock ? `, Stockwerk: ${zielStock}` : ''}${zielLift ? ` (Lift: ${zielLift})` : ''}`,
        `m³: ${m3Val} m³`,
        `Personen: ${personenCount}`,
        `Montage: ${montageInfo}`,
        `Eingeteilte Personen: ${eingeteiltePersonen}`,
        extractedData.anmerkungen ? `Anmerkungen: ${extractedData.anmerkungen}` : ''
      ].filter(Boolean).join('\n');

      // Check if a calendar event already exists for this customer or title
      const existingEventIndex = calendarEvents.findIndex(e =>
        (matchedCustomer?.id && e.customerId === matchedCustomer.id) ||
        e.title.toLowerCase().includes(customerName.toLowerCase())
      );

      if (existingEventIndex >= 0) {
        // UPDATE existing calendar event
        const existingEv = calendarEvents[existingEventIndex];
        const updatedEvent: CalendarEvent = {
          ...existingEv,
          title: eventTitle,
          startDate: targetDate,
          startTime: startTime,
          endTime: endTime,
          location: abholStrasse || existingEv.location,
          description: descLines,
          customerId: matchedCustomer?.id || existingEv.customerId,
          moveDetails: {
            abholadresse: abholStrasse || existingEv.moveDetails?.abholadresse || '',
            abholStockwerk: abholStock || existingEv.moveDetails?.abholStockwerk || '',
            abholLift: abholLift || existingEv.moveDetails?.abholLift || '',
            zieladresse: zielStrasse || existingEv.moveDetails?.zieladresse || '',
            zielStockwerk: zielStock || existingEv.moveDetails?.zielStockwerk || '',
            zielLift: zielLift || existingEv.moveDetails?.zielLift || '',
            m3: m3Val || existingEv.moveDetails?.m3 || '25',
            personenCount: personenCount,
            montageInfo: montageInfo,
            eingeteiltePersonen: existingEv.moveDetails?.eingeteiltePersonen || eingeteiltePersonen,
            anmerkungen: extractedData.anmerkungen || existingEv.moveDetails?.anmerkungen
          }
        };

        const updatedEvents = [...calendarEvents];
        updatedEvents[existingEventIndex] = updatedEvent;
        setCalendarEvents(updatedEvents);
        setSelectedEvent(updatedEvent);
        persistentSet(EVENTS_KEY, updatedEvents).catch(console.error);

        setSuccessModalInfo({
          title: 'Kalendereintrag auf neuestem Stand',
          message: `Der bestehende Kalendereintrag für "${customerName}" wurde erfolgreich mit den neuesten Daten aus dem E-Mail-Verlauf überarbeitet.`,
          customerId: matchedCustomer?.id
        });
      } else {
        // CREATE new calendar event
        const newEvent: CalendarEvent = {
          id: 'evt-' + Date.now(),
          title: eventTitle,
          startDate: targetDate,
          startTime: startTime,
          endTime: endTime,
          location: abholStrasse,
          description: descLines,
          category: 'Umzug',
          customerId: matchedCustomer?.id,
          moveDetails: {
            abholadresse: abholStrasse,
            abholStockwerk: abholStock,
            abholLift: abholLift,
            zieladresse: zielStrasse,
            zielStockwerk: zielStock,
            zielLift: zielLift,
            m3: m3Val,
            personenCount: personenCount,
            montageInfo: montageInfo,
            eingeteiltePersonen: eingeteiltePersonen,
            anmerkungen: extractedData.anmerkungen
          }
        };

        const updatedEvents = [...calendarEvents, newEvent];
        setCalendarEvents(updatedEvents);
        setSelectedEvent(newEvent);
        persistentSet(EVENTS_KEY, updatedEvents).catch(console.error);

        setSuccessModalInfo({
          title: 'Kalendereintrag erstellt',
          message: `Der Kalendereintrag für "${customerName}" am ${targetDate} wurde erfolgreich per KI angelegt.`,
          customerId: matchedCustomer?.id
        });
      }
    } catch (err) {
      console.error('Calendar extraction error:', err);
      alert('Fehler beim Erstellen oder Aktualisieren des Kalendereintrags.');
    } finally {
      setIsExtractingCalendar(false);
    }
  };

  // Handler 3: Print Lieferschein for selected calendar event
  const handlePrintLieferschein = async (event: CalendarEvent) => {
    let cust = customers.find(c => c.id === event.customerId);
    const custName = event.title.replace(/^KOMM:\s*/i, '');

    if (!cust) {
      cust = {
        id: 'temp-' + Date.now(),
        name: custName,
        nameLower: custName.toLowerCase(),
        avatarUrl: `https://picsum.photos/seed/temp-${Date.now()}/40/40`,
        createdAt: new Date().toISOString(),
        email: selectedEmail?.senderEmail || '',
        phone: '',
        address: { street: event.moveDetails?.abholadresse || event.location || '', city: '', zip: '', country: 'Österreich' },
        abholadresse: {
          strasse: event.moveDetails?.abholadresse || event.location || '',
          stockwerk: event.moveDetails?.abholStockwerk || ''
        },
        zieladresse: {
          strasse: event.moveDetails?.zieladresse || '',
          stockwerk: event.moveDetails?.zielStockwerk || ''
        }
      } as Customer;
    }

    const docNumber = 'LS-' + format(new Date(), 'yyyyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);

    const custAbhol = (cust.abholadresse as any) || {};
    const custZiel = (cust.zieladresse as any) || {};

    const job = {
      id: 'job-' + Date.now(),
      scheduledAt: event.startDate,
      abholadresse: {
        strasse: event.moveDetails?.abholadresse || event.location || custAbhol.strasse || '',
        stockwerk: event.moveDetails?.abholStockwerk || custAbhol.stockwerk || custAbhol.etage || '',
        aufzug: event.moveDetails?.abholLift || (custAbhol.lift ? 'Ja' : 'Nein')
      },
      zieladresse: {
        strasse: event.moveDetails?.zieladresse || custZiel.strasse || '',
        stockwerk: event.moveDetails?.zielStockwerk || custZiel.stockwerk || custZiel.etage || '',
        aufzug: event.moveDetails?.zielLift || (custZiel.lift ? 'Ja' : 'Nein')
      }
    };

    const totalM3 = parseFloat(event.moveDetails?.m3 || '25') || 25;
    const workers = event.moveDetails?.eingeteiltePersonen ? event.moveDetails.eingeteiltePersonen.split(',').map(s => s.trim()) : ['Fahrer / Team'];
    const gegenstaende = [
      { name: 'Umzugsgut & Verpackungsmaterial laut Kalendereintrag', count: '1 Pauschale' }
    ];

    try {
      await generateLieferscheinPDF(
        cust,
        job as any,
        gegenstaende,
        workers,
        event.description || `Kalendereintrag: ${event.title}`,
        logo2,
        'save',
        docNumber,
        totalM3,
        event.startTime || '08:00',
        event.endTime || '12:00'
      );
    } catch (err) {
      console.error('Error generating Lieferschein:', err);
      alert('Lieferschein-PDF konnte nicht erstellt werden.');
    }
  };

  useEffect(() => {
    Promise.all([
      persistentGet<EmailMessage[]>(EMAILS_KEY),
      persistentGet<CalendarEvent[]>(EVENTS_KEY)
    ]).then(([savedEmails, savedEvents]) => {
      let evts = savedEvents;
      if (!evts) {
         const ls = localStorage.getItem(EVENTS_KEY);
         if (ls) { try { evts = JSON.parse(ls); } catch(e) {} }
      }
      if (evts) setCalendarEvents(evts);

      let ems = savedEmails;
      if (!ems) {
         const ls = localStorage.getItem(EMAILS_KEY);
         if (ls) { try { ems = JSON.parse(ls); } catch(e) {} }
      }

      if (ems && ems.length > 0) {
         const savedRulesJson = localStorage.getItem('email_sender_rules');
         const senderRules = savedRulesJson ? JSON.parse(savedRulesJson) : {};
         // Re-apply categories to ensure they are up to date with DB and rules
         const updatedEms = ems.map((m: any) => ({
             ...m,
             category: getLocalCategory(m, customers, evts || [], senderRules)
         }));
         setEmails(updatedEms);
      }

      setDataLoaded(true);
    });
  }, [customers]); // Add customers to dependency array so it updates when customers are loaded

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Save to idb whenever it changes
  useEffect(() => {
    if (dataLoaded) {
      persistentSet(EMAILS_KEY, emails).catch(console.error);
      if (localStorage.getItem(EMAILS_KEY)) localStorage.removeItem(EMAILS_KEY);

      // Dispatch task count for AI & Workspace tab
      const kundenCount = emails.filter(e => e.folder === 'inbox' && !e.isRead && checkEmailCategory(e, 'Kunden')).length;
      const wichtigCount = emails.filter(e => e.folder === 'inbox' && !e.isRead && checkEmailCategory(e, 'Wichtig')).length;
      window.dispatchEvent(new CustomEvent('mail-tasks-count', { detail: kundenCount + wichtigCount }));
    }
  }, [emails, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      persistentSet(EVENTS_KEY, calendarEvents).catch(console.error);
      if (localStorage.getItem(EVENTS_KEY)) localStorage.removeItem(EVENTS_KEY);
    }
  }, [calendarEvents, dataLoaded]);

  useEffect(() => {
    const handleAddCalendarEvent = (e: CustomEvent<CalendarEvent>) => {
      setCalendarEvents(prev => [...prev, e.detail]);
    };
    window.addEventListener('add_calendar_event', handleAddCalendarEvent as EventListener);
    return () => window.removeEventListener('add_calendar_event', handleAddCalendarEvent as EventListener);
  }, []);


  // Auto-sync every 10 minutes
  useEffect(() => {
    const sync = () => {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        setLastSync(new Date());
      }, 1000);
    };
    const interval = setInterval(sync, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);


  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('outlook_logged_in') === 'true' && !!localStorage.getItem('ms_graph_access_token');
  });


  const syncWithGraph = async () => {
    const token = localStorage.getItem('ms_graph_access_token');
    if (!token) return;

    setIsSyncing(true);
    try {
      // Fetch Emails from multiple folders
      const foldersToFetch = [
        { graphId: 'inbox', appFolder: 'inbox' },
        { graphId: 'sentitems', appFolder: 'sent' },
        { graphId: 'drafts', appFolder: 'drafts' },
        { graphId: 'deleteditems', appFolder: 'trash' }
      ];

      const savedRulesJson = localStorage.getItem('email_sender_rules');
      const senderRules = savedRulesJson ? JSON.parse(savedRulesJson) : {};

      let allMappedEmails: any[] = [];

      await Promise.all(foldersToFetch.map(async (f) => {
        try {
          const mailRes = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${f.graphId}/messages?$top=50&$orderby=receivedDateTime DESC&$select=id,internetMessageId,conversationId,from,toRecipients,ccRecipients,subject,body,bodyPreview,receivedDateTime,sentDateTime,isRead,hasAttachments,importance,categories,webLink`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (mailRes.ok) {
            const mailData = await mailRes.json();
            const mappedEmails = mailData.value.map((m: any) => {
              let htmlBody = undefined;
              let textBody = m.bodyPreview || '';
              if (m.body && m.body.contentType === 'html') {
                htmlBody = m.body.content;
              } else if (m.body && m.body.contentType === 'text') {
                textBody = m.body.content;
              }

              const senderEmail = m.from?.emailAddress?.address || '';
              const recipientEmail = m.toRecipients?.[0]?.emailAddress?.address || '';
              const subject = m.subject || '(Ohne Betreff)';
              const senderNameStr = m.from?.emailAddress?.name || '';
              const mockM = { senderEmail, senderName: senderNameStr, recipientEmail, subject, preview: textBody };
              let category = getLocalCategory(mockM, customers, calendarEvents, senderRules);

              return {
                id: m.id,
                folder: f.appFolder,
                senderName: m.from?.emailAddress?.name || 'Unbekannt',
                senderEmail: senderEmail,
                recipientEmail: m.toRecipients?.[0]?.emailAddress?.address || '',
                subject: subject,
                body: textBody,
                htmlBody: htmlBody,
                timestamp: m.receivedDateTime,
                isRead: m.isRead,
                category: category,
                hasAttachment: m.hasAttachments,
                attachments: []
              };
            });
            allMappedEmails = [...allMappedEmails, ...mappedEmails];

            if (f.appFolder === 'inbox') {
              const syncMetadata = caseService.getOutlookSyncMetadata();
              const cutoffTime = syncMetadata.lastSuccessfulMailSyncAt
                ? Number(syncMetadata.lastSuccessfulMailSyncAt)
                : Date.now() - 24 * 60 * 60 * 1000;

              for (const message of mailData.value) {
                const receivedTime = new Date(message.receivedDateTime).getTime();
                if (receivedTime <= cutoffTime || caseService.hasProcessedOutlookMessage(message.id)) continue;

                caseService.markOutlookMessageProcessing(message.id);
                try {
                  emitEvent('EMAIL_RECEIVED', 'System', {
                    graphMessageId: message.id,
                    internetMessageId: message.internetMessageId,
                    conversationId: message.conversationId,
                    receivedDateTime: message.receivedDateTime,
                    sentDateTime: message.sentDateTime,
                    senderName: message.from?.emailAddress?.name || 'Unbekannt',
                    senderEmail: message.from?.emailAddress?.address || '',
                    recipients: (message.toRecipients || []).map((recipient: any) => recipient.emailAddress?.address),
                    ccRecipients: (message.ccRecipients || []).map((recipient: any) => recipient.emailAddress?.address),
                    subject: message.subject || '',
                    bodyText: normalizeEmailBody(message.body?.content || message.bodyPreview || '', message.body?.contentType),
                    bodyPreview: message.bodyPreview || '',
                    hasAttachments: !!message.hasAttachments,
                    importance: message.importance || 'normal',
                    isRead: !!message.isRead,
                    webLink: message.webLink,
                    sourceFolder: 'inbox',
                    rawMetadata: { id: message.id, conversationId: message.conversationId }
                  });
                  caseService.registerProcessedOutlookMessage(message.id);
                } catch (error) {
                  console.error('E-Mail konnte nicht an den Workflow übergeben werden:', error);
                  caseService.unmarkOutlookMessageProcessing(message.id);
                }
              }

              caseService.updateOutlookSyncMetadata({
                lastSuccessfulMailSyncAt: Date.now().toString()
              });
            }
          }
        } catch (e) {
          console.error(`Error fetching folder ${f.graphId}`, e);
        }
      }));

      if (allMappedEmails.length > 0) {
        setEmails(prevEmails => {
          const emailMap = new Map(prevEmails.map(e => [e.id, e]));
          const newlyAdded: any[] = [];

          allMappedEmails.forEach((m: any) => {
            if (emailMap.has(m.id)) {
              // Update status
              const existing = emailMap.get(m.id)!;
              emailMap.set(m.id, {
                ...existing,
                isRead: m.isRead,
                folder: m.folder,
              });
            } else {
              emailMap.set(m.id, m);
              if (m.folder === 'inbox' && m.category === 'Sonstige') {
                newlyAdded.push(m);
              }
            }
          });

          const merged = Array.from(emailMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          if (newlyAdded.length > 0) {
            // Trigger background AI categorization for newly added emails
            const savedLearnedRules = localStorage.getItem('email_learned_rules');
            const learnedRules = savedLearnedRules ? JSON.parse(savedLearnedRules) : [];
            apiFetch('/api/ai/categorize-emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ emails: newlyAdded, learnedRules })
            }).then(res => res.json()).then(categoryMap => {
              if (categoryMap && Object.keys(categoryMap).length > 0) {
                // Re-load senderRules to ensure we don't overwrite manual rules
                const savedRulesJson = localStorage.getItem('email_sender_rules');
                const senderRules = savedRulesJson ? JSON.parse(savedRulesJson) : {};

                setEmails(currentEmails => {
                  return currentEmails.map(email => {
                    if (categoryMap[email.id]) {
                      const senderEmail = (email.senderEmail || '').toLowerCase();
                      const senderName = (email.senderName || '').toLowerCase();

                      // DO NOT OVERWRITE if there's a manual rule
                      if (senderRules[senderEmail]) return email;

                      // DO NOT OVERWRITE GW Rule
                      if (isGebruederWeissSender(senderEmail, senderName)) return email;

                      // DO NOT OVERWRITE if already Kunden or Wichtig by local logic (meaning strict rules matched)
                      if (email.category === 'Kunden' || email.category === 'Wichtig') return email;

                      const learnedCategory = categoryMap[email.id] === 'Kundenanfragen' ? 'Kunden' : categoryMap[email.id];
                      return { ...email, category: learnedCategory as EmailCategoryType };
                    }
                    return email;
                  });
                });
              }
            }).catch(e => console.error('Failed to categorize new emails:', e));
          }

          return merged;
        });
      }

      // Fetch Calendar Events (Whole year)
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 11, 31);
      const startStr = encodeURIComponent(start.toISOString());
      const endStr = encodeURIComponent(end.toISOString());

      const calRes = await fetch(`https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startStr}&endDateTime=${endStr}&$top=500&$orderby=start/dateTime`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (calRes.ok) {
        const calData = await calRes.json();
        const mappedEvents: CalendarEvent[] = calData.value.map((e: any) => {
          let category: 'Umzug' | 'Besichtigung' | 'Büro' | 'Wartung' = 'Büro';
          const lowerSubject = (e.subject || '').toLowerCase();
          if (lowerSubject.includes('umzug')) category = 'Umzug';
          else if (lowerSubject.includes('besichtigung')) category = 'Besichtigung';
          else if (lowerSubject.includes('wartung')) category = 'Wartung';

          return {
            id: e.id,
            title: e.subject || 'Termin',
            startDate: e.start.dateTime.substring(0, 10),
            startTime: new Date(e.start.dateTime + 'Z').toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'}),
            endTime: new Date(e.end.dateTime + 'Z').toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'}),
            location: e.location?.displayName || '',
            description: e.bodyPreview || '',
            category: category
          };
        });
        setCalendarEvents(mappedEvents);
      }

      setLastSync(new Date());
    } catch (e) {
      console.error('Error fetching from Graph API:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      syncWithGraph();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleToken = () => {
      setIsLoggedIn(true);
      syncWithGraph();
    };
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MS_OAUTH_TOKEN' && event.data?.token) {
        if (event.data.isAccessToken) {
          localStorage.setItem('ms_graph_access_token', event.data.token);
          localStorage.setItem('outlook_logged_in', 'true');
          setIsLoggedIn(true);
          setOauthErrorMessage(null);
          syncWithGraph();
        } else {
          setOauthErrorMessage('⚠️ Es wurde nur ein ID-Token empfangen. Bitte im Azure Portal unter Authentifizierung den Haken bei "Zugriffstoken" setzen.');
          setShowAzureHelpModal(true);
        }
      } else if (event.data?.type === 'MS_OAUTH_ERROR') {
        setOauthErrorMessage(event.data.error || 'Fehler bei der Microsoft-Anmeldung.');
        setShowAzureHelpModal(true);
      }
    };

    window.addEventListener('ms_oauth_token_received', handleToken);
    window.addEventListener('message', handleWindowMessage);
    return () => {
      window.removeEventListener('ms_oauth_token_received', handleToken);
      window.removeEventListener('message', handleWindowMessage);
    };
  }, []);
  const [emailCategoryFilter, setEmailCategoryFilter] = useState<'Alle' | 'Kunden' | 'Sonstige' | 'Junk' | 'Wichtig'>('Alle');
  const [manualSyncing, setManualSyncing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);

  const learnFromCategoryCorrection = async (email: EmailMessage, newCategory: EmailCategoryType) => {
    if (email.category === newCategory) return;

    learningService.recordLearningRecord({
      actionType: 'email_category_rule',
      contextType: 'mail_training',
      detectedDecision: String(email.category),
      finalDecision: String(newCategory),
      result: 'corrected',
      confidence: 'high',
      originalData: { sender: email.senderEmail, subject: email.subject }
    });

    try {
      const response = await apiFetch('/api/ai/learn-email-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailText: `${email.subject || ''} ${email.bodyPreview || email.preview || email.body || ''}`,
          oldCategory: email.category,
          newCategory
        })
      });
      const data = await response.json();
      if (!data?.rule) return;

      const savedRules = localStorage.getItem('email_learned_rules');
      const learnedRules: string[] = savedRules ? JSON.parse(savedRules) : [];
      const nextRules = [...new Set([...learnedRules, String(data.rule)])].slice(-50);
      localStorage.setItem('email_learned_rules', JSON.stringify(nextRules));
    } catch (error) {
      console.error('E-Mail-Korrektur konnte nicht an die KI-Lernlogik übergeben werden:', error);
    }
  };

  const applySenderRule = (category: string) => {
    const savedRulesJson = localStorage.getItem('email_sender_rules');
    const senderRules = savedRulesJson ? JSON.parse(savedRulesJson) : {};

    const sendersToUpdate = new Set<string>();
    emails.forEach(m => {
       if (selectedEmailIds.includes(m.id)) sendersToUpdate.add(m.senderEmail.toLowerCase());
    });

    sendersToUpdate.forEach(sender => {
       senderRules[sender] = category;
    });
    localStorage.setItem('email_sender_rules', JSON.stringify(senderRules));

    const representativeEmails = Array.from(
      new Map(
        emails
          .filter(email => selectedEmailIds.includes(email.id))
          .map(email => [email.senderEmail.toLowerCase(), email] as const)
      ).values()
    ).slice(0, 10);
    void Promise.allSettled(
      representativeEmails.map(email => learnFromCategoryCorrection(email, category as EmailCategoryType))
    );

    setEmails(prev => prev.map(m => {
      if (sendersToUpdate.has(m.senderEmail.toLowerCase())) {
        return { ...m, category: category as EmailCategoryType };
      }
      return m;
    }));

    setIsEditMode(false);
    setSelectedEmailIds([]);
  };

  const [authConfig, setAuthConfig] = useState<{clientId: string, tenantId: string} | null>(null);
  const [showAzureHelpModal, setShowAzureHelpModal] = useState(false);
  const [oauthErrorMessage, setOauthErrorMessage] = useState<string | null>(null);
  const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState('');
  const [customTenantIdInput, setCustomTenantIdInput] = useState('');

  useEffect(() => {
    apiFetch('/api/config')
      .then(res => res.json())
      .then(config => {
        const customClient = localStorage.getItem('custom_azure_client_id');
        const customTenant = localStorage.getItem('custom_azure_tenant_id');
        const activeClient = customClient || config.azureClientId || 'c2c13ed9-7843-4dc7-b7ce-ceb8b91e0c53';
        const activeTenant = customTenant || config.azureTenantId || 'common';
        setAuthConfig({
          clientId: activeClient,
          tenantId: activeTenant
        });
        setCustomClientIdInput(activeClient);
        setCustomTenantIdInput(activeTenant);
      })
      .catch(e => {
        console.error('Failed to load auth config', e);
        const activeClient = localStorage.getItem('custom_azure_client_id') || 'c2c13ed9-7843-4dc7-b7ce-ceb8b91e0c53';
        const activeTenant = localStorage.getItem('custom_azure_tenant_id') || 'common';
        setAuthConfig({ clientId: activeClient, tenantId: activeTenant });
        setCustomClientIdInput(activeClient);
        setCustomTenantIdInput(activeTenant);
      });
  }, []);

  const loginWithMicrosoft = () => {
      const activeClientId = authConfig?.clientId || localStorage.getItem('custom_azure_client_id') || 'c2c13ed9-7843-4dc7-b7ce-ceb8b91e0c53';
      const activeTenantId = authConfig?.tenantId || localStorage.getItem('custom_azure_tenant_id') || 'common';

      if (!activeClientId) {
          setShowAzureHelpModal(true);
          return;
      }

      const scopes = 'User.Read Mail.ReadWrite Mail.Send Calendars.ReadWrite';
      const redirectUri = window.location.origin;
      const authUrl = `https://login.microsoftonline.com/${activeTenantId}/oauth2/v2.0/authorize?client_id=${activeClientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&prompt=select_account`;

      const width = 600;
      const height = 680;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(authUrl, 'Microsoft Login', `width=${width},height=${height},left=${left},top=${top}`);
  };

  // MAIL STATE
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

  // Resizable Panels State
  const [listWidth, setListWidth] = useState<number>(340);
  const [isResizingList, setIsResizingList] = useState(false);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingList(true);

    const startX = e.clientX;
    const startWidth = listWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(200, Math.min(800, startWidth + delta));
      setListWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingList(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if (target && dataLoaded) {
      if (target.type === 'mail') {
        setActiveSubView('mail');
        if (target.emailStr) {
          const emailStrLower = target.emailStr.toLowerCase();
          const found = emails.find(e => e.senderEmail?.toLowerCase() === emailStrLower || e.recipientEmail?.toLowerCase() === emailStrLower);
          if (found) {
            handleEmailSelect(found.id);
            if (target.openReply) {
              setTimeout(() => openCompose('reply', found), 300);
            }
          }
        }
      } else if (target.type === 'calendar') {
        setActiveSubView('calendar');
        // Kalendereinträge könnten wir durchsuchen, aber activeSubView reicht meist.
      }
    }
  }, [target, dataLoaded, emails]);

  const handleEmailSelect = async (mailId: string) => {
    setSelectedEmailId(mailId);
    const mail = emails.find(m => m.id === mailId);
    if (!mail) return;

    if (!mail.isRead) {
      setEmails(prev => prev.map(m => m.id === mailId ? { ...m, isRead: true } : m));
    }

    // Always fetch full details (including attachments) if we haven't yet or if we just want to ensure we have htmlBody.
    // Graph API sometimes truncates bodies in list view or we need attachments.
    const token = localStorage.getItem('ms_graph_access_token');
    if (token) {
      try {
        const detailRes = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${mailId}?$select=id,body,hasAttachments&$expand=attachments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          let htmlBody: string | undefined;
          let textBody = mail.body;
          if (detailData.body && detailData.body.contentType === 'html') {
            htmlBody = detailData.body.content;
          } else if (detailData.body && detailData.body.contentType === 'text') {
            textBody = detailData.body.content;
          }

          let attachments = [];
          if (detailData.attachments) {
            attachments = detailData.attachments.map((a: any) => ({
              id: a.id,
              name: a.name,
              contentType: a.contentType,
              size: a.size,
              contentBytes: a.contentBytes, // base64 string
              isInline: a.isInline,
              contentId: a.contentId
            }));

            // Replace cid references in htmlBody with base64 data URIs
            if (htmlBody) {
               for (const att of attachments) {
                  if (att.isInline && att.contentId && att.contentBytes) {
                     const cidClean = att.contentId.replace('<', '').replace('>', '');
                     const cidRef = `cid:${cidClean}`;
                     const dataUri = `data:${att.contentType};base64,${att.contentBytes}`;
                     htmlBody = htmlBody.split(cidRef).join(dataUri);
                  }
               }
            }
          }

          setEmails(prev => prev.map(m => m.id === mailId ? {
            ...m,
            htmlBody: htmlBody || m.htmlBody,
            body: textBody || m.body,
            attachments: attachments
          } : m));
        }
      } catch (err) {
        console.error('Error fetching email details:', err);
      }
    }
  };
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [deleteEmailId, setDeleteEmailId] = useState<string | null>(null);
  const [emailSearch, setEmailSearch] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);

  const [composeTo, setComposeTo] = useState('');

  const [composeAction, setComposeAction] = useState<'new' | 'reply' | 'replyAll' | 'forward'>('new');
  const [composeAttachments, setComposeAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeQuoted, setComposeQuoted] = useState('');

  // SIGNATURE STATE
  const SIGNATURES_KEY = 'outlook_signatures_v1';
  const [signatures, setSignatures] = useState<any[]>([]);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('');
  const [showSignatureManager, setShowSignatureManager] = useState(false);
  const [editingSignature, setEditingSignature] = useState<any | null>(null);

  useEffect(() => {
    persistentGet<{ id: string; name: string; content: string }[]>(SIGNATURES_KEY).then(saved => {
      if (saved) {
        setSignatures(saved);
        if (saved.length > 0) setSelectedSignatureId(saved[0].id);
      } else {
        const ls = localStorage.getItem(SIGNATURES_KEY);
        if (ls) {
          try {
            const parsed = JSON.parse(ls);
            setSignatures(parsed);
            if (parsed.length > 0) setSelectedSignatureId(parsed[0].id);
          } catch(e) {}
        }
      }
    });
  }, []);

  useEffect(() => {
    if (signatures.length > 0) {
      persistentSet(SIGNATURES_KEY, signatures).catch(console.error);
      localStorage.setItem(SIGNATURES_KEY, JSON.stringify(signatures));
    }
  }, [signatures]);

  // CALENDAR STATE
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newEventStartTime, setNewEventStartTime] = useState('09:00');
  const [newEventEndTime, setNewEventEndTime] = useState('10:00');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<'Umzug' | 'Besichtigung' | 'Büro' | 'Wartung'>('Umzug');
  const [newEventDesc, setNewEventDesc] = useState('');

  // Helpers for Mail

  const handleSendEmail = async (isDraft: boolean = false) => {
    if (!composeTo || !composeSubject) return;
    setIsSending(true);
    const token = localStorage.getItem("ms_graph_access_token");

    const activeSignature = signatures.find(s => s.id === selectedSignatureId);
    const finalHtmlBody = composeBody + (activeSignature ? '<br/><br/>' + activeSignature.content : '') + composeQuoted;

    try {
      const messageBody = {
        message: {
          subject: composeSubject,
          body: {
            contentType: "HTML",
            content: finalHtmlBody
          },
          toRecipients: [
            {
              emailAddress: {
                address: composeTo
              }
            }
          ],
          attachments: await Promise.all(composeAttachments.map(async (file) => {
            const buffer = await file.arrayBuffer();
            const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            return {
              "@odata.type": "#microsoft.graph.fileAttachment",
              name: file.name,
              contentType: file.type || "application/octet-stream",
              contentBytes: base64
            };
          }))
        },
        saveToSentItems: !isDraft
      };

      const endpoint = isDraft ? 'https://graph.microsoft.com/v1.0/me/messages' : 'https://graph.microsoft.com/v1.0/me/sendMail';

      if (token) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(isDraft ? messageBody.message : messageBody)
        });

        if (res.ok || res.status === 201 || res.status === 202) {
          alert(isDraft ? 'Entwurf gespeichert!' : 'E-Mail erfolgreich gesendet!');
          setShowComposeModal(false);
          setComposeTo('');
          setComposeSubject('');
          setComposeBody('');
          setComposeAttachments([]);
          setComposeAction('new');
        } else {
          const err = await res.json();
          console.error(err);
          alert('Fehler beim Senden/Speichern der E-Mail.');
        }
      } else {
        // Fallback local if no token
        const newMail: EmailMessage = {
          id: 'mail-' + Date.now(),
          folder: isDraft ? 'drafts' : 'sent',
          senderName: 'Spedition Hueber Office',
          senderEmail: 'office@spedition-hueber.at',
          recipientEmail: composeTo,
          subject: composeSubject,
          body: (composeBody + composeQuoted).replace(/<[^>]+>/g, ''), // strip tags for plain text fallback display if needed
          htmlBody: finalHtmlBody,
          timestamp: new Date().toISOString(),
          isRead: true,
          category: 'Allgemein'
        };
        setEmails(prev => [newMail, ...prev]);
        setShowComposeModal(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setComposeAttachments([]);
        setComposeAction('new');
      }
    } catch (e) {
      console.error(e);
      alert('Fehler beim Vorgang');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteEmail = () => {
    if (deleteEmailId) {
      setEmails(emails.filter(e => e.id !== deleteEmailId));
      if (selectedEmailId === deleteEmailId) setSelectedEmailId(null);
      setDeleteEmailId(null);
    }
  };

  const openCompose = (action: 'new' | 'reply' | 'replyAll' | 'forward', mail?: EmailMessage) => {
    setComposeAction(action);
    setComposeAttachments([]);
    setComposeBody('');
    if ((action === 'reply' || action === 'replyAll') && mail) {
      setComposeTo(mail.senderEmail);
      setComposeSubject(mail.subject.startsWith('Re:') || mail.subject.startsWith('RE:') || mail.subject.startsWith('AW:') ? mail.subject : 'Re: ' + mail.subject);

      const quotedBody = mail.htmlBody || (mail.body ? mail.body.replace(/\n/g, '<br/>') : '');
      setComposeQuoted(`<br/><br/><div class="gmail_quote"><div dir="ltr" class="gmail_attr">Am ${new Date(mail.timestamp).toLocaleString('de-DE')} schrieb ${mail.senderName} &lt;${mail.senderEmail}&gt;:<br/></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">${quotedBody}</blockquote></div>`);
    } else if (action === 'forward' && mail) {
      setComposeTo('');
      setComposeSubject(mail.subject.startsWith('Fwd:') || mail.subject.startsWith('FW:') || mail.subject.startsWith('WG:') ? mail.subject : 'Fwd: ' + mail.subject);
      const forwardedBody = mail.htmlBody || (mail.body ? mail.body.replace(/\n/g, '<br/>') : '');
      setComposeQuoted(`<br/><br/><div dir="ltr">---------- Weitergeleitete Nachricht ----------<br/>Von: <b>${mail.senderName}</b> &lt;${mail.senderEmail}&gt;<br/>Datum: ${new Date(mail.timestamp).toLocaleString('de-DE')}<br/>Betreff: ${mail.subject}<br/>An: &lt;${mail.recipientEmail}&gt;<br/></div><br/><div>${forwardedBody}</div>`);
    } else {
      setComposeTo('');
      setComposeSubject('');
      setComposeQuoted('');
    }
    setShowComposeModal(true);
  };


  const checkEmailCategory = (e: EmailMessage, cat: string) => {
    if (cat === 'Alle') {
        return e.category !== 'Junk';
    }
    return e.category === cat ||
           (cat === 'Kunden' && (e.category === 'Anfrage' || e.category === 'Auftrag')) ||
           (cat === 'Wichtig' && e.category === 'Rechnung');
  };

  const filteredEmails = emails.filter(e => {
    if (e.folder !== activeFolder) return false;
    if (emailSearch && !e.subject.toLowerCase().includes(emailSearch.toLowerCase()) && !e.senderName.toLowerCase().includes(emailSearch.toLowerCase())) return false;

    return checkEmailCategory(e, emailCategoryFilter);
  });

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  // Helpers for Calendar
  const handleSaveEvent = () => {
    const evt: CalendarEvent = {
      id: 'evt-' + Date.now(),
      title: newEventTitle,
      startDate: newEventDate,
      startTime: newEventStartTime,
      endTime: newEventEndTime,
      location: newEventLocation,
      description: newEventDesc,
      category: newEventCategory
    };
    setCalendarEvents(prev => [...prev, evt]);
    setShowNewEventModal(false);

    // reset
    setNewEventTitle('');
    setNewEventLocation('');
    setNewEventDesc('');
  };

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarEvents.filter(e => e.startDate === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Calendar views
  const renderCalendarMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase">{day}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const dayEvents = getEventsForDay(day);

            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] border-r border-b border-slate-100 p-1.5 flex flex-col ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'}`}
                onClick={() => {
                  setNewEventDate(format(day, 'yyyy-MM-dd'));
                  setShowNewEventModal(true);
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {dayEvents.map(evt => {
                    const matchedCust = findCustomerForCalendarEvent(evt, customers);
                    const hasEmail = checkCalendarEmailMatch(evt, emails);

                    return (
                      <div
                        key={evt.id}
                        className="text-[10px] leading-tight p-1 rounded bg-blue-50 text-blue-700 border border-blue-100 cursor-pointer hover:bg-blue-100 flex items-center justify-between"
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                      >
                        <span className="truncate">
                          <span className="font-bold">{evt.startTime}</span> {evt.title}
                        </span>
                        <div className="flex items-center space-x-0.5 shrink-0 ml-0.5">
                          {matchedCust && <span title={`Kunde: ${matchedCust.name}`}><User className="w-2.5 h-2.5 text-indigo-600" /></span>}
                          {hasEmail && <span title="E-Mail Match"><Mail className="w-2.5 h-2.5 text-purple-600" /></span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarWeek = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {days.map(day => (
            <div key={day.toString()} className="py-2 text-center text-xs text-slate-600 border-r border-slate-200">
              <span className="block font-bold uppercase">{format(day, 'EEEEEE', { locale: de })}</span>
              <span className={`inline-block w-6 h-6 leading-6 rounded-full mt-1 ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white' : ''}`}>{format(day, 'd')}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 overflow-y-auto">
          {days.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div key={day.toString()} className="border-r border-slate-100 p-2 space-y-2 relative min-h-[500px]" onClick={() => {
                setNewEventDate(format(day, 'yyyy-MM-dd'));
                setShowNewEventModal(true);
              }}>
                {dayEvents.map(evt => {
                  const matchedCust = findCustomerForCalendarEvent(evt, customers);
                  const hasEmail = checkCalendarEmailMatch(evt, emails);

                  return (
                    <div key={evt.id} className="text-xs p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 cursor-pointer hover:bg-blue-100 shadow-sm" onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}>
                      <div className="font-bold flex justify-between items-center">
                        <span>{evt.startTime} - {evt.endTime}</span>
                        <div className="flex items-center space-x-1 shrink-0">
                          {matchedCust && <span title={`Kunde: ${matchedCust.name}`}><User className="w-3 h-3 text-indigo-600" /></span>}
                          {hasEmail && <span title="E-Mail Match"><Mail className="w-3 h-3 text-purple-600" /></span>}
                        </div>
                      </div>
                      <div className="font-semibold truncate">{evt.title}</div>
                      {evt.location && <div className="text-[10px] text-blue-600 mt-0.5 truncate">{evt.location}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarDay = () => {
    const dayEvents = getEventsForDay(currentDate);

    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">{format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de })}</h3>
          <button onClick={() => {
             setNewEventDate(format(currentDate, 'yyyy-MM-dd'));
             setShowNewEventModal(true);
          }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Neuer Termin</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {dayEvents.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Keine Termine an diesem Tag</p>
            </div>
          ) : (
            dayEvents.map(evt => {
              const matchedCust = findCustomerForCalendarEvent(evt, customers);
              const hasEmail = checkCalendarEmailMatch(evt, emails);

              return (
                <div key={evt.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }} className="cursor-pointer flex space-x-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-white shadow-sm">
                  <div className="flex flex-col items-center justify-center shrink-0 w-20 border-r border-slate-100 pr-4">
                    <span className="font-black text-slate-800">{evt.startTime}</span>
                    <span className="text-xs font-bold text-slate-400">{evt.endTime}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">{evt.title}</h4>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {matchedCust && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded border border-indigo-200" title={`Kunde: ${matchedCust.name}`}>
                            <User className="w-3 h-3 text-indigo-600 mr-0.5" />
                            <span>{matchedCust.name}</span>
                          </span>
                        )}
                        {hasEmail && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded border border-purple-200" title="E-Mail Match">
                            <Mail className="w-3 h-3 text-purple-600 mr-0.5" />
                            <span>Mail</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {evt.location && <p className="text-xs text-slate-500 flex items-center mb-1"><MapPin className="w-3 h-3 mr-1"/> {evt.location}</p>}
                    {evt.description && <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">{evt.description}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full md:h-full flex flex-col space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white relative overflow-hidden flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
              {activeSubView === 'mail' ? <Mail className="w-6 h-6" /> : <CalendarIcon className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Mail & Outlook Kalender</h2>
              <p className="text-xs text-slate-400 flex items-center space-x-2 mt-1">
                <span className="flex items-center"><User className="w-3 h-3 mr-1" /> office@spedition-hueber.at</span>
                <span>•</span>
                <span className="flex items-center">
                  <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin text-indigo-500' : 'text-slate-400'}`} />
                  Zuletzt aktualisiert: {format(lastSync, 'HH:mm')}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveSubView('mail')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-all ${activeSubView === 'mail' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
              >
                <Mail className="w-4 h-4" />
                <span>Postfach</span>
              </button>
              <button
                onClick={() => setActiveSubView('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-all ${activeSubView === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Kalender</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAzureHelpModal(true)}
                  title="Azure AD / Outlook OAuth Setup & Redirect URI Hilfe"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                  <span>OAuth / Redirect URI</span>
                </button>
                <button
                  onClick={() => {
                      setManualSyncing(true);
                      setTimeout(() => {
                          setManualSyncing(false);
                          setLastSync(new Date());
                      }, 1000);
                  }}
                  disabled={!isLoggedIn}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${manualSyncing ? 'animate-spin text-indigo-500' : ''}`} />
                  <span>Synchronisieren</span>
                </button>
                <button
                  onClick={() => {
                      if (isLoggedIn) {
                          setIsLoggedIn(false);
                          localStorage.setItem('outlook_logged_in', 'false');
                          localStorage.removeItem('ms_graph_access_token');
                      } else {
                          loginWithMicrosoft();
                      }
                  }}
                  className={`border text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 ${isLoggedIn ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'}`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isLoggedIn ? 'Abmelden' : 'Anmelden'}</span>
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-y-auto md:overflow-hidden min-h-[600px] md:h-full">
        {activeSubView === 'mail' && (
          <div className="w-full h-full flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 relative">

            {/* Mail Sidebar */}
            <div className={`flex-shrink-0 flex flex-col space-y-4 transition-all duration-300 ${isSidebarCollapsed ? 'w-full md:w-16' : 'w-full md:w-64'}`}>
              {isSidebarCollapsed ? (
                <>
                  <button
                    onClick={() => openCompose('new')}
                    title="Neue E-Mail"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col items-center py-3 space-y-3">
                    <button
                      onClick={() => setIsSidebarCollapsed(false)}
                      title="Ordner & Menü ausklappen"
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="w-8 border-b border-slate-200 my-1"></div>

                    {/* Folder Icons with Tooltips & Badges */}
                    <button
                      onClick={() => setActiveFolder('inbox')}
                      title={`Posteingang (${emails.filter(e => e.folder === 'inbox' && !e.isRead).length})`}
                      className={`relative p-3 rounded-xl transition-colors flex items-center justify-center ${activeFolder === 'inbox' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Inbox className="w-5 h-5" />
                      {emails.filter(e => e.folder === 'inbox' && !e.isRead).length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {emails.filter(e => e.folder === 'inbox' && !e.isRead).length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveFolder('sent')}
                      title={`Gesendete Elemente (${emails.filter(e => e.folder === 'sent').length})`}
                      className={`relative p-3 rounded-xl transition-colors flex items-center justify-center ${activeFolder === 'sent' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Send className="w-5 h-5" />
                      {emails.filter(e => e.folder === 'sent').length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {emails.filter(e => e.folder === 'sent').length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveFolder('drafts')}
                      title="Entwürfe"
                      className={`p-3 rounded-xl transition-colors flex items-center justify-center ${activeFolder === 'drafts' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <FileText className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setActiveFolder('trash')}
                      title="Papierkorb"
                      className={`p-3 rounded-xl transition-colors flex items-center justify-center ${activeFolder === 'trash' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openCompose('new')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Neue E-Mail</span>
                    </button>
                    <button
                      onClick={() => setIsSidebarCollapsed(true)}
                      title="Seitenleiste einklappen"
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
                    <div className="p-3 border-b border-slate-100">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Suchen..."
                          value={emailSearch || ''}
                          onChange={e => setEmailSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-blue-500"
                        />
                      </div>
                    </div>
                    <div className="p-2 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50" onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Ordner</span>
                      <div className="flex items-center space-x-1">
                        <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
                          <svg className={`w-4 h-4 transition-transform ${isFoldersExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {isFoldersExpanded && (
                      <div className="p-2 space-y-1">
                        <button onClick={() => setActiveFolder('inbox')} className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${activeFolder === 'inbox' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <div className="flex items-center space-x-3"><Inbox className="w-4 h-4" /><span>Posteingang</span></div>
                          {emails.filter(e => e.folder === 'inbox' && !e.isRead).length > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{emails.filter(e => e.folder === 'inbox' && !e.isRead).length}</span>
                          )}
                        </button>
                        <button onClick={() => setActiveFolder('sent')} className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${activeFolder === 'sent' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <div className="flex items-center space-x-3"><Send className="w-4 h-4" /><span>Gesendete Elemente</span></div>
                          {emails.filter(e => e.folder === 'sent').length > 0 && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{emails.filter(e => e.folder === 'sent').length}</span>
                          )}
                        </button>
                        <button onClick={() => setActiveFolder('drafts')} className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${activeFolder === 'drafts' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <div className="flex items-center space-x-3"><FileText className="w-4 h-4" /><span>Entwürfe</span></div>
                        </button>
                        <button onClick={() => setActiveFolder('trash')} className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${activeFolder === 'trash' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <div className="flex items-center space-x-3"><Trash2 className="w-4 h-4" /><span>Papierkorb</span></div>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mail List */}
            {!isListCollapsed && (
              <div
                style={{ width: `${listWidth}px` }}
                className="flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-75"
              >
                <div className="border-b border-slate-100 bg-slate-50 flex flex-col">
                  <div
                    className="p-3 flex justify-between items-center bg-slate-50 border-b border-slate-100"
                  >
                    <span className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                      <span>{activeFolder === 'inbox' ? 'Posteingang' : activeFolder === 'sent' ? 'Gesendete Elemente' : activeFolder === 'drafts' ? 'Entwürfe' : 'Papierkorb'}</span>
                      <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        title="Mehrfachauswahl & Regeln bearbeiten"
                        className={`p-1 rounded transition-colors ${isEditMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                        title="Kategorien ausklappen / einklappen"
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      >
                        <svg className={`w-4 h-4 transition-transform ${isFiltersExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setIsListCollapsed(true)}
                        title="Posteingang Liste einklappen (Vollansicht für E-Mail)"
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEditMode && (
                    <div className="p-2 border-b border-slate-100 bg-indigo-50 flex flex-col space-y-2">
                      <div className="text-[10px] font-bold text-indigo-800">
                        {selectedEmailIds.length} ausgewählt. Absender für Zukunft einordnen als:
                      </div>
                      <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
                        {['Kunden', 'Wichtig', 'Sonstige', 'Junk'].map(cat => (
                           <button
                             key={cat}
                             disabled={selectedEmailIds.length === 0}
                             onClick={() => applySenderRule(cat)}
                             className="px-2 py-1 bg-white border border-indigo-200 text-indigo-700 rounded text-[10px] font-bold hover:bg-indigo-100 disabled:opacity-50 whitespace-nowrap"
                           >
                             {cat}
                           </button>
                        ))}
                      </div>
                    </div>
                  )}
                {isFiltersExpanded && (
                  <div className="px-3 pb-3">
                    <div className="flex bg-white rounded-md border border-slate-200 p-0.5 overflow-x-auto whitespace-nowrap hide-scrollbar scrollbar-hide">
                      {['Alle', 'Kunden', 'Wichtig', 'Sonstige', 'Junk'].map(cat => {
                        const count = emails.filter(e => e.folder === activeFolder && checkEmailCategory(e, cat)).length;

                        return (
                          <button
                            key={cat}
                            onClick={() => setEmailCategoryFilter(cat as any)}
                            className={`px-2 py-1 text-[10px] font-bold rounded flex-shrink-0 flex items-center space-x-1 ${emailCategoryFilter === cat ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            <span>{cat}</span>
                            <span className={`px-1 rounded-full text-[9px] ${emailCategoryFilter === cat ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredEmails.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Keine E-Mails gefunden</div>
                ) : (
                  filteredEmails.map(mail => {
                    const matchedCust = findCustomerForEmail(mail, customers);
                    const hasCalMatch = checkEmailCalendarMatch(mail, calendarEvents);

                    return (
                      <div key={mail.id} className={`flex items-stretch border-b border-slate-100 ${selectedEmailId === mail.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                        {isEditMode && (
                          <div className="flex items-center pl-4 py-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedEmailIds.includes(mail.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedEmailIds(prev => [...prev, mail.id]);
                                else setSelectedEmailIds(prev => prev.filter(id => id !== mail.id));
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => handleEmailSelect(mail.id)}
                          className={`flex-1 text-left p-4 transition-colors ${isEditMode ? 'pl-3' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm truncate pr-2 flex items-center space-x-1 flex-wrap ${!mail.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                              <span className="truncate max-w-[120px]">{activeFolder === 'sent' ? `An: ${mail.recipientEmail}` : mail.senderName}</span>

                              {isGebruederWeissSender(mail.senderEmail, mail.senderName) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-black rounded border border-orange-200 shrink-0" title="Gebrüder Weiss – standardmäßig Sonstige">
                                  GW
                                </span>
                              )}

                              {/* Customer DB Symbol next to name if match exists */}
                              {matchedCust && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCustomer(matchedCust);
                                    window.dispatchEvent(new CustomEvent('open-customer-crm', { detail: matchedCust.id }));
                                  }}
                                  className="inline-flex items-center px-1.5 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[10px] font-bold rounded border border-indigo-200 shrink-0 cursor-pointer"
                                  title={`Kunde in Datenbank: ${matchedCust.name} - Klicken um im CRM zu öffnen`}
                                >
                                  <User className="w-3 h-3 text-indigo-600 mr-0.5" />
                                </span>
                              )}

                              {/* Violet Email Symbol if email match */}
                              {matchedCust && (
                                <span className="inline-flex items-center px-1 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded border border-purple-200 shrink-0" title="E-Mail in DB gelistet">
                                  <Mail className="w-3 h-3 text-purple-600" />
                                </span>
                              )}

                              {/* Calendar Symbol if calendar event match */}
                              {hasCalMatch && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const matchedEv = calendarEvents.find(evt => (matchedCust?.id && evt.customerId === matchedCust.id) || checkEmailCalendarMatch(mail, [evt]));
                                    if (matchedEv) {
                                      setSelectedEvent(matchedEv);
                                    }
                                    setActiveSubView('calendar');
                                  }}
                                  className="inline-flex items-center px-1 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200 shrink-0 cursor-pointer"
                                  title="Kalendereintrag vorhanden - Klicken um im Kalender zu öffnen"
                                >
                                  <CalendarIcon className="w-3 h-3 text-emerald-600" />
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap pt-1">
                              {format(new Date(mail.timestamp), 'dd.MM. yyyy')}
                            </span>
                          </div>
                          <div className={`text-xs mb-1 truncate ${!mail.isRead ? 'font-bold text-blue-600' : 'text-slate-600'}`}>
                            {mail.subject}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{mail.body.substring(0, 60)}...</div>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

            {/* Drag Resizer Bar */}
            {!isListCollapsed && (
              <div
                onMouseDown={handleMouseDownResize}
                className={`w-2 hover:w-3 bg-slate-200 hover:bg-indigo-500 cursor-col-resize flex-shrink-0 transition-all flex items-center justify-center relative group rounded-full my-1 select-none z-10 ${
                  isResizingList ? 'bg-indigo-600 w-3 shadow-md' : ''
                }`}
                title="Gedrückt halten & ziehen, um Spaltenbreite flexibel anzupassen"
              >
                <div className="w-1 h-8 bg-slate-400 group-hover:bg-white rounded-full"></div>
              </div>
            )}

            {/* Mail Reading Pane */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              {selectedEmail ? (() => {
                const matchedCust = findCustomerForEmail(selectedEmail, customers);
                const hasCalMatch = checkEmailCalendarMatch(selectedEmail, calendarEvents);

                return (
                  <>
                    <div className="p-6 border-b border-slate-100">
                      {isListCollapsed && (
                        <button
                          onClick={() => setIsListCollapsed(false)}
                          className="mb-4 inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors border border-blue-200"
                        >
                          <ChevronRight className="w-4 h-4" />
                          <span>E-Mail Liste anzeigen (Ausklappen)</span>
                        </button>
                      )}
                      <h2 className="text-xl font-bold text-slate-800 mb-4">{selectedEmail.subject}</h2>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase">
                            {activeFolder === 'sent' ? (selectedEmail.recipientEmail ? selectedEmail.recipientEmail.charAt(0).toUpperCase() : '?') : selectedEmail.senderName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-800 flex items-center space-x-1.5 flex-wrap">
                              <span>{activeFolder === 'sent' ? `An: ${selectedEmail.recipientEmail}` : selectedEmail.senderName}</span>
                              {isGebruederWeissSender(selectedEmail.senderEmail, selectedEmail.senderName) && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-black rounded-md border border-orange-200" title="Gebrüder Weiss – standardmäßig Sonstige">
                                  GW
                                </span>
                              )}
                              {matchedCust && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCustomer(matchedCust);
                                    window.dispatchEvent(new CustomEvent('open-customer-crm', { detail: matchedCust.id }));
                                  }}
                                  className="inline-flex items-center px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold rounded-md border border-indigo-200 transition-colors cursor-pointer"
                                  title={`Kunde in DB: ${matchedCust.name} - Klicken um im CRM zu öffnen`}
                                >
                                  <User className="w-3.5 h-3.5 text-indigo-600 mr-1" />
                                  <span>Kunde DB</span>
                                </button>
                              )}
                              {hasCalMatch && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const matchedEv = calendarEvents.find(evt => (matchedCust?.id && evt.customerId === matchedCust.id) || checkEmailCalendarMatch(selectedEmail, [evt]));
                                    if (matchedEv) {
                                      setSelectedEvent(matchedEv);
                                    }
                                    setActiveSubView('calendar');
                                  }}
                                  className="inline-flex items-center px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-md border border-emerald-200 transition-colors cursor-pointer"
                                  title="Kalendereintrag vorhanden - Klicken um im Kalender zu öffnen"
                                >
                                  <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                                  <span>Termin</span>
                                </button>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                              <span>{activeFolder === 'sent' ? selectedEmail.recipientEmail : selectedEmail.senderEmail}</span>
                              {matchedCust && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded border border-purple-200" title="E-Mail in DB gematcht">
                                  <Mail className="w-3 h-3 text-purple-600 mr-0.5" />
                                  <span>Match</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 text-right space-y-2">
                          <div>{format(new Date(selectedEmail.timestamp), 'dd.MM.yyyy HH:mm')}</div>
                          <div className="flex items-center justify-end space-x-1">
                            {['Kunden', 'Wichtig', 'Sonstige', 'Junk'].map(cat => (
                              <button
                                key={cat}
                                onClick={() => {
                                  const savedRulesJson = localStorage.getItem('email_sender_rules');
                                  const senderRules = savedRulesJson ? JSON.parse(savedRulesJson) : {};
                                  senderRules[selectedEmail.senderEmail.toLowerCase()] = cat;
                                  localStorage.setItem('email_sender_rules', JSON.stringify(senderRules));

                                  setEmails(prev => prev.map(m => m.senderEmail.toLowerCase() === selectedEmail.senderEmail.toLowerCase() ? { ...m, category: cat as EmailCategoryType } : m));
                                  void learnFromCategoryCorrection(selectedEmail, cat as EmailCategoryType);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                  selectedEmail.category === cat
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                                title={`Als ${cat} markieren`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    <div className="mt-6 flex items-center space-x-3">
                      <button
                        onClick={() => openCompose('reply', selectedEmail)}
                        className="group relative flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <Reply className="w-5 h-5" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                          Antworten
                        </span>
                      </button>
                      <button
                        onClick={() => openCompose('replyAll', selectedEmail)}
                        className="group relative flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <ReplyAll className="w-5 h-5" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                          Allen antworten
                        </span>
                      </button>
                      <button
                        onClick={() => openCompose('forward', selectedEmail)}
                        className="group relative flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <Forward className="w-5 h-5" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                          Weiterleiten
                        </span>
                      </button>

                      {/* Button 1: Kunde erzeugen */}
                      <button
                        onClick={handleCreateCustomerFromEmail}
                        disabled={isExtractingCustomer}
                        className="group relative flex items-center justify-center p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isExtractingCustomer ? (
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        ) : (
                          <UserPlus className="w-5 h-5" />
                        )}
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-indigo-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-lg">
                          Kunde erzeugen (KI-Import)
                        </span>
                      </button>

                      {/* Button 2: Kalendereintrag */}
                      <button
                        onClick={handleCreateCalendarEventFromEmail}
                        disabled={isExtractingCalendar}
                        className="group relative flex items-center justify-center p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isExtractingCalendar ? (
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                        ) : (
                          <CalendarPlus className="w-5 h-5" />
                        )}
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-emerald-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-lg">
                          Kalendereintrag erstellen (KI)
                        </span>
                      </button>

                      {/* Button 3: Anhänge Speichern! */}
                      <button
                        onClick={handleSaveAttachmentsToDriveAndCustomer}
                        disabled={isSavingAttachments}
                        className="group relative flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors disabled:opacity-50 text-xs font-bold shadow-xs"
                      >
                        {isSavingAttachments ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                        ) : (
                          <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <span>Anhänge Speichern!</span>
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-blue-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-lg font-normal">
                          Dokumente in Google Drive & beim Kunden speichern
                        </span>
                      </button>

                      <div className="flex-1"></div>
                      <button
                        onClick={() => setDeleteEmailId(selectedEmail.id)}
                        className="group relative flex items-center justify-center p-2.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                          Löschen
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="text-sm text-slate-700 leading-relaxed overflow-hidden">
                      {selectedEmail.htmlBody ? (
                        <div
                           dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.htmlBody) }}
                           className="email-html-content"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">{selectedEmail.body}</div>
                      )}

                      {/* Attachments Section */}
                      {selectedEmail.attachments && selectedEmail.attachments.filter((a: any) => !a.isInline).length > 0 && (
                        <div className="mt-8 pt-4 border-t border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                            <Paperclip className="w-4 h-4 mr-2" />
                            Anhänge ({selectedEmail.attachments.filter((a: any) => !a.isInline).length})
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {selectedEmail.attachments.filter((a: any) => !a.isInline).map(att => (
                              <div key={att.id} className="flex items-center p-3 border border-slate-200 rounded-lg bg-slate-50 min-w-[200px] max-w-sm">
                                <FileText className="w-8 h-8 text-blue-500 mr-3 flex-shrink-0" />
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="text-sm font-medium text-slate-700 truncate" title={att.name}>{att.name}</div>
                                  <div className="text-xs text-slate-500">{(att.size / 1024).toFixed(1)} KB</div>
                                </div>
                                {att.contentBytes && (
                                  <a
                                    href={`data:${att.contentType};base64,${att.contentBytes}`}
                                    download={att.name}
                                    className="ml-3 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
                                    title="Herunterladen"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ); })() : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
                  {isListCollapsed && (
                    <button
                      onClick={() => setIsListCollapsed(false)}
                      className="mb-6 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors shadow-md hover:bg-blue-700"
                    >
                      <ChevronRight className="w-5 h-5" />
                      <span>E-Mail Liste / Posteingang anzeigen</span>
                    </button>
                  )}
                  <div className="text-center">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Wählen Sie eine E-Mail zum Lesen aus</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubView === 'calendar' && (
          <div className="w-full h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 relative">

            {/* Calendar Header */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 rounded-t-xl">
              <div className="flex items-center space-x-4">
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Heute
                </button>
                <div className="flex items-center space-x-2">
                  <button onClick={() => {
                    if (calendarView === 'month') setCurrentDate(subMonths(currentDate, 1));
                    if (calendarView === 'week') setCurrentDate(subWeeks(currentDate, 1));
                    if (calendarView === 'day') setCurrentDate(subDays(currentDate, 1));
                  }} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600"><ChevronLeft className="w-5 h-5"/></button>
                  <h3 className="font-bold text-lg text-slate-800 min-w-[150px] text-center">
                    {calendarView === 'month' ? format(currentDate, 'MMMM yyyy', { locale: de }) :
                     calendarView === 'week' ? `KW ${format(currentDate, 'I, yyyy')}` :
                     format(currentDate, 'dd.MM.yyyy')}
                  </h3>
                  <button onClick={() => {
                    if (calendarView === 'month') setCurrentDate(addMonths(currentDate, 1));
                    if (calendarView === 'week') setCurrentDate(addWeeks(currentDate, 1));
                    if (calendarView === 'day') setCurrentDate(addDays(currentDate, 1));
                  }} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600"><ChevronRight className="w-5 h-5"/></button>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex bg-white rounded-lg border border-slate-300 p-0.5">
                  <button onClick={() => setCalendarView('month')} className={`px-3 py-1 text-xs font-bold rounded-md ${calendarView === 'month' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Monat</button>
                  <button onClick={() => setCalendarView('week')} className={`px-3 py-1 text-xs font-bold rounded-md ${calendarView === 'week' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Woche</button>
                  <button onClick={() => setCalendarView('day')} className={`px-3 py-1 text-xs font-bold rounded-md ${calendarView === 'day' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Tag</button>
                </div>
                <button onClick={() => setShowNewEventModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Neuer Termin</span>
                </button>
              </div>
            </div>

            {/* Calendar Body */}
            <div className="flex-1 p-4 overflow-hidden">
              {calendarView === 'month' && renderCalendarMonth()}
              {calendarView === 'week' && renderCalendarWeek()}
              {calendarView === 'day' && renderCalendarDay()}
            </div>
          </div>
        )}
      </div>

      {/* Compose Email Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {composeAction === 'new' ? 'Neue E-Mail' : (composeAction === 'reply' || composeAction === 'replyAll') ? 'Antworten' : 'Weiterleiten'}
              </h3>
              <button onClick={() => setShowComposeModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">An:</label>
                <input type="email" value={composeTo} onChange={e => setComposeTo(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500" placeholder="empfaenger@beispiel.de" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Betreff:</label>
                <input type="text" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500" placeholder="Betreff eingeben..." />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-xs font-bold text-slate-500">Nachricht:</label>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-semibold text-slate-500">Signatur:</label>
                    <select
                      value={selectedSignatureId}
                      onChange={e => setSelectedSignatureId(e.target.value)}
                      className="text-xs p-1 border border-slate-200 rounded focus:outline-blue-500"
                    >
                      <option value="">Keine Signatur</option>
                      {signatures.map(sig => (
                        <option key={sig.id} value={sig.id}>{sig.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowSignatureManager(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Bearbeiten
                    </button>
                  </div>
                </div>
                <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                  <ReactQuill
                    theme="snow"
                    value={composeBody}
                    onChange={setComposeBody}
                    className="flex-1 flex flex-col h-full bg-white"
                    modules={{
                      toolbar: [
                        [{ 'font': [] }],
                        [{ 'size': ['small', false, 'large', 'huge'] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['image', 'link'],
                        ['clean']
                      ]
                    }}
                  />
                  {composeQuoted && (
                    <div
                      className="p-4 bg-slate-50 border-t border-slate-200 text-sm overflow-hidden opacity-75 max-h-48 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(composeQuoted) }}
                    />
                  )}
                </div>

                {/* Attachments Section */}
                <div className="mt-3">
                  <input type="file" id="email-attachments" multiple className="hidden" onChange={(e) => {
                    if (e.target.files) {
                      setComposeAttachments(prev => [...prev, ...Array.from(e.target.files as FileList)]);
                    }
                  }} />
                  <label htmlFor="email-attachments" className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <span>+ Anhang hinzufügen</span>
                  </label>
                  {composeAttachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {composeAttachments.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
                          <span className="truncate max-w-[80%]">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                          <button onClick={() => setComposeAttachments(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button onClick={() => handleSendEmail(true)} disabled={isSending} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                Als Entwurf speichern
              </button>
              <div className="flex space-x-3">
                <button onClick={() => setShowComposeModal(false)} disabled={isSending} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg">Abbrechen</button>
                <button onClick={() => handleSendEmail(false)} disabled={!composeTo || !composeSubject || isSending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Sende...' : 'Senden'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Event Modal */}
      {showNewEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Neuer Termin</h3>
              <button onClick={() => setShowNewEventModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Titel:</label>
                <input type="text" value={newEventTitle || ''} onChange={e => setNewEventTitle(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-500" placeholder="z.B. Umzug Müller" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Datum:</label>
                  <input type="date" value={newEventDate || ''} onChange={e => setNewEventDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Kategorie:</label>
                  <select value={newEventCategory || ''} onChange={e => setNewEventCategory(e.target.value as any)} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-indigo-500">
                    <option value="Umzug">Umzug</option>
                    <option value="Besichtigung">Besichtigung</option>
                    <option value="Büro">Büro</option>
                    <option value="Wartung">Wartung</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Startzeit:</label>
                  <input type="time" value={newEventStartTime || ''} onChange={e => setNewEventStartTime(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Endzeit:</label>
                  <input type="time" value={newEventEndTime || ''} onChange={e => setNewEventEndTime(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Ort (Optional):</label>
                <input type="text" value={newEventLocation || ''} onChange={e => setNewEventLocation(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-500" placeholder="z.B. Innsbruck" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Beschreibung (Optional):</label>
                <textarea value={newEventDesc || ''} onChange={e => setNewEventDesc(e.target.value)} className="w-full h-24 p-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-500 resize-none" placeholder="Details..." />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button onClick={() => setShowNewEventModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg">Abbrechen</button>
              <button onClick={handleSaveEvent} disabled={!newEventTitle || !newEventDate} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Speichern</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (() => {
        const matchedCust = findCustomerForCalendarEvent(selectedEvent, customers);
        const hasEmail = checkCalendarEmailMatch(selectedEvent, emails);

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="font-bold text-lg text-slate-800 flex items-center space-x-2">
                  <span>Termindetails</span>
                  {matchedCust && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-md border border-indigo-200" title={`Kunde in DB: ${matchedCust.name}`}>
                      <User className="w-3.5 h-3.5 text-indigo-600 mr-1" />
                      <span>Kunde DB</span>
                    </span>
                  )}
                  {hasEmail && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-md border border-purple-200" title="E-Mail im Posteingang">
                      <Mail className="w-3.5 h-3.5 text-purple-600 mr-1" />
                      <span>E-Mail Match</span>
                    </span>
                  )}
                </h2>
                <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-slate-700">
                <div>
                  <span className="block text-xs font-bold text-slate-400 mb-1">Titel</span>
                  <span className="font-semibold text-slate-800">{selectedEvent.title}</span>
                </div>
                <div className="flex space-x-8">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">Datum</span>
                    <span className="font-semibold">{selectedEvent.startDate}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">Zeit</span>
                    <span className="font-semibold">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                  </div>
                </div>
                {selectedEvent.location && (
                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">Ort</span>
                    <span className="font-semibold">{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.category && (
                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">Kategorie</span>
                    <span className="inline-block px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                      {selectedEvent.category}
                    </span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">Beschreibung</span>
                    <p className="whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button
                  onClick={() => handlePrintLieferschein(selectedEvent)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center space-x-2 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Lieferschein drucken</span>
                </button>
                <button onClick={() => setSelectedEvent(null)} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm">
                  Eintragen!
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Success Modal for Customer Creation */}
      {successModalInfo && (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{successModalInfo.title}</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">{successModalInfo.message}</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setSuccessModalInfo(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-indigo-200"
              >
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Manager Modal */}
      {showSignatureManager && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden h-[80vh]">
            <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Signaturen</h3>
                <button onClick={() => setEditingSignature({ id: 'sig-' + Date.now(), name: 'Neue Signatur', content: '' })} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {signatures.length === 0 ? (
                  <div className="text-center p-4 text-sm text-slate-400">Keine Signaturen vorhanden.</div>
                ) : (
                  signatures.map(sig => (
                    <div
                      key={sig.id}
                      onClick={() => setEditingSignature(sig)}
                      className={`group p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${editingSignature?.id === sig.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-200 text-slate-700'}`}
                    >
                      <span className="font-medium truncate text-sm">{sig.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); setSignatures(prev => prev.filter(s => s.id !== sig.id)); if(editingSignature?.id === sig.id) setEditingSignature(null); if(selectedSignatureId === sig.id) setSelectedSignatureId(''); }} className="text-red-500 hover:text-red-700 p-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="w-2/3 flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">{editingSignature ? 'Signatur bearbeiten' : 'Signatur auswählen'}</h3>
                <button onClick={() => { setShowSignatureManager(false); setEditingSignature(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              {editingSignature ? (
                <div className="p-6 flex-1 flex flex-col overflow-y-auto">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Name der Signatur:</label>
                  <input
                    type="text"
                    value={editingSignature.name}
                    onChange={e => setEditingSignature({ ...editingSignature, name: e.target.value })}
                    className="w-full p-2 mb-4 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                  />
                  <label className="block text-xs font-bold text-slate-500 mb-1">Inhalt:</label>
                  <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden flex flex-col min-h-[300px]">
                    <ReactQuill
                      theme="snow"
                      value={editingSignature.content}
                      onChange={content => setEditingSignature({ ...editingSignature, content })}
                      className="flex-1 flex flex-col bg-white h-full"
                      modules={{
                        toolbar: [
                          [{ 'font': [] }],
                          [{ 'size': ['small', false, 'large', 'huge'] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'color': [] }, { 'background': [] }],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['image', 'link'],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={() => setEditingSignature(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg">Abbrechen</button>
                    <button onClick={() => {
                      setSignatures(prev => {
                        const exists = prev.find(s => s.id === editingSignature.id);
                        if (exists) return prev.map(s => s.id === editingSignature.id ? editingSignature : s);
                        return [...prev, editingSignature];
                      });
                      if(!selectedSignatureId) setSelectedSignatureId(editingSignature.id);
                      setEditingSignature(null);
                    }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg">Speichern</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                  Wählen Sie links eine Signatur aus oder erstellen Sie eine neue.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <GlobalDeleteDialog
        isOpen={!!deleteEmailId}
          onClose={() => setDeleteEmailId(null)}
          onConfirm={handleDeleteEmail}
          title="E-Mail löschen"
          description="Möchten Sie diese E-Mail wirklich endgültig löschen?"
      />

      {/* Microsoft Azure AD OAuth Setup & Redirect URI Modal */}
      {showAzureHelpModal && (
        <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Microsoft Azure AD / Outlook OAuth Setup</h3>
                  <p className="text-xs text-slate-400">Konfiguration & Redirect URI Hilfe</p>
                </div>
              </div>
              <button
                onClick={() => setShowAzureHelpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-800">
              {/* Error Alert Box if present */}
              {oauthErrorMessage && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-rose-900 text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>Fehler bei Microsoft-Anmeldung</span>
                  </div>
                  <p className="leading-relaxed bg-white/80 p-2.5 rounded-lg border border-rose-100 font-mono text-[11px] break-all">
                    {oauthErrorMessage}
                  </p>
                  {oauthErrorMessage.includes('AADSTS50011') && (
                    <p className="font-semibold text-rose-900 leading-normal pt-1">
                      👉 <strong>Ursache:</strong> Die aktuelle Anwendungs-URL ({typeof window !== 'undefined' ? window.location.origin : ''}) ist in Microsoft Entra ID (Azure Portal) noch nicht als zulässige Redirect URI eingetragen.
                    </p>
                  )}
                </div>
              )}

              {/* Step 1: Copy Current Redirect URI */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    1. Aktuelle Redirect URI (Im Azure Portal eintragen)
                  </span>
                  {copiedRedirectUri && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>In Zwischenablage kopiert!</span>
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? window.location.origin : ''}
                    className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.origin);
                        setCopiedRedirectUri(true);
                        setTimeout(() => setCopiedRedirectUri(false), 2500);
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>URI kopieren</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Clear Guide */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <span>2. Anweisung zur Lösung im Azure Portal (AADSTS50011 Behebung)</span>
                </h4>
                <ol className="list-decimal list-inside space-y-2.5 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                  <li>
                    Öffnen Sie das <strong><a href="https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold inline-flex items-center space-x-1"><span>Azure Portal (App-Registrierungen)</span><ExternalLink className="w-3 h-3 inline" /></a></strong>.
                  </li>
                  <li>
                    Wählen Sie Ihre App-Registrierung mit Client-ID <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-900">{authConfig?.clientId || 'c2c13ed9-7843-4dc7-b7ce-ceb8b91e0c53'}</code> aus.
                  </li>
                  <li>
                    Klicken Sie im linken Menü auf <strong>Authentifizierung (Authentication)</strong>.
                  </li>
                  <li>
                    Unter <strong>Plattformkonfigurationen</strong> -&gt; <strong>Single-Page-Anwendung (SPA)</strong> (oder Web): Klicken Sie auf <strong>URI hinzufügen (Add URI)</strong>.
                  </li>
                  <li>
                    Fügen Sie die oben kopierte URL ein: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-900">{typeof window !== 'undefined' ? window.location.origin : ''}</code>
                  </li>
                  <li>
                    Unter <strong>Implizit gewährte Berechtigungen (Implicit Grant)</strong>: Aktivieren Sie <strong>Zugriffstoken (Access Tokens)</strong> und <strong>ID-Token</strong>.
                  </li>
                  <li>
                    Klicken Sie oben auf <strong>Speichern (Save)</strong>.
                  </li>
                </ol>
              </div>

              {/* Step 3: Custom Azure App Registration ID Settings */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  3. Eigene Azure Client ID & Tenant ID anpassen (Optional)
                </h4>
                <p className="text-xs text-slate-500">
                  Falls Sie Ihre eigene App-Registrierung in Azure nutzen möchten, tragen Sie Ihre Client ID hier ein:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Azure Client ID (Application ID)
                    </label>
                    <input
                      type="text"
                      value={customClientIdInput}
                      onChange={e => setCustomClientIdInput(e.target.value)}
                      placeholder="c2c13ed9-7843-4dc7-b7ce-ceb8b91e0c53"
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono focus:outline-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Azure Tenant ID (oder 'common')
                    </label>
                    <input
                      type="text"
                      value={customTenantIdInput}
                      onChange={e => setCustomTenantIdInput(e.target.value)}
                      placeholder="common"
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono focus:outline-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    onClick={() => {
                      localStorage.removeItem('custom_azure_client_id');
                      localStorage.removeItem('custom_azure_tenant_id');
                      setAuthConfig({
                        clientId: 'c2c13ed9-7843-4dc7-b7ce-ceb8b91e0c53',
                        tenantId: 'common'
                      });
                      setCustomClientIdInput('c2c13ed9-7843-4dc7-b7ce-ceb8b91e0c53');
                      setCustomTenantIdInput('common');
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 font-semibold rounded-lg"
                  >
                    Standard wiederherstellen
                  </button>
                  <button
                    onClick={() => {
                      if (customClientIdInput.trim()) {
                        localStorage.setItem('custom_azure_client_id', customClientIdInput.trim());
                        localStorage.setItem('custom_azure_tenant_id', customTenantIdInput.trim() || 'common');
                        setAuthConfig({
                          clientId: customClientIdInput.trim(),
                          tenantId: customTenantIdInput.trim() || 'common'
                        });
                        alert('Azure Einstellungen wurden lokal gespeichert.');
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg"
                  >
                    Einstellungen speichern
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Nach dem Speichern in Azure auf "Anmelden" klicken.
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAzureHelpModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Schließen
                </button>
                <button
                  onClick={() => {
                    setShowAzureHelpModal(false);
                    loginWithMicrosoft();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Jetzt bei Microsoft Anmelden</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
