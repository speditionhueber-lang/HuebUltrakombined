import { apiFetch } from "@/src/lib/api-client";
import { useCustomer } from '@/src/contexts/customer-context';
import React, { useState } from 'react';
import { Sparkles, AlertCircle, Mail, Check, X, Calendar as CalendarIcon, QrCode, FileText, ArrowRight, UserPlus, Inbox, Trash2, Clock, Database, CheckCircle, WifiOff, RefreshCw, AlertTriangle, XCircle, History, RotateCcw, ThumbsUp, MessageSquareWarning, Star, Wrench, ChevronUp, ChevronDown } from 'lucide-react';
import { caseService } from '@/src/lib/case-service';
import { learningService } from '@/src/lib/learning-service';

type AssistantItem = {
  id: string;
  sender?: string;
  subject?: string;
  content?: string;
  [key: string]: any;
};

type CompletedAction = {
  id: string;
  item: AssistantItem;
  actionType: string;
  actionLabel: string;
  completedAt: string;
  feedback?: 'helpful' | 'perfect' | 'wrong' | 'wrong_action';
  feedbackNote?: string;
};

type AssistantCache = {
  anfragen: AssistantItem[];
  wichtig: AssistantItem[];
  handledItems: string[];
  completedActions: CompletedAction[];
  analysisFingerprint: string;
};

const ASSISTANT_CACHE_KEY = 'hueber_ai_assistant_cache_v2';

function readAssistantCache(): AssistantCache {
  try {
    const cached = JSON.parse(localStorage.getItem(ASSISTANT_CACHE_KEY) || '{}') as Partial<AssistantCache>;
    return {
      anfragen: Array.isArray(cached.anfragen) ? cached.anfragen : [],
      wichtig: Array.isArray(cached.wichtig) ? cached.wichtig : [],
      handledItems: Array.isArray(cached.handledItems) ? cached.handledItems : [],
      completedActions: Array.isArray(cached.completedActions) ? cached.completedActions : [],
      analysisFingerprint: typeof cached.analysisFingerprint === 'string' ? cached.analysisFingerprint : ''
    };
  } catch {
    return { anfragen: [], wichtig: [], handledItems: [], completedActions: [], analysisFingerprint: '' };
  }
}

function importantItemText(item: AssistantItem): string {
  return `${item.subject || ''} ${item.content || ''} ${item.analysis || ''}`.toLowerCase();
}

function isSecurityNotice(item: AssistantItem): boolean {
  const text = importantItemText(item);
  return ['sicherheitswarnung', 'unbefugter zugriff', 'passwort', 'kontoaktivität', 'anmeldung erkannt'].some(term => text.includes(term));
}

function isPaymentNotice(item: AssistantItem): boolean {
  const text = importantItemText(item);
  return ['mahnung', 'rechnung', 'forderung', 'fälligkeit', 'zahlung', 'offener betrag', 'iban'].some(term => text.includes(term));
}

const EMAIL_SORT_REMINDER_ID = 'reminder_sort_emails';
function isEmailSortReminder(item: AssistantItem): boolean {
  return item.id.startsWith(EMAIL_SORT_REMINDER_ID);
}

const ACTION_LABELS: Record<string, string> = {
  import: 'Kunde importiert',
  mail: 'E-Mail gesendet',
  calendar: 'Kalendereintrag vorbereitet',
  ignore: 'Ignoriert',
  pay: 'Zahlung vorbereitet',
  open: 'Geöffnet'
};

export function AIAssistantWidget() {
  const { addCustomer, setActiveCustomer } = useCustomer();
  const [initialCache] = useState(readAssistantCache);
  const [activeTab, setActiveTab] = useState<'anfragen' | 'wichtig' | 'erledigt'>('anfragen');
  const [handledItems, setHandledItems] = useState<string[]>(initialCache.handledItems);
  const [completedActions, setCompletedActions] = useState<CompletedAction[]>(initialCache.completedActions);
  const [analysisFingerprint, setAnalysisFingerprint] = useState(initialCache.analysisFingerprint);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [feedbackEditingId, setFeedbackEditingId] = useState<string | null>(null);
  const [feedbackEditingType, setFeedbackEditingType] = useState<'wrong' | 'wrong_action'>('wrong');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailDraft, setMailDraft] = useState({ to: '', subject: '', body: '' });
  const [pendingMailAction, setPendingMailAction] = useState<{ item: AssistantItem; label: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState(caseService.getSyncStatus());
  const [notification, setNotification] = useState<string | null>(null);
  const [anfragen, setAnfragen] = useState<AssistantItem[]>(initialCache.anfragen);
  const [wichtig, setWichtig] = useState<AssistantItem[]>(initialCache.wichtig);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    localStorage.setItem(ASSISTANT_CACHE_KEY, JSON.stringify({
      anfragen,
      wichtig,
      handledItems,
      completedActions: completedActions.slice(0, 30),
      analysisFingerprint
    } satisfies AssistantCache));
    window.dispatchEvent(new Event('assistant_cache_updated'));
  }, [analysisFingerprint, anfragen, completedActions, handledItems, wichtig]);

  React.useEffect(() => {
    return caseService.subscribe(() => {
      setSyncStatus(caseService.getSyncStatus());
    });
  }, []);

  React.useEffect(() => {
    const lastShown = Number(localStorage.getItem('hueber_ai_last_email_sort_reminder_time') || '0');
    const now = Date.now();
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
    
    if (now - lastShown > TWO_DAYS) {
      const reminderId = `${EMAIL_SORT_REMINDER_ID}_${now}`;
      const reminderItem: AssistantItem = {
        id: reminderId,
        sender: 'Hueber KI',
        subject: 'Email Zuweisung',
        content: 'Emails sollten so oft wie möglich sortiert werden damit die Hueber KI aufgrund von User Beispielen lernen kann emails richtig zuzuordnen!',
        analysis: 'Handlungsvorschlag',
        timeAgo: 'Neu'
      };
      
      setWichtig(prev => {
        if (!prev.some(item => item.id.startsWith(EMAIL_SORT_REMINDER_ID))) {
          return [reminderItem, ...prev];
        }
        return prev;
      });
      localStorage.setItem('hueber_ai_last_email_sort_reminder_time', now.toString());
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const renderSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><CheckCircle className="w-3 h-3 mr-1" /> Synchronisiert</span>;
      case 'offline':
        return <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full"><WifiOff className="w-3 h-3 mr-1" /> Offline</span>;
      case 'pending_sync':
        return <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Änderungen ausstehend</span>;
      case 'syncing':
        return <span className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Synchronisiere...</span>;
      case 'conflict':
        return <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full"><AlertTriangle className="w-3 h-3 mr-1" /> Konflikt</span>;
      case 'error':
        return <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full"><XCircle className="w-3 h-3 mr-1" /> Speicherfehler</span>;
      default:
        return <span className="inline-flex items-center text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full"><Database className="w-3 h-3 mr-1" /> Initialisiere...</span>;
    }
  };

  const completeAction = (item: AssistantItem, actionType: string, label = ACTION_LABELS[actionType] || actionType) => {
    const completed: CompletedAction = {
      id: `completed_${Date.now()}_${item.id}`,
      item,
      actionType,
      actionLabel: label,
      completedAt: new Date().toISOString()
    };
    setHandledItems(previous => previous.includes(item.id) ? previous : [...previous, item.id]);
    setCompletedActions(previous => [completed, ...previous].slice(0, 30));
    learningService.recordLearningRecord({
      actionType: `assistant_${actionType}`,
      contextType: 'assistant_action',
      finalDecision: 'accepted',
      result: 'executed',
      confidence: 'high',
      originalData: { itemId: item.id, subject: item.subject, sender: item.sender }
    });
  };

  const handleAction = (id: string, action: string, data?: any, label?: string) => {
    const item = [...anfragen, ...wichtig].find(entry => entry.id === id);
    if (!item) return;

    if (action === 'import') {
      const newKunde = {
          id: `cust_${Date.now()}`,
          name: 'Kunde X (Importiert)',
          email: 'kunde-x@beispiel.de',
          phone: '',
          address: { street: 'Musterstraße 1', city: 'Innsbruck', zipCode: '6020' },
          role: 'Kunde' as any,
          status: 'Interessent' as any,
          notes: 'Umzug: Tisch, Bett, Sofa. Zeitraum: 15.08.',
          umzugsdetails: {
              ausgangsadresse: 'Musterstraße 1, 6020 Innsbruck',
              gewuenschterUmzugstermin: '2026-08-15'
          }
      };
      addCustomer(newKunde as any);
      setActiveCustomer(newKunde as any);
      showNotification('Kunde erfolgreich importiert und angelegt.');
    } else if (action === 'mail') {
      setMailDraft(data);
      setPendingMailAction({ item, label: label || ACTION_LABELS.mail });
      setShowMailModal(true);
      return;
    } else if (action === 'open') {
      window.dispatchEvent(new CustomEvent('open-mail-from-ai', {
        detail: item.senderEmail || item.sender || ''
      }));
    } else {
      showNotification(`Aktion "${action}" ausgeführt.`);
    }
    completeAction(item, action, label);
  };

  const handleFeedback = (completedId: string, feedback: CompletedAction['feedback'], note = '') => {
    const completed = completedActions.find(entry => entry.id === completedId);
    if (!completed || !feedback) return;
    setCompletedActions(previous => previous.map(entry => entry.id === completedId ? { ...entry, feedback, feedbackNote: note.trim() || undefined } : entry));
    learningService.recordLearningRecord({
      actionType: `assistant_${completed.actionType}`,
      contextType: 'assistant_feedback',
      finalDecision: feedback === 'helpful' || feedback === 'perfect' ? 'accepted' : feedback === 'wrong' ? 'corrected' : 'rejected',
      result: feedback === 'helpful' || feedback === 'perfect' ? 'accepted' : feedback === 'wrong' ? 'corrected' : 'rejected',
      confidence: feedback === 'perfect' ? 'high' : feedback === 'helpful' ? 'high' : 'medium',
      originalData: { itemId: completed.item.id, subject: completed.item.subject, feedback },
      correctedData: note.trim() ? { userInstruction: note.trim() } : undefined
    });
    setFeedbackEditingId(null);
    setFeedbackNote('');
    showNotification('Feedback gespeichert – die KI lernt daraus.');
  };

  const reopenAction = (completed: CompletedAction) => {
    setCompletedActions(previous => previous.filter(entry => entry.id !== completed.id));
    setHandledItems(previous => previous.filter(id => id !== completed.item.id));
    setActiveTab(wichtig.some(item => item.id === completed.item.id) ? 'wichtig' : 'anfragen');
    showNotification('Vorgang wurde wieder geöffnet.');
  };

  React.useEffect(() => {
    async function loadInbox() {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('ms_graph_access_token');
        let emailsPayload = [];
        let calendarPayload = [];

        if (token) {
           try {
             // Fetch real emails
             const mailRes = await fetch('https://graph.microsoft.com/v1.0/me/messages?$top=50&$orderby=receivedDateTime DESC', {
               headers: { Authorization: `Bearer ${token}` }
             });
             if (mailRes.ok) {
                const mailData = await mailRes.json();
                emailsPayload = mailData.value.map((m: any) => ({
                   id: m.id,
                   sender: m.from?.emailAddress?.name || m.from?.emailAddress?.address || 'Unbekannt',
                   senderEmail: m.from?.emailAddress?.address || '',
                   subject: m.subject || 'Kein Betreff',
                   content: m.bodyPreview || '',
                   received: m.receivedDateTime
                }));
             }

             // Fetch today's calendar events
             const now = new Date();
             const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
             const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
             const calRes = await fetch(`https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}&$top=10`, {
               headers: { Authorization: `Bearer ${token}` }
             });
             if (calRes.ok) {
                const calData = await calRes.json();
                calendarPayload = calData.value.map((e: any) => ({
                   subject: e.subject,
                   start: e.start?.dateTime,
                   end: e.end?.dateTime
                }));
             }
           } catch (graphError) {
             console.error("Failed to fetch graph data", graphError);
           }
        }

        if (emailsPayload.length === 0) return;
        const nextFingerprint = JSON.stringify({
          emails: emailsPayload.map((email: any) => [email.id, email.subject, email.received]),
          events: calendarPayload.map((event: any) => [event.subject, event.start, event.end])
        });
        if (nextFingerprint === initialCache.analysisFingerprint) return;

        const res = await apiFetch('/api/ai/analyze-inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails: emailsPayload, events: calendarPayload })
        });

        if (res.ok) {
          const data = await res.json();
          setAnfragen(Array.isArray(data.anfragen) ? data.anfragen : []);
          setWichtig(Array.isArray(data.wichtig) ? data.wichtig : []);
          setAnalysisFingerprint(nextFingerprint);
        }
      } catch (e) {
        console.error("Failed to load inbox", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadInbox();
  }, [initialCache.analysisFingerprint]);

  return (
    <div className={`overflow-y-auto bg-slate-50 relative rounded-xl flex flex-col ${isCollapsed ? 'h-auto flex-none' : 'h-full flex-1'}`}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 shadow-sm sticky top-0 z-10">
        <div className={`flex items-center space-x-3 ${isCollapsed ? 'mb-0' : 'mb-4'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">KI-Assistent</h2>
                {renderSyncBadge()}
              </div>
              <p className="text-xs text-slate-500 font-medium">Automatisierte E-Mail-Analyse & Handlungsvorschläge</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCollapsed(previous => !previous)}
              className="ml-3 flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-indigo-700"
              title={isCollapsed ? 'KI-Assistent ausklappen' : 'KI-Assistent einklappen'}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className={`${isCollapsed ? 'hidden' : 'flex'} gap-2 overflow-x-auto pb-1`} role="tablist" aria-label="KI-Assistent Bereiche">
          <button
            onClick={() => setActiveTab('anfragen')}
            aria-pressed={activeTab === 'anfragen'}
            className={`min-h-10 shrink-0 px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${activeTab === 'anfragen' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}
          >
            <Inbox className="w-4 h-4" />
            <span>Kundenanfragen ({anfragen.filter(item => !handledItems.includes(item.id)).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('wichtig')}
            aria-pressed={activeTab === 'wichtig'}
            className={`min-h-10 shrink-0 px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${activeTab === 'wichtig' ? 'bg-red-50 text-red-700 shadow-sm border border-red-200' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Wichtig ({wichtig.filter(item => !handledItems.includes(item.id)).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('erledigt')}
            aria-pressed={activeTab === 'erledigt'}
            className={`min-h-10 shrink-0 px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${activeTab === 'erledigt' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}
          >
            <History className="w-4 h-4" />
            <span>Erledigt ({completedActions.length})</span>
          </button>
        </div>
      </div>

      <div className={`${isCollapsed ? 'hidden' : 'block'} p-6 space-y-6`}>
        {isLoading && activeTab !== 'erledigt' ? (
          <div className="space-y-3" role="status" aria-label="KI-Vorschläge werden geladen">
            {[0, 1].map(index => (
              <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
                <div className="mt-3 h-16 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : null}
        {activeTab === 'anfragen' && anfragen.filter(item => !handledItems.includes(item.id)).length === 0 && !isLoading && (
          <div className="p-8 text-center text-slate-500">
            <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Keine neuen Kundenanfragen vorhanden.</p>
          </div>
        )}
        {activeTab === 'anfragen' && anfragen.map(item => (
          !handledItems.includes(item.id) && (
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Kundenanfrage</span>
                    <span className="text-xs text-slate-400 font-medium">{item.timeAgo || "Vor 15 Min"}</span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">{item.sender}: {item.subject}</h3>
                <p className="text-sm text-slate-600 line-clamp-2 italic border-l-2 border-slate-200 pl-3 my-3">"{item.content}"</p>

                {/* AI Analysis */}
                <div className="bg-slate-50 rounded-xl p-4 mt-4 border border-slate-100">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center"><Sparkles className="w-3 h-3 mr-1" /> KI-Analyse</h4>

                  {item.isAcceptance ? (
                    <div className="text-sm text-emerald-700 font-medium flex items-center">
                      <Check className="w-4 h-4 mr-1.5" /> Kunde hat Angebot akzeptiert.
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {(item.missing?.length || 0) > 0 && (
                        <div className="flex items-start text-indigo-700">
                          <AlertCircle className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>Es fehlen Daten: {item.missing.join(', ')}</span>
                        </div>
                      )}
                      {(item.issues?.length || 0) > 0 && (
                        <div className="flex items-start text-red-600">
                          <X className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>{item.issues.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-slate-50/50 flex flex-wrap gap-2">
                {item.isAcceptance ? (
                  <>
                    <button onClick={() => handleAction(item.id, 'mail', { to: item.senderEmail || item.sender, subject: 'Anzahlungsrechnung für Ihren Umzug', body: 'Sehr geehrte(r) ' + item.sender + ',\\n\\nvielen Dank für die Bestätigung. Im Anhang finden Sie die Anzahlungsrechnung.\\n\\nMit freundlichen Grüßen\\nTeam Hueber' })} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors">
                      <FileText className="w-4 h-4 mr-1.5" /> Anzahlungsrechnung erstellen & senden
                    </button>
                    <button onClick={() => handleAction(item.id, 'mail', { to: item.senderEmail || item.sender, subject: 'Rechnung für Ihren Umzug', body: 'Sehr geehrte(r) ' + item.sender + ',\\n\\nvielen Dank für die Bestätigung. Im Anhang finden Sie die Rechnung.\\n\\nMit freundlichen Grüßen\\nTeam Hueber' })} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors">
                      <FileText className="w-4 h-4 mr-1.5 text-slate-400" /> Rechnung erstellen
                    </button>
                    <button onClick={() => handleAction(item.id, 'calendar')} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors">
                      <CalendarIcon className="w-4 h-4 mr-1.5 text-emerald-500" /> In Kalender eintragen
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleAction(item.id, 'import')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors">
                      <UserPlus className="w-4 h-4 mr-1.5" /> Kunde importieren
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'mail', { to: item.senderEmail || item.sender, subject: 'Rückfrage zu Ihrer Umzugsanfrage', body: item.suggestedReply || 'Sehr geehrte(r) ' + item.sender + ',\n\nwir benötigen noch weitere Daten.\n\nMit freundlichen Grüßen\nTeam Hueber' })}
                      className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors"
                    >
                      <Mail className="w-4 h-4 mr-1.5 text-blue-500" /> KI-Antwort (Rückfragen) generiert
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'mail', {
                        to: item.senderEmail || item.sender,
                        subject: 'Ihre Umzugsanfrage - Absage',
                        body: 'Sehr geehrte(r) ' + item.sender + ',\\n\\nleider sind unsere Kapazitäten derzeit am Limit, deshalb muss ich Ihnen leider mitteilen, dass wir den Auftrag nicht durchführen können!\\n\\nMit freundlichen Grüßen\\nTeam Hueber'
                      })}
                      className="px-4 py-2 bg-white border border-slate-300 hover:bg-red-50 text-slate-700 hover:text-red-700 text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors"
                    >
                      <X className="w-4 h-4 mr-1.5 text-red-500" /> Absagen
                    </button>
                    <button onClick={() => handleAction(item.id, 'ignore')} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-500 text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors">
                      <Trash2 className="w-4 h-4 mr-1.5 text-slate-400" /> Ignorieren
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        ))}

        {activeTab === 'wichtig' && wichtig.filter(item => !handledItems.includes(item.id)).length === 0 && !isLoading && (
          <div className="p-8 text-center text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Keine wichtigen Nachrichten vorhanden.</p>
          </div>
        )}
        {activeTab === 'wichtig' && wichtig.map(item => (
          !handledItems.includes(item.id) && (
            <div key={item.id} className="bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                      {isSecurityNotice(item) ? 'Warnung' : isPaymentNotice(item) ? 'Wichtig / Mahnung' : 'Wichtig'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{item.timeAgo || "Vor 2 Std"}</span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">{item.sender}: {item.subject}</h3>
                <p className="text-sm text-slate-600 line-clamp-2 italic border-l-2 border-slate-200 pl-3 my-3">"{item.content}"</p>

                {/* AI Analysis */}
                <div className="bg-slate-50 rounded-xl p-4 mt-4 border border-slate-100">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center"><Sparkles className="w-3 h-3 mr-1" /> KI-Analyse</h4>
                  <div className="text-sm text-red-600 font-medium flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1.5" /> {item.analysis || 'Wichtige Information mit möglichem Handlungsbedarf.'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-slate-50/50 flex flex-wrap gap-2">
                {!isEmailSortReminder(item) && (
                  <button
                    onClick={() => handleAction(item.id, 'open', undefined, 'E-Mail geöffnet')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-1.5" /> E-Mail öffnen
                  </button>
                )}
                {isEmailSortReminder(item) ? (
                  <>
                    <button
                      onClick={() => {
                        handleAction(item.id, 'sort_emails', undefined, 'Zur Sortierung navigiert');
                        window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'mail_kalender' }));
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors"
                    >
                      <Inbox className="w-4 h-4 mr-1.5" /> Jetzt emails sortieren
                    </button>
                    <button 
                      onClick={() => handleAction(item.id, 'ignore', undefined, 'Später erinnern')} 
                      className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-500 text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors"
                    >
                      <Clock className="w-4 h-4 mr-1.5 text-slate-400" /> Später nochmal erinnern!
                    </button>
                  </>
                ) : isPaymentNotice(item) && !isSecurityNotice(item) ? (
                  <>
                    <button
                      onClick={() => handleAction(item.id, 'mail', {
                        to: item.senderEmail || item.sender,
                        subject: `AW: ${item.subject || 'Ihre Nachricht'}`,
                        body: item.suggestedReply || 'Vielen Dank für Ihre Nachricht. Wir prüfen die Forderung und melden uns kurzfristig.\\n\\nMit freundlichen Grüßen\\nTeam Hueber'
                      })}
                      className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors"
                    >
                      <Mail className="w-4 h-4 mr-1.5 text-blue-500" /> Passende Antwort prüfen
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'mail', {
                        to: item.senderEmail || item.sender,
                        subject: `AW: ${item.subject || 'Fristverlängerung'}`,
                        body: 'Vielen Dank für Ihre Nachricht. Wir bitten um eine Fristverlängerung von zwei Wochen und um kurze Bestätigung.\\n\\nMit freundlichen Grüßen\\nTeam Hueber'
                      })}
                      className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors"
                    >
                      <Clock className="w-4 h-4 mr-1.5 text-indigo-500" /> Fristverlängerung anfragen
                    </button>
                    <button onClick={() => handleAction(item.id, 'pay')} className="px-4 py-2 bg-white border border-slate-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors">
                      <QrCode className="w-4 h-4 mr-1.5 text-emerald-500" /> Zahlung prüfen
                    </button>
                  </>
                ) : !isSecurityNotice(item) && item.suggestedReply ? (
                  <button
                    onClick={() => handleAction(item.id, 'mail', {
                      to: item.senderEmail || item.sender,
                      subject: `AW: ${item.subject || 'Ihre Nachricht'}`,
                      body: item.suggestedReply
                    })}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-1.5 text-blue-500" /> Antwortentwurf prüfen
                  </button>
                ) : null}
                <button onClick={() => handleAction(item.id, 'ignore', undefined, 'Nicht wichtig')} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-500 text-sm font-bold rounded-lg shadow-sm flex items-center transition-colors">
                  <ArrowRight className="w-4 h-4 mr-1.5 text-slate-400" /> Nicht wichtig / erledigt
                </button>
              </div>
            </div>
          )
        ))}

        {activeTab === 'erledigt' && completedActions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="font-semibold">Noch keine Vorgänge erledigt.</p>
            <p className="mt-1 text-xs text-slate-400">Bearbeitete Vorschläge erscheinen hier mit Status und Lernfeedback.</p>
          </div>
        ) : null}

        {activeTab === 'erledigt' ? completedActions.map(completed => (
          <article key={completed.id} className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      <CheckCircle className="h-3 w-3" /> {completed.actionLabel}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Date(completed.completedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="mt-3 truncate text-base font-black text-slate-800">
                    {completed.item.sender || 'Unbekannt'}: {completed.item.subject || 'Kein Betreff'}
                  </h3>
                  {completed.item.content ? <p className="mt-1 line-clamp-2 text-xs italic text-slate-500">„{completed.item.content}“</p> : null}
                </div>
                <button
                  onClick={() => reopenAction(completed)}
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-50"
                  title="Vorgang wieder öffnen"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Wieder öffnen</span>
                </button>
              </div>
            </div>
            <div className="bg-slate-50/70 p-4">
              {completed.feedback ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <Sparkles className="h-4 w-4" /> Feedback gespeichert – dieses Signal fließt in den Lernfortschritt ein.
                </div>
              ) : (
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">War der Vorschlag hilfreich?</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleFeedback(completed.id, 'helpful')} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50">
                      <ThumbsUp className="h-3.5 w-3.5" /> Gut
                    </button>
                    <button onClick={() => handleFeedback(completed.id, 'perfect')} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50">
                      <Star className="h-3.5 w-3.5" /> Genau richtig
                    </button>
                    <button onClick={() => { setFeedbackEditingId(completed.id); setFeedbackEditingType('wrong'); setFeedbackNote(''); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-2 text-[10px] font-bold text-amber-700 hover:bg-amber-50">
                      <MessageSquareWarning className="h-3.5 w-3.5" /> Nicht gut
                    </button>
                    <button onClick={() => { setFeedbackEditingId(completed.id); setFeedbackEditingType('wrong_action'); setFeedbackNote(''); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-100">
                      <Wrench className="h-3.5 w-3.5" /> Verbessern
                    </button>
                  </div>
                  {feedbackEditingId === completed.id ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <label htmlFor={`feedback-${completed.id}`} className="text-[10px] font-black text-amber-900">Was hätte die KI anders machen sollen?</label>
                      <textarea
                        id={`feedback-${completed.id}`}
                        value={feedbackNote}
                        onChange={event => setFeedbackNote(event.target.value)}
                        className="mt-2 min-h-20 w-full resize-y rounded-lg border border-amber-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        placeholder="Korrektur oder gewünschte Aktion kurz beschreiben …"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button type="button" onClick={() => { setFeedbackEditingId(null); setFeedbackNote(''); }} className="min-h-9 rounded-lg px-3 text-[10px] font-bold text-slate-500 hover:bg-white">Abbrechen</button>
                        <button type="button" disabled={!feedbackNote.trim()} onClick={() => handleFeedback(completed.id, feedbackEditingType, feedbackNote)} className="min-h-9 rounded-lg bg-amber-600 px-3 text-[10px] font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50">Als Lernsignal speichern</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </article>
        )) : null}
      </div>

      {notification && !isCollapsed && (
        <div role="status" className="mb-4 mx-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center shadow-sm">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {showMailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setShowMailModal(false); setPendingMailAction(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center"><Mail className="w-5 h-5 mr-2 text-indigo-600"/> Automatisierte E-Mail</h3>
              <button onClick={() => { setShowMailModal(false); setPendingMailAction(null); }} className="text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Schließen"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">An:</label>
                <input type="text" value={mailDraft.to || ''} readOnly className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Betreff:</label>
                <input type="text" value={mailDraft.subject || ''} onChange={(e) => setMailDraft({...mailDraft, subject: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nachricht:</label>
                <textarea value={mailDraft.body || ''} onChange={(e) => setMailDraft({...mailDraft, body: e.target.value})} className="w-full h-64 p-3 border border-slate-200 rounded-lg text-sm focus:outline-indigo-500 resize-none font-sans" />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button onClick={() => { setShowMailModal(false); setPendingMailAction(null); }} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 min-h-[44px] min-w-[44px]">Abbrechen</button>
              <button onClick={() => {
                if (pendingMailAction) completeAction(pendingMailAction.item, 'mail', pendingMailAction.label);
                setShowMailModal(false);
                setPendingMailAction(null);
                showNotification('E-Mail erfolgreich versendet!');
              }} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm flex items-center transition-all min-h-[44px]">
                Senden <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
