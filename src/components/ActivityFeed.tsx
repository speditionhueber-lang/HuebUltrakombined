import React, { useState, useMemo, useCallback } from 'react';
import { useWorkflow } from '../contexts/workflow-context';
import { WorkflowEvent, WorkflowSuggestion } from '../lib/workflow-engine';
import { learningService } from '../lib/learning-service';
import { caseService } from '../lib/case-service';
import { crmLookupService } from '../lib/crm-lookup-service';
import { 
  Mail, 
  UserPlus, 
  User, 
  FileText, 
  ReceiptEuro, 
  Calendar, 
  Sparkles, 
  Trash2, 
  UserCheck, 
  ChevronRight,
  ChevronDown,
  Folder,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  Check,
  X,
  Edit2,
  History,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { CustomerDraftContainer } from './CustomerDraftContainer';
import { CustomerMatchContainer } from './CustomerMatchContainer';
import { EmailResponseDraftContainer } from './EmailResponseDraftContainer';
import { OfferDraftContainer } from './OfferDraftContainer';
import { OfferResponseReviewContainer } from './OfferResponseReviewContainer';
import { PlanningReviewContainer } from './PlanningReviewContainer';
import { DispatchReviewContainer } from './DispatchReviewContainer';
import { CalendarPlanningReviewContainer } from './CalendarPlanningReviewContainer';
import { TourPlanningReviewContainer } from './TourPlanningReviewContainer';
import { OperationPreparationReviewContainer } from './OperationPreparationReviewContainer';
import { OperationExecutionReviewContainer } from './OperationExecutionReviewContainer';
import { InvoiceDraftContainer } from './InvoiceDraftContainer';
import { ReceivableReviewContainer } from './ReceivableReviewContainer';
import { WorkflowExceptionsCenter } from './WorkflowExceptionsCenter';
import { de } from 'date-fns/locale';

const getEventIcon = (type: string) => {
  switch (type) {
    case 'EMAIL_RECEIVED': return <Mail className="w-5 h-5 text-blue-500" />;
    case 'CUSTOMER_CREATED': return <UserPlus className="w-5 h-5 text-emerald-500" />;
    case 'CUSTOMER_UPDATED': return <User className="w-5 h-5 text-amber-500" />;
    case 'OFFER_CREATED': return <FileText className="w-5 h-5 text-purple-500" />;
    case 'INVOICE_CREATED': return <ReceiptEuro className="w-5 h-5 text-indigo-500" />;
    case 'DOCUMENT_GENERATED': return <FileText className="w-5 h-5 text-slate-500" />;
    case 'EVENT_CREATED': return <Calendar className="w-5 h-5 text-rose-500" />;
    case 'CALENDAR_UPDATED': return <Calendar className="w-5 h-5 text-orange-500" />;
    case 'PDF_SAVED': return <FileText className="w-5 h-5 text-red-500" />;
    case 'AI_CUSTOMER_DATA_EXTRACTED': return <Sparkles className="w-5 h-5 text-indigo-500" />;
    case 'DOCUMENT_DELETED': return <Trash2 className="w-5 h-5 text-slate-400" />;
    case 'CUSTOMER_SELECTED': return <UserCheck className="w-5 h-5 text-teal-500" />;
    default: return <Activity className="w-5 h-5 text-slate-500" />;
  }
};

const getEventTitle = (type: string) => {
  switch (type) {
    case 'EMAIL_RECEIVED': return 'Neue E-Mail';
    case 'CUSTOMER_CREATED': return 'Neuer Kunde erstellt';
    case 'CUSTOMER_UPDATED': return 'Kundendaten aktualisiert';
    case 'OFFER_CREATED': return 'Angebot erstellt';
    case 'INVOICE_CREATED': return 'Rechnung erstellt';
    case 'DOCUMENT_GENERATED': return 'Dokument erzeugt';
    case 'EVENT_CREATED': return 'Termin erstellt';
    case 'CALENDAR_UPDATED': return 'Kalender geändert';
    case 'PDF_SAVED': return 'PDF gespeichert';
    case 'AI_CUSTOMER_DATA_EXTRACTED': return 'Kundendaten durch KI erkannt';
    case 'DOCUMENT_DELETED': return 'Dokument gelöscht';
    case 'CUSTOMER_SELECTED': return 'Kunde ausgewählt';
    default: return 'Unbekanntes Ereignis';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'processing': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'failed': return 'text-rose-600 bg-rose-50 border-rose-100';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed': return 'Erfolgreich';
    case 'processing': return 'In Bearbeitung';
    case 'failed': return 'Fehlgeschlagen';
    case 'pending': return 'Ausstehend';
    default: return status;
  }
};

const translateFieldKey = (key: string): string => {
  const map: Record<string, string> = {
    senderName: 'Absender Name',
    company: 'Firma',
    phone: 'Telefon',
    email: 'E-Mail',
    pickupAddress: 'Abholadresse',
    destinationAddress: 'Zieladresse',
    moveDate: 'Umzugstermin',
    isFlexibleDate: 'Termin flexibel',
    apartmentSize: 'Wohnungsgröße',
    floor: 'Stockwerk',
    elevator: 'Aufzug',
    furniture: 'Möbel',
    boxes: 'Kartons',
    hvzMentioned: 'Halteverbotszone',
    viewingRequested: 'Besichtigung gewünscht',
    offerRequested: 'Angebot gewünscht',
    callbackRequested: 'Rückruf gewünscht',
    urgency: 'Dringlichkeit',
    freeText: 'Freitext',
    missingOrUnknown: 'Fehlende Informationen'
  };
  return map[key] || key;
};

interface TopicCategory {
  id: string;
  title: string;
  description: string;
  iconType: 'mail' | 'file' | 'calendar' | 'euro' | 'system';
  badgeColor: string;
}

const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    id: 'email_customer',
    title: 'E-Mail & Anfragen (Triage & Stammdaten)',
    description: 'Posteingang, Kunden-Stammdaten, Ersterfassung & Triage',
    iconType: 'mail',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'offers_calculation',
    title: 'Angebote & Kalkulation',
    description: 'Orientierungsangebote, Kalkulationen & Kundenreaktionen',
    iconType: 'file',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'planning_execution',
    title: 'Planung, Disposition & Ausführung',
    description: 'Kalendertermine, Touren, Vorbereitung & Umzugsdurchführung',
    iconType: 'calendar',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  {
    id: 'finance_billing',
    title: 'Finanzen, Rechnungen & Mahnwesen',
    description: 'Anzahlungsrechnungen, Endabrechnungen & Offene Posten',
    iconType: 'euro',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'workflow_system',
    title: 'Workflow-Ausnahmen & System',
    description: 'System-Events, automatische Prüfberichte & Ausnahmen',
    iconType: 'system',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
];

function assignGroupToTopic(group: { caseId: string | null; caseData: any; events: any[] }): string {
  const title = (group.caseData?.title || '').toLowerCase();
  const eventTypes = group.events.map((e: any) => e.type || '').join(' ');

  if (title.includes('rechnung') || title.includes('finanz') || title.includes('mahnung') || title.includes('forderung') || eventTypes.includes('INVOICE_CREATED')) {
    return 'finance_billing';
  }
  if (title.includes('disposition') || title.includes('tour') || title.includes('termin') || title.includes('ausführung') || title.includes('vorbereitung') || eventTypes.includes('EVENT_CREATED') || eventTypes.includes('CALENDAR_UPDATED')) {
    return 'planning_execution';
  }
  if (title.includes('angebot') || title.includes('kalkulation') || title.includes('orientierung') || eventTypes.includes('OFFER_CREATED')) {
    return 'offers_calculation';
  }
  if (title.includes('mail') || title.includes('kunde') || title.includes('anfrage') || title.includes('triage') || eventTypes.includes('EMAIL_RECEIVED') || eventTypes.includes('CUSTOMER_CREATED') || eventTypes.includes('AI_CUSTOMER_DATA_EXTRACTED')) {
    return 'email_customer';
  }
  return 'workflow_system';
}

export const ActivityFeed = React.memo(function ActivityFeed() {
  const { events, emitEvent } = useWorkflow();
  const [decisions, setDecisions] = useState<Record<string, 'accepted' | 'rejected' | 'edited'>>({});
  const [, setRefresh] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
  const [displayLimit, setDisplayLimit] = useState(25);
  
  const [viewMode, setViewMode] = useState<'themen' | 'chronologisch'>('themen');
  const [expandedTopics, setExpandedTopics] = useState<string[]>([
    'email_customer',
    'offers_calculation',
    'planning_execution',
    'finance_billing',
    'workflow_system'
  ]);
  const [expandedCaseIds, setExpandedCaseIds] = useState<string[]>([]);
  
  const refreshCases = useCallback(() => setRefresh(prev => prev + 1), []);
  
  React.useEffect(() => {
    const loadedDecisions: Record<string, 'accepted' | 'rejected' | 'edited'> = {};
    caseService.getAllCases().forEach(c => {
      if (c.decisions) {
        Object.values(c.decisions).forEach(d => {
          loadedDecisions[d.suggestionId] = d.decision;
        });
      }
    });
    setDecisions(loadedDecisions);
  }, []);
  
  // Base events excluding suggestions - memoized
  const sortedEvents = useMemo(() => {
    const baseEvents = events.filter(e => e.type !== 'SUGGESTION_CREATED' && e.type !== 'SUGGESTION_DECISION_MADE');
    return [...baseEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [events]);

  const handleDecision = useCallback(async (caseId: string | null, suggestion: WorkflowSuggestion, eventId: string, decision: 'accepted' | 'rejected' | 'edited') => {
    setDecisions(prev => ({ ...prev, [suggestion.id]: decision }));
    
    if (caseId) {
      caseService.saveDecision(caseId, suggestion.id, eventId, decision, suggestion);
    }
    
    emitEvent('SUGGESTION_DECISION_MADE', 'User', {
      suggestionId: suggestion.id,
      eventId,
      decision,
      originalSuggestion: suggestion
    });

    if (decision === 'accepted') {
      await learningService.recordDecision(suggestion.id, eventId, 'accepted', suggestion);
    } else if (decision === 'rejected') {
      await learningService.recordRejection(suggestion.id, eventId, 'user rejected', suggestion);
    } else if (decision === 'edited') {
      await learningService.recordCorrection(suggestion.id, eventId, { note: 'user edited', suggestion });
    }
  }, [emitEvent]);

  const handleTaskAction = useCallback((caseId: string, taskId: string, action: 'complete' | 'cancel' | 'postpone') => {
    if (action === 'complete') {
      caseService.updateTask(caseId, taskId, { status: 'Completed' });
    } else if (action === 'cancel') {
      caseService.updateTask(caseId, taskId, { status: 'Cancelled' });
    } else if (action === 'postpone') {
      caseService.updateTask(caseId, taskId, { status: 'Waiting' });
    }
    setDecisions(prev => ({ ...prev }));
  }, []);

  // Group events by caseId - heavily optimized with useMemo
  const allCaseGroups = useMemo(() => {
    const allCases = caseService.getAllCases();
    const casesMap = new Map(allCases.map(c => [c.id, c]));
    
    const caseGroups: { caseId: string | null; caseData: any | null; events: typeof sortedEvents }[] = [];
    const eventToGroupMap = new Map<string, typeof caseGroups[0]>();

    casesMap.forEach(caseItem => {
      const newGroup = { caseId: caseItem.id, caseData: caseItem, events: [] };
      eventToGroupMap.set(caseItem.id, newGroup);
      caseGroups.push(newGroup);
    });

    sortedEvents.forEach(event => {
      if (event.caseId && casesMap.has(event.caseId)) {
        eventToGroupMap.get(event.caseId)!.events.push(event);
      } else {
        caseGroups.push({ caseId: null, caseData: null, events: [event] });
      }
    });

    caseGroups.sort((a, b) => {
      const aLatest = Math.max(
        a.events[0] ? new Date(a.events[0].timestamp).getTime() : 0,
        a.caseData?.timeline?.[0] ? new Date(a.caseData.timeline[0].timestamp).getTime() : 0,
        a.caseData ? new Date(a.caseData.updatedAt).getTime() : 0
      );
      const bLatest = Math.max(
        b.events[0] ? new Date(b.events[0].timestamp).getTime() : 0,
        b.caseData?.timeline?.[0] ? new Date(b.caseData.timeline[0].timestamp).getTime() : 0,
        b.caseData ? new Date(b.caseData.updatedAt).getTime() : 0
      );
      return bLatest - aLatest;
    });

    return caseGroups;
  }, [sortedEvents]);

  // Filter & Search case groups - memoized
  const filteredCaseGroups = useMemo(() => {
    let result = allCaseGroups;

    if (statusFilter !== 'all') {
      result = result.filter(g => {
        if (!g.caseData) return statusFilter === 'active';
        if (statusFilter === 'completed') return g.caseData.status === 'Completed';
        if (statusFilter === 'failed') return g.caseData.status === 'Cancelled' || (g.caseData.health && g.caseData.health.score < 50);
        return g.caseData.status !== 'Completed' && g.caseData.status !== 'Cancelled';
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(g => {
        if (g.caseId?.toLowerCase().includes(q)) return true;
        if (g.caseData?.title?.toLowerCase().includes(q)) return true;
        if (g.caseData?.customerDraft?.customer?.name?.toLowerCase().includes(q)) return true;
        if (g.caseData?.customerDraft?.customer?.email?.toLowerCase().includes(q)) return true;
        if (g.events.some(e => getEventTitle(e.type).toLowerCase().includes(q) || JSON.stringify(e.payload).toLowerCase().includes(q))) return true;
        return false;
      });
    }

    return result;
  }, [allCaseGroups, statusFilter, searchQuery]);

  const toggleTopicExpand = useCallback((topicId: string) => {
    setExpandedTopics(prev =>
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
  }, []);

  const toggleCaseExpand = useCallback((caseId: string) => {
    setExpandedCaseIds(prev =>
      prev.includes(caseId) ? prev.filter(id => id !== caseId) : [...prev, caseId]
    );
  }, []);

  const visibleCaseGroups = useMemo(() => {
    return filteredCaseGroups.slice(0, displayLimit);
  }, [filteredCaseGroups, displayLimit]);

  if (allCaseGroups.length === 0 && sortedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500" role="status">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-medium text-slate-900 mb-2">Noch keine Aktivitäten</h3>
        <p className="text-sm">Sobald Ereignisse in der App auftreten, werden sie hier aufgezeichnet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50" aria-label="Activity Center">
      <WorkflowExceptionsCenter />

      {/* Activity Filter & Search Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Aktivitäten, Kunde oder Case-ID suchen..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all min-h-[44px]"
            aria-label="Suche in Aktivitäten"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto flex-wrap">
          {/* Ansicht-Umschaltung: Themen vs Chronologisch */}
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-bold shrink-0">
            <button
              onClick={() => setViewMode('themen')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 min-h-[36px] ${
                viewMode === 'themen' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Nach Themen</span>
            </button>
            <button
              onClick={() => setViewMode('chronologisch')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 min-h-[36px] ${
                viewMode === 'chronologisch' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Chronologisch</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all min-h-[36px] min-w-[44px] ${statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Alle ({allCaseGroups.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-md transition-all min-h-[36px] min-w-[44px] ${statusFilter === 'active' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Aktiv
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-md transition-all min-h-[36px] min-w-[44px] ${statusFilter === 'completed' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Abgeschlossen
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 rounded-md transition-all min-h-[36px] min-w-[44px] ${statusFilter === 'failed' ? 'bg-white text-rose-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Kritisch
            </button>
          </div>
        </div>
      </div>

      {visibleCaseGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 my-4">
          <p className="text-sm font-medium">Keine passenden Aktivitäten für die Filterkriterien gefunden.</p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
            className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors min-h-[44px]"
          >
            Filter zurücksetzen
          </button>
        </div>
      ) : viewMode === 'themen' ? (
        /* Themen-Gliederung Ansicht */
        <div className="space-y-6">
          {TOPIC_CATEGORIES.map(topic => {
            const topicGroups = filteredCaseGroups.filter(g => assignGroupToTopic(g) === topic.id);
            const isTopicExpanded = expandedTopics.includes(topic.id);

            const getTopicIcon = (type: string) => {
              switch (type) {
                case 'mail': return <Mail className="w-5 h-5 text-blue-600" />;
                case 'file': return <FileText className="w-5 h-5 text-purple-600" />;
                case 'calendar': return <Calendar className="w-5 h-5 text-orange-600" />;
                case 'euro': return <ReceiptEuro className="w-5 h-5 text-emerald-600" />;
                default: return <Sparkles className="w-5 h-5 text-indigo-600" />;
              }
            };

            return (
              <div key={topic.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Topic Header Card */}
                <div
                  onClick={() => toggleTopicExpand(topic.id)}
                  className="p-4 bg-slate-50 hover:bg-slate-100/80 cursor-pointer border-b border-slate-200 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      {getTopicIcon(topic.iconType)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span>{topic.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${topic.badgeColor}`}>
                          {topicGroups.length} {topicGroups.length === 1 ? 'Fall' : 'Fälle'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{topic.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                      {isTopicExpanded ? 'Einklappen' : 'Ausklappen'}
                    </span>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                      {isTopicExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Cases List inside Topic */}
                {isTopicExpanded && (
                  <div className="p-4 space-y-4 bg-slate-100/50">
                    {topicGroups.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs font-medium bg-white rounded-lg border border-slate-200">
                        Keine passenden Fälle in diesem Thema vorhanden.
                      </div>
                    ) : (
                      topicGroups.map((group, groupIdx) => {
                        const caseId = group.caseId || `group-${groupIdx}`;
                        const isCaseExpanded = expandedCaseIds.includes(caseId);

                        return (
                          <div key={caseId} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                            {/* Case Header Row */}
                            <div
                              onClick={() => toggleCaseExpand(caseId)}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                                    <span>{group.caseData?.title || 'Systemfall / Ereignis-Gruppe'}</span>
                                    {group.caseData?.health && (
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                        group.caseData.health.score === 100 ? 'bg-emerald-100 text-emerald-800' :
                                        group.caseData.health.score > 50 ? 'bg-amber-100 text-amber-800' :
                                        'bg-rose-100 text-rose-800'
                                      }`}>
                                        Health: {group.caseData.health.score}%
                                      </span>
                                    )}
                                  </h4>
                                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                    <span>Case ID: {caseId.substring(0, 8)}</span>
                                    {group.caseData?.customerName && (
                                      <>
                                        <span>•</span>
                                        <span className="font-semibold text-slate-700">Kunde: {group.caseData.customerName}</span>
                                      </>
                                    )}
                                    <span>•</span>
                                    <span>Status: {group.caseData?.status || 'Aktiv'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCaseExpand(caseId);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    isCaseExpanded
                                      ? 'bg-indigo-600 text-white shadow-2xs'
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  }`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>{isCaseExpanded ? 'Details einklappen' : 'Fall öffnen & bearbeiten'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Complete Information / Edit Panel when expanded */}
                            {isCaseExpanded && (
                              <div className="p-4 bg-slate-50 border-t border-slate-200">
                                {group.caseData ? (
                                  <div className="space-y-4">
                                    {/* Task & Next Step summary */}
                                    {group.caseData.health && (
                                      <div className="p-3 bg-slate-800 text-white rounded-xl">
                                        <div className="text-xs text-indigo-300 font-semibold mb-2">
                                          Nächster Schritt: <span className="text-white font-bold">{group.caseData.health.nextStep}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {group.caseData.health.checklist.map((item: any) => (
                                            <div key={item.id} className={`text-[10px] px-2 py-1 rounded-full flex items-center gap-1.5 border ${
                                              item.completed 
                                                ? 'bg-emerald-900/30 border-emerald-800/50 text-emerald-400' 
                                                : 'bg-slate-700 border-slate-600 text-slate-300'
                                            }`}>
                                              {item.completed ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full border border-slate-400" />}
                                              {item.label}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Detailed Review and Editing Containers */}
                                    {group.caseData.customerMatchReview && (
                                      <CustomerMatchContainer caseId={group.caseData.id} onUpdated={refreshCases} />
                                    )}
                                    {group.caseData.customerDraft && (
                                      <CustomerDraftContainer caseItem={group.caseData} />
                                    )}
                                    {group.caseData.emailDrafts && group.caseData.emailDrafts.length > 0 && (
                                      <EmailResponseDraftContainer caseItem={group.caseData} onCaseUpdated={refreshCases} />
                                    )}
                                    {group.caseData.offerResponseReviews && group.caseData.offerResponseReviews.length > 0 && (
                                      <OfferResponseReviewContainer caseItem={group.caseData} onUpdate={refreshCases} />
                                    )}
                                    {group.caseData.planningReviews && group.caseData.planningReviews.length > 0 && (
                                      <PlanningReviewContainer caseItem={group.caseData} onUpdate={refreshCases} />
                                    )}
                                    {group.caseData.dispatchReviews && group.caseData.dispatchReviews.length > 0 && (
                                      <DispatchReviewContainer caseItem={group.caseData} onUpdate={refreshCases} />
                                    )}
                                    {group.caseData.calendarPlanningReviews && group.caseData.calendarPlanningReviews.length > 0 && (
                                      <CalendarPlanningReviewContainer caseItem={group.caseData} onUpdate={refreshCases} />
                                    )}
                                    {group.caseData.tourPlanningReviews && group.caseData.tourPlanningReviews.length > 0 && (
                                      <TourPlanningReviewContainer caseItem={group.caseData} onUpdate={refreshCases} />
                                    )}
                                    {group.caseData.operationPreparationReviews && group.caseData.operationPreparationReviews.length > 0 && (
                                      <OperationPreparationReviewContainer caseId={group.caseData.id} />
                                    )}
                                    {group.caseData.operationExecutionReviews && group.caseData.operationExecutionReviews.length > 0 && (
                                      <OperationExecutionReviewContainer caseId={group.caseData.id} />
                                    )}
                                    <InvoiceDraftContainer caseId={group.caseData.id} />
                                    <ReceivableReviewContainer caseId={group.caseData.id} />
                                    <OfferDraftContainer caseId={group.caseData.id} customer={crmLookupService.findCustomerForCase(group.caseData)} onRefresh={refreshCases} />
                                  </div>
                                ) : (
                                  <div className="p-4 text-xs text-slate-500">Systemereignisse ohne spezifischen Fall.</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Chronologische Ansicht */
        visibleCaseGroups.map((group, groupIdx) => (
          <div key={`group-${group.caseId || groupIdx}`} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {group.caseData && (
              <div className="bg-slate-800 text-white flex flex-col">
                <div className="px-5 py-3 flex justify-between items-center border-b border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-700 p-1.5 rounded-md">
                      <Activity className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {group.caseData.title}
                        {group.caseData.health && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold ${
                            group.caseData.health.score === 100 ? 'bg-emerald-500/20 text-emerald-300' :
                            group.caseData.health.score > 50 ? 'bg-amber-500/20 text-amber-300' :
                            'bg-rose-500/20 text-rose-300'
                          }`}>
                            Health: {group.caseData.health.score}%
                          </span>
                        )}
                      </h3>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">
                        Case ID: {group.caseId?.substring(0, 8)} • Status: {group.caseData.status}
                      </div>
                    </div>
                  </div>
                  <span className="bg-slate-700/50 text-slate-300 text-xs px-2.5 py-1 rounded-md border border-slate-600">
                    {group.events.length} Ereignis{group.events.length !== 1 ? 'se' : ''}
                  </span>
                </div>
                
                {group.caseData.health && (
                  <div className="px-5 py-3 bg-slate-800/50 flex flex-col space-y-4">
                    <div>
                      <div className="mb-2 text-xs font-medium text-indigo-300">
                        Nächster Schritt: <span className="text-white font-semibold">{group.caseData.health.nextStep}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {group.caseData.health.checklist.map((item: any) => (
                          <div key={item.id} className={`text-[10px] px-2 py-1 rounded-full flex items-center gap-1.5 border ${
                            item.completed 
                              ? 'bg-emerald-900/30 border-emerald-800/50 text-emerald-400' 
                              : 'bg-slate-800 border-slate-700 text-slate-500'
                          }`}>
                            {item.completed ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full border border-slate-500" />}
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {group.caseData.tasks && group.caseData.tasks.length > 0 && (
                      <div className="border-t border-slate-700/50 pt-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Aufgaben</h4>
                        <div className="space-y-2">
                          {group.caseData.tasks.map((task: any) => (
                            <div key={task.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg flex items-center justify-between p-2.5 min-h-[44px]">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  task.status === 'Completed' ? 'bg-emerald-400' :
                                  task.status === 'Open' ? 'bg-indigo-400' :
                                  'bg-slate-400'
                                }`} />
                                <div className="text-xs font-medium text-slate-200">{task.title}</div>
                                {task.priority === 'high' && (
                                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded uppercase font-bold">Wichtig</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                <span>{task.category}</span>
                                {task.status !== 'Completed' && (
                                  <button 
                                    onClick={() => handleTaskAction(group.caseId!, task.id, 'complete')}
                                    className="p-1 hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded min-h-[36px] min-w-[36px] flex items-center justify-center" 
                                    title="Erledigen"
                                    aria-label="Aufgabe als erledigt markieren"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {group.caseData.decisions && Object.keys(group.caseData.decisions).length > 0 && (
                      <div className="border-t border-slate-700/50 pt-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Verarbeitete Vorschläge
                        </h4>
                        <div className="space-y-3">
                          {Object.values(group.caseData.decisions).map((decision: any) => {
                            const suggestion = decision.originalSuggestion;
                            if (!suggestion) return null;
                            return (
                              <div key={decision.suggestionId} className="bg-slate-700/50 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="font-medium text-slate-200 text-sm">{suggestion.title}</div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    decision.decision === 'accepted' ? 'bg-emerald-500/20 text-emerald-300' :
                                    decision.decision === 'rejected' ? 'bg-rose-500/20 text-rose-300' :
                                    'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {decision.decision === 'accepted' ? 'Übernommen' : decision.decision === 'rejected' ? 'Abgelehnt' : 'Bearbeitet'}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {suggestion.actions && suggestion.actions.map((action: any, idx: number) => (
                                    <div key={idx} className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-[10px] font-medium border border-slate-600">
                                      {action.label}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {group.caseData.customerMatchReview && (
                      <div className="my-4">
                        <CustomerMatchContainer caseId={group.caseData.id} onUpdated={refreshCases} />
                      </div>
                    )}

                    {group.caseData.customerDraft && (
                      <div className="my-4">
                        <CustomerDraftContainer caseItem={group.caseData} />
                      </div>
                    )}

                    {group.caseData.emailDrafts && group.caseData.emailDrafts.length > 0 && (
                      <div className="my-4">
                        <EmailResponseDraftContainer caseItem={group.caseData} onCaseUpdated={refreshCases} />
                      </div>
                    )}

                    {group.caseData.offerResponseReviews && group.caseData.offerResponseReviews.length > 0 && (
                      <div className="my-4">
                        <OfferResponseReviewContainer caseItem={group.caseData} onUpdate={refreshCases} />
                      </div>
                    )}

                    {group.caseData.planningReviews && group.caseData.planningReviews.length > 0 && (
                      <div className="my-4">
                        <PlanningReviewContainer caseItem={group.caseData} onUpdate={refreshCases} />
                      </div>
                    )}

                    {group.caseData.dispatchReviews && group.caseData.dispatchReviews.length > 0 && (
                      <div className="my-4">
                        <DispatchReviewContainer caseItem={group.caseData} onUpdate={refreshCases} />
                      </div>
                    )}

                    {group.caseData.calendarPlanningReviews && group.caseData.calendarPlanningReviews.length > 0 && (
                      <div className="my-4">
                        <CalendarPlanningReviewContainer caseItem={group.caseData} onUpdate={refreshCases} />
                      </div>
                    )}

                    {group.caseData.tourPlanningReviews && group.caseData.tourPlanningReviews.length > 0 && (
                      <div className="my-4">
                        <TourPlanningReviewContainer caseItem={group.caseData} onUpdate={refreshCases} />
                      </div>
                    )}

                    {group.caseData.operationPreparationReviews && group.caseData.operationPreparationReviews.length > 0 && (
                      <div className="my-4">
                        <OperationPreparationReviewContainer caseId={group.caseData.id} />
                      </div>
                    )}

                    {group.caseData.operationExecutionReviews && group.caseData.operationExecutionReviews.length > 0 && (
                      <div className="my-4">
                        <OperationExecutionReviewContainer caseId={group.caseData.id} />
                      </div>
                    )}

                    <div className="my-4">
                      <InvoiceDraftContainer caseId={group.caseData.id} />
                    </div>

                    <div className="my-4">
                      <ReceivableReviewContainer caseId={group.caseData.id} />
                    </div>

                    <div className="my-4">
                      <OfferDraftContainer caseId={group.caseData.id} customer={crmLookupService.findCustomerForCase(group.caseData)} onRefresh={refreshCases} />
                    </div>
                    
                    {group.caseData.timeline && group.caseData.timeline.length > 0 && (
                      <div className="border-t border-slate-700/50 pt-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <History className="w-3 h-3" />
                          Timeline ({group.caseData.timeline.length})
                        </h4>
                        <div className="space-y-3 pl-2 border-l-2 border-slate-700/50 max-h-60 overflow-y-auto">
                          {group.caseData.timeline.map((entry: any) => (
                            <div key={entry.id} className="relative pl-3">
                              <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 bg-slate-800 border-2 border-slate-500 rounded-full"></div>
                              <div className="text-[10px] text-slate-400 mb-0.5">
                                {format(new Date(entry.timestamp), 'dd.MM.yy, HH:mm', { locale: de })} • {entry.category}
                              </div>
                              <div className="text-xs font-medium text-slate-200">{entry.title}</div>
                              {entry.description && (
                                <div className="text-[10px] text-slate-400 mt-0.5">{entry.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className={`flex flex-col space-y-4 ${group.caseData ? 'p-5 bg-slate-50/50' : ''}`}>
              {group.events.map((event) => {
                const relatedSuggestions = events
                  .filter(e => e.type === 'SUGGESTION_CREATED' && e.payload.eventId === event.id)
                  .map(e => e.payload as WorkflowSuggestion);

                let extractedData: any = null;
                let crmResult: any = null;
                
                if (relatedSuggestions.length > 0 && relatedSuggestions[0].actions.length > 0) {
                  const firstActionData = relatedSuggestions[0].actions[0].data;
                  if (firstActionData && firstActionData.extractedData) {
                    extractedData = firstActionData.extractedData;
                    crmResult = firstActionData.crmResult;
                  } else {
                    extractedData = firstActionData;
                  }
                }

                return (
                  <div 
                    key={event.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col"
                    data-event-id={event.id}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          {getEventIcon(event.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {getEventTitle(event.type)}
                          </h4>
                          <div className="flex items-center text-xs text-slate-500 mt-1 space-x-2">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(new Date(event.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                            </span>
                            <span>•</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-medium">
                              Quelle: {event.source}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {event.confidence && (
                        <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100" title={`Confidence: ${event.confidence}`}>
                          <span className="text-[10px] text-slate-500 mr-1 uppercase font-medium">KI-Konfidenz</span>
                          {event.confidence === 'high' && <Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
                          {event.confidence === 'medium' && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                          {event.confidence === 'low' && <HelpCircle className="w-3.5 h-3.5 text-rose-500" />}
                        </div>
                      )}
                    </div>

                    {event.payload && !extractedData && (
                      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 mb-4 border border-slate-100">
                        {event.type === 'EMAIL_RECEIVED' && (
                          <div>
                            <div className="font-medium text-slate-900">{event.payload.sender}</div>
                            <div className="text-slate-500 truncate">{event.payload.subject}</div>
                          </div>
                        )}
                        {!['EMAIL_RECEIVED'].includes(event.type) && (
                          <div className="text-slate-500 text-xs font-mono truncate">
                            {JSON.stringify(event.payload)}
                          </div>
                        )}
                      </div>
                    )}

                    {crmResult && (
                      <div className="mb-4">
                        <div className={`rounded-lg p-3 border ${
                          crmResult.status === 'exact_match' ? 'bg-emerald-50 border-emerald-100' :
                          crmResult.status === 'multiple_matches' ? 'bg-amber-50 border-amber-100' :
                          'bg-slate-50 border-slate-200'
                        }`}>
                          <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center ${
                            crmResult.status === 'exact_match' ? 'text-emerald-800' :
                            crmResult.status === 'multiple_matches' ? 'text-amber-800' :
                            'text-slate-600'
                          }`}>
                            {crmResult.status === 'exact_match' && '🟢 Kunde gefunden'}
                            {crmResult.status === 'multiple_matches' && '🟡 Mehrere mögliche Treffer'}
                            {crmResult.status === 'no_match' && '⚪ Kein Kunde gefunden'}
                          </h5>
                          <div className={`text-sm font-medium ${
                            crmResult.status === 'exact_match' ? 'text-emerald-900' :
                            crmResult.status === 'multiple_matches' ? 'text-amber-900' :
                            'text-slate-700'
                          }`}>
                            {crmResult.status === 'exact_match' && (
                              <div className="flex justify-between items-center">
                                <span>{crmResult.customers[0]?.name || crmResult.customers[0]?.firma}</span>
                                <span className="text-xs text-emerald-700 font-normal">
                                  {crmResult.confidence === 'high' ? '95 %' : '75 %'}
                                </span>
                              </div>
                            )}
                            {crmResult.status === 'multiple_matches' && (
                              <span>{crmResult.customers.length} Kunden gefunden</span>
                            )}
                            {crmResult.status === 'no_match' && (
                              <span>Neuen Kunden vorbereiten</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {extractedData && (
                      <div className="mb-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                            <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                              Erkannte Informationen
                            </h5>
                            <div className="space-y-1.5">
                              {Object.entries(extractedData).map(([key, field]: [string, any]) => {
                                if (key === 'missingOrUnknown' || !field.recognized || field.value === null || field.value === false || field.value === '') return null;
                                return (
                                  <div key={key} className="flex justify-between items-center text-xs">
                                    <span className="text-emerald-700/70">{translateFieldKey(key)}:</span>
                                    <span className="font-medium text-emerald-900 text-right ml-2 line-clamp-1" title={String(field.value)}>{String(field.value)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {extractedData.missingOrUnknown?.value?.length > 0 && (
                            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                              <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center">
                                <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                Fehlende Informationen
                              </h5>
                              <ul className="list-disc pl-4 space-y-1 text-xs text-amber-900/80">
                                {extractedData.missingOrUnknown.value.map((missingItem: string, idx: number) => (
                                  <li key={idx}>{missingItem}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {relatedSuggestions.length > 0 && (
                      <div className="mt-auto border-t border-slate-100 pt-4 space-y-3">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Handlungsvorschläge</h5>
                        {relatedSuggestions.map((suggestion) => (
                          <div key={suggestion.id} className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-indigo-900 text-sm">{suggestion.title}</div>
                              {decisions[suggestion.id] && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  decisions[suggestion.id] === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                                  decisions[suggestion.id] === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {decisions[suggestion.id] === 'accepted' ? 'Übernommen' : decisions[suggestion.id] === 'rejected' ? 'Abgelehnt' : 'Bearbeitet'}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {suggestion.actions.map((action, idx) => (
                                <div key={idx} className="bg-white border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-medium shadow-2xs">
                                  {action.label}
                                </div>
                              ))}
                            </div>

                            {!decisions[suggestion.id] && (
                              <div className="flex items-center space-x-2 pt-2 border-t border-indigo-100/50">
                                <button 
                                  onClick={() => handleDecision(group.caseId, suggestion, event.id, 'accepted')}
                                  className="flex-1 flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-md text-xs font-medium transition-colors min-h-[44px]"
                                  aria-label="Vorschlag übernehmen"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Übernehmen</span>
                                </button>
                                <button 
                                  onClick={() => handleDecision(group.caseId, suggestion, event.id, 'edited')}
                                  className="flex items-center justify-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 px-3 rounded-md text-xs font-medium transition-colors min-h-[44px]"
                                  aria-label="Vorschlag bearbeiten"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Bearbeiten</span>
                                </button>
                                <button 
                                  onClick={() => handleDecision(group.caseId, suggestion, event.id, 'rejected')}
                                  className="flex items-center justify-center space-x-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 py-2 px-3 rounded-md text-xs font-medium transition-colors min-h-[44px]"
                                  aria-label="Vorschlag ablehnen"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Ablehnen</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {filteredCaseGroups.length > displayLimit && (
        <div className="flex justify-center pt-2 pb-6">
          <button
            onClick={() => setDisplayLimit(prev => prev + 25)}
            className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all min-h-[44px]"
          >
            Weitere Aktivitäten laden ({filteredCaseGroups.length - displayLimit} verbleibend)
          </button>
        </div>
      )}
    </div>
  );
});
