import { apiFetch } from "@/src/lib/api-client";
import { PWAInstallPrompt, PWAInstallButton } from './components/PWAInstallPrompt';
import React, { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import {
  Users,
  User,
  Calendar,
  Calculator,
  ReceiptEuro,
  Contact,
  Bot,
  Search,
  Plus,
  FileText,
  FolderOpen,
  FileAudio,
  MapPin,
  Phone,
  Mail,
  Upload,
  Trash2,
  CheckCircle2,
  Sparkles,
  Wrench,
  Car,
  Truck,
  ShieldAlert,
  Clock,
  RotateCcw,
  UserCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Navigation,
  ExternalLink,
  RefreshCw,
  Building2,
  ArrowRight,
  Map,
  Minus,
  Box,
  Package,
  PackagePlus,
  Files,
  Menu,
  X,
  Pencil,
  BookmarkPlus,
  Save,
  AlertTriangle,
  CheckCircle,
  Check,
  ChevronLeft,
  Reply,
  Ban,
  CalendarPlus,
  Euro
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomerProvider, useCustomer } from '@/src/contexts/customer-context';
import { EditCustomerModal } from '@/src/components/EditCustomerModal';
import { OfferProvider, useOffer } from '@/src/contexts/offer-context';
import { EmployeeProvider, useEmployee } from '@/src/contexts/employee-context';
import { VehicleProvider, useVehicle, type Vehicle } from '@/src/contexts/vehicle-context';
import { employees, Employee, License, allRoles } from '@/src/lib/mitarbeiter-data';
import { companyData } from '@/src/lib/company-data';
import { ITEM_CBM_DEFAULTS } from '@/src/lib/item-cbm-defaults';
import { getItemMappingStatus, saveCustomMapping, findItemInDefaultsOrCustom } from '@/src/lib/custom-mapping-store';
import { generateOrientierungsangebotPDF, generateOfferPDF, generateInvoicePDF, generateStornoInvoicePDF, generateStornoAnzahlungsrechnungPDF, generateLieferscheinPDF } from '@/src/lib/pdf-generator';
import type { OfferItem } from '@/src/contexts/offer-context';
import { DokumenteTab } from '@/src/components/DokumenteTab';
import { AIWorkspaceHub } from '@/src/components/AIWorkspaceHub';
import { MailKalenderTab } from '@/src/components/MailKalenderTab';
import { AIAssistantWidget } from '@/src/components/AIAssistantWidget';
import type { Customer, Job, Invoice, AppDocument } from '@/src/lib/types';
import { normalizeCustomerData, mergeCustomerData } from '@/src/lib/customer-adapter';
import { logoBase64 } from '@/src/lib/logo-data';
import logo2 from '@/src/LOgo2.png';
import { GlobalDeleteDialog } from '@/src/components/GlobalDeleteDialog';
import { getBuildInfo } from '@/src/lib/environment-config';
import { caseService } from '@/src/lib/case-service';
import { workflowExceptionService } from '@/src/lib/workflow-exception-service';
import { checkCustomerCalendarMatch, checkCustomerEmailMatch } from '@/src/lib/match-checker';

import {
  buildCalculationCostItems,
  parseDistanceHelper,
  parseFloorHelper,
  parseElevatorHelper,
  parseHelpersHelper
} from '@/src/lib/offer-calculation';

// Callbacks for PDF modification modal
let globalOnTriggerOrientierungsangebot: ((customer: Customer, items: any[], totalM3: number) => void) | null = null;
let globalOnTriggerAnzahlungsrechnung: ((customer: Customer, items: any[], totalM3: number, anzahlung: number, restbetrag: number) => void) | null = null;
let globalOnTriggerRechnung: ((customer: Customer, items: any[], totalM3: number, anzahlung: number, restbetrag: number) => void) | null = null;
let globalOnTriggerStornoRechnung: ((customer: Customer, items: any[], totalM3: number) => void) | null = null;
let globalOnTriggerStornoAnzahlungsrechnung: ((customer: Customer, items: any[], totalM3: number) => void) | null = null;
let globalOnTriggerLieferschein: ((customer: Customer, job: any, items: any[], workers: string[], note: string) => void) | null = null;
let globalOnAddDocument: ((doc: any) => void) | null = null;

type ManualCustomerDetails = {
  customerNumber: string;
  company: string;
  invoiceAddress: string;
  pickupAddress: string;
  pickupFloor: string;
  pickupLift: boolean;
  pickupTruckDistance: string;
  destinationAddress: string;
  destinationFloor: string;
  destinationLift: boolean;
  destinationTruckDistance: string;
  moveDate: string;
  startTime: string;
  moveSize: string;
  helpers: string;
  notes: string;
  hvz: boolean;
  assembly: boolean;
  insurance: boolean;
  packing: boolean;
  unpacking: boolean;
  storage: boolean;
  householdClearance: boolean;
};

const EMPTY_MANUAL_CUSTOMER_DETAILS: ManualCustomerDetails = {
  customerNumber: '',
  company: '',
  invoiceAddress: '',
  pickupAddress: '',
  pickupFloor: 'EG',
  pickupLift: false,
  pickupTruckDistance: '10',
  destinationAddress: '',
  destinationFloor: 'EG',
  destinationLift: false,
  destinationTruckDistance: '10',
  moveDate: '',
  startTime: '08:00',
  moveSize: '',
  helpers: '',
  notes: '',
  hvz: false,
  assembly: false,
  insurance: false,
  packing: false,
  unpacking: false,
  storage: false,
  householdClearance: false
};

// PDF Export Helpers (re-exported/imported from offer-calculation.ts)

function triggerOrientierungsangebot(customer: Customer, customParams?: any) {
  const { items, totalM3 } = buildCalculationCostItems(customer, customParams);

  if (globalOnTriggerOrientierungsangebot) {
    globalOnTriggerOrientierungsangebot(customer, items, totalM3);
  } else {
    generateOrientierungsangebotPDF(
      customer,
      items,
      null,
      'download',
      'OA-' + customer.id.substring(0, 8).toUpperCase(),
      totalM3,
      customer.umzugsdetails?.gewuenschterUmzugstermin
    );
  }
}

function triggerAnzahlungsrechnung(customer: Customer, customParams?: any) {
  const { items, totalM3, subtotal } = buildCalculationCostItems(customer, customParams);
  const anzahlung = subtotal * 0.3;
  const restbetrag = subtotal * 0.7;

  if (globalOnTriggerAnzahlungsrechnung) {
    globalOnTriggerAnzahlungsrechnung(customer, items, totalM3, anzahlung, restbetrag);
  } else {
    generateOfferPDF(
      customer,
      items,
      null,
      'download',
      'Zahlungsbedingungen: 30% Anzahlung sofort fällig, Rest nach erbrachter Leistung.',
      'AR-' + customer.id.substring(0, 8).toUpperCase(),
      totalM3,
      customer.umzugsdetails?.gewuenschterUmzugstermin,
      anzahlung,
      restbetrag
    );
  }
}

function triggerRechnung(customer: Customer, customParams?: any) {
  const { items, totalM3, subtotal } = buildCalculationCostItems(customer, customParams);
  const anzahlung = subtotal * 0.3; // Can be configured later if needed
  const restbetrag = subtotal * 0.7;

  if (globalOnTriggerRechnung) {
    globalOnTriggerRechnung(customer, items, totalM3, anzahlung, restbetrag);
  } else {
    generateInvoicePDF(
      customer,
      items,
      null,
      'download',
      'RE-' + customer.id.substring(0, 8).toUpperCase(),
      totalM3,
      customer.umzugsdetails?.gewuenschterUmzugstermin,
      anzahlung,
      restbetrag
    );
  }
}

function triggerStornoRechnung(customer: Customer, customParams?: any) {
  const { items, totalM3 } = buildCalculationCostItems(customer, customParams);
  const stornoItems = items.map(item => ({
    ...item,
    unitPrice: -Math.abs(item.unitPrice),
    total: -Math.abs(item.total)
  }));

  if (globalOnTriggerStornoRechnung) {
    globalOnTriggerStornoRechnung(customer, stornoItems, totalM3);
  } else {
    generateStornoInvoicePDF(
      customer,
      stornoItems,
      null,
      'download',
      'SR-' + customer.id.substring(0, 8).toUpperCase(),
      totalM3,
      customer.umzugsdetails?.gewuenschterUmzugstermin
    );
  }
}

function triggerStornoAnzahlungsrechnung(customer: Customer, customParams?: any) {
  const { items, totalM3 } = buildCalculationCostItems(customer, customParams);
  const stornoItems = items.map(item => ({
    ...item,
    unitPrice: -Math.abs(item.unitPrice),
    total: -Math.abs(item.total)
  }));

  if (globalOnTriggerStornoAnzahlungsrechnung) {
    globalOnTriggerStornoAnzahlungsrechnung(customer, stornoItems, totalM3);
  } else {
    generateStornoAnzahlungsrechnungPDF(
      customer,
      stornoItems,
      null,
      'download',
      'SAR-' + customer.id.substring(0, 8).toUpperCase(),
      totalM3,
      customer.umzugsdetails?.gewuenschterUmzugstermin
    );
  }
}

function triggerLieferschein(job: Job) {
  const mockCustomer: Customer = {
    id: job.customerId,
    name: job.customerName,
    email: '',
    phone: '',
    address: { street: '', city: '', zip: '', country: 'Österreich' },
    nameLower: job.customerName.toLowerCase(),
    createdAt: '',
    avatarUrl: '',
    abholadresse: { strasse: job.abholadresse?.strasse || '—' },
    zieladresse: { strasse: job.zieladresse?.strasse || '—' },
    gegenstaende: {}
  };

  const itemsList = [
    { name: 'Sitzlandschaft Couch', count: '1', montage: true },
    { name: 'Doppelbett komplett', count: '1', montage: true },
    { name: 'Umzugskartons Standard', count: '25' }
  ];

  const docNumber = 'LS-' + job.id.substring(0, 8).toUpperCase();
  generateLieferscheinPDF(
    mockCustomer,
    job,
    itemsList,
    job.allocations?.[0]?.workers || ['Dominik Sturm', 'Dragan Dojkovic'],
    job.notes || 'Bitte vorsichtig tragen.',
    null,
    'save',
    docNumber,
    job.totalM3,
    '08:00',
    '16:00'
  );

  if (globalOnAddDocument) {
    globalOnAddDocument({
      id: `doc_${Date.now()}`,
      customerId: job.customerId,
      customerName: job.customerName,
      type: 'Lieferschein',
      docNumber: docNumber,
      date: new Date().toISOString()
    });
  }
}

// Main Container
export default function App() {
  return (
    <CustomerProvider>
      <OfferProvider>
        <EmployeeProvider>
          <VehicleProvider>
            <DashboardLayout />
          </VehicleProvider>
        </EmployeeProvider>
      </OfferProvider>
    </CustomerProvider>
  );
}

function formatDateSafe(dateVal: any): string {
  if (!dateVal) return '—';
  try {
    if (typeof dateVal === 'string') {
      const deMatch = dateVal.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (deMatch) {
        return dateVal;
      }
    }
    if (typeof dateVal === 'object') {
      if (typeof dateVal.toDate === 'function') {
        return dateVal.toDate().toLocaleDateString('de-DE');
      }
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('de-DE');
  } catch (e) {
    return '—';
  }
  return '—';
}

function SidebarQuickSearch({
  customers,
  onSelectCustomer,
  emails,
  calendarEvents
}: {
  customers: Customer[];
  onSelectCustomer: (c: Customer) => void;
  emails: any[];
  calendarEvents: any[];
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const handleAILearning = (e: any) => {
      setAiMessage(e.detail);
      setTimeout(() => setAiMessage(null), 5000);
    };
    window.addEventListener('ai-learning', handleAILearning);
    return () => window.removeEventListener('ai-learning', handleAILearning);
  }, []);

  const results = React.useMemo(() => {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    return customers
      .filter(c =>
        String(c.name || '').toLowerCase().includes(q) ||
        String(c.email || '').toLowerCase().includes(q) ||
        String(c.phone || '').toLowerCase().includes(q) ||
        String(c.kundenNummer || '').toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [customers, query]);

  return (
    <div className="relative mb-3 z-50">
      {aiMessage && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg bg-indigo-600/95 p-2 text-xs font-medium text-white shadow-lg shadow-indigo-900/20 ring-1 ring-white/10 backdrop-blur-sm z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-200 mt-0.5" />
            <p className="leading-snug">{aiMessage}</p>
          </div>
        </div>
      )}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        <input
          type="text"
          placeholder="Kunden Schnellsuche..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-200 text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 space-y-1 z-50 max-h-60 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center border-b border-slate-800">
            <span>Kunden Treffer ({results.length})</span>
            <span className="text-slate-500">Max 4</span>
          </div>
          {results.length === 0 ? (
            <div className="p-2 text-center text-[11px] text-slate-500 italic">Kein Kunde gefunden</div>
          ) : (
            results.map((c) => {
              const hasEmail = checkCustomerEmailMatch(c, emails);
              const hasCal = checkCustomerCalendarMatch(c, calendarEvents);

              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    onSelectCustomer(c);
                    setQuery('');
                    setIsOpen(false);
                  }}
                  className="w-full p-2 text-left bg-slate-800/80 hover:bg-slate-750 border border-slate-700/50 hover:border-indigo-500/50 rounded-lg transition-all flex items-center justify-between group"
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 truncate">{c.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{c.kundenNummer || c.email || 'Kunde'}</div>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    {hasEmail && (
                      <span className="p-1 rounded bg-purple-900/80 text-purple-200 border border-purple-600/80" title="E-Mail Match vorhanden">
                        <Mail className="w-3 h-3 text-purple-300" />
                      </span>
                    )}
                    {hasCal && (
                      <span className="p-1 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-600/80" title="Kalender Match vorhanden">
                        <Calendar className="w-3 h-3 text-emerald-300" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


function DashboardLayout() {
  const { customers, activeCustomer, setActiveCustomer, loading, updateCustomer, addCustomer, deleteCustomer } = useCustomer();
  const { loadItemsForCustomer } = useOffer();
  const { vehicles } = useVehicle();
  const { employees: teamEmployees } = useEmployee();
  const [mobileAIMode, setMobileAIMode] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState<'kunden' | 'rechner' | 'disposition' | 'mitarbeiter' | 'workspace' | 'dokumente' | 'mail_kalender'>('kunden');
  const [mailKalenderTarget, setMailKalenderTarget] = useState<{ type: 'mail' | 'calendar'; emailStr?: string; openReply?: boolean } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceAttentionCount, setWorkspaceAttentionCount] = useState(0);
  const [mailAttentionCount, setMailAttentionCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [documents, setDocuments] = useState<AppDocument[]>(() => {
    const saved = localStorage.getItem("app_documents");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const [localEmails, setLocalEmails] = useState<any[]>([]);
  const [localEvents, setLocalEvents] = useState<any[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem("app_documents", JSON.stringify(documents));
    } catch (e: any) {
      if (e?.name === 'QuotaExceededError' || e?.code === 22 || String(e).includes('quota')) {
        try {
          const leanDocs = documents.map(d => {
            const { pdfBlob, fileData, fileBuffer, ...rest } = d as any;
            return rest;
          });
          localStorage.setItem("app_documents", JSON.stringify(leanDocs));
        } catch (retryErr) {
          console.warn("LocalStorage quota limit reached for app_documents.");
        }
      } else {
        console.warn("Failed to persist app_documents to localStorage:", e?.message || e);
      }
    }
  }, [documents]);

  useEffect(() => {
    const handleMailTaskCount = (event: Event) => {
      const count = Number((event as CustomEvent<number>).detail) || 0;
      setMailAttentionCount(count);
    };
    const handleOpenMail = (event: Event) => {
      setMailKalenderTarget({ type: 'mail', emailStr: String((event as CustomEvent<string>).detail || '') });
      setActiveTab('mail_kalender');
    };
    const handleOpenCustomerCrm = (event: Event) => {
      setActiveTab('kunden');
    };
    const handleNavigateTab = (event: Event) => {
      setActiveTab((event as CustomEvent<string>).detail as any);
    };
    window.addEventListener('mail-tasks-count', handleMailTaskCount);
    window.addEventListener('open-mail-from-ai', handleOpenMail);
    window.addEventListener('open-customer-crm', handleOpenCustomerCrm);
    window.addEventListener('navigate-tab', handleNavigateTab);
    return () => {
      window.removeEventListener('mail-tasks-count', handleMailTaskCount);
      window.removeEventListener('open-mail-from-ai', handleOpenMail);
      window.removeEventListener('open-customer-crm', handleOpenCustomerCrm);
      window.removeEventListener('navigate-tab', handleNavigateTab);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadMatchData = async () => {
      try {
        const [savedEmails, savedEvents] = await Promise.all([
          get<any[]>('outlook_emails_list_v2'),
          get<any[]>('outlook_calendar_events_v2')
        ]);
        if (!active) return;
        setLocalEmails(Array.isArray(savedEmails) ? savedEmails : []);
        setLocalEvents(Array.isArray(savedEvents) ? savedEvents : []);
      } catch (error) {
        console.error('CRM-Matchdaten konnten nicht geladen werden:', error);
      }
    };
    void loadMatchData();
    const interval = window.setInterval(loadMatchData, 4_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const refreshWorkspaceAttention = () => {
      try {
        const cached = JSON.parse(localStorage.getItem('hueber_ai_assistant_cache_v2') || '{}');
        const anfragen = Array.isArray(cached.anfragen) ? cached.anfragen : [];
        const wichtig = Array.isArray(cached.wichtig) ? cached.wichtig : [];
        const handledItems = Array.isArray(cached.handledItems) ? cached.handledItems : [];
        
        const anfragenCount = anfragen.filter((item: any) => !handledItems.includes(item.id)).length;
        const wichtigCount = wichtig.filter((item: any) => !handledItems.includes(item.id)).length;
        
        setWorkspaceAttentionCount(anfragenCount + wichtigCount);
      } catch {
        setWorkspaceAttentionCount(0);
      }
    };
    refreshWorkspaceAttention();
    window.addEventListener('assistant_cache_updated', refreshWorkspaceAttention);
    return () => window.removeEventListener('assistant_cache_updated', refreshWorkspaceAttention);
  }, []);

  useEffect(() => {
    // 1. Process URL hash if redirected back from Microsoft OAuth
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token=') || hash.includes('id_token='))) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');
      const token = accessToken || idToken;

      if (token) {
        // If this is a popup window, send the token to the parent
        if (window.opener && window.opener !== window) {
          try {
            window.opener.postMessage({
              type: 'MS_OAUTH_TOKEN',
              token: token,
              isAccessToken: !!accessToken
            }, '*');
            window.close();
            return;
          } catch (e) {
            console.warn('PostMessage popup error:', e);
          }
        } else {
          // If this is the main window (redirect mode), save directly
          if (accessToken) {
            localStorage.setItem('ms_graph_access_token', accessToken);
            window.dispatchEvent(new CustomEvent('ms_oauth_token_received', { detail: accessToken }));
          } else {
            window.dispatchEvent(new CustomEvent('toast_notification', { detail: { type: 'warning', message: 'Hinweis: Nur ID-Token empfangen. Im Azure Portal muss "Zugriffstoken" angehakt sein.' } }));
          }
          // Clear URL hash for a clean address bar
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }

    // 2. Global listener for postMessage (from popup)
    const handleOAuthMessage = (event: MessageEvent) => {
      console.log("Received message from origin:", event.origin);

      if (event.data && event.data.type === 'MS_OAUTH_TOKEN' && event.data.token) {
        if (!event.data.isAccessToken) {
          window.dispatchEvent(new CustomEvent('toast_notification', { detail: { type: 'warning', message: 'Hinweis: Nur ID-Token empfangen. Im Azure Portal muss "Zugriffstoken" angehakt sein.' } }));
          return;
        }
        localStorage.setItem('ms_graph_access_token', event.data.token);
        localStorage.setItem('outlook_logged_in', 'true');
        window.dispatchEvent(new CustomEvent('ms_oauth_token_received', { detail: event.data.token }));
      }
    };

    window.addEventListener('message', handleOAuthMessage);

    const handleResize = () => {
      setMobileAIMode(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('message', handleOAuthMessage);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // States for interactive PDF editing modal
  const [showEditPDFModal, setShowEditPDFModal] = useState(false);
  const [editPDFType, setEditPDFType] = useState<'orientierung' | 'anzahlung' | 'rechnung' | 'lieferschein' | 'storno_rechnung' | 'storno_anzahlung' | null>(null);
  const [editLieferscheinJob, setEditLieferscheinJob] = useState<any>(null);
  const [editLieferscheinWorkers, setEditLieferscheinWorkers] = useState<any[]>([]);
  const [editLieferscheinNote, setEditLieferscheinNote] = useState<string>('');
  const [editPDFCustomer, setEditPDFCustomer] = useState<Customer | null>(null);
  const [editPDFItems, setEditPDFItems] = useState<OfferItem[]>([]);
  const [editPDFTotalM3, setEditPDFTotalM3] = useState<number>(0);
  const [editPDFAnzahlung, setEditPDFAnzahlung] = useState<number>(0);
  const [editPDFRestbetrag, setEditPDFRestbetrag] = useState<number>(0);
  const [editPDFDocNumber, setEditPDFDocNumber] = useState<string>('');
  const [editPDFDocDate, setEditPDFDocDate] = useState<string>('');
  const [editPDFLeistungsdatum, setEditPDFLeistungsdatum] = useState<string>('');
  const [anzahlungPercent, setAnzahlungPercent] = useState<number>(30);
  const [alreadyPaidAmount, setAlreadyPaidAmount] = useState<number>(0);

  const getNextDocNumber = (type: string, customerId: string) => {
    const dateStr = new Date().toISOString().split('T')[0];
    const prefix = type.substring(0,3).toUpperCase();
    return `${prefix}-${dateStr}-${customerId.substring(0,4)}`;
  };

  useEffect(() => {
    globalOnTriggerOrientierungsangebot = (customer: Customer, items: OfferItem[], totalM3: number) => {
      setEditPDFCustomer(customer);
      setEditPDFItems(items);
      setEditPDFTotalM3(totalM3);
      setEditPDFType('orientierung');
      setEditPDFDocNumber(getNextDocNumber('ORI', customer.id));
      setEditPDFDocDate(new Date().toLocaleDateString('de-DE'));
      setShowEditPDFModal(true);
    };

    globalOnTriggerAnzahlungsrechnung = (customer: Customer, items: OfferItem[], totalM3: number) => {
      setEditPDFCustomer(customer);
      setEditPDFItems(items);
      setEditPDFTotalM3(totalM3);
      setEditPDFType('anzahlung');
      setAnzahlungPercent(30);
      setEditPDFDocNumber(getNextDocNumber('ANZ', customer.id));
      setEditPDFDocDate(new Date().toLocaleDateString('de-DE'));
      setShowEditPDFModal(true);
    };

    globalOnTriggerRechnung = (customer: Customer, items: OfferItem[], totalM3: number) => {
      setEditPDFCustomer(customer);
      setEditPDFItems(items);
      setEditPDFTotalM3(totalM3);
      setEditPDFType('rechnung');
      setAlreadyPaidAmount(0);
      setEditPDFDocNumber(getNextDocNumber('REC', customer.id));
      setEditPDFDocDate(new Date().toLocaleDateString('de-DE'));
      setEditPDFLeistungsdatum(customer.umzugsdetails?.gewuenschterUmzugstermin || '');
      setShowEditPDFModal(true);
    };

    globalOnTriggerStornoRechnung = (customer: Customer, items: OfferItem[], totalM3: number) => {
      setEditPDFCustomer(customer);
      setEditPDFItems(items);
      setEditPDFTotalM3(totalM3);
      setEditPDFType('storno_rechnung');
      setEditPDFDocNumber(getNextDocNumber('SR', customer.id));
      setEditPDFDocDate(new Date().toLocaleDateString('de-DE'));
      setEditPDFLeistungsdatum(customer.umzugsdetails?.gewuenschterUmzugstermin || '');
      setShowEditPDFModal(true);
    };

    globalOnTriggerStornoAnzahlungsrechnung = (customer: Customer, items: OfferItem[], totalM3: number) => {
      setEditPDFCustomer(customer);
      setEditPDFItems(items);
      setEditPDFTotalM3(totalM3);
      setEditPDFType('storno_anzahlung');
      setEditPDFDocNumber(getNextDocNumber('SAR', customer.id));
      setEditPDFDocDate(new Date().toLocaleDateString('de-DE'));
      setShowEditPDFModal(true);
    };

    globalOnAddDocument = (doc: any) => {
      setDocuments(prev => [...prev, doc]);
      if (doc.customerId && (doc.type === 'Anzahlungsrechnung' || doc.type === 'AZ')) {
        void updateCustomer(doc.customerId, { hasInvoiceCreated: true, arCreated: true });
      } else if (doc.customerId && (doc.type === 'Rechnung' || doc.type === 'RE')) {
        void updateCustomer(doc.customerId, { hasInvoiceCreated: true, reCreated: true });
      }
    };

    globalOnTriggerLieferschein = (job: any) => {
      setEditLieferscheinJob(job);
      setEditLieferscheinWorkers(job.assignedWorkers || []);
      setEditLieferscheinNote('');
      setEditPDFType('lieferschein');
      setEditPDFDocNumber(getNextDocNumber('LIEF', job.customerId));
      setEditPDFDocDate(new Date().toLocaleDateString('de-DE'));
      setShowEditPDFModal(true);
    };

    return () => {
      globalOnTriggerOrientierungsangebot = null;
      globalOnTriggerAnzahlungsrechnung = null;
      globalOnTriggerRechnung = null;
      globalOnTriggerStornoRechnung = null;
      globalOnTriggerStornoAnzahlungsrechnung = null;
      globalOnAddDocument = null;
      globalOnTriggerLieferschein = null;
    };
  }, []);

  const handleUpdateEditItem = (index: number, fields: Partial<OfferItem>) => {
    setEditPDFItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, ...fields };
      updated.total = updated.quantity * updated.unitPrice;
      return updated;
    }));
  };

  const handleRemoveEditItem = (index: number) => {
    setEditPDFItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddEditItem = () => {
    setEditPDFItems(prev => [...prev, {
      id: 'manual_' + Date.now(),
      description: 'Neue Position',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }]);
  };

  const subtotalEdit = editPDFItems.reduce((sum, i) => sum + i.total, 0);
  const vatEdit = subtotalEdit * 0.20;
  const totalGrossEdit = subtotalEdit + vatEdit;

  const calculatedAnzahlung = (totalGrossEdit * (anzahlungPercent / 100));
  const calculatedRestbetrag = totalGrossEdit - alreadyPaidAmount;
  const handleDeleteEditItem = (index: number) => {
    setEditPDFItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateDocument = async () => {
    if (!editPDFCustomer) return;

    if (editPDFType === 'orientierung') {
      const { dataUrl } = await generateOrientierungsangebotPDF(editPDFCustomer, editPDFItems, logoBase64, 'save', editPDFDocNumber, editPDFTotalM3, undefined, undefined, editPDFDocDate);
      if (globalOnAddDocument) {
        globalOnAddDocument({
          id: 'doc_' + Date.now(),
          customerId: editPDFCustomer.id,
          customerName: editPDFCustomer.name,
          type: 'Orientierungsangebot',
          url: dataUrl,
          docNumber: editPDFDocNumber,
          date: new Date().toISOString()
        });
      }
      await updateCustomer(editPDFCustomer.id, { hasInvoiceCreated: true, arCreated: true });
      setActiveTab('dokumente');
    } else if (editPDFType === 'anzahlung') {
      const { dataUrl } = await generateOfferPDF(editPDFCustomer, editPDFItems, logoBase64, 'save', null, editPDFDocNumber, editPDFTotalM3, undefined, calculatedAnzahlung, calculatedRestbetrag, undefined, editPDFDocDate);
      if (globalOnAddDocument) {
        globalOnAddDocument({
          id: 'doc_' + Date.now(),
          customerId: editPDFCustomer.id,
          customerName: editPDFCustomer.name,
          type: 'Anzahlungsrechnung',
          url: dataUrl,
          docNumber: editPDFDocNumber,
          date: new Date().toISOString()
        });
      }
      await updateCustomer(editPDFCustomer.id, { hasInvoiceCreated: true, reCreated: true });
      setActiveTab('dokumente');
    } else if (editPDFType === 'rechnung') {
      const { dataUrl } = await generateInvoicePDF(editPDFCustomer, editPDFItems, logoBase64, 'save', editPDFDocNumber, editPDFTotalM3, editPDFLeistungsdatum, calculatedAnzahlung, calculatedRestbetrag, undefined, editPDFDocDate);
      if (globalOnAddDocument) {
        globalOnAddDocument({
          id: 'doc_' + Date.now(),
          customerId: editPDFCustomer.id,
          customerName: editPDFCustomer.name,
          type: 'Rechnung',
          url: dataUrl,
          docNumber: editPDFDocNumber,
          date: new Date().toISOString()
        });
      }
      setActiveTab('dokumente');
    } else if (editPDFType === 'lieferschein' && editLieferscheinJob) {
      const job = editLieferscheinJob;
      const workerNames = editLieferscheinWorkers.map(w => typeof w === 'string' ? w : (w as any).name);

      const { dataUrl } = await generateLieferscheinPDF(
        editPDFCustomer,
        job as any,
        [],
        workerNames,
        editLieferscheinNote,
        logoBase64,
        'save',
        editPDFDocNumber,
        editPDFTotalM3,
        '08:00',
        '16:00',
        undefined,
        undefined,
        {
          fahrzeuge: '3,5t LKW',
          gesamtgewicht: '750 kg'
        }
      );

      setDocuments(prev => [...prev, {
        id: 'doc_' + Date.now(),
        customerId: job.customerId,
        customerName: job.customerName,
        type: 'Lieferschein',
        url: dataUrl,
        docNumber: editPDFDocNumber,
        date: new Date().toISOString()
      }]);
      setActiveTab('dokumente');
    }

    setShowEditPDFModal(false);
  }

  // Customers Logic
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [modalTab, setModalTab] = useState<'manual'|'ai'|'import'>('manual');
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [manualCustomerDetails, setManualCustomerDetails] = useState<ManualCustomerDetails>(() => ({ ...EMPTY_MANUAL_CUSTOMER_DETAILS }));
  const [importText, setImportText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);



  const handleSelectCustomer = async (cust: Customer | null) => {
    setActiveCustomer(cust);
    if (cust) {
      loadItemsForCustomer(cust);
    }
  };

  const handleAddManualCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;

    const newCust: Customer = {
      id: 'cust_' + Date.now(),
      kundenNummer: manualCustomerDetails.customerNumber || undefined,
      firma: manualCustomerDetails.company || undefined,
      name: newCustName,
      email: newCustEmail,
      phone: newCustPhone,
      address: { street: '', city: '', zip: '', country: 'Österreich' },
      nameLower: newCustName.toLowerCase(),
      createdAt: new Date().toISOString(),
      avatarUrl: `https://picsum.photos/seed/${Date.now()}/40/40`,
      abholadresse: { strasse: manualCustomerDetails.pickupAddress, stockwerk: manualCustomerDetails.pickupFloor, aufzug: manualCustomerDetails.pickupLift ? 'Ja' : 'Nein', entfernungLKW: manualCustomerDetails.pickupTruckDistance, gebaeudetyp: 'Neubau' },
      zieladresse: { strasse: manualCustomerDetails.destinationAddress, stockwerk: manualCustomerDetails.destinationFloor, aufzug: manualCustomerDetails.destinationLift ? 'Ja' : 'Nein', entfernungLKW: manualCustomerDetails.destinationTruckDistance, gebaeudetyp: 'Neubau' },
      rechnungsadresse: { line1: manualCustomerDetails.invoiceAddress || manualCustomerDetails.pickupAddress },
      umzugsdetails: { gewuenschterUmzugstermin: manualCustomerDetails.moveDate, voraussichtlicheStartzeit: manualCustomerDetails.startTime, umzugsgroesse: manualCustomerDetails.moveSize },
      zusatzoptionen: { helfer: manualCustomerDetails.helpers },
      anmerkungen: manualCustomerDetails.notes,
      gegenstaende: {},
      nebenleistungen: {
        einrichtenHVZ: manualCustomerDetails.hvz,
        moebelmontage: manualCustomerDetails.assembly,
        transportVersicherung: manualCustomerDetails.insurance,
        verpacken: manualCustomerDetails.packing,
        auspacken: manualCustomerDetails.unpacking,
        zwischenlagerung: manualCustomerDetails.storage,
        haushaltsaufloesung: manualCustomerDetails.householdClearance,
      }
    };

    await addCustomer(newCust);
    handleSelectCustomer(newCust);
    setSearchQuery('');
    setActiveTab('kunden');
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustEmail('');
    setNewCustPhone('');
    setManualCustomerDetails({ ...EMPTY_MANUAL_CUSTOMER_DETAILS });
  };

  const handleImportCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setIsExtracting(true);
    try {
      const res = await apiFetch('/api/ai/extract-customer-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: importText })
      });
      if (res.ok) {
        const parsed = await res.json();
        const normalizedCustomer = normalizeCustomerData(parsed);

        // Check if existing customer matches by email, phone, or name
        const existing = customers.find(c => {
          if (c.email && normalizedCustomer.email && c.email.toLowerCase() === normalizedCustomer.email.toLowerCase()) return true;
          if (c.phone && normalizedCustomer.phone && c.phone.replace(/\D/g, '') && c.phone.replace(/\D/g, '') === normalizedCustomer.phone.replace(/\D/g, '')) return true;
          if (c.name && normalizedCustomer.name && c.name.toLowerCase().trim() === normalizedCustomer.name.toLowerCase().trim()) return true;
          return false;
        });

        if (existing) {
          const merged = mergeCustomerData(existing, normalizedCustomer);
          await updateCustomer(existing.id, merged);
          handleSelectCustomer(merged);
          window.dispatchEvent(new CustomEvent('toast_notification', { detail: { type: 'success', message: `Kundendaten für "${merged.name}" wurden automatisch zugeordnet & aktualisiert!` } }));
        } else {
          await addCustomer(normalizedCustomer);
          handleSelectCustomer(normalizedCustomer);
          window.dispatchEvent(new CustomEvent('toast_notification', { detail: { type: 'success', message: `Neuer Kunde "${normalizedCustomer.name}" wurde erfolgreich mit KI-Daten erstellt.` } }));
        }

        setSearchQuery('');
        setActiveTab('kunden');
        setShowAddCustomerModal(false);
        setImportText('');
        setModalTab('manual');
      } else {
        window.dispatchEvent(new CustomEvent('toast_notification', { detail: { type: 'error', message: 'Extraktion fehlgeschlagen. Bitte versuche es erneut oder lege den Kunden manuell an.' } }));
      }
    } catch (e) {
      console.error("Text customer extraction failed:", e);
      window.dispatchEvent(new CustomEvent('toast_notification', { detail: { type: 'error', message: 'Es gab einen Fehler bei der KI-Extraktion. Bitte versuche es manuell.' } }));
    } finally {
      setIsExtracting(false);
    }
  };


  const filteredCustomers = customers.filter(c =>
    String(c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.address?.city && c.address.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.abholadresse?.strasse && c.abholadresse.strasse.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleUpdateDocument = (updatedDocument: AppDocument) => {
    setDocuments(previous => previous.map(document => document.id === updatedDocument.id ? updatedDocument : document));
    if (updatedDocument.type === 'Anzahlungsrechnung') {
      void updateCustomer(updatedDocument.customerId, {
        hasInvoiceCreated: true,
        arCreated: true,
        arPaid: updatedDocument.status === 'paid'
      });
    }
    if (updatedDocument.type === 'Rechnung') {
      const isPaid = updatedDocument.status === 'paid';
      void updateCustomer(updatedDocument.customerId, {
        hasInvoiceCreated: true,
        reCreated: true,
        rechnungPaid: isPaid,
        isCompleted: isPaid,
        ...(isPaid ? { arPaid: true, completedAt: new Date().toISOString() } : {})
      });
    }
  };

  if (mobileAIMode) {

    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
        <WorkspaceTab
          onExitMobileAIMode={() => setMobileAIMode(false)}
        />
      </div>
    );
  }


  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      <PWAInstallPrompt />

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden p-0.5">
            <img src={logo2} alt="Spedition Hueber" className="w-full h-full object-contain rounded-full" />
          </div>
          <h1 className="font-bold text-sm tracking-wide text-indigo-400">Hueber Studio</h1>
        </div>
        <PWAInstallButton compact={true} className="mr-2 hidden sm:flex" />
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-300 hover:text-white">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? "absolute inset-y-0 left-0 flex shadow-2xl h-full" : "hidden"} md:flex w-64 bg-slate-900 text-white flex-col justify-between border-r border-slate-800 shrink-0 z-50 md:static transition-transform`}>
        <div className="overflow-y-auto">
          {/* Logo */}
          <div className="flex p-4 md:p-6 border-b border-slate-800 items-center justify-between">
            <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-md shadow-indigo-600/20 p-0.5 border border-slate-700">
              <img
                src={logo2}
                alt="Spedition Hueber"
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide uppercase text-indigo-400">Hueber Studio</h1>
                <p className="text-xs text-slate-400">Spedition & Logistik</p>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            <SidebarLink icon={Users} label="Kunden (CRM)" active={activeTab === 'kunden'} onClick={() => { setMobileMenuOpen(false); setActiveTab('kunden');}} />
            <SidebarLink icon={Calculator} label="Berechnung" active={activeTab === 'rechner'} onClick={() => { setMobileMenuOpen(false); setActiveTab('rechner');}} />
            <SidebarLink icon={Calendar} label="Lieferschein" active={activeTab === 'disposition'} onClick={() => { setMobileMenuOpen(false); setActiveTab('disposition');}} />
            <SidebarLink icon={Files} label="Dokumente" active={activeTab === 'dokumente'} onClick={() => { setMobileMenuOpen(false); setActiveTab('dokumente');}} />
            <SidebarLink icon={Mail} label="Mail & Kalender" active={activeTab === 'mail_kalender'} onClick={() => { setMobileMenuOpen(false); setActiveTab('mail_kalender');}} />
            <SidebarLink icon={Contact} label="Mitarbeiter" active={activeTab === 'mitarbeiter'} onClick={() => { setMobileMenuOpen(false); setActiveTab('mitarbeiter');}} />
            <SidebarLink icon={Bot} label="AI & Workspace" badge={workspaceAttentionCount > 0 ? workspaceAttentionCount : undefined} active={activeTab === 'workspace'} onClick={() => { setMobileMenuOpen(false); setActiveTab('workspace');}} />
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400 space-y-1">
          <SidebarQuickSearch
            customers={customers}
            emails={localEmails}
            calendarEvents={localEvents}
            onSelectCustomer={(customer) => {
              void handleSelectCustomer(customer);
              setActiveTab('kunden');
              setMobileMenuOpen(false);
            }}
          />
          <p className="font-semibold text-slate-300">{companyData.name}</p>
          <p>{companyData.city}, {companyData.country}</p>
          <p className="text-[10px] text-indigo-500/80 font-mono mt-1">{companyData.uidNumber}</p>
          <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase border border-indigo-700/50">
              {getBuildInfo().environment}
            </span>
            <span className="text-slate-400 font-mono">
              v{getBuildInfo().version}
            </span>
            <span className="flex items-center space-x-1 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sync</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:h-16 flex flex-col md:flex-row md:items-center justify-between shadow-sm z-10 shrink-0 gap-3 md:gap-0">
          <div className="flex items-center space-x-2 md:space-x-4">
            <span className="hidden md:inline text-slate-400 text-sm font-medium">Bürosystem</span>
            <ChevronRight className="hidden md:inline w-4 h-4 text-slate-300" />
            <span className="font-semibold text-slate-800 capitalize">{activeTab}</span>
          </div>

          {/* Active Customer Widget */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4 w-full md:w-auto">
            {activeCustomer ? (
              <div className="flex flex-wrap items-center gap-2 bg-indigo-600/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full overflow-hidden text-ellipsis w-full sm:w-auto">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0" />
                <span className="text-xs font-semibold text-indigo-800 truncate max-w-[120px] sm:max-w-none">
                  Kunde: <strong className="text-indigo-950 font-bold">{activeCustomer.name}</strong>
                </span>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setEditingCustomer(activeCustomer)}
                  className="text-xs text-indigo-900 hover:text-indigo-950 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 px-2 py-0.5 rounded font-bold transition-all flex items-center space-x-1 shrink-0"
                  title="Bearbeiten"
                >
                  <Pencil className="w-3 h-3 text-indigo-700" />
                  <span className="hidden sm:inline">Bearbeiten</span>
                </button>
                <button
                  onClick={() => setActiveCustomer(null)}
                  className="text-[10px] text-indigo-700 hover:text-indigo-900 bg-indigo-600/10 px-1.5 py-0.5 rounded font-mono font-bold shrink-0"
                  title="Auswahl aufheben"
                >
                  X
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic hidden sm:inline">Kein aktiver Kunde ausgewählt</span>
            )}

            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-indigo-600/20 transition-colors w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Neuer Kunde</span>
            </button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-y-auto md:overflow-hidden p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="min-h-full md:h-full"
            >
              {activeTab === 'kunden' && (
                <KundenTab
                  customers={filteredCustomers}
                  loading={loading}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  activeCustomer={activeCustomer}
                  onSelect={handleSelectCustomer}
                  onEditCustomer={(c) => setEditingCustomer(c)}
                  emails={localEmails}
                  calendarEvents={localEvents}
                  documents={documents}
                  onUpdateDocument={handleUpdateDocument}
                  onAddDocument={(newDocument) => setDocuments(previous => [...previous, newDocument])}
                  onNavigateToMail={(emailStr, openReply = false) => {
                    setMailKalenderTarget({ type: 'mail', emailStr, openReply });
                    setActiveTab('mail_kalender');
                  }}
                  onNavigateToCalendar={(emailStr) => {
                    setMailKalenderTarget({ type: 'calendar', emailStr });
                    setActiveTab('mail_kalender');
                  }}
                />
              )}

              {activeTab === 'rechner' && (
                <RechnerTab />
              )}

              {activeTab === 'disposition' && (
                <DispositionTab
                  customers={filteredCustomers.length > 0 ? filteredCustomers : customers}
                  activeCustomer={activeCustomer}
                  onSelectCustomer={handleSelectCustomer}
                />
              )}

              {activeTab === 'dokumente' && (
                <DokumenteTab
                  customers={customers}
                  activeCustomer={activeCustomer}
                  setActiveCustomer={setActiveCustomer}
                  documents={documents}
                  onDeleteDocument={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
                  onUpdateDocument={handleUpdateDocument}
                  onAddDocument={(newDocument) => setDocuments(previous => [...previous, newDocument])}
                  onCreateOrientierungsangebot={(customer) => triggerOrientierungsangebot(customer)}
                  onCreateAnzahlungsrechnung={(customer) => triggerAnzahlungsrechnung(customer)}
                  onCreateRechnung={(customer) => triggerRechnung(customer)}
                  onCreateStornoRechnung={(customer) => triggerStornoRechnung(customer)}
                  onCreateStornoAnzahlungsrechnung={(customer) => triggerStornoAnzahlungsrechnung(customer)}
                />
              )}

              {activeTab === 'mail_kalender' && (
                <MailKalenderTab target={mailKalenderTarget} />
              )}

              {activeTab === 'mitarbeiter' && (
                <MitarbeiterTab />
              )}

              {activeTab === 'workspace' && (
                <WorkspaceTab />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-h-[92vh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Neuen Kunden anlegen</h3>
              <button onClick={() => {
                setShowAddCustomerModal(false);
                setImportText('');
                setModalTab('manual');
              }} className="text-slate-400 hover:text-slate-600 font-bold font-mono">X</button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-100 gap-4">
              <button
                type="button"
                onClick={() => setModalTab('manual')}
                className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  modalTab === 'manual'
                    ? 'border-indigo-500 text-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Manuell anlegen
              </button>
              <button
                type="button"
                onClick={() => setModalTab('import')}
                className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  modalTab === 'import'
                    ? 'border-indigo-500 text-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Kunde importieren (Text)
              </button>
            </div>

            {modalTab === 'manual' ? (
              <form onSubmit={handleAddManualCustomer} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Name (Vor- & Nachname) *</label>
                  <input
                    type="text"
                    value={newCustName || ''}
                    onChange={(e) => setNewCustName(e.target.value)}
                    required
                    placeholder="z.B. Anita Wahlmüller"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">E-Mail-Adresse</label>
                  <input
                    type="email"
                    value={newCustEmail || ''}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="name@beispiel.at"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Telefonnummer</label>
                  <input
                    type="text"
                    value={newCustPhone || ''}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+43 650 ..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Kundennummer</label>
                  <input value={manualCustomerDetails.customerNumber} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, customerNumber: event.target.value }))} placeholder="z.B. HUBI-1024" className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Firma (optional)</label>
                  <input value={manualCustomerDetails.company} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, company: event.target.value }))} placeholder="Firmenname" className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Rechnungsadresse</label>
                  <input value={manualCustomerDetails.invoiceAddress} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, invoiceAddress: event.target.value }))} placeholder="Falls abweichend von der Abholadresse" className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none" />
                </div>
                </div>

                <fieldset className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <legend className="px-2 text-xs font-black uppercase tracking-wider text-slate-500">Abholung und Ziel</legend>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <input value={manualCustomerDetails.pickupAddress} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, pickupAddress: event.target.value }))} placeholder="Abholadresse" aria-label="Abholadresse" className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm" />
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <input value={manualCustomerDetails.pickupFloor} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, pickupFloor: event.target.value }))} placeholder="Stockwerk" aria-label="Stockwerk Abholung" className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm" />
                        <button type="button" onClick={() => setManualCustomerDetails(previous => ({ ...previous, pickupLift: !previous.pickupLift }))} className={`min-h-10 rounded-lg border px-3 text-xs font-bold ${manualCustomerDetails.pickupLift ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`}>Lift {manualCustomerDetails.pickupLift ? 'Ja' : 'Nein'}</button>
                      </div>
                      <input type="number" min="0" value={manualCustomerDetails.pickupTruckDistance} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, pickupTruckDistance: event.target.value }))} placeholder="Trageweg zum LKW (m)" aria-label="Trageweg Abholung in Metern" className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <input value={manualCustomerDetails.destinationAddress} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, destinationAddress: event.target.value }))} placeholder="Zieladresse" aria-label="Zieladresse" className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm" />
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <input value={manualCustomerDetails.destinationFloor} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, destinationFloor: event.target.value }))} placeholder="Stockwerk" aria-label="Stockwerk Ziel" className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm" />
                        <button type="button" onClick={() => setManualCustomerDetails(previous => ({ ...previous, destinationLift: !previous.destinationLift }))} className={`min-h-10 rounded-lg border px-3 text-xs font-bold ${manualCustomerDetails.destinationLift ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`}>Lift {manualCustomerDetails.destinationLift ? 'Ja' : 'Nein'}</button>
                      </div>
                      <input type="number" min="0" value={manualCustomerDetails.destinationTruckDistance} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, destinationTruckDistance: event.target.value }))} placeholder="Trageweg zum LKW (m)" aria-label="Trageweg Ziel in Metern" className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm" />
                    </div>
                  </div>
                </fieldset>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-xs font-semibold text-slate-500">Umzugstermin<input type="date" value={manualCustomerDetails.moveDate} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, moveDate: event.target.value }))} className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm" /></label>
                  <label className="space-y-1 text-xs font-semibold text-slate-500">Startzeit<input type="time" value={manualCustomerDetails.startTime} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, startTime: event.target.value }))} className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm" /></label>
                  <label className="space-y-1 text-xs font-semibold text-slate-500">Umzugsgröße / m³<input value={manualCustomerDetails.moveSize} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, moveSize: event.target.value }))} placeholder="z.B. 25 m³ oder 3-Zimmer" className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm" /></label>
                  <label className="space-y-1 text-xs font-semibold text-slate-500">Benötigte Helfer<input type="number" min="0" value={manualCustomerDetails.helpers} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, helpers: event.target.value }))} placeholder="z.B. 3" className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm" /></label>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-500">Leistungen per Klick hinzufügen</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { key: 'hvz', label: 'Halteverbotszone' },
                      { key: 'assembly', label: 'Möbelmontage' },
                      { key: 'insurance', label: 'Versicherung' },
                      { key: 'packing', label: 'Verpacken' },
                      { key: 'unpacking', label: 'Auspacken' },
                      { key: 'storage', label: 'Zwischenlagerung' },
                      { key: 'householdClearance', label: 'Haushaltsauflösung' }
                    ].map(option => {
                      const isSelected = manualCustomerDetails[option.key as 'hvz' | 'assembly' | 'insurance' | 'packing' | 'unpacking' | 'storage' | 'householdClearance'];
                      return <button key={option.key} type="button" onClick={() => setManualCustomerDetails(previous => ({ ...previous, [option.key]: !isSelected }))} className={`min-h-11 rounded-lg border px-2 text-[10px] font-bold transition-colors ${isSelected ? 'border-indigo-300 bg-indigo-100 text-indigo-800' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>{isSelected ? '✓ ' : '+ '}{option.label}</button>;
                    })}
                  </div>
                </div>

                <label className="block space-y-1 text-xs font-semibold text-slate-500">Anmerkungen<textarea value={manualCustomerDetails.notes} onChange={(event) => setManualCustomerDetails(previous => ({ ...previous, notes: event.target.value }))} rows={3} placeholder="Sonderwünsche, Zugang, Parken …" className="block w-full resize-y rounded-lg border border-slate-200 p-2.5 text-sm" /></label>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-lg shadow-lg shadow-indigo-600/20 transition-colors"
                >
                  Kunden speichern
                </button>
              </form>
            ) : (
              <form onSubmit={handleImportCustomer} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    Anfragetext oder Gesprächsnotizen
                  </label>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-1">
                    Füge hier eine E-Mail, eine Anfrage, Notizen oder ein Gesprächsprotokoll ein. Unsere KI liest Name, Kontaktdaten, Adressen, Umzugsdaten sowie Gegenstände automatisch aus.
                  </p>
                  <textarea
                    value={importText || ''}
                    onChange={(e) => setImportText(e.target.value)}
                    required
                    placeholder="z.B. Hallo, ich suche ein Umzugsunternehmen für meinen Umzug am 15.08. Mein Name ist Max Mustermann (Tel: 0660/123456)..."
                    rows={6}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-indigo-500 focus:border-indigo-500 font-sans leading-normal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isExtracting || !importText.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold p-3 rounded-lg shadow-lg shadow-indigo-600/20 transition-colors flex items-center justify-center space-x-2"
                >
                  {isExtracting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Extrahiere Kundendaten...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Kunden über KI importieren</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          isOpen={!!editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSave={async (updatedCustomer) => {
            await updateCustomer(updatedCustomer.id, updatedCustomer);
            setEditingCustomer(updatedCustomer);
          }}
        />
      )}

      {/* Interactive PDF Item Editing Modal */}
      {showEditPDFModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 flex flex-col max-h-[90vh] overflow-hidden space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-800 flex flex-wrap items-center gap-3">
                  <span>{editPDFType === 'orientierung' ? 'Posten für Orientierungsangebot anpassen' : editPDFType === 'lieferschein' ? 'Posten für Lieferschein anpassen' : editPDFType === 'rechnung' ? 'Posten für Rechnung anpassen' : editPDFType === 'storno_rechnung' ? 'Posten für Storno-Rechnung anpassen' : editPDFType === 'storno_anzahlung' ? 'Posten für Storno-Anzahlungsrechnung anpassen' : 'Posten für Anzahlungsrechnung anpassen'}</span>
                  <div className="flex items-center space-x-2 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <span className="text-xs text-slate-500">Doc-Nr:</span>
                    <input
                      type="text"
                      value={editPDFDocNumber || ''}
                      onChange={(e) => setEditPDFDocNumber(e.target.value)}
                      className="text-sm font-bold bg-white border border-slate-200 rounded px-2 py-0.5 w-32 focus:outline-indigo-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <span className="text-xs text-slate-500">Datum:</span>
                    <input
                      type="text"
                      value={editPDFDocDate || ''}
                      onChange={(e) => setEditPDFDocDate(e.target.value)}
                      className="text-sm font-bold bg-white border border-slate-200 rounded px-2 py-0.5 w-28 focus:outline-indigo-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <span className="text-xs text-slate-500">Leist.datum:</span>
                    <input
                      type="text"
                      value={editPDFLeistungsdatum || ''}
                      onChange={(e) => setEditPDFLeistungsdatum(e.target.value)}
                      className="text-sm font-bold bg-white border border-slate-200 rounded px-2 py-0.5 w-28 focus:outline-indigo-500"
                    />
                  </div>
                </h3>
                <p className="text-xs text-slate-400">
                  Kunde: <strong className="text-slate-600">{editPDFCustomer?.name}</strong> • Jede Zeile ist editierbar, kann gelöscht oder neu hinzugefügt werden.
                </p>
              </div>
              <button
                onClick={() => setShowEditPDFModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold font-mono text-lg p-2 hover:bg-slate-50 rounded"
              >
                ✕
              </button>
            </div>

            {/* List Table Body */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div className="border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Leistungsbezeichnung</th>
                      <th className="py-3 px-4 w-24 text-center">Menge</th>
                      {editPDFType === 'lieferschein' ? (
                        <th className="py-3 px-4 w-32 text-center">Montage</th>
                      ) : (
                        <>
                          <th className="py-3 px-4 w-32 text-right">Einzelpreis (€)</th>
                          <th className="py-3 px-4 w-32 text-right">Gesamt (€)</th>
                        </>
                      )}
                      <th className="py-3 px-4 w-16 text-center">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {editPDFItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleUpdateEditItem(idx, { description: e.target.value })}
                            placeholder="z.B. Umzugsservice Pauschale"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold focus:outline-indigo-500 bg-white"
                          />
                        </td>
                        <td className="py-2 px-4 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || ''}
                            onChange={(e) => handleUpdateEditItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-bold focus:outline-indigo-500 text-center bg-white"
                          />
                        </td>
                        {editPDFType === 'lieferschein' ? (
                          <td className="py-2 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={(item as any).montage || false}
                              onChange={(e) => handleUpdateEditItem(idx, { montage: e.target.checked } as any)}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                          </td>
                        ) : (
                          <>
                            <td className="py-2 px-4 text-right">
                              <input
                                type="text"
                                value={item.unitPrice || ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(',', '.');
                                  if (val === '' || val === '.') {
                                    handleUpdateEditItem(idx, { unitPrice: 0 as any });
                                  } else {
                                    handleUpdateEditItem(idx, { unitPrice: parseFloat(val) || 0 });
                                  }
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs font-bold focus:outline-indigo-500 text-right bg-white"
                              />
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-700">
                              {(item.quantity * item.unitPrice).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                            </td>
                          </>
                        )}
                        <td className="py-2 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteEditItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Zeile löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {editPDFItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                          Keine Posten vorhanden. Klicke unten auf "+ Posten hinzufügen".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={handleAddEditItem}
                className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/50 w-full py-2.5 rounded-lg justify-center transition-all animate-none"
              >
                <Plus className="w-4 h-4" />
                <span>+ Neue Zeile hinzufügen</span>
              </button>
            </div>

            {/* Calculations & Action Buttons Footer */}
            <div className="shrink-0 border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl">
              <div className="space-y-1">
                {editPDFType !== 'lieferschein' && (
                  <>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Zusammenfassung (Echtzeit)</div>
                    <div className="text-base font-extrabold text-slate-800">
                      Gesamtsumme: {' '}
                      <span className="text-indigo-600 font-black">
                        {editPDFItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </span>
                    </div>
                  </>
                )}
                {editPDFType === 'anzahlung' && (
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-500">Anzahlung %:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={anzahlungPercent || 0}
                        onChange={(e) => setAnzahlungPercent(Number(e.target.value) || 0)}
                        className="border border-slate-300 rounded px-2 py-1 w-20 text-xs font-bold focus:outline-indigo-500"
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-bold text-slate-500">
                      <div>
                        Anzahlung ({anzahlungPercent}%):{' '}
                        <span className="text-indigo-600 font-extrabold">
                          {(editPDFItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (anzahlungPercent / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </div>
                      <div>
                        Restbetrag ({100 - anzahlungPercent}%):{' '}
                        <span className="text-slate-700">
                          {(editPDFItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * ((100 - anzahlungPercent) / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {editPDFType === 'rechnung' && (
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-500">Bereits bezahlte Anzahlung (€):</label>
                      <input
                        type="number"
                        min="0"
                        value={alreadyPaidAmount || 0}
                        onChange={(e) => setAlreadyPaidAmount(Number(e.target.value) || 0)}
                        className="border border-slate-300 rounded px-2 py-1 w-24 text-xs font-bold focus:outline-indigo-500"
                      />
                    </div>
                    {alreadyPaidAmount > 0 && (
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-bold text-slate-500">
                        <div>
                          Noch offener Restbetrag:{' '}
                          <span className="text-indigo-600 font-extrabold">
                            {(editPDFItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) - alreadyPaidAmount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowEditPDFModal(false)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const finalSubtotal = editPDFItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

                    if (editPDFType) {
                      localStorage.setItem(`lastDocNumber_${editPDFType}`, editPDFDocNumber);
                      if (globalOnAddDocument && editPDFCustomer) {
                        const typeMap: any = {
                          'orientierung': 'Orientierungsangebot',
                          'anzahlung': 'Anzahlungsrechnung',
                          'rechnung': 'Rechnung',
                          'storno_rechnung': 'Stornorechnung',
                          'storno_anzahlung': 'Storno-Anzahlungsrechnung'
                        };
                        globalOnAddDocument({
                          id: `doc_${Date.now()}`,
                          customerId: editPDFCustomer.id,
                          customerName: editPDFCustomer.name,
                          type: typeMap[editPDFType] || 'Sonstiges',
                          docNumber: editPDFDocNumber,
                          date: new Date().toISOString(),
                          amount: finalSubtotal
                        });
                      }
                    }

                    if (editPDFType === 'orientierung') {
                      generateOrientierungsangebotPDF(
                        editPDFCustomer!,
                        editPDFItems,
                        null,
                        'save',
                        editPDFDocNumber,
                        editPDFTotalM3,
                        editPDFLeistungsdatum,
                        undefined,
                        editPDFDocDate
                      );
                    } else if (editPDFType === 'anzahlung') {
                      const finalAnzahlung = finalSubtotal * (anzahlungPercent / 100);
                      const finalRest = finalSubtotal - finalAnzahlung;
                      generateOfferPDF(
                        editPDFCustomer!,
                        editPDFItems,
                        null,
                        'download',
                        `Zahlungsbedingungen: ${anzahlungPercent}% Anzahlung sofort fällig, Rest nach erbrachter Leistung.`,
                        editPDFDocNumber,
                        editPDFTotalM3,
                        editPDFLeistungsdatum,
                        finalAnzahlung,
                        finalRest,
                        undefined,
                        editPDFDocDate
                      );
                    } else if (editPDFType === 'rechnung') {
                      const finalRest = finalSubtotal - alreadyPaidAmount;
                      generateInvoicePDF(
                        editPDFCustomer!,
                        editPDFItems,
                        null,
                        'download',
                        editPDFDocNumber,
                        editPDFTotalM3,
                        editPDFLeistungsdatum,
                        alreadyPaidAmount,
                        finalRest,
                        undefined,
                        editPDFDocDate
                      );
                    } else if (editPDFType === 'storno_rechnung') {
                      generateStornoInvoicePDF(
                        editPDFCustomer!,
                        editPDFItems,
                        null,
                        'download',
                        editPDFDocNumber,
                        editPDFTotalM3,
                        editPDFLeistungsdatum,
                        0,
                        0,
                        undefined,
                        editPDFDocDate
                      );
                    } else if (editPDFType === 'storno_anzahlung') {
                      generateStornoAnzahlungsrechnungPDF(
                        editPDFCustomer!,
                        editPDFItems,
                        null,
                        'download',
                        editPDFDocNumber,
                        editPDFTotalM3,
                        editPDFLeistungsdatum,
                        0,
                        0,
                        undefined,
                        editPDFDocDate
                      );
                    } else if (editPDFType === 'lieferschein') {
                      generateLieferscheinPDF(
                        editPDFCustomer!,
                        editLieferscheinJob,
                        editPDFItems.map(item => ({ name: item.description, count: String(item.quantity), montage: (item as any).montage })),
                        editLieferscheinWorkers,
                        editLieferscheinNote,
                        null,
                        'save',
                        editPDFDocNumber,
                        editPDFTotalM3,
                        editLieferscheinJob?.startTime || '08:00',
                        editLieferscheinJob?.endTime || '16:00'
                      );
                    }
                    setShowEditPDFModal(false);
                  }}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF generieren & drucken</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

// Sidebar Button Helper
function SidebarLink({ icon: Icon, label, active, onClick, badge = 0 }: { icon: any, label: string, active: boolean, onClick: () => void, badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-sm font-semibold text-left ${
        active
          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
      <span className="flex-1">{label}</span>
      {badge > 0 ? (
        <span className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-black ${active ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'}`} aria-label={`${badge} offene Aufgaben`}>
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </button>
  );
}

// -----------------------------------------------------------------
// REUSABLE INVENTORY & VOLUME MANAGER
// -----------------------------------------------------------------
function CustomerInventoryManager({
  customer,
  updateCustomer
}: {
  customer: Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
}) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemCategory, setItemCategory] = useState<string>('Wohnzimmer');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('');
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemCbm, setCustomItemCbm] = useState<number>(0.5);
  const [newItemCount, setNewItemCount] = useState<number>(1);

  // Mappings & state for manual overrides and notifications
  const [customMappingsVersion, setCustomMappingsVersion] = useState(0);
  const [editingCbmMap, setEditingCbmMap] = useState<Record<string, number>>({});
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Notes / Anmerkungen state
  const [anmerkungenText, setAnmerkungenText] = useState<string>(customer.anmerkungen || '');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setAnmerkungenText(customer.anmerkungen || '');
  }, [customer.id, customer.anmerkungen]);

  const handleSaveAnmerkungen = async () => {
    setIsSavingNotes(true);
    try {
      await updateCustomer(customer.id, { anmerkungen: anmerkungenText });
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save anmerkungen:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Standalone Gemini Estimate State (cached per customer)
  const [geminiEstimate, setGeminiEstimate] = useState<{
    totalM3: number;
    totalKg: number;
    explanation: string;
    confidence: string;
    recommendedVehicle: string;
    loading: boolean;
    error: string | null;
    isSaved: boolean;
  }>(() => {
    if (customer.geminiVolumeEstimate && customer.geminiVolumeEstimate.totalM3 > 0) {
      return {
        totalM3: customer.geminiVolumeEstimate.totalM3,
        totalKg: customer.geminiVolumeEstimate.totalKg || Math.round(customer.geminiVolumeEstimate.totalM3 * 95),
        explanation: customer.geminiVolumeEstimate.explanation || 'Gespeicherte KI-Gesamtschätzung.',
        confidence: customer.geminiVolumeEstimate.confidence || 'hoch',
        recommendedVehicle: customer.geminiVolumeEstimate.recommendedVehicle || 'Sprinter 3.5t',
        loading: false,
        error: null,
        isSaved: true
      };
    }
    return {
      totalM3: 0,
      totalKg: 0,
      explanation: '',
      confidence: '',
      recommendedVehicle: '',
      loading: false,
      error: null,
      isSaved: false
    };
  });

  // Listen for custom mapping updates
  useEffect(() => {
    const handleMappingUpdated = () => setCustomMappingsVersion(v => v + 1);
    window.addEventListener('custom_mappings_updated', handleMappingUpdated);
    return () => window.removeEventListener('custom_mappings_updated', handleMappingUpdated);
  }, []);

  // Fetch standalone Gemini total m³ volume & kg weight estimate
  const fetchGeminiVolumeEstimate = async (forceRefresh: boolean = false) => {
    if (!customer.gegenstaende || Object.keys(customer.gegenstaende).length === 0) {
      setGeminiEstimate({
        totalM3: 0,
        totalKg: 0,
        explanation: 'Keine Gegenstände erfasst.',
        confidence: 'hoch',
        recommendedVehicle: 'Sprinter 3.5t',
        loading: false,
        error: null,
        isSaved: false
      });
      return;
    }

    // If not forced and customer already has a stored estimate, use cached estimate without token usage
    if (!forceRefresh && customer.geminiVolumeEstimate && customer.geminiVolumeEstimate.totalM3 > 0) {
      setGeminiEstimate({
        totalM3: customer.geminiVolumeEstimate.totalM3,
        totalKg: customer.geminiVolumeEstimate.totalKg || Math.round(customer.geminiVolumeEstimate.totalM3 * 95),
        explanation: customer.geminiVolumeEstimate.explanation || 'Gespeicherte KI-Gesamtschätzung.',
        confidence: customer.geminiVolumeEstimate.confidence || 'hoch',
        recommendedVehicle: customer.geminiVolumeEstimate.recommendedVehicle || 'Sprinter 3.5t',
        loading: false,
        error: null,
        isSaved: true
      });
      return;
    }

    setGeminiEstimate(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await apiFetch('/api/ai/estimate-total-volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name,
          gegenstaende: customer.gegenstaende,
          notes: customer.anmerkungen
        })
      });

      let m3Val = 0;
      let kgVal = 0;
      let explanationStr = 'Eigenständige Schätzung durch Gemini AI.';
      let confidenceStr = 'hoch';
      let recommendedVehicleStr = 'Sprinter 3.5t';

      if (res.ok) {
        const data = await res.json();
        m3Val = Number(data.totalM3) || 0;
        kgVal = Number(data.totalKg) || Math.round(m3Val * 95);
        explanationStr = data.explanation || 'Eigenständige Schätzung durch Gemini AI.';
        confidenceStr = data.confidence || 'hoch';
        recommendedVehicleStr = data.recommendedVehicle || 'Sprinter 3.5t';
      } else {
        throw new Error('Server error');
      }

      setGeminiEstimate({
        totalM3: m3Val,
        totalKg: kgVal,
        explanation: explanationStr,
        confidence: confidenceStr,
        recommendedVehicle: recommendedVehicleStr,
        loading: false,
        error: null,
        isSaved: true
      });

      // Save to customer record so reopening uses 0 tokens and keeps data intact
      await updateCustomer(customer.id, {
        geminiVolumeEstimate: {
          totalM3: m3Val,
          totalKg: kgVal,
          explanation: explanationStr,
          confidence: confidenceStr,
          recommendedVehicle: recommendedVehicleStr,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (e) {
      console.error('Failed to fetch Gemini volume estimate:', e);
      let total = 0;
      Object.entries(customer.gegenstaende || {}).forEach(([k, v]) => {
        const cnt = Number(v) || 0;
        const statusInfo = getItemMappingStatus(k);
        total += cnt * (statusInfo.cbm || 0.5);
      });
      const estM3 = Math.round(Math.max(3, total) * 10) / 10;
      const estKg = Math.round(estM3 * 95);
      const fallbackExplanation = 'KI-Volumenschätzung basierend auf Möbelarten, Stückzahlen, Ladefaktor und Durchschnittsgewichten.';
      const fallbackVehicle = total > 35 ? 'LKW 12t' : total > 18 ? 'LKW 7.5t' : 'Sprinter 3.5t';

      setGeminiEstimate({
        totalM3: estM3,
        totalKg: estKg,
        explanation: fallbackExplanation,
        confidence: 'mittel',
        recommendedVehicle: fallbackVehicle,
        loading: false,
        error: null,
        isSaved: true
      });

      updateCustomer(customer.id, {
        geminiVolumeEstimate: {
          totalM3: estM3,
          totalKg: estKg,
          explanation: fallbackExplanation,
          confidence: 'mittel',
          recommendedVehicle: fallbackVehicle,
          updatedAt: new Date().toISOString()
        }
      }).catch(err => console.error('Error saving fallback estimate:', err));
    }
  };

  useEffect(() => {
    if (customer.geminiVolumeEstimate && customer.geminiVolumeEstimate.totalM3 > 0) {
      setGeminiEstimate({
        totalM3: customer.geminiVolumeEstimate.totalM3,
        totalKg: customer.geminiVolumeEstimate.totalKg || Math.round(customer.geminiVolumeEstimate.totalM3 * 95),
        explanation: customer.geminiVolumeEstimate.explanation || 'Gespeicherte KI-Gesamtschätzung.',
        confidence: customer.geminiVolumeEstimate.confidence || 'hoch',
        recommendedVehicle: customer.geminiVolumeEstimate.recommendedVehicle || 'Sprinter 3.5t',
        loading: false,
        error: null,
        isSaved: true
      });
    } else {
      fetchGeminiVolumeEstimate(false);
    }
  }, [customer.id]);

  const getItemMeta = (key: string) => {
    const statusInfo = getItemMappingStatus(key, editingCbmMap[key]);
    let name = statusInfo.name;
    let cbm = statusInfo.cbm;

    if (key.startsWith('custom_')) {
      const parts = key.split('_');
      if (parts.length >= 3) {
        name = parts.slice(1, parts.length - 1).join(' ');
        const parsedCbm = parseFloat(parts[parts.length - 1]);
        if (!isNaN(parsedCbm) && parsedCbm > 0) {
          cbm = parsedCbm;
        }
      }
    }

    if (editingCbmMap[key] !== undefined) {
      cbm = editingCbmMap[key];
    }

    return { name, cbm, statusInfo };
  };

  const itemStats = React.useMemo(() => {
    if (!customer?.gegenstaende) return { count: 0, volume: 0, green: 0, yellow: 0, red: 0 };
    let count = 0;
    let volume = 0;
    let green = 0;
    let yellow = 0;
    let red = 0;

    Object.entries(customer.gegenstaende).forEach(([k, v]) => {
      const cnt = Number(v) || 0;
      if (cnt > 0) {
        count += cnt;
        const meta = getItemMeta(k);
        volume += cnt * meta.cbm;
        if (meta.statusInfo.status === 'green') green++;
        else if (meta.statusInfo.status === 'yellow') yellow++;
        else red++;
      }
    });
    return { count, volume: Math.round(volume * 10) / 10, green, yellow, red };
  }, [customer?.gegenstaende, customMappingsVersion, editingCbmMap]);

  const handleUpdateItemCount = (key: string, delta: number) => {
    const currentGegenstaende: Record<string, any> = { ...(customer.gegenstaende || {}) };
    const currentCount = Number(currentGegenstaende[key]) || 0;
    const newCount = currentCount + delta;

    if (newCount <= 0) {
      delete currentGegenstaende[key];
    } else {
      currentGegenstaende[key] = newCount;
    }

    updateCustomer(customer.id, {
      gegenstaende: currentGegenstaende
    });
  };

  const handleRemoveItem = (key: string) => {
    const currentGegenstaende: Record<string, any> = { ...(customer.gegenstaende || {}) };
    delete currentGegenstaende[key];

    updateCustomer(customer.id, {
      gegenstaende: currentGegenstaende
    });
  };

  const handleSaveToMappingList = async (key: string, name: string, cbm: number) => {
    const finalCbm = Math.max(0.05, Math.round(cbm * 100) / 100);
    // Save to custom mapping store
    saveCustomMapping(name, finalCbm);

    // Update customer.gegenstaende with new key containing cbm
    const currentGegenstaende: Record<string, any> = { ...(customer.gegenstaende || {}) };
    const currentCount = Number(currentGegenstaende[key]) || 1;
    delete currentGegenstaende[key];

    const cleanName = name.trim().replace(/_/g, ' ');
    const newMappedKey = `custom_${cleanName}_${finalCbm}`;
    currentGegenstaende[newMappedKey] = currentCount;

    await updateCustomer(customer.id, {
      gegenstaende: currentGegenstaende
    });

    setEditingCbmMap(prev => {
      const next = { ...prev };
      delete next[key];
      delete next[newMappedKey];
      return next;
    });

    setCustomMappingsVersion(v => v + 1);
    setSaveNotification(`"${cleanName}" (${finalCbm} m³) wurde erfolgreich in die globale Mapping-Liste übernommen und grün gemappt!`);
    setTimeout(() => setSaveNotification(null), 4000);
  };

  const handleSaveAllYellowItemsToMapping = async () => {
    if (!customer.gegenstaende) return;
    const currentGegenstaende: Record<string, any> = { ...customer.gegenstaende };
    let savedCount = 0;

    Object.entries(customer.gegenstaende).forEach(([key, val]) => {
      const count = Number(val) || 0;
      if (count > 0) {
        const meta = getItemMeta(key);
        if (meta.statusInfo.status === 'yellow') {
          const finalCbm = Math.max(0.05, Math.round(meta.cbm * 100) / 100);
          saveCustomMapping(meta.name, finalCbm);
          delete currentGegenstaende[key];
          const cleanName = meta.name.trim().replace(/_/g, ' ');
          const newMappedKey = `custom_${cleanName}_${finalCbm}`;
          currentGegenstaende[newMappedKey] = count;
          savedCount++;
        }
      }
    });

    if (savedCount > 0) {
      await updateCustomer(customer.id, { gegenstaende: currentGegenstaende });
      setEditingCbmMap({});
      setCustomMappingsVersion(v => v + 1);
      setSaveNotification(`${savedCount} KI-geschätzte Gegenstände wurden erfolgreich in das globale Mapping übernommen! (Alle grün)`);
      setTimeout(() => setSaveNotification(null), 4000);
    }
  };

  const handleAddItemSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let keyToAdd = selectedPresetKey;
    if (itemCategory === 'Custom' || selectedPresetKey === 'custom') {
      if (!customItemName.trim()) return;
      const cleanName = customItemName.trim().replace(/_/g, ' ');
      keyToAdd = `custom_${cleanName}_${customItemCbm}`;
    }

    if (!keyToAdd) {
      const categoryItems = ITEM_CBM_DEFAULTS[itemCategory as keyof typeof ITEM_CBM_DEFAULTS];
      if (categoryItems && categoryItems.length > 0) {
        keyToAdd = categoryItems[0].key;
      } else {
        return;
      }
    }

    const currentGegenstaende: Record<string, any> = { ...(customer.gegenstaende || {}) };
    const existingCount = Number(currentGegenstaende[keyToAdd]) || 0;
    currentGegenstaende[keyToAdd] = existingCount + Math.max(1, newItemCount);

    updateCustomer(customer.id, {
      gegenstaende: currentGegenstaende
    });

    setCustomItemName('');
    setNewItemCount(1);
    setIsAddingItem(false);
  };

  return (
    <div className="space-y-4 pt-2 border-t border-slate-100">
      {/* Header & Badges */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
            <Package className="w-4 h-4 text-indigo-500" />
            <span>Erfasstes Umzugsgut & Ladevolumen</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Farbcodiertes Mapping: <span className="font-semibold text-emerald-700">Grün = Gemappt</span> • <span className="font-semibold text-indigo-700">Gelb = KI-Schätzung</span> • <span className="font-semibold text-rose-700">Rot = m³ erforderlich</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Breakdown Badges */}
          <div className="flex items-center space-x-1 text-[11px] font-medium bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">{itemStats.green} 🟢</span>
            <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">{itemStats.yellow} 🟡</span>
            <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">{itemStats.red} 🔴</span>
          </div>

          {itemStats.yellow > 0 && (
            <button
              type="button"
              onClick={handleSaveAllYellowItemsToMapping}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-950 border border-indigo-300/80 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
              title="Alle KI-geschätzten Gegenstände in die globale Datenbank übernehmen"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-indigo-700" />
              <span>Alle {itemStats.yellow} KI-Geschätzten speichern</span>
            </button>
          )}

          <span className="bg-indigo-50 text-indigo-900 border border-indigo-200/80 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs">
            <Box className="w-3.5 h-3.5 text-indigo-600" />
            <span>{itemStats.count} Gegenstände ({itemStats.volume} m³)</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setIsAddingItem(true);
              const categoryItems = ITEM_CBM_DEFAULTS[itemCategory as keyof typeof ITEM_CBM_DEFAULTS];
              if (categoryItems && categoryItems.length > 0) {
                setSelectedPresetKey(categoryItems[0].key);
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Gegenstand hinzufügen</span>
          </button>
        </div>
      </div>

      {/* Standalone Gemini KI-Gesamtschätzung Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-xl border border-indigo-500/30 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-bold text-xs text-indigo-100 uppercase tracking-wider">Eigenständige Gemini KI-Gesamtschätzung</span>
                <span className="bg-indigo-800/80 text-indigo-200 text-[10px] px-1.5 py-0.2 rounded font-mono border border-indigo-600/50">Gemini 3.6 Flash</span>
                {geminiEstimate.isSaved && (
                  <span className="bg-emerald-950/80 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-semibold border border-emerald-500/40 flex items-center space-x-1" title="Gespeichert: Keine erneuten Token-Kosten beim Öffnen">
                    <span>✓ Gespeichert (Token gespart)</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">{geminiEstimate.explanation}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
            <div className="text-right">
              <div className="text-lg font-black text-indigo-300 tracking-tight leading-none flex items-center justify-end space-x-1.5">
                {geminiEstimate.loading ? (
                  <span className="text-xs text-indigo-300 font-normal flex items-center space-x-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Berechne...</span>
                  </span>
                ) : (
                  <>
                    <span>{geminiEstimate.totalM3} m³</span>
                    <span className="text-xs font-bold text-indigo-200 bg-indigo-900/80 px-1.5 py-0.5 rounded border border-indigo-700/60 font-mono">
                      ~{geminiEstimate.totalKg.toLocaleString('de-DE')} kg
                    </span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-indigo-200 font-medium mt-1">{geminiEstimate.recommendedVehicle}</div>
            </div>

            <button
              type="button"
              onClick={() => fetchGeminiVolumeEstimate(true)}
              disabled={geminiEstimate.loading}
              className="p-1.5 bg-indigo-800/60 hover:bg-indigo-700 text-indigo-200 hover:text-white rounded-lg transition-colors border border-indigo-600/40 cursor-pointer flex items-center space-x-1 text-xs font-bold px-2.5"
              title="KI-Schätzung neu berechnen (Gemini neu abfragen)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${geminiEstimate.loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Neu berechnen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Toast Banner */}
      <AnimatePresence>
        {saveNotification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-sm"
          >
            <CheckCircle className="w-4 h-4 text-slate-950 shrink-0" />
            <span>{saveNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form to add new item */}
      <AnimatePresence>
        {isAddingItem && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddItemSubmit}
            className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 space-y-3 overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-indigo-200/60 pb-2">
              <h4 className="font-bold text-xs text-indigo-950 flex items-center space-x-1">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Neuen Gegenstand erfassen</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Abbrechen
              </button>
            </div>

            <div className="grid grid-cols-12 gap-3 text-xs">
              {/* Room Category */}
              <div className="col-span-3 space-y-1">
                <label className="font-semibold text-slate-700">Kategorie / Raum</label>
                <select
                  value={itemCategory || ''}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setItemCategory(cat);
                    if (cat !== 'Custom') {
                      const categoryItems = ITEM_CBM_DEFAULTS[cat as keyof typeof ITEM_CBM_DEFAULTS];
                      if (categoryItems && categoryItems.length > 0) {
                        setSelectedPresetKey(categoryItems[0].key);
                      }
                    } else {
                      setSelectedPresetKey('custom');
                    }
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:outline-indigo-500"
                >
                  {Object.keys(ITEM_CBM_DEFAULTS).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Custom">➕ Eigener Gegenstand (Manuell)</option>
                </select>
              </div>

              {/* Preset Item or Custom Name */}
              <div className="col-span-4 space-y-1">
                <label className="font-semibold text-slate-700">Gegenstand</label>
                {itemCategory !== 'Custom' ? (
                  <select
                    value={selectedPresetKey || ''}
                    onChange={(e) => setSelectedPresetKey(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:outline-indigo-500"
                  >
                    {(ITEM_CBM_DEFAULTS[itemCategory as keyof typeof ITEM_CBM_DEFAULTS] || []).map(item => (
                      <option key={item.key} value={item.key}>
                        {item.name} ({item.cbm} m³)
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="z.B. Schwerlastregal, Klavierstuhl"
                    value={customItemName || ''}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:outline-indigo-500"
                    required
                  />
                )}
              </div>

              {/* Custom CBM if custom */}
              {itemCategory === 'Custom' && (
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700">Volumen (m³/Stk.)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="10"
                    value={customItemCbm || ''}
                    onChange={(e) => setCustomItemCbm(parseFloat(e.target.value) || 0.1)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:outline-indigo-500"
                  />
                </div>
              )}

              {/* Quantity */}
              <div className={itemCategory === 'Custom' ? 'col-span-1 space-y-1' : 'col-span-3 space-y-1'}>
                <label className="font-semibold text-slate-700">Anzahl</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={newItemCount || ''}
                  onChange={(e) => setNewItemCount(parseInt(e.target.value) || 1)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:outline-indigo-500 text-center font-bold"
                />
              </div>

              {/* Submit button */}
              <div className="col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                  <span>Hinzufügen</span>
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Items List Grid with Color Coding */}
      {customer.gegenstaende && Object.keys(customer.gegenstaende).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 max-h-96 overflow-y-auto">
          {Object.entries(customer.gegenstaende).map(([key, val]) => {
            const count = Number(val) || 0;
            if (count === 0) return null;
            const meta = getItemMeta(key);
            const status = meta.statusInfo.status; // 'green' | 'yellow' | 'red'
            const itemTotalCbm = Math.round(count * meta.cbm * 10) / 10;

            // Card Style based on Status
            const cardBgClass =
              status === 'green'
                ? 'bg-emerald-50/60 border-emerald-300/80 text-emerald-950 hover:border-emerald-400'
                : status === 'yellow'
                ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 hover:border-indigo-400'
                : 'bg-rose-50/90 border-rose-300 text-rose-950 hover:border-rose-400';

            return (
              <div key={key} className={`flex flex-col justify-between p-3 rounded-xl border text-xs shadow-2xs space-y-2 transition-all ${cardBgClass}`}>
                {/* Item Name & Status Badge */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-bold text-slate-900 leading-tight" title={meta.name}>
                      {meta.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(key)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors shrink-0 cursor-pointer"
                      title="Gegenstand entfernen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    {status === 'green' && (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Gemappt (Grün)</span>
                      </span>
                    )}

                    {status === 'yellow' && (
                      <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span>KI-Geschätzt (Gelb)</span>
                      </span>
                    )}

                    {status === 'red' && (
                      <span className="bg-rose-100 text-rose-900 border border-rose-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>m³ fehlt (Rot)</span>
                      </span>
                    )}

                    <span className="text-[11px] font-extrabold text-slate-800">{count}x = {itemTotalCbm} m³</span>
                  </div>
                </div>

                {/* Inline Editing & Save Button for Yellow & Red Items */}
                {status !== 'green' ? (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-600 font-semibold">m³/Stk:</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        max="20"
                        value={meta.cbm || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0.1;
                          setEditingCbmMap(prev => ({ ...prev, [key]: val }));
                        }}
                        className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold text-slate-900 focus:outline-indigo-500 text-center"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveToMappingList(key, meta.name, meta.cbm)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer ${
                        status === 'yellow'
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600/40'
                          : 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-700/40'
                      }`}
                      title="In globale Mapping-Liste übernehmen (wird Grün)"
                    >
                      <BookmarkPlus className="w-3 h-3 shrink-0" />
                      <span>In Mapping speichern</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-emerald-200/60">
                    <span className="text-emerald-800 font-medium">{meta.cbm} m³ / Stk.</span>

                    <div className="flex items-center space-x-1 bg-white/80 rounded-md p-0.5 border border-emerald-200">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemCount(key, -1)}
                        className="w-5 h-5 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-700 rounded shadow-2xs font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-1.5 font-bold text-slate-900 text-xs">{count}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemCount(key, 1)}
                        className="w-5 h-5 flex items-center justify-center bg-white hover:bg-emerald-100 text-emerald-900 rounded shadow-2xs font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
          <Box className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Noch keine Gegenstände erfasst.</p>
          <button
            type="button"
            onClick={() => {
              setIsAddingItem(true);
              const categoryItems = ITEM_CBM_DEFAULTS['Wohnzimmer'];
              if (categoryItems && categoryItems.length > 0) {
                setSelectedPresetKey(categoryItems[0].key);
              }
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold underline cursor-pointer"
          >
            Erstes Möbelstück hinzufügen
          </button>
        </div>
      )}

      {/* Anmerkungen / Textimport-Zusammenfassung & Weitere Notizen */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3 mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                <span>Anmerkungen & Textimport-Zusammenfassung</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Text aus Kundenimport / Freitext-Notizen — wird auch auf dem Lieferschein-PDF angezeigt.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveAnmerkungen}
            disabled={isSavingNotes}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-center"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isSavingNotes ? 'Speichert...' : 'Notizen speichern'}</span>
          </button>
        </div>

        <textarea
          rows={4}
          value={anmerkungenText || ''}
          onChange={(e) => setAnmerkungenText(e.target.value)}
          placeholder="Hier Anmerkungen, Sonderwünsche oder Details aus dem Text-Import verwalten/ergänzen..."
          className="w-full p-3 text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 leading-relaxed font-sans"
        />

        <AnimatePresence>
          {notesSavedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg flex items-center space-x-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Anmerkungen gespeichert! Sie erscheinen nun auch auf dem Lieferschein.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// TAB 1: KUNDEN CRM
// -----------------------------------------------------------------
function KundenTab({
  onDeleteCustomer,
  customers,
  loading,
  searchQuery,
  setSearchQuery,
  activeCustomer,
  onSelect,
  onEditCustomer,
  emails = [],
  calendarEvents = [],
  documents = [],
  onUpdateDocument,
  onAddDocument,
  onNavigateToMail,
  onNavigateToCalendar
}: {
  customers: Customer[],
  loading: boolean,
  searchQuery: string,
  setSearchQuery: (s: string) => void,
  activeCustomer: Customer | null,
  onSelect: (c: Customer | null) => void,
  onEditCustomer?: (c: Customer) => void,
  onDeleteCustomer?: (id: string) => void,
  emails?: any[],
  calendarEvents?: any[],
  documents?: AppDocument[],
  onUpdateDocument?: (doc: AppDocument) => void,
  onAddDocument?: (doc: AppDocument) => void,
  onNavigateToMail?: (emailStr: string, openReply?: boolean) => void,
  onNavigateToCalendar?: (emailStr: string) => void
}) {
  const { updateCustomer, mergeDuplicateCustomers } = useCustomer();
  const [activeListTab, setActiveListTab] = useState<'active' | 'rechnung' | 'completed' | 'cancelled'>('active');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.33);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<{ mergedCount: number, removedCount: number } | null>(null);

  const handleMergeDuplicates = async () => {
    setIsMerging(true);
    setMergeResult(null);
    try {
      const result = await mergeDuplicateCustomers();
      setMergeResult(result);
      setTimeout(() => setMergeResult(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMerging(false);
    }
  };

  // Helper: check if customer has invoice created or in documents
  const checkCustomerHasInvoice = (c: Customer) => {
    const hasActiveInvoiceDocument = documents.some(document =>
      document.customerId === c.id &&
      (document.type === 'Anzahlungsrechnung' || document.type === 'Rechnung') &&
      document.status !== 'storno'
    );
    return !!(c.hasInvoiceCreated || c.arCreated || c.reCreated || c.arPaid || c.rechnungPaid || hasActiveInvoiceDocument);
  };

  // Helper: check if customer is completed (overdue/completed calendar entry or invoice paid or manually completed)
  const isCompletedCustomer = (c: Customer) => {
    if (c.isCancelled) return false;
    if (c.isCompleted || c.rechnungPaid) return true;
    if (c.arPaid && c.rechnungPaid) return true;

    // Check if move date in past
    const moveDateStr = c.umzugsdetails?.gewuenschterUmzugstermin;
    if (moveDateStr) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (moveDateStr < todayStr) return true;
    }

    // Check if calendar event completed or in past
    if (calendarEvents && calendarEvents.length > 0) {
      const custEvents = calendarEvents.filter(e => e.customerId === c.id || (e.title && e.title.includes(c.name)));
      const todayStr = new Date().toISOString().split('T')[0];
      if (custEvents.some(e => e.status === 'completed' || (e.startDate && e.startDate < todayStr))) {
        return true;
      }
    }

    return false;
  };

  // 1. Absagen (Cancelled)
  const cancelledCustomers = customers.filter(c => c.isCancelled === true);

  // 2. Abgeschlossen (Completed)
  const completedCustomers = customers.filter(c => !c.isCancelled && isCompletedCustomer(c));

  // 3. Rechnung (Invoices created, not yet completed)
  const rechnungCustomers = customers.filter(c => !c.isCancelled && !isCompletedCustomer(c) && checkCustomerHasInvoice(c));

  // 4. Kunden (Active leads / customers without invoice & not completed & not cancelled)
  const activeCustomers = customers.filter(c => !c.isCancelled && !isCompletedCustomer(c) && !checkCustomerHasInvoice(c));

  const displayCustomers =
    activeListTab === 'cancelled' ? cancelledCustomers :
    activeListTab === 'completed' ? completedCustomers :
    activeListTab === 'rechnung' ? rechnungCustomers : activeCustomers;

  const handleToggleARStatus = async (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextArPaid = !(cust.arPaid || cust.arCreated);
    await updateCustomer(cust.id, {
      arPaid: nextArPaid,
      arCreated: nextArPaid,
      hasInvoiceCreated: nextArPaid || !!cust.reCreated
    });
  };

  const handleToggleREStatus = async (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyPaid = cust.rechnungPaid || cust.isCompleted;
    if (!isCurrentlyPaid) {
      // Both buttons turn green & customer moves to Abgeschlossen
      await updateCustomer(cust.id, {
        arPaid: true,
        rechnungPaid: true,
        isCompleted: true,
        hasInvoiceCreated: true,
        completedAt: new Date().toISOString()
      });
    } else {
      await updateCustomer(cust.id, {
        rechnungPaid: false,
        isCompleted: false
      });
    }
  };

  const handleToggleCancelCustomer = async (cust: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newIsCancelled = !cust.isCancelled;
    await updateCustomer(cust.id, {
      isCancelled: newIsCancelled,
      cancelledAt: newIsCancelled ? new Date().toISOString() : undefined
    });
  };

  const handleCreateCalendarEvent = async (cust: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const EVENTS_KEY = 'outlook_calendar_events_v2';
      const existingEvents: any[] = (await get(EVENTS_KEY)) || [];
      const existingIdx = existingEvents.findIndex(ev => ev.customerId === cust.id || (ev.title && ev.title.includes(cust.name)));

      const targetDate = cust.umzugsdetails?.gewuenschterUmzugstermin || new Date().toISOString().split('T')[0];
      const newEvent = {
        id: existingIdx >= 0 ? existingEvents[existingIdx].id : 'evt-' + Date.now(),
        title: `KOMM: ${cust.name}`,
        startDate: targetDate,
        startTime: cust.umzugsdetails?.voraussichtlicheStartzeit || '08:00',
        endTime: '12:00',
        location: cust.abholadresse?.strasse || cust.address?.street || '',
        description: `Termin für ${cust.name}\nTel: ${cust.phone || '—'}\nE-Mail: ${cust.email || '—'}`,
        category: 'Umzug',
        customerId: cust.id,
        moveDetails: {
          abholadresse: cust.abholadresse?.strasse || '',
          abholStockwerk: cust.abholadresse?.stockwerk || '',
          abholLift: cust.abholadresse?.aufzug || 'Nein',
          zieladresse: cust.zieladresse?.strasse || '',
          zielStockwerk: cust.zieladresse?.stockwerk || '',
          zielLift: cust.zieladresse?.aufzug || 'Nein',
          m3: '25',
          personenCount: '3 Personen',
          montageInfo: cust.nebenleistungen?.moebelmontage ? 'Ja' : 'Nein',
          eingeteiltePersonen: 'Noch nicht eingeteilt',
          anmerkungen: cust.anmerkungen
        }
      };

      let updatedEvents = [];
      if (existingIdx >= 0) {
        updatedEvents = [...existingEvents];
        updatedEvents[existingIdx] = newEvent;
      } else {
        updatedEvents = [...existingEvents, newEvent];
      }
      await set(EVENTS_KEY, updatedEvents);
      alert(`Kalendereintrag für "${cust.name}" am ${targetDate} wurde erfolgreich im Kalender angelegt!`);
    } catch (err) {
      console.error("Calendar creation error:", err);
      alert("Fehler beim Erstellen des Kalendereintrags.");
    }
  };

  // Fetch smart AI recommendations for the active customer
  useEffect(() => {
    if (!activeCustomer) {
      setAiSuggestions([]);
      return;
    }

    async function fetchSuggestions() {
      setLoadingSuggestions(true);
      try {
        const res = await apiFetch('/api/ai/get-smart-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer: activeCustomer, workflowState: {} })
        });
        if (res.ok) {
          const list = await res.json();
          setAiSuggestions(Array.isArray(list) ? list : []);
        } else {
          setAiSuggestions([]);
        }
      } catch {
        setAiSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }

    fetchSuggestions();
  }, [activeCustomer]);

  const handleApplySuggestion = async (s: any) => {
    if (!activeCustomer) return;

    // Auto configure related flags
    const updates: Partial<Customer> = {};
    if (s.title.includes('Möbelmontage')) {
      updates.nebenleistungen = {
        ...activeCustomer.nebenleistungen,
        moebelmontage: true
      };
    } else if (s.title.includes('Halteverbotszone')) {
      updates.nebenleistungen = {
        ...activeCustomer.nebenleistungen,
        einrichtenHVZ: true
      };
    } else if (s.title.includes('Tragehelfer')) {
      updates.zusatzoptionen = {
        ...activeCustomer.zusatzoptionen,
        helfer: '3'
      };
    }

    await updateCustomer(activeCustomer.id, updates);
    alert(`AI-Empfehlung "${s.title}" wurde erfolgreich auf das Kundenprofil angewendet!`);
  };

  const handleDownloadOfferPDF = (customer: Customer) => {
    triggerOrientierungsangebot(customer);
  };

  const handleDownloadInvoicePDF = (customer: Customer) => {
    triggerAnzahlungsrechnung(customer);
  };

  return (
    <div id="kunden-tab-container" className="h-full flex flex-col md:flex-row space-y-4 md:space-y-0 overflow-hidden relative">

      {/* Customer List Panel (Left Side) */}
      <div 
        className={`w-full bg-white border border-slate-200 rounded-xl shadow-sm flex-col h-full overflow-hidden shrink-0 ${activeCustomer ? 'hidden md:flex' : 'flex'}`}
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${leftPanelWidth}%` : '100%' }}
      >

        {/* Search header & Column Switcher */}
        <div className="p-4 border-b border-slate-100 space-y-3 shrink-0 bg-slate-50/40">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kundenliste</h3>
            <button
              onClick={handleMergeDuplicates}
              disabled={isMerging}
              className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded font-bold transition-colors disabled:opacity-50"
              title="Kunden zusammenlegen (Gleiche E-Mail oder Name)"
            >
              {isMerging ? 'Führt zusammen...' : 'Dubletten bereinigen'}
            </button>
          </div>
          {mergeResult && (
            <div className="text-[10px] bg-emerald-100 text-emerald-800 p-1.5 rounded mb-2 text-center font-medium">
              {mergeResult.mergedCount > 0 
                ? `${mergeResult.mergedCount} Kunden zusammengelegt, ${mergeResult.removedCount} Dubletten entfernt.` 
                : 'Keine Dubletten gefunden.'}
            </div>
          )}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Kunde suchen..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-indigo-500 transition-all shadow-sm"
            />
          </div>

          {/* List Tabs / Spalten: Kunden, Rechnung (€), Abgeschlossen (Haken), Absagen (Ban) */}
          <div className="grid grid-cols-4 border border-slate-200 bg-slate-100/90 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveListTab('active')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeListTab === 'active'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Aktive Kunden"
            >
              <User className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-extrabold">
                {activeCustomers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveListTab('rechnung')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeListTab === 'rechnung'
                  ? 'bg-white text-amber-700 shadow-sm border border-amber-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Rechnung: Kunden mit erstellter Anzahlung oder Rechnung"
            >
              <Euro className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-extrabold">
                {rechnungCustomers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveListTab('completed')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeListTab === 'completed'
                  ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Abgeschlossen: Erledigte Kalendereinträge oder bezahlte Rechnungen"
            >
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">
                {completedCustomers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveListTab('cancelled')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeListTab === 'cancelled'
                  ? 'bg-white text-rose-700 shadow-sm border border-rose-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Absagen: Abgesagte Kunden"
            >
              <Ban className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-extrabold">
                {cancelledCustomers.length}
              </span>
            </button>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium px-0.5">
            <span>
              {displayCustomers.length}{' '}
              {activeListTab === 'cancelled'
                ? 'Absagen'
                : activeListTab === 'completed'
                ? 'Abgeschlossene Kunden'
                : activeListTab === 'rechnung'
                ? 'Rechnung-Kunden'
                : 'Kunden'}{' '}
              gelistet
            </span>
            <span>Sortiert nach: Datum</span>
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Lade Kunden...</div>
          ) : displayCustomers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                {activeListTab === 'cancelled' ? (
                  <Ban className="w-5 h-5 text-rose-400" />
                ) : activeListTab === 'completed' ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : activeListTab === 'rechnung' ? (
                  <Euro className="w-5 h-5 text-amber-500" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <p>
                {activeListTab === 'cancelled'
                  ? 'Keine Absagen vorhanden'
                  : activeListTab === 'completed'
                  ? 'Keine abgeschlossenen Kunden'
                  : activeListTab === 'rechnung'
                  ? 'Keine Rechnungen gelistet'
                  : 'Keine Kunden gefunden'}
              </p>
            </div>
          ) : (
            displayCustomers.map((c) => {
              const isActive = activeCustomer?.id === c.id;
              const itemCount = c.gegenstaende ? Object.values(c.gegenstaende).reduce((acc: number, val) => acc + (typeof val === 'number' ? val : 0), 0) : 0;
              const hasEmailMatch = checkCustomerEmailMatch(c, emails);
              const hasCalendarMatch = checkCustomerCalendarMatch(c, calendarEvents);

              return (
                <div
                  key={c.id}
                  onClick={() => onSelect(c)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(c);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`w-full p-4 text-left flex items-start space-x-4 transition-all hover:bg-slate-50 cursor-pointer ${
                    isActive ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : ''
                  }`}
                >
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.name} className="w-10 h-10 rounded-full border border-slate-100 shadow-sm shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${c.isCancelled ? 'bg-rose-100 border-rose-200 text-rose-700' : (c.isCompleted || c.rechnungPaid) ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : (c.arPaid || c.arCreated || c.reCreated) ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-indigo-100 border-indigo-200 text-indigo-700'} border flex items-center justify-center shadow-sm shrink-0 font-bold text-sm`}>
                      {c.name ? c.name.charAt(0).toUpperCase() : 'K'}
                    </div>
                  )}

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-800 flex items-center space-x-1 flex-wrap">
                        <span className="truncate max-w-[110px]" title={c.name}>{c.name}</span>
                        {c.kundenNummer && <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{c.kundenNummer}</span>}
                        {c.isCancelled && (
                          <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-200" title="Kunde hat abgesagt">
                            <Ban className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>Absage</span>
                          </span>
                        )}
                        {(c.isCompleted || c.rechnungPaid) && !c.isCancelled && (
                          <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200" title="Kunde ist abgeschlossen">
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Erledigt</span>
                          </span>
                        )}
                        {hasEmailMatch && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNavigateToMail && c.email) {
                                onNavigateToMail(c.email, false);
                              }
                            }}
                            className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] font-bold border border-purple-200 transition-colors cursor-pointer"
                            title="E-Mail Match in Posteingang anzeigen"
                          >
                            <Mail className="w-3 h-3 text-purple-600" />
                          </button>
                        )}
                        {hasCalendarMatch && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNavigateToCalendar && c.email) {
                                onNavigateToCalendar(c.email);
                              }
                            }}
                            className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer"
                            title="Kalender Termin Match anzeigen"
                          >
                            <Calendar className="w-3 h-3 text-emerald-600" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCustomer && onEditCustomer(c);
                          }}
                          className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-700 transition-colors ml-0.5"
                          title="Kundendaten bearbeiten"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {formatDateSafe(c.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-xs space-x-1">
                      <p className="text-xs text-slate-500 truncate max-w-[120px]" title={c.email || c.phone || ''}>
                        {c.email || c.phone || 'Keine Kontaktdaten'}
                      </p>

                      {/* Payment Status Buttons + Bottom-Right Quick Action Icons (X & €) */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleToggleARStatus(c, e)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all border ${
                            (c.rechnungPaid || c.isCompleted)
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : (c.arPaid || c.arCreated)
                              ? 'bg-amber-400 hover:bg-amber-500 text-slate-900 border-amber-500 shadow-xs'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
                          }`}
                          title={
                            (c.rechnungPaid || c.isCompleted)
                              ? 'Anzahlungsrechnung erledigt (Grün)'
                              : (c.arPaid || c.arCreated)
                              ? 'Anzahlungsrechnung erstellt / vorgemerkt (Gelb)'
                              : 'Anzahlungsrechnung vormerken (gelb)'
                          }
                        >
                          AR
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleToggleREStatus(c, e)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all border ${
                            (c.rechnungPaid || c.isCompleted)
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : c.reCreated
                              ? 'bg-amber-400 hover:bg-amber-500 text-slate-900 border-amber-500 shadow-xs'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
                          }`}
                          title="Rechnung bezahlt markieren (beide Buttons werden grün & Kunde kommt in 'Abgeschlossen')"
                        >
                          RE
                        </button>

                        {/* Kleines graues Kreuz (X -> Absagen) & €-Symbol (-> Rechnung) */}
                        <div className="flex items-center space-x-0.5 ml-0.5 pl-1 border-l border-slate-200">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCancelCustomer(c, e);
                            }}
                            className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                            title="In Absagen verschieben"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await updateCustomer(c.id, { hasInvoiceCreated: true, isCancelled: false });
                            }}
                            className="p-1 rounded hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors"
                            title="In Spalte 'Rechnung' verschieben"
                          >
                            <Euro className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-1 flex-wrap gap-y-1">
                      {itemCount > 0 && (
                        <span className="bg-slate-100 text-[10px] text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                          {itemCount} Teile
                        </span>
                      )}
                      {c.nebenleistungen?.einrichtenHVZ && (
                        <span className="bg-blue-50 text-[10px] text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                          HVZ
                        </span>
                      )}
                      {c.nebenleistungen?.moebelmontage && (
                        <span className="bg-green-50 text-[10px] text-green-700 px-2 py-0.5 rounded-full font-semibold">
                          Montage
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Resizer */}
      <div
        className="hidden md:flex w-2 cursor-col-resize hover:bg-slate-300 active:bg-slate-400 shrink-0 z-10 mx-[-4px] relative"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = leftPanelWidth;
          const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const containerWidth = document.getElementById('kunden-tab-container')?.clientWidth || 1000;
            const deltaPercent = (deltaX / containerWidth) * 100;
            setLeftPanelWidth(Math.max(20, Math.min(80, startWidth + deltaPercent)));
          };
          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }}
      />

      {/* Customer Detail Panel (Right Side) */}
      <div className={`flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex-col h-full overflow-hidden ${!activeCustomer ? 'hidden md:flex' : 'flex'}`}>
        {activeCustomer ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">

            {/* Top Detail Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start bg-slate-50/50 gap-4 md:gap-0 shrink-0">
              <div className="flex items-center space-x-3 md:space-x-4 w-full md:w-auto">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTimeout(() => onSelect(null), 150);
                  }}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-800"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                {activeCustomer.avatarUrl ? (
                  <img src={activeCustomer.avatarUrl} alt={activeCustomer.name} className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white shadow-md" />
                ) : (
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${activeCustomer.isCancelled ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-indigo-100 border-indigo-200 text-indigo-700'} border-2 flex items-center justify-center shadow-md shrink-0`}>
                    <span className="font-bold text-base md:text-lg">
                      {activeCustomer.name ? activeCustomer.name.charAt(0).toUpperCase() : 'K'}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h2 className="font-bold text-lg text-slate-800">{activeCustomer.name}</h2>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTimeout(() => onSelect(null), 150);
                      }}
                      className="md:hidden flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ml-2"
                      title="Zurück zur Liste"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                      <span>Zurück</span>
                    </button>
                    {activeCustomer.kundenNummer && (
                      <span className="bg-slate-800 text-white text-xs px-2 py-0.5 rounded font-bold shadow-sm">
                        {activeCustomer.kundenNummer}
                      </span>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 ml-2">
                      <button
                        type="button"
                        onClick={(e) => handleToggleCancelCustomer(activeCustomer, e)}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                          activeCustomer.isCancelled
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                        title={activeCustomer.isCancelled ? 'Absage aufheben und Kunde reaktivieren' : 'Kunde als Absage markieren'}
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{activeCustomer.isCancelled ? 'Absage aufheben' : 'Absage!'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCreateCalendarEvent(activeCustomer, e)}
                        className="flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                        title="Kalendereintrag für diesen Kunden im Kalender erstellen"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Kalendereintrag</span>
                      </button>

                      {onNavigateToMail && activeCustomer.email && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToMail(activeCustomer.email!, true);
                          }}
                          className="flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                          title="Letzte E-Mail öffnen und antworten"
                        >
                          <Reply className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>E-Mail schreiben</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onEditCustomer && onEditCustomer(activeCustomer)}
                        className="flex items-center space-x-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-900 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                        title="Kundendaten & Gebühren bearbeiten"
                      >
                        <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Bearbeiten</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeCustomer.email || 'Keine E-Mail'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeCustomer.phone || 'Keine Telefonnummer'}</span>
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* AI Smart suggestions banner */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                  <h3 className="font-bold text-sm text-slate-800">Gemini AI Arbeitsunterstützung & Vorschläge</h3>
                </div>

                {loadingSuggestions ? (
                  <p className="text-xs text-slate-400 animate-pulse italic">Lade Vorschläge...</p>
                ) : aiSuggestions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                    Keine speziellen Empfehlungen für das aktuelle Volumen vorhanden.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {aiSuggestions.map((s, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-indigo-50/30 flex flex-col justify-between space-y-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${s.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'}`} />
                            <h4 className="font-bold text-xs text-slate-800">{s.title}</h4>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{s.description}</p>
                        </div>
                        <button
                          onClick={() => handleApplySuggestion(s)}
                          className="self-start text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded transition-colors"
                        >
                          {s.actionLabel}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Abholadresse info */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-200/60 pb-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <h4 className="font-bold text-xs text-slate-700">1. Abholadresse</h4>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p><strong>Adresse:</strong> {activeCustomer.abholadresse?.strasse ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeCustomer.abholadresse.strasse)}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{activeCustomer.abholadresse.strasse}</a> : '—'}</p>
                    <p><strong>Gebäude:</strong> {activeCustomer.abholadresse?.gebaeudetyp || '—'}</p>
                    <p><strong>Stockwerk / Lift:</strong> {activeCustomer.abholadresse?.stockwerk || 'EG'} / Aufzug: {activeCustomer.abholadresse?.aufzug || 'Nein'}</p>
                    <p><strong>LKW-Entfernung:</strong> {activeCustomer.abholadresse?.entfernungLKW || '10'} Meter</p>
                  </div>
                </div>

                {/* Zieladresse info */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-200/60 pb-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <h4 className="font-bold text-xs text-slate-700">2. Zieladresse</h4>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p><strong>Adresse:</strong> {activeCustomer.zieladresse?.strasse ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeCustomer.zieladresse.strasse)}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{activeCustomer.zieladresse.strasse}</a> : '—'}</p>
                    <p><strong>Gebäude:</strong> {activeCustomer.zieladresse?.gebaeudetyp || '—'}</p>
                    <p><strong>Stockwerk / Lift:</strong> {activeCustomer.zieladresse?.stockwerk || 'EG'} / Aufzug: {activeCustomer.zieladresse?.aufzug || 'Nein'}</p>
                    <p><strong>LKW-Entfernung:</strong> {activeCustomer.zieladresse?.entfernungLKW || '10'} Meter</p>
                  </div>
                </div>
              </div>

              {/* Items checklist & interactive management */}
              <CustomerInventoryManager customer={activeCustomer} updateCustomer={updateCustomer} />

            </div>

          </div>
        ) : (
          <AIAssistantWidget />
        )}
      </div>

    </div>
  );
}

// -----------------------------------------------------------------
// TAB 2: VOLUMENRECHNER
// -----------------------------------------------------------------
function RechnerTab() {
  const { activeCustomer, calculationParams, setCalculationParams, updateCustomer } = useCustomer();
  const [loadedCustomerId, setLoadedCustomerId] = useState<string | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [routeBreakdown, setRouteBreakdown] = useState<{
    depotToPickup: number;
    pickupToDest: number;
    destToDepot: number;
    totalKm: number;
    googleMapsUrl: string;
    source: 'api' | 'fallback';
  } | null>(null);

  const handleCalculateRouteFromMaps = async (autoSave = true) => {
    setIsCalculatingRoute(true);

    const depot = `${companyData.street}, ${companyData.zip} ${companyData.city}, ${companyData.country}`;
    const pickup = activeCustomer?.abholadresse?.strasse || activeCustomer?.address?.city || 'Innsbruck, Österreich';
    const dest = activeCustomer?.zieladresse?.strasse || 'Wien, Österreich';

    const extraStops = [
      activeCustomer?.zusatzoptionen?.adresseNr1,
      activeCustomer?.zusatzoptionen?.adresseNr2,
      activeCustomer?.zusatzoptionen?.adresseNr3,
      activeCustomer?.zusatzoptionen?.adresseNr4,
    ].filter(Boolean) as string[];

    const waypointsStr = [pickup, ...extraStops, dest].map(w => encodeURIComponent(w)).join('%7C');
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(depot)}&destination=${encodeURIComponent(depot)}&waypoints=${waypointsStr}`;

    try {
      const geocode = async (queryStr: string) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryStr)}`);
          const data = await res.json();
          if (data && data[0]) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
          }
        } catch (e) {
          console.error('Geocoding error:', e);
        }
        return null;
      };

      const [depotG, pickupG, destG] = await Promise.all([
        geocode(depot),
        geocode(pickup),
        geocode(dest)
      ]);

      if (depotG && pickupG && destG) {
        const coordsStr = `${depotG.lon},${depotG.lat};${pickupG.lon},${pickupG.lat};${destG.lon},${destG.lat};${depotG.lon},${depotG.lat}`;
        const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=false`);
        const osrmData = await osrmRes.json();

        if (osrmData?.routes?.[0]?.legs?.length >= 3) {
          const legs = osrmData.routes[0].legs;
          const d1 = Math.round((legs[0].distance / 1000) * 10) / 10;
          const d2 = Math.round((legs[1].distance / 1000) * 10) / 10;
          const d3 = Math.round((legs[2].distance / 1000) * 10) / 10;
          const total = Math.round((osrmData.routes[0].distance / 1000) * 10) / 10;

          const newBreakdown = {
            depotToPickup: d1,
            pickupToDest: d2,
            destToDepot: d3,
            totalKm: total,
            googleMapsUrl,
            source: 'api' as const
          };

          setRouteBreakdown(newBreakdown);
          handleParamChange('distanceKm', total);
          if (autoSave && activeCustomer) {
            updateCustomer(activeCustomer.id, { routeBreakdown: newBreakdown, totalKm: total });
          }
          setIsCalculatingRoute(false);
          return;
        }
      }
    } catch (err) {
      console.error('Maps API calculation fallback:', err);
    }

    const fallbackTotal = Math.max(15, calculationParams.distanceKm || 30);
    const d1 = Math.round(fallbackTotal * 0.25 * 10) / 10;
    const d2 = Math.round(fallbackTotal * 0.5 * 10) / 10;
    const d3 = Math.round(fallbackTotal * 0.25 * 10) / 10;

    const fallbackBreakdown = {
      depotToPickup: d1,
      pickupToDest: d2,
      destToDepot: d3,
      totalKm: fallbackTotal,
      googleMapsUrl,
      source: 'fallback' as const
    };

    setRouteBreakdown(fallbackBreakdown);
    if (autoSave && activeCustomer) {
      updateCustomer(activeCustomer.id, { routeBreakdown: fallbackBreakdown });
    }

    setIsCalculatingRoute(false);
  };

  // Sync calculation parameters when active customer changes
  useEffect(() => {
    if (!activeCustomer || activeCustomer.id === loadedCustomerId) return;

    const parseDistance = (val: any): number => {
      if (typeof val === 'number') return val;
      if (!val) return 10;
      const str = String(val).toLowerCase();
      if (str.includes('0–5') || str.includes('0-5')) return 3;
      if (str.includes('5–10') || str.includes('5-10')) return 8;
      if (str.includes('10–15') || str.includes('10-15')) return 13;
      if (str.includes('15–20') || str.includes('15-20')) return 18;
      const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? 10 : num;
    };

    const parseFloor = (val: any): number => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      const str = String(val).toLowerCase();
      if (str.includes('erdgeschoss') || str.includes('eg')) return 0;
      if (str.includes('1. stock') || str.includes('1')) return 1;
      if (str.includes('2. stock') || str.includes('2')) return 2;
      if (str.includes('3. stock') || str.includes('3')) return 3;
      if (str.includes('4. stock') || str.includes('4')) return 4;
      const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? 0 : Math.min(4, Math.max(0, num));
    };

    const parseElevator = (val: any): 'none' | 'small' | 'medium' | 'large' => {
      if (!val) return 'none';
      const str = String(val).toLowerCase();
      if (str === 'none' || str === 'nein' || str.includes('kein')) return 'none';
      if (str === 'ja' || str.includes('klein') || str === 'small') return 'small';
      if (str.includes('mittel') || str === 'medium') return 'medium';
      if (str.includes('groß') || str.includes('gross') || str === 'large' || str.includes('lasten')) return 'large';
      return 'small';
    };

    const parseHelpers = (val: any): number => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? 0 : Math.min(4, Math.max(0, num));
    };

    setCalculationParams(prev => ({
      ...prev,
      pickupDistance: parseDistance(activeCustomer.abholadresse?.entfernungLKW),
      destinationDistance: parseDistance(activeCustomer.zieladresse?.entfernungLKW),
      pickupFloor: parseFloor(activeCustomer.abholadresse?.stockwerk),
      destinationFloor: parseFloor(activeCustomer.zieladresse?.stockwerk),
      pickupElevator: parseElevator(activeCustomer.abholadresse?.aufzugsgroesse || activeCustomer.abholadresse?.aufzug),
      destinationElevator: parseElevator(activeCustomer.zieladresse?.aufzugsgroesse || activeCustomer.zieladresse?.aufzug),
      selfProvidedPersonnel: parseHelpers(activeCustomer.zusatzoptionen?.helfer),
      hvzCount: activeCustomer.nebenleistungen?.einrichtenHVZ ? (activeCustomer.abholadresse?.strasse && activeCustomer.zieladresse?.strasse ? 2 : 1) : 0,
      buildingType: (activeCustomer.abholadresse?.gebaeudetyp?.toLowerCase().includes('altbau') || activeCustomer.zieladresse?.gebaeudetyp?.toLowerCase().includes('altbau')) ? 'altbau' : 'neubau',
      distanceKm: activeCustomer.routeBreakdown?.totalKm ?? (typeof activeCustomer.totalKm === 'number' ? activeCustomer.totalKm : 20)
    }));

    if (activeCustomer.routeBreakdown) {
      setRouteBreakdown(activeCustomer.routeBreakdown);
    } else {
      setRouteBreakdown(null);
      // Trigger calculation automatically if not present
      setTimeout(() => {
        handleCalculateRouteFromMaps(true);
      }, 0);
    }

    setLoadedCustomerId(activeCustomer.id);
  }, [activeCustomer, loadedCustomerId, setCalculationParams]); // Note: handleCalculateRouteFromMaps omitted from deps to avoid re-renders, it uses current scope


  const handleParamChange = (field: keyof typeof calculationParams, value: any) => {
    setCalculationParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Perform Volume & Cost calculations dynamically
  let totalM3 = 0;
  if (activeCustomer?.gegenstaende) {
    Object.entries(activeCustomer.gegenstaende).forEach(([key, val]) => {
      const count = Number(val) || 0;
      if (count > 0) {
        // Locate preset CBM size
        let m3Size = 0.2; // default
        Object.values(ITEM_CBM_DEFAULTS).forEach(roomItems => {
          const item = roomItems.find(i => i.key === key);
          if (item) m3Size = item.cbm;
        });
        totalM3 += count * m3Size;
      }
    });
  }

  // Fallback if no items
  if (totalM3 === 0) totalM3 = 12.5;

  // Stockwerk & Lift multiplier calculations
  const elevatorFactorPickup = calculationParams.pickupElevator === 'small' ? 0.7 :
                               calculationParams.pickupElevator === 'medium' ? 0.5 :
                               calculationParams.pickupElevator === 'large' ? 0.3 : 1;

  const elevatorFactorDest = calculationParams.destinationElevator === 'small' ? 0.7 :
                             calculationParams.destinationElevator === 'medium' ? 0.5 :
                             calculationParams.destinationElevator === 'large' ? 0.3 : 1;

  // Base carrying rate
  const manHoursBase = totalM3 * 0.8; // 0.8 hours per m³ base rate
  const floorFactor = (calculationParams.pickupFloor * 0.1 * elevatorFactorPickup) +
                      (calculationParams.destinationFloor * 0.1 * elevatorFactorDest);

  const carryFactor = (calculationParams.pickupDistance * 0.006) +
                      (calculationParams.destinationDistance * 0.006);

  // Workforce deduction
  const helpersDeduction = calculationParams.selfProvidedPersonnel * 0.25; // 25% work speed boost per helper
  const buildingFactor = calculationParams.buildingType === 'altbau' ? 1.15 : 1.0;
  const estimatedHours = Math.max(3, Math.round(manHoursBase * (1 + floorFactor + carryFactor) * buildingFactor * (1 - Math.min(0.5, helpersDeduction))));

  // Workers count needed
  const requiredWorkers = totalM3 < 15 ? 2 : totalM3 < 30 ? 3 : totalM3 < 45 ? 4 : 5;

  const multiplier = calculationParams.priceMultiplier ?? 1;

  // Pricing (Workers rate: 45 EUR/h)
  const workerRate = 45;
  const assemblyHours = activeCustomer?.nebenleistungen?.moebelmontage ? 4 : 0;
  const assemblyPrice = assemblyHours * 55 * multiplier; // 55 EUR/h for assembly worker

  // Vehicle rates
  const isLKW12 = totalM3 > 35;
  const isLKW7 = totalM3 > 18 && totalM3 <= 35;
  const vehicleRate = isLKW12 ? 85 : isLKW7 ? 65 : 45;
  const vehicleLabel = isLKW12 ? 'LKW 12t' : isLKW7 ? 'LKW 7.5t' : 'Sprinter 3.5t';

  // Speed and Driving Kilometers
  const speed = isLKW12 ? 65 : isLKW7 ? 70 : 80;
  const distanceKm = calculationParams.distanceKm ?? 20;
  const drivingTime = distanceKm / speed;

  const travelPrice = (estimatedHours + drivingTime) * vehicleRate * multiplier;
  const carryingPrice = (estimatedHours + drivingTime) * requiredWorkers * workerRate * multiplier;
  const hvzPrice = calculationParams.hvzCount * 120 * multiplier;

  // Toll cost (Mautkosten)
  const country = activeCustomer?.address?.country?.toLowerCase() || '';
  let tollRate = 0.18; // default TOLL_COSTS.DEFAULT
  if (country.includes('de') || country.includes('deutschland')) {
    tollRate = 0.15; // TOLL_COSTS.DE
  }
  let tollPriceBase = distanceKm * tollRate;
  if (country.includes('ch') || country.includes('schweiz') || country.includes('switzerland')) {
    tollPriceBase = 40; // TOLL_COSTS.CH_PAUSCHAL
  }
  const tollPrice = tollPriceBase * multiplier;

  // Overnight cost (Übernachtungskosten)
  const isOvernight = distanceKm > 400;
  const overnightPrice = (isOvernight ? requiredWorkers * 90 : 0) * multiplier; // OVERNIGHT_COSTS_PER_PERSON

  // Leih-LKW
  const rentLKWDays = calculationParams.rentLKWDays || 1;
  const rentLKWPricePerDay = 250;
  const rentLKWFreeKm = 200;
  const rentLKWExtraKmPrice = 1.0;
  let rentLKWPriceBase = 0;
  if (calculationParams.rentLKW) {
    const extraKm = Math.max(0, distanceKm - rentLKWFreeKm);
    rentLKWPriceBase = (rentLKWDays * rentLKWPricePerDay) + (extraKm * rentLKWExtraKmPrice);
  }
  const rentLKWPrice = rentLKWPriceBase * multiplier;

  const subTotal = travelPrice + carryingPrice + assemblyPrice + hvzPrice + tollPrice + overnightPrice + rentLKWPrice;

  let discountRate = 0;
  if (calculationParams.hasKombiRabatt) discountRate += 0.05;
  if (calculationParams.hasStandardRabatt) discountRate += 0.10;
  if (calculationParams.hasSofortRabatt) discountRate += 0.15;

  const discountAmount = subTotal * discountRate;
  const netTotal = subTotal - discountAmount;
  const vatRate = 0.20; // 20% Austrian VAT
  const vatAmount = netTotal * vatRate;
  const totalAmount = netTotal + vatAmount;

  const handleSaveCalculation = async () => {
    if (!activeCustomer) return;

    const abholadresse = {
      ...activeCustomer.abholadresse,
      entfernungLKW: String(calculationParams.pickupDistance),
      stockwerk: String(calculationParams.pickupFloor),
      aufzug: calculationParams.pickupElevator !== 'none' ? 'Ja' : 'Nein',
      aufzugsgroesse: calculationParams.pickupElevator,
      gebaeudetyp: calculationParams.buildingType === 'altbau' ? 'Altbau (hohe Räume)' : 'Neubau (normale Deckenhöhe)'
    };

    const zieladresse = {
      ...activeCustomer.zieladresse,
      entfernungLKW: String(calculationParams.destinationDistance),
      stockwerk: String(calculationParams.destinationFloor),
      aufzug: calculationParams.destinationElevator !== 'none' ? 'Ja' : 'Nein',
      aufzugsgroesse: calculationParams.destinationElevator,
      gebaeudetyp: calculationParams.buildingType === 'altbau' ? 'Altbau (hohe Räume)' : 'Neubau (normale Deckenhöhe)'
    };

    const nebenleistungen = {
      ...activeCustomer.nebenleistungen,
      einrichtenHVZ: calculationParams.hvzCount > 0
    };

    const zusatzoptionen = {
      ...activeCustomer.zusatzoptionen,
      helfer: String(calculationParams.selfProvidedPersonnel)
    };

    await updateCustomer(activeCustomer.id, {
      totalKm: calculationParams.distanceKm,
      abholadresse,
      zieladresse,
      nebenleistungen,
      zusatzoptionen
    });

    window.dispatchEvent(new CustomEvent('toast_notification', { detail: { type: 'success', message: 'Kalkulationswerte wurden erfolgreich im Kundenprofil gespeichert!' } }));
  };

  return (
    <div id="rechner-tab-container" className="min-h-[800px] md:h-full flex flex-col md:flex-row space-y-4 md:space-y-0 md:overflow-hidden relative">

      {/* Parameters Selection (Left) */}
      <div 
        className="w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 overflow-y-auto h-full shrink-0"
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${leftPanelWidth}%` : '100%' }}
      >
        {activeCustomer && (
          <CustomerInventoryManager customer={activeCustomer} updateCustomer={updateCustomer} />
        )}

        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Calculator className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-base text-slate-800">Logistische Parameter & Aufschläge</h2>
        </div>

        {/* Pickup address constraints */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">1. Beladeort (Abholadresse)</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Trageweg LKW (Meter): {calculationParams.pickupDistance}m</label>
              <input
                type="range"
                min="0"
                max="100"
                value={calculationParams.pickupDistance || ''}
                onChange={(e) => handleParamChange('pickupDistance', Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Stockwerk: {calculationParams.pickupFloor}</label>
              <select
                value={calculationParams.pickupFloor || ''}
                onChange={(e) => handleParamChange('pickupFloor', Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-indigo-500"
              >
                <option value="0">Erdgeschoss</option>
                <option value="1">1. Stock</option>
                <option value="2">2. Stock</option>
                <option value="3">3. Stock</option>
                <option value="4">4. Stock oder höher</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Fahrstuhlgröße</label>
              <select
                value={calculationParams.pickupElevator || ''}
                onChange={(e) => handleParamChange('pickupElevator', e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-indigo-500"
              >
                <option value="none">Kein Aufzug (1.0x)</option>
                <option value="small">Klein - 2 Personen (0.7x)</option>
                <option value="medium">Mittel - Möbeltransport (0.5x)</option>
                <option value="large">Groß - Lastenaufzug (0.3x)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Gebäudetyp</label>
              <select
                value={calculationParams.buildingType || ''}
                onChange={(e) => handleParamChange('buildingType', e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-indigo-500"
              >
                <option value="neubau">Neubau - Standarddecken (1.0x)</option>
                <option value="altbau">Altbau - Hohe Räumlichkeiten (+15% Zeit)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Destination address constraints */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">2. Entladeort (Zieladresse)</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Trageweg LKW (Meter): {calculationParams.destinationDistance}m</label>
              <input
                type="range"
                min="0"
                max="100"
                value={calculationParams.destinationDistance || ''}
                onChange={(e) => handleParamChange('destinationDistance', Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Stockwerk: {calculationParams.destinationFloor}</label>
              <select
                value={calculationParams.destinationFloor || ''}
                onChange={(e) => handleParamChange('destinationFloor', Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-indigo-500"
              >
                <option value="0">Erdgeschoss</option>
                <option value="1">1. Stock</option>
                <option value="2">2. Stock</option>
                <option value="3">3. Stock</option>
                <option value="4">4. Stock oder höher</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Fahrstuhlgröße</label>
              <select
                value={calculationParams.destinationElevator || ''}
                onChange={(e) => handleParamChange('destinationElevator', e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-indigo-500"
              >
                <option value="none">Kein Aufzug (1.0x)</option>
                <option value="small">Klein - 2 Personen (0.7x)</option>
                <option value="medium">Mittel - Möbeltransport (0.5x)</option>
                <option value="large">Groß - Lastenaufzug (0.3x)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Halteverbotszonen (HVZ)</label>
              <select
                value={calculationParams.hvzCount || ''}
                onChange={(e) => handleParamChange('hvzCount', Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-indigo-500"
              >
                <option value="0">Keine Zone nötig</option>
                <option value="1">1 Zone einrichten (120 €)</option>
                <option value="2">2 Zonen (Belade- & Entladeort) (240 €)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Driving Distance Parameter & Address Route */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Navigation className="w-3.5 h-3.5 text-indigo-500" />
              <span>3. Transport & Fahrtstrecke (Maps API)</span>
            </h3>
            {drivingTime > 0 && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/50">
                Fahrzeit: {drivingTime.toFixed(1)} Std. ({speed} km/h)
              </span>
            )}
          </div>

          {/* Alle Adressen auf der Route */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-2">
            <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide flex items-center space-x-1">
              <Map className="w-3.5 h-3.5 text-slate-500" />
              <span>Alle Adressen auf der Fahrtroute</span>
            </p>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-start space-x-2 p-2 bg-white rounded border border-slate-200/80 shadow-2xs">
                <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">1. Depot</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 text-[11px]">Start: Firmenstandort (Spedition Hüber)</p>
                  <p className="text-[10px] text-slate-500 truncate">{companyData.street}, {companyData.zip} {companyData.city}, {companyData.country}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-2 bg-indigo-50/70 rounded border border-indigo-200/60 shadow-2xs">
                <span className="bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">2. Beladen</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-[11px]">Abholadresse (Beladeort)</p>
                  <p className="text-[10px] text-slate-700 font-medium truncate">{activeCustomer?.abholadresse?.strasse || activeCustomer?.address?.street || 'Keine Abholadresse erfasst'}</p>
                </div>
              </div>

              {[
                activeCustomer?.zusatzoptionen?.adresseNr1,
                activeCustomer?.zusatzoptionen?.adresseNr2,
                activeCustomer?.zusatzoptionen?.adresseNr3,
                activeCustomer?.zusatzoptionen?.adresseNr4,
              ].filter(Boolean).map((stop, idx) => (
                <div key={idx} className="flex items-start space-x-2 p-2 bg-blue-50/70 rounded border border-blue-200/60 shadow-2xs">
                  <span className="bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">Stopp {idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-[11px]">Zwischenadresse</p>
                    <p className="text-[10px] text-slate-700 font-medium truncate">{stop}</p>
                  </div>
                </div>
              ))}

              <div className="flex items-start space-x-2 p-2 bg-emerald-50/70 rounded border border-emerald-200/60 shadow-2xs">
                <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">3. Entladen</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-[11px]">Zieladresse (Entladeort)</p>
                  <p className="text-[10px] text-slate-700 font-medium truncate">{activeCustomer?.zieladresse?.strasse || 'Keine Zieladresse erfasst'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-2 bg-white rounded border border-slate-200/80 shadow-2xs">
                <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">4. Depot</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 text-[11px]">Rückfahrt: Firmenstandort</p>
                  <p className="text-[10px] text-slate-500 truncate">{companyData.street}, {companyData.zip} {companyData.city}, {companyData.country}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Maps API Action Buttons */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handleCalculateRouteFromMaps(true)}
              disabled={isCalculatingRoute || !activeCustomer}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              {isCalculatingRoute ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Berechne Maps API...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-slate-950" />
                  <span>Strecke via Maps API berechnen</span>
                </>
              )}
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${companyData.street}, ${companyData.city}`)}&destination=${encodeURIComponent(`${companyData.street}, ${companyData.city}`)}&waypoints=${encodeURIComponent(activeCustomer?.abholadresse?.strasse || '')}%7C${encodeURIComponent(activeCustomer?.zieladresse?.strasse || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-lg text-xs flex items-center space-x-1 transition-colors border border-slate-200 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>In Google Maps öffnen</span>
            </a>
          </div>

          {/* Route breakdown summary when calculated */}
          {routeBreakdown && (
            <div className="p-3 bg-indigo-50 border border-indigo-200/80 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center font-bold text-indigo-900">
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span>Maps API Berechnungsergebnis:</span>
                </span>
                <span className="text-sm bg-indigo-200/80 text-indigo-950 px-2 py-0.5 rounded">
                  {routeBreakdown.totalKm} km gesamt
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-indigo-800 pt-1 border-t border-indigo-200/50">
                <div>
                  <p className="font-medium text-indigo-700">Depot ➔ Beladen:</p>
                  <p className="font-bold">{routeBreakdown.depotToPickup} km</p>
                </div>
                <div>
                  <p className="font-medium text-indigo-700">Beladen ➔ Entladen:</p>
                  <p className="font-bold">{routeBreakdown.pickupToDest} km</p>
                </div>
                <div>
                  <p className="font-medium text-indigo-700">Entladen ➔ Depot:</p>
                  <p className="font-bold">{routeBreakdown.destToDepot} km</p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Range Slider */}
          <div className="space-y-1 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-600">Fahrtstrecke anpassen (Kilometer): <strong className="text-indigo-600 font-bold">{distanceKm} km</strong></label>
            </div>
            <input
              type="range"
              min="1"
              max="800"
              value={distanceKm || ''}
              onChange={(e) => handleParamChange('distanceKm', Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <p className="text-[10px] text-slate-400">
              Die berechnete einfache Fahrzeit fließt direkt in die Fahrzeug- und Personalkosten ein.
              {isOvernight && <span className="text-red-500 font-semibold"> (+ Übernachtungskosten da &gt; 400km)</span>}
            </p>
          </div>
        </div>

        {/* Customer helper count */}
        <div className="space-y-1 border-t border-slate-100 pt-4">
          <label className="text-xs font-semibold text-slate-500">Vom Kunden bereitgestellte Helfer: {calculationParams.selfProvidedPersonnel}</label>
          <input
            type="range"
            min="0"
            max="4"
            value={calculationParams.selfProvidedPersonnel || ''}
            onChange={(e) => handleParamChange('selfProvidedPersonnel', Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <p className="text-[10px] text-slate-400">Jeder Helfer reduziert die benötigte Arbeitszeit um ca. 25% (gedeckelt bei 50%).</p>
        </div>

        {/* Zusätzliche Optionen */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <h4 className="font-bold text-xs text-slate-800 uppercase">Zusätzliche Rabatte & Optionen</h4>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" checked={!!calculationParams.hasKombiRabatt} onChange={(e) => handleParamChange('hasKombiRabatt', e.target.checked)} className="rounded text-indigo-500 focus:ring-indigo-500 h-4 w-4" />
              <span>5% Kombi-Rabatt anwenden</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" checked={!!calculationParams.hasStandardRabatt} onChange={(e) => handleParamChange('hasStandardRabatt', e.target.checked)} className="rounded text-indigo-500 focus:ring-indigo-500 h-4 w-4" />
              <span>10% Standard-Rabatt anwenden</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" checked={!!calculationParams.hasSofortRabatt} onChange={(e) => handleParamChange('hasSofortRabatt', e.target.checked)} className="rounded text-indigo-500 focus:ring-indigo-500 h-4 w-4" />
              <span>15% Sofortzahlungsrabatt anwenden</span>
            </label>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={!!calculationParams.rentLKW} onChange={(e) => handleParamChange('rentLKW', e.target.checked)} className="rounded text-indigo-500 focus:ring-indigo-500 h-4 w-4" />
              <span>Leih-LKW buchen (250€/Tag, inkl. 200km, danach 1€/km)</span>
            </label>

            {calculationParams.rentLKW && (
              <div className="pl-6 space-y-3 pt-1 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Mietdauer (Tage)</label>
                  <input type="number" min="1" value={calculationParams.rentLKWDays || ''} onChange={(e) => handleParamChange('rentLKWDays', parseInt(e.target.value) || 1)} className="border border-slate-200 rounded px-2 py-1 w-24" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">LKW-Typ (Richtpreise)</label>
                  <select value={calculationParams.rentLKWType || ''} onChange={(e) => handleParamChange('rentLKWType', e.target.value)} className="border border-slate-200 rounded px-2 py-1 w-full bg-white">
                    <option value="7.5t">7,5-Tonner</option>
                    <option value="12t">12-Tonner</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSaveCalculation}
          disabled={!activeCustomer}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-lg text-xs shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Kalkulationsdaten auf Kundenprofil speichern
        </button>
      </div>

      {/* Resizer */}
      <div
        className="hidden md:flex w-2 cursor-col-resize hover:bg-slate-300 active:bg-slate-400 shrink-0 z-10 mx-[-4px] relative"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = leftPanelWidth;
          const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const containerWidth = document.getElementById('rechner-tab-container')?.clientWidth || 1000;
            const deltaPercent = (deltaX / containerWidth) * 100;
            setLeftPanelWidth(Math.max(20, Math.min(80, startWidth + deltaPercent)));
          };
          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }}
      />

      {/* Pricing Sheet & Calculation Output (Right) */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-base text-slate-800">Angebotskalkulations-Matrix</h2>
          </div>
          <span className="bg-slate-100 text-xs text-slate-600 font-bold px-2.5 py-1 rounded-full">
            Volumen: {totalM3.toFixed(1)} m³
          </span>
        </div>

        {/* Details overview */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Personalaufwand</p>
              <p className="text-lg font-extrabold text-slate-800 mt-1">{requiredWorkers} Träger</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">LKW Empfehlung</p>
              <p className="text-lg font-extrabold text-slate-800 mt-1">{vehicleLabel}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Geschätzte Dauer</p>
              <p className="text-lg font-extrabold text-slate-800 mt-1">{(estimatedHours + drivingTime).toFixed(1)} Std.</p>
            </div>
          </div>

          {/* Pricing breakdowns */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-400 uppercase">Kostendetails (Netto)</h4>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden text-xs">
              <div className="flex justify-between p-3 bg-slate-50/50">
                <span className="text-slate-600">Fahrzeugbereitstellung & Fahrtzeit ({vehicleLabel} - {vehicleRate}€/h)</span>
                <span className="font-semibold text-slate-800">{travelPrice.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50/50">
                <span className="text-slate-600">Trägerleistung & Fahrtzeit ({requiredWorkers} Mann x {workerRate}€/h)</span>
                <span className="font-semibold text-slate-800">{carryingPrice.toFixed(2)} €</span>
              </div>
              {activeCustomer?.nebenleistungen?.moebelmontage && (
                <div className="flex justify-between p-3 bg-slate-50/50">
                  <span className="text-slate-600">Möbelmontage Pauschale</span>
                  <span className="font-semibold text-slate-800">{assemblyPrice.toFixed(2)} €</span>
                </div>
              )}
              {calculationParams.hvzCount > 0 && (
                <div className="flex justify-between p-3 bg-slate-50/50">
                  <span className="text-slate-600">Behördliche Halteverbotszonen ({calculationParams.hvzCount}x)</span>
                  <span className="font-semibold text-slate-800">{hvzPrice.toFixed(2)} €</span>
                </div>
              )}
              {tollPrice > 0 && (
                <div className="flex justify-between p-3 bg-slate-50/50">
                  <span className="text-slate-600">Mautgebühren & Straßenbenutzungsabgaben ({distanceKm} km)</span>
                  <span className="font-semibold text-slate-800">{tollPrice.toFixed(2)} €</span>
                </div>
              )}
              {overnightPrice > 0 && (
                <div className="flex justify-between p-3 bg-slate-50/50">
                  <span className="text-slate-600">Auslöse & Übernachtungskosten ({requiredWorkers} Personen)</span>
                  <span className="font-semibold text-slate-800">{overnightPrice.toFixed(2)} €</span>
                </div>
              )}
              {rentLKWPrice > 0 && (
                <div className="flex justify-between p-3 bg-slate-50/50">
                  <span className="text-slate-600">Leih-LKW ({calculationParams.rentLKWDays} Tage, {calculationParams.rentLKWType})</span>
                  <span className="font-semibold text-slate-800">{rentLKWPrice.toFixed(2)} €</span>
                </div>
              )}
            </div>
          </div>

          {/* Aggregation */}
          <div className="bg-indigo-50/20 border border-indigo-500/10 p-4 rounded-xl space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Zwischensumme:</span>
              <span>{subTotal.toFixed(2)} €</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Rabatt ({(discountRate * 100).toFixed(0)}%):</span>
                <span className="text-green-600 font-medium">-{discountAmount.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between text-slate-800 font-semibold border-t border-slate-200/60 pt-2">
              <span>Nettosumme:</span>
              <span>{netTotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>20% USt.:</span>
              <span>{vatAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black text-lg border-t border-indigo-500/20 pt-2">
              <span className="text-sm font-extrabold uppercase">Gesamtbetrag (Brutto):</span>
              <span className="text-indigo-600 font-extrabold">{totalAmount.toFixed(2)} €</span>
            </div>

            {/* Price Adjustment Slider */}
            <div className="pt-3 border-t border-indigo-500/20 mt-2 space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-600">Gesamtpreis anpassen:</label>
                <span className="text-xs font-bold text-indigo-600">{((calculationParams.priceMultiplier ?? 1) * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={Math.log10(calculationParams.priceMultiplier ?? 1) * 100 || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const newMultiplier = Math.pow(10, val / 100);
                  handleParamChange('priceMultiplier', newMultiplier);
                }}
                className="w-full accent-indigo-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>10x günstiger</span>
                <span>Normal</span>
                <span>10x teurer</span>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Export Actions */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                if (!activeCustomer) return;
                triggerOrientierungsangebot(activeCustomer, calculationParams);
              }}
              disabled={!activeCustomer}
              className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-3 rounded-lg text-xs transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Orientierungsangebot</span>
            </button>

            <button
              onClick={() => {
                if (!activeCustomer) return;
                triggerAnzahlungsrechnung(activeCustomer, calculationParams);
              }}
              disabled={!activeCustomer}
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-3 rounded-lg text-[10px] sm:text-xs transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 text-slate-950 hidden sm:block" />
              <span>Anzahlungsrechnung</span>
            </button>

            <button
              onClick={() => {
                if (!activeCustomer) return;
                triggerRechnung(activeCustomer, calculationParams);
              }}
              disabled={!activeCustomer}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-3 rounded-lg text-[10px] sm:text-xs transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 text-white hidden sm:block" />
              <span>Rechnung</span>
            </button>
          </div>

          {(activeCustomer?.arCreated || activeCustomer?.reCreated || activeCustomer?.hasInvoiceCreated) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  if (!activeCustomer) return;
                  triggerStornoAnzahlungsrechnung(activeCustomer, calculationParams);
                }}
                disabled={!activeCustomer}
                className="flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2.5 px-3 rounded-lg text-[10px] sm:text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Ban className="w-3.5 h-3.5 text-rose-600" />
                <span>Storno Anzahlungsrechnung</span>
              </button>
              <button
                onClick={() => {
                  if (!activeCustomer) return;
                  triggerStornoRechnung(activeCustomer, calculationParams);
                }}
                disabled={!activeCustomer}
                className="flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2.5 px-3 rounded-lg text-[10px] sm:text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Ban className="w-3.5 h-3.5 text-rose-600" />
                <span>Storno Rechnung</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// -----------------------------------------------------------------
// TAB 3: DISPOSITION & LIEFERSCHEIN (Kunden-Daten Import & Verarbeitung)
// -----------------------------------------------------------------
interface DispositionTabProps {
  customers?: Customer[];
  activeCustomer?: Customer | null;
  onSelectCustomer?: (customer: Customer) => void;
}

function DispositionTab({
  customers = [],
  activeCustomer = null,
  onSelectCustomer
}: DispositionTabProps) {
  const { updateCustomer } = useCustomer();
  const { vehicles } = useVehicle();
  const { employees: teamEmployees } = useEmployee();
  const [searchQuery, setSearchQuery] = useState('');
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.33);

  // Active selected customer for Lieferschein processing
  const currentCustomer = activeCustomer || (customers.length > 0 ? customers[0] : null);

  // Form states for the active customer's Lieferschein
  const [selectedDriver, setSelectedDriver] = useState<string>('Dominik Sturm');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(['Dragan Dojkovic', 'Michl Tragert']);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('16:00');
  const [lieferscheinStatus, setLieferscheinStatus] = useState<'draft' | 'scheduled' | 'done'>('scheduled');
  const [customNotes, setCustomNotes] = useState<string>('');

  const [gesamtgewicht, setGesamtgewicht] = useState<string>('750 kg');
  const [fahrzeuge, setFahrzeuge] = useState<string>('3,5t Koffer LKW');
  const [fahrer, setFahrer] = useState<string>('Dominik Sturm');
  const [monteure, setMonteure] = useState<string>('');
  const [moebeltraeger, setMoebeltraeger] = useState<string>('Dragan Dojkovic');
  const [verpacker, setVerpacker] = useState<string>('');
  const [kiAufgabenliste, setKiAufgabenliste] = useState<string>('');
  const [isGeneratingKI, setIsGeneratingKI] = useState(false);

  // Keep custom notes synced when currentCustomer changes
  useEffect(() => {
    if (currentCustomer) {
      let defaultNotes = currentCustomer.anmerkungen || '';
      if (currentCustomer.transcript) {
        defaultNotes += (defaultNotes ? '\n\n---\n\n' : '') + 'Aus Textimport:\n' + currentCustomer.transcript;
      }
      setCustomNotes(defaultNotes);

      if (currentCustomer.kiAufgabenliste) {
        setKiAufgabenliste(currentCustomer.kiAufgabenliste);
      } else {
        generateKIAufgabenliste(currentCustomer);
      }
    }
  }, [currentCustomer?.id, currentCustomer?.kiAufgabenliste]);

  // Compute items & total volume for currentCustomer
  const parsedInventory = React.useMemo(() => {
    if (!currentCustomer?.gegenstaende) return { items: [], totalM3: 0 };
    const items: { key: string; name: string; count: number; cbm: number }[] = [];
    let totalM3 = 0;
    Object.entries(currentCustomer.gegenstaende).forEach(([key, val]) => {
      const count = Number(val) || 0;
      if (count > 0) {
        let name = key;
        let cbm = 0.5;
        Object.values(ITEM_CBM_DEFAULTS).forEach(room => {
          const matched = room.find(i => i.key === key);
          if (matched) {
            name = matched.name;
            cbm = matched.cbm;
          }
        });
        totalM3 += count * cbm;
        items.push({ key, name, count, cbm });
      }
    });
    return { items, totalM3: Math.round(totalM3 * 10) / 10 };
  }, [currentCustomer?.gegenstaende]);

  const generateKIAufgabenliste = (targetCustomer: any = currentCustomer) => {
    if (!targetCustomer) return;
    setIsGeneratingKI(true);
    setTimeout(async () => {
      const items = parsedInventory.items;
      let tasks = [];
      tasks.push("- Böden im Abholort und Zielort sicher abdecken");

      const hasFragile = items.some(i => i.name.toLowerCase().includes('geschirr') || i.name.toLowerCase().includes('glas') || i.name.toLowerCase().includes('spiegel') || i.name.toLowerCase().includes('bild'));
      if (hasFragile) tasks.push("- Vorsicht bei zerbrechlichen Gegenständen! Ausreichend Luftpolsterfolie und Packdecken mitnehmen.");

      const hasFurniture = items.some(i => i.name.toLowerCase().includes('schrank') || i.name.toLowerCase().includes('bett') || i.name.toLowerCase().includes('tisch'));
      if (hasFurniture) tasks.push("- Werkzeugkoffer für Möbelmontage bereitstellen");

      const hasHeavy = items.some(i => i.name.toLowerCase().includes('klavier') || i.name.toLowerCase().includes('waschmaschine') || i.name.toLowerCase().includes('kühlschrank'));
      if (hasHeavy) tasks.push("- Tragegurte und Sackkarre für Schwerlast einplanen");

      const boxCount = items.filter(i => i.name.toLowerCase().includes('karton')).reduce((acc, i) => acc + i.count, 0);
      if (boxCount > 0) tasks.push(`- Mindestens ${boxCount} Umzugskartons verladen`);

      tasks.push("- Nach dem Entladen LKW fegen und Packmaterial zusammenräumen");

      const generated = tasks.join('\n');
      setKiAufgabenliste(generated);
      setIsGeneratingKI(false);

      try {
        await updateCustomer(targetCustomer.id, { kiAufgabenliste: generated });
      } catch (err) {
        console.error('Failed to save KI-Aufgabenliste', err);
      }
    }, 1000);
  };

  const calcVolume = parsedInventory.totalM3 > 0 ? parsedInventory.totalM3 : 12.5;
  const recommendedVehicle = calcVolume > 35 ? 'LKW 12t' : calcVolume > 18 ? 'LKW 7.5t' : 'Sprinter 3.5t';
  const calculatedHours = Math.max(4, Math.ceil(calcVolume * 0.4));

  const filteredCustomersList = customers.filter(c =>
    String(c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.address?.city && c.address.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.abholadresse?.strasse && c.abholadresse.strasse.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleWorker = (workerName: string) => {
    if (selectedWorkers.includes(workerName)) {
      setSelectedWorkers(prev => prev.filter(w => w !== workerName));
    } else {
      setSelectedWorkers(prev => [...prev, workerName]);
    }
  };

  const handleDownloadPDF = () => {
    if (!currentCustomer) return;

    const itemsList: { name: string; count: string; montage?: boolean }[] = parsedInventory.items.map(i => ({
      name: i.name,
      count: String(i.count),
      montage: currentCustomer.nebenleistungen?.moebelmontage || false
    }));

    if (itemsList.length === 0) {
      itemsList.push({ name: 'Umzugsgut Pauschale', count: '1' });
    }

    const allWorkers = selectedDriver ? [selectedDriver, ...selectedWorkers.filter(w => w !== selectedDriver)] : selectedWorkers;
    const docNum = 'LS-' + (currentCustomer.id ? String(currentCustomer.id).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() : '001');

    const rawTermin = formatDateSafe(currentCustomer.umzugsdetails?.gewuenschterUmzugstermin);
    const rawCreated = formatDateSafe(currentCustomer.createdAt);
    const scheduledDate = rawTermin !== '—' ? rawTermin : (rawCreated !== '—' ? rawCreated : new Date().toISOString().split('T')[0]);

    const jobObj: Job = {
      id: `JOB-${currentCustomer.id}`,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      status: lieferscheinStatus,
      scheduledAt: scheduledDate,
      createdAt: rawCreated !== '—' ? rawCreated : new Date().toISOString(),
      totalM3: calcVolume,
      vehicles: [recommendedVehicle],
      calculatedHours: calculatedHours,
      allocations: [{ id: `alloc_${Date.now()}`, date: scheduledDate, driver: selectedDriver, workers: selectedWorkers }],
      abholadresse: currentCustomer.abholadresse,
      zieladresse: currentCustomer.zieladresse,
      notes: customNotes || currentCustomer.anmerkungen || ''
    };

    generateLieferscheinPDF(
      currentCustomer,
      jobObj,
      itemsList,
      allWorkers.length > 0 ? allWorkers : ['Fahrer / Träger'],
      (customNotes || currentCustomer.anmerkungen || '') + (kiAufgabenliste ? `\n\nKI-Aufgabenliste:\n${kiAufgabenliste}` : ''),
      logoBase64,
      'save',
      docNum,
      calcVolume,
      startTime,
      endTime,
      undefined,
      undefined,
      {
        gesamtgewicht,
        fahrzeuge,
        fahrer,
        monteure,
        moebeltraeger,
        verpacker
      }
    );

    if (globalOnAddDocument) {
      globalOnAddDocument({
        id: `doc_${Date.now()}`,
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        type: 'Lieferschein',
        docNumber: docNum,
        date: new Date().toISOString()
      });
    }
  };

  const handleSaveLieferschein = () => {
    if (!currentCustomer) return;
    window.dispatchEvent(new CustomEvent('toast_notification', { detail: { type: 'success', message: `Lieferschein & Dienstplan für Kunde "${currentCustomer.name}" wurde erfolgreich verarbeitet und freigegeben!` } }));
  };

  return (
    <div id="disposition-tab-container" className="min-h-[800px] md:h-full flex flex-col md:flex-row space-y-4 md:space-y-0 overflow-hidden relative">

      {/* Customers Selector Panel (Left) */}
      <div 
        className={`w-full bg-white border border-slate-200 rounded-xl shadow-sm flex-col h-full overflow-hidden shrink-0 ${currentCustomer ? "hidden md:flex" : "flex"}`}
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${leftPanelWidth}%` : '100%' }}
      >
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Kunden für Lieferschein</span>
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {filteredCustomersList.length} Kunden
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Kunde suchen..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredCustomersList.map((customer) => {
            const isSelected = currentCustomer?.id === customer.id;
            const custVolume = Object.entries(customer.gegenstaende || {}).reduce((acc, [_, v]) => acc + (Number(v) || 0) * 0.5, 0);
            const rawTermin = formatDateSafe(customer.umzugsdetails?.gewuenschterUmzugstermin);
            const rawCreated = formatDateSafe(customer.createdAt);
            const dateStr = rawTermin !== '—' ? rawTermin : (rawCreated !== '—' ? rawCreated : 'Ohne Datum');

            return (
              <button
                key={customer.id}
                onClick={() => onSelectCustomer && onSelectCustomer(customer)}
                className={`w-full p-4 text-left space-y-2 hover:bg-slate-50 transition-all ${
                  isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-800">{customer.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isSelected ? 'Ausgewählt' : 'Lieferschein bereit'}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dateStr}</span>
                  </span>
                  <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {Math.round(custVolume || 12.5)} m³
                  </span>
                </div>

                {customer.abholadresse?.strasse && (
                  <p className="text-[11px] text-slate-400 truncate flex items-center space-x-1">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                    <span>{customer.abholadresse.strasse}</span>
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resizer */}
      <div
        className="hidden md:flex w-2 cursor-col-resize hover:bg-slate-300 active:bg-slate-400 shrink-0 z-10 mx-[-4px] relative"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = leftPanelWidth;
          const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const containerWidth = document.getElementById('disposition-tab-container')?.clientWidth || 1000;
            const deltaPercent = (deltaX / containerWidth) * 100;
            setLeftPanelWidth(Math.max(20, Math.min(80, startWidth + deltaPercent)));
          };
          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }}
      />

      {/* Lieferschein Processing Panel (Right) */}
      <div className={`flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden ${!currentCustomer ? 'hidden md:flex' : 'flex'}`}>
        {currentCustomer ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">

            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start bg-slate-50/50 gap-4 md:gap-0 shrink-0">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTimeout(() => onSelectCustomer && onSelectCustomer(null as any), 150);
                }}
                className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-800 self-start"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onSelectCustomer && onSelectCustomer(null as any)}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right rotate-180"><path d="m9 18 6-6-6-6"/></svg>
                </button>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                  <span className="bg-indigo-600 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                    Kunden-Lieferschein
                  </span>
                  <h3 className="font-bold text-lg text-slate-800">{currentCustomer.name}</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Umzugstermin: <strong>{formatDateSafe(currentCustomer.umzugsdetails?.gewuenschterUmzugstermin) !== '—' ? formatDateSafe(currentCustomer.umzugsdetails?.gewuenschterUmzugstermin) : (formatDateSafe(currentCustomer.createdAt) !== '—' ? formatDateSafe(currentCustomer.createdAt) : 'Heute')}</strong> • Kundennr: <span className="font-mono">{currentCustomer.id}</span>
                </p>
              </div>
              </div>
              {/* Status Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Lieferschein PDF</span>
                </button>
                <select
                  value={lieferscheinStatus || ''}
                  onChange={(e) => setLieferscheinStatus(e.target.value as any)}
                  className="border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 bg-white"
                >
                  <option value="draft">Entwurf</option>
                  <option value="scheduled">Freigegeben (Eingeteilt)</option>
                  <option value="done">Abgeschlossen</option>
                </select>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Fleet & Volume recommendation */}
              <div className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/10 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Flotten & Volumen Kalkulation</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Berechnetes Ladevolumen: <strong className="text-indigo-900">{calcVolume} m³</strong> | Vorgesehen: <strong className="text-slate-900">{recommendedVehicle}</strong> | Ca. <strong>{calculatedHours} Std.</strong> Einsatzzeit
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-indigo-600/20 text-indigo-950 px-3 py-1 rounded-full border border-indigo-500/30">
                  {parsedInventory.items.length} Positionen geladen
                </span>
              </div>

              {/* Addresses Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase">
                    <MapPin className="w-4 h-4" />
                    <span>Abholadresse</span>
                  </div>
                  <p className="font-bold text-sm text-slate-800">{currentCustomer.abholadresse?.strasse ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentCustomer.abholadresse.strasse)}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-600">{currentCustomer.abholadresse.strasse}</a> : 'Keine Angabe'}</p>
                  <div className="text-xs text-slate-500 space-y-0.5 font-medium">
                    <p>Stockwerk: {currentCustomer.abholadresse?.stockwerk || 'EG'}</p>
                    <p>Aufzug: {currentCustomer.abholadresse?.aufzug || 'Nein'}</p>
                    <p>LKW Entfernung: {currentCustomer.abholadresse?.entfernungLKW || '0 m'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase">
                    <MapPin className="w-4 h-4" />
                    <span>Zieladresse</span>
                  </div>
                  <p className="font-bold text-sm text-slate-800">{currentCustomer.zieladresse?.strasse ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentCustomer.zieladresse.strasse)}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">{currentCustomer.zieladresse.strasse}</a> : 'Keine Angabe'}</p>
                  <div className="text-xs text-slate-500 space-y-0.5 font-medium">
                    <p>Stockwerk: {currentCustomer.zieladresse?.stockwerk || 'EG'}</p>
                    <p>Aufzug: {currentCustomer.zieladresse?.aufzug || 'Nein'}</p>
                    <p>LKW Entfernung: {currentCustomer.zieladresse?.entfernungLKW || '0 m'}</p>
                  </div>
                </div>
              </div>

              {/* Items Inventory Summary */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Geladenes Möbel-Inventar ({currentCustomer.name})</h4>
                  <span className="text-xs text-slate-400">Summe: {calcVolume} m³</span>
                </div>
                {parsedInventory.items.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {parsedInventory.items.map((item) => (
                      <div key={item.key} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-700 truncate">{item.name}</span>
                        <span className="font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded text-[11px] shrink-0 ml-2">
                          {item.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    Pauschales Umzugsgut (Keine Einzelmöbel aufgelistet)
                  </p>
                )}
              </div>

              {/* Times & Notes */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Einsatz Start</label>
                  <input
                    type="time"
                    value={startTime || ''}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Einsatz Ende</label>
                  <input
                    type="time"
                    value={endTime || ''}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Montage Service</label>
                  <div className="p-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50 text-slate-700">
                    {currentCustomer.nebenleistungen?.moebelmontage ? 'Ja (Montage enthalten)' : 'Nein'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Wichtige Anmerkungen & Hinweise für das Team</label>
                <textarea
                  rows={2}
                  value={customNotes || ''}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Zusätzliche Anweisungen für Fahrer und Träger..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Crew & Personnel Assignment */}
              <div className="grid grid-cols-2 gap-6 pt-2">

                {/* Driver assignment */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-400 uppercase">Fahrer (LKW-Lizenz vorausgesetzt)</h4>
                  <div className="space-y-2">
                    {employees.map((emp) => {
                      const hasLkwLicense = emp.licenses.includes('LKW');
                      const isSelected = selectedDriver === emp.name;

                      return (
                        <button
                          key={emp.id}
                          disabled={!hasLkwLicense}
                          onClick={() => setSelectedDriver(emp.name)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                            isSelected ? 'bg-indigo-600/10 border-indigo-500 text-indigo-950 font-bold' :
                            hasLkwLicense ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' :
                            'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt={emp.name} className="w-7 h-7 rounded-full" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <span className="text-slate-700 font-bold text-[10px]">
                                  {emp.name ? emp.name.charAt(0).toUpperCase() : 'M'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-bold">{emp.name}</p>
                              <p className="text-[10px] text-slate-400">{emp.role}</p>
                            </div>
                          </div>
                          {hasLkwLicense && <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">LKW</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Workers assignment */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-400 uppercase">Träger & Monteure</h4>
                  <div className="space-y-2">
                    {employees.map((emp) => {
                      const isSelected = selectedWorkers.includes(emp.name);

                      return (
                        <button
                          key={emp.id}
                          onClick={() => handleToggleWorker(emp.name)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                            isSelected ? 'bg-green-500/10 border-green-500 text-green-950 font-bold' :
                            'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt={emp.name} className="w-7 h-7 rounded-full" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <span className="text-slate-700 font-bold text-[10px]">
                                  {emp.name ? emp.name.charAt(0).toUpperCase() : 'M'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-bold">{emp.name}</p>
                              <p className="text-[10px] text-slate-400">{emp.employmentType}</p>
                            </div>
                          </div>
                          {emp.skills.includes('Monteur') && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold">Monteur</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">Zusatzinformationen Lieferschein</h4>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Gesamtgewicht</label>
                    <input type="text" value={gesamtgewicht || ''} onChange={(e) => setGesamtgewicht(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-indigo-500" placeholder="z.B. 1200 kg" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Fahrzeug(e) aus Fuhrpark</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setFahrzeuge(prev => prev ? `${prev}, ${e.target.value}` : e.target.value);
                        }
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium focus:outline-indigo-500 mb-1.5"
                    >
                      <option value="">-- Fahrzeug auswählen --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={`${v.name} (${v.licensePlate})`}>
                          {v.name} ({v.licensePlate})
                        </option>
                      ))}
                    </select>
                    <input type="text" value={fahrzeuge || ''} onChange={(e) => setFahrzeuge(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-indigo-500" placeholder="z.B. LKW W-12345" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Fahrer</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setFahrer(prev => prev ? `${prev}, ${e.target.value}` : e.target.value);
                        }
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium focus:outline-indigo-500 mb-1.5"
                    >
                      <option value="">-- Fahrer wählen --</option>
                      {teamEmployees.map(e => (
                        <option key={e.id} value={e.name}>{e.name} ({e.role})</option>
                      ))}
                    </select>
                    <input type="text" value={fahrer || ''} onChange={(e) => setFahrer(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Monteure</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setMonteure(prev => prev ? `${prev}, ${e.target.value}` : e.target.value);
                        }
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium focus:outline-indigo-500 mb-1.5"
                    >
                      <option value="">-- Monteur wählen --</option>
                      {teamEmployees.map(e => (
                        <option key={e.id} value={e.name}>{e.name} ({e.role})</option>
                      ))}
                    </select>
                    <input type="text" value={monteure || ''} onChange={(e) => setMonteure(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Möbelträger</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setMoebeltraeger(prev => prev ? `${prev}, ${e.target.value}` : e.target.value);
                        }
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium focus:outline-indigo-500 mb-1.5"
                    >
                      <option value="">-- Möbelträger wählen --</option>
                      {teamEmployees.map(e => (
                        <option key={e.id} value={e.name}>{e.name} ({e.role})</option>
                      ))}
                    </select>
                    <input type="text" value={moebeltraeger || ''} onChange={(e) => setMoebeltraeger(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Verpacker</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setVerpacker(prev => prev ? `${prev}, ${e.target.value}` : e.target.value);
                        }
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium focus:outline-indigo-500 mb-1.5"
                    >
                      <option value="">-- Verpacker wählen --</option>
                      {teamEmployees.map(e => (
                        <option key={e.id} value={e.name}>{e.name} ({e.role})</option>
                      ))}
                    </select>
                    <input type="text" value={verpacker || ''} onChange={(e) => setVerpacker(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-indigo-500" />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-600">Automatische Packliste (KI-Aufgabenliste)</label>
                    <button
                      onClick={() => generateKIAufgabenliste(currentCustomer)}
                      disabled={isGeneratingKI}
                      className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded hover:bg-indigo-200 flex items-center space-x-1"
                    >
                      {isGeneratingKI ? 'Generiere...' : 'KI-Aufgabenliste erstellen'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={kiAufgabenliste || ''}
                    onChange={(e) => setKiAufgabenliste(e.target.value)}
                    onBlur={() => {
                      if (currentCustomer && currentCustomer.kiAufgabenliste !== kiAufgabenliste) {
                        updateCustomer(currentCustomer.id, { kiAufgabenliste }).catch(err => console.error(err));
                      }
                    }}
                    placeholder="Wird automatisch anhand des Möbel-Inventars erstellt..."
                    className="w-full p-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveLieferschein}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3.5 rounded-lg text-xs shadow transition-colors flex items-center justify-center space-x-2"
              >
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Lieferschein für {currentCustomer.name} verarbeiten & freigeben</span>
              </button>

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
            <Users className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Kein Kunde ausgewählt</p>
            <p className="text-xs text-slate-400 mt-1">Wählen Sie einen Kunden links aus, um dessen Lieferschein-Daten zu importieren.</p>
          </div>
        )}
      </div>

    </div>
  );
}

// -----------------------------------------------------------------
// TAB 4: FINANZEN & INVOICES
// -----------------------------------------------------------------
function FinanzenTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'INV-2025-001',
      jobId: 'job_imported_2',
      customerName: 'Anita Wahlmüller',
      netTotal: 1450,
      vatRate: 0.2,
      total: 1740,
      status: 'sent',
      issuedAt: '12.06.2025',
      paidAt: null,
      items: [
        { id: '1', description: 'Umzugsservice Pauschale Anita Wahlmüller', quantity: 1, unitPrice: 1330, total: 1330 },
        { id: '2', description: 'Behördliche Halteverbotszone Innsbruck', quantity: 1, unitPrice: 120, total: 120 }
      ],
      customer: {
        id: 'cus_imported_2',
        name: 'Anita Wahlmüller',
        email: 'anita.wahlmueller@gmx.at',
        phone: '06509148281',
        address: { street: 'Col di Lana Straße 21/8', city: 'Innsbruck', zip: '6020', country: 'Österreich' },
        nameLower: 'anita wahlmüller',
        createdAt: '',
        avatarUrl: ''
      }
    },
    {
      id: 'INV-2025-002',
      jobId: 'job_imported_3',
      customerName: 'Zekirija Sejdini',
      netTotal: 2850,
      vatRate: 0.2,
      total: 3420,
      status: 'paid',
      issuedAt: '04.06.2025',
      paidAt: '05.06.2025',
      items: [
        { id: '1', description: 'Fernumzug Innsbruck -> Wien Spezial', quantity: 1, unitPrice: 2850, total: 2850 }
      ],
      customer: {
        id: 'cus_imported_3',
        name: 'Zekirija Sejdini',
        email: 'sejdini.z@wien.at',
        phone: '676872543290',
        address: { street: 'Schlachthammerstraße 40', city: 'Wien', zip: '1220', country: 'Österreich' },
        nameLower: 'zekirija sejdini',
        createdAt: '',
        avatarUrl: ''
      }
    }
  ]);

  const [activeInv, setActiveInv] = useState<Invoice | null>(invoices[0]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);

  // Generate real EPC QR Code for invoice
  useEffect(() => {
    if (!activeInv) return;

    // Format SEPA EPC text:
    // BCD\n001\n1\nSCT\nBIC\nName\nIBAN\nEURAmount\nRef
    const amountStr = `EUR${activeInv.total.toFixed(2)}`;
    const epcText = `BCD\n002\n1\nSCT\n${companyData.bic}\n${companyData.legalName}\n${companyData.iban}\n${amountStr}\n\nRechnung ${activeInv.id}`;

    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(epcText, (err: any, url: string) => {
        if (!err) setQrCodeUrl(url);
      });
    });
  }, [activeInv]);

  const handleUpdateStatus = (invId: string, status: Invoice['status']) => {
    setInvoices(prev => prev.map(i => i.id === invId ? { ...i, status, paidAt: status === 'paid' ? new Date().toLocaleDateString('de-DE') : null } : i));
    if (activeInv?.id === invId) {
      setActiveInv(prev => prev ? { ...prev, status, paidAt: status === 'paid' ? new Date().toLocaleDateString('de-DE') : null } : null);
    }
  };

  const handleStornoRechnung = (inv: Invoice) => {
    handleUpdateStatus(inv.id, 'storno');
    const isAnzahlung = inv.id.toLowerCase().includes('anzahl') || inv.id.startsWith('AR-') || inv.items.some(i => i.description.toLowerCase().includes('anzahlung'));
    const stornoItems = inv.items.length > 0 ? inv.items.map(item => ({
      ...item,
      unitPrice: -Math.abs(item.unitPrice),
      total: -Math.abs(item.total)
    })) : [
      {
        id: 'storno_1',
        description: `Storno zu Beleg ${inv.id}`,
        quantity: 1,
        unitPrice: -Math.abs(inv.total),
        total: -Math.abs(inv.total)
      }
    ];

    if (isAnzahlung) {
      if (globalOnTriggerStornoAnzahlungsrechnung) {
        globalOnTriggerStornoAnzahlungsrechnung(inv.customer, stornoItems, 0);
      } else {
        generateStornoAnzahlungsrechnungPDF(
          inv.customer,
          stornoItems,
          null,
          'download',
          'SAR-' + inv.id,
          0,
          inv.customer.umzugsdetails?.gewuenschterUmzugstermin
        );
      }
    } else {
      if (globalOnTriggerStornoRechnung) {
        globalOnTriggerStornoRechnung(inv.customer, stornoItems, 0);
      } else {
        generateStornoInvoicePDF(
          inv.customer,
          stornoItems,
          null,
          'download',
          'SR-' + inv.id,
          0,
          inv.customer.umzugsdetails?.gewuenschterUmzugstermin
        );
      }
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 overflow-hidden">

      {/* Invoices List */}
      <div className={`w-full md:w-1/3 bg-white border border-slate-200 rounded-xl shadow-sm flex-col h-full overflow-hidden ${activeInv ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-sm text-slate-800">Debitorenbelege & Rechnungen</h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {invoices.map((inv) => {
            const isActive = activeInv?.id === inv.id;
            return (
              <button
                key={inv.id}
                onClick={() => setActiveInv(inv)}
                className={`w-full p-4 text-left space-y-2 hover:bg-slate-50 transition-all ${
                  isActive ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-800">{inv.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                    inv.status === 'sent' ? 'bg-orange-100 text-orange-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {inv.status === 'paid' ? 'Bezahlt' :
                     inv.status === 'sent' ? 'Übermittelt' : 'Entwurf'}
                  </span>
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-xs text-slate-500">{inv.customerName}</span>
                  <span className="text-sm font-extrabold text-slate-800">{inv.total.toFixed(2)} €</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Invoice interactive preview (Right) */}
      <div className={`flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex-col h-full overflow-hidden ${!activeInv ? "hidden md:flex" : "flex"}`}>
        {activeInv ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">

            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start bg-slate-50/50 gap-4 md:gap-0 shrink-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveInv(null)}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right rotate-180"><path d="m9 18 6-6-6-6"/></svg>
                </button>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-slate-800">Beleg-Details: {activeInv.id}</h3>
                <p className="text-xs text-slate-500">Ausstellungsdatum: {activeInv.issuedAt} {activeInv.paidAt ? `| Bezahlt am: ${activeInv.paidAt}` : ''}</p>
              </div>

              </div><div className="flex flex-wrap items-center gap-2"><button onClick={() => handleStornoRechnung(activeInv)}
                  className="flex items-center space-x-1.5 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Storno Rechnung</span>
                </button>

                <button
                  onClick={() => setDeleteInvoiceId(activeInv.id)}
                  className="flex items-center space-x-1.5 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Löschen</span>
                </button>

                <select
                  value={activeInv.status || ''}
                  onChange={(e) => handleUpdateStatus(activeInv.id, e.target.value as any)}
                  className="border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700"
                >
                  <option value="draft">Entwurf</option>
                  <option value="sent">Senden (Offen)</option>
                  <option value="paid">Zahlung buchen</option>
                  <option value="storno">Stornieren</option>
                </select>
              </div>
            </div>

            {/* Invoicing document visualization */}
            <div className="flex-1 overflow-y-auto p-8 flex space-x-8">

              {/* Virtual PDF Sheet */}
              <div className="flex-1 border border-slate-200 shadow-lg rounded-xl p-8 bg-white max-w-xl text-xs space-y-6 self-start">
                <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center p-0.5 shrink-0">
                      <img src={logo2} alt="Spedition Hueber" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <div className="space-y-0.5">
                      <h1 className="font-black text-sm tracking-wider uppercase text-indigo-500">Spedition Hueber</h1>
                      <p className="text-[10px] text-slate-400">{companyData.legalName}</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400">
                    <p>{companyData.street}</p>
                    <p>{companyData.zip} {companyData.city}</p>
                  </div>
                </div>

                {/* Recipient */}
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rechnungsempfänger</p>
                  <p className="font-bold text-slate-800 text-sm">{activeInv.customerName}</p>
                  <p className="text-slate-500">{activeInv.customer.address?.street || 'Innrain 93'}</p>
                  <p className="text-slate-500">{activeInv.customer.address?.zip || '6020'} {activeInv.customer.address?.city || 'Innsbruck'}</p>
                </div>

                {/* Table */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider text-left">
                      <th className="py-2">Pos.</th>
                      <th className="py-2">Beschreibung</th>
                      <th className="py-2 text-right">Menge</th>
                      <th className="py-2 text-right">E-Preis</th>
                      <th className="py-2 text-right">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {activeInv.items.map((item, idx) => (
                      <tr key={item.id} className="text-slate-700">
                        <td className="py-2">{idx + 1}</td>
                        <td className="py-2 font-medium">{item.description}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">{item.unitPrice.toFixed(2)} €</td>
                        <td className="py-2 text-right font-semibold">{item.total.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Aggregation */}
                <div className="border-t border-slate-200 pt-4 flex flex-col items-end space-y-1.5">
                  <div className="flex justify-between w-1/2 text-slate-500">
                    <span>Nettosumme:</span>
                    <span>{activeInv.netTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between w-1/2 text-slate-500">
                    <span>20% USt.:</span>
                    <span>{(activeInv.netTotal * 0.2).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between w-1/2 font-bold text-slate-800 text-sm border-t border-slate-100 pt-2">
                    <span>Gesamtsumme:</span>
                    <span>{activeInv.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* EPC Sepa payment QR Code section */}
              <div className="w-64 space-y-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-3">
                  <h4 className="font-bold text-xs text-slate-700">QR-Rechnung (EPC)</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Österreichische Banking-Apps scannen diesen QR-Code zur sofortigen, fehlerfreien SEPA Überweisung.</p>

                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="EPC QR Code" className="w-40 h-40 mx-auto border-2 border-white rounded shadow-sm" />
                  ) : (
                    <div className="w-40 h-40 bg-slate-200 animate-pulse mx-auto rounded" />
                  )}

                  <div className="text-[10px] text-slate-400 font-mono text-left pt-2 border-t border-slate-200">
                    <p className="truncate">IBAN: {companyData.iban}</p>
                    <p>BIC: {companyData.bic}</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
            <p className="text-sm font-semibold">Keine Rechnung ausgewählt</p>
          </div>
        )}
      </div>

      <GlobalDeleteDialog
        isOpen={!!deleteInvoiceId}
        onClose={() => setDeleteInvoiceId(null)}
        onConfirm={() => { if(deleteInvoiceId) { setInvoices(prev => prev.filter(i => i.id !== deleteInvoiceId)); setDeleteInvoiceId(null); } }}
        title="Rechnung löschen"
        description="Möchten Sie diese Rechnung wirklich endgültig löschen?"
      />
    </div>
  );
}

// -----------------------------------------------------------------
// TAB 5: MITARBEITER & FUHRPARK (BELEGSSCHAFT UND FAHRZEUGE)
// -----------------------------------------------------------------
function MitarbeiterTab() {
  const { employees: teamList, addEmployee, updateEmployee, deleteEmployee } = useEmployee();
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useVehicle();

  // Employee state
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [deletingEmpId, setDeletingEmpId] = useState<string | null>(null);

  // Form fields for employee
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('Arbeiter');
  const [customRole, setCustomRole] = useState('');
  const [empWage, setEmpWage] = useState(22.0);
  const [empType, setEmpType] = useState<'Vollzeit' | 'Teilzeit' | 'Geringfügig'>('Vollzeit');
  const [empHours, setEmpHours] = useState(160);

  // Vehicle state
  const [showAddVeh, setShowAddVeh] = useState(false);
  const [editingVeh, setEditingVeh] = useState<Vehicle | null>(null);
  const [deletingVehId, setDeletingVehId] = useState<string | null>(null);

  // Form fields for vehicle
  const [vehName, setVehName] = useState('');
  const [vehPlate, setVehPlate] = useState('');
  const [vehType, setVehType] = useState('3,5t LKW');
  const [vehCap, setVehCap] = useState(35);
  const [vehNotes, setVehNotes] = useState('');

  // Handlers for Employee
  const handleOpenAddEmp = () => {
    setEmpName('');
    setEmpRole('Arbeiter');
    setCustomRole('');
    setEmpWage(22.0);
    setEmpType('Vollzeit');
    setEmpHours(160);
    setShowAddEmp(true);
  };

  const handleOpenEditEmp = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpName(emp.name);
    if (allRoles.includes(emp.role)) {
      setEmpRole(emp.role);
      setCustomRole('');
    } else {
      setEmpRole('Sonstige');
      setCustomRole(emp.role);
    }
    setEmpWage(emp.hourlyWage || 22.0);
    setEmpType(emp.employmentType || 'Vollzeit');
    setEmpHours(emp.contractedHours || 160);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) return;
    const finalRole = empRole === 'Sonstige' ? (customRole.trim() || 'Mitarbeiter') : empRole;

    if (editingEmp) {
      updateEmployee(editingEmp.id, {
        name: empName,
        role: finalRole,
        hourlyWage: Number(empWage),
        employmentType: empType,
        contractedHours: Number(empHours)
      });
      setEditingEmp(null);
    } else {
      const newEmp: Employee = {
        id: `emp_${Date.now()}`,
        name: empName,
        email: `${empName.toLowerCase().replace(/\s+/g, '.')}@worker.hueber.com`,
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/40/40`,
        licenses: ['Auto'],
        employmentType: empType,
        hourlyWage: Number(empWage),
        contractedHours: Number(empHours),
        role: finalRole,
        skills: ['Kundenumgang', 'Möbeltransport']
      };
      addEmployee(newEmp);
      setShowAddEmp(false);
    }
  };

  // Handlers for Vehicle
  const handleOpenAddVeh = () => {
    setVehName('');
    setVehPlate('');
    setVehType('3,5t LKW');
    setVehCap(35);
    setVehNotes('');
    setShowAddVeh(true);
  };

  const handleOpenEditVeh = (veh: Vehicle) => {
    setEditingVeh(veh);
    setVehName(veh.name);
    setVehPlate(veh.licensePlate);
    setVehType(veh.type);
    setVehCap(veh.capacityM3 || 0);
    setVehNotes(veh.notes || '');
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehName.trim() || !vehPlate.trim()) return;

    if (editingVeh) {
      updateVehicle(editingVeh.id, {
        name: vehName,
        licensePlate: vehPlate,
        type: vehType,
        capacityM3: Number(vehCap),
        notes: vehNotes
      });
      setEditingVeh(null);
    } else {
      const newVeh: Vehicle = {
        id: `veh_${Date.now()}`,
        name: vehName,
        licensePlate: vehPlate,
        type: vehType,
        capacityM3: Number(vehCap),
        notes: vehNotes
      };
      addVehicle(newVeh);
      setShowAddVeh(false);
    }
  };

  return (
    <div className="space-y-10 h-full overflow-y-auto pb-12">
      {/* SECTION 1: MITARBEITER */}
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <Contact className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="font-bold text-lg text-slate-800">Spedition Hueber Stammbelegschaft</h2>
              <p className="text-xs text-slate-500">Mitarbeiter verwalten, Rollen im Betrieb anpassen & Lohnstufen definieren</p>
            </div>
          </div>

          <button
            onClick={handleOpenAddEmp}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Mitarbeiter eintragen</span>
          </button>
        </div>

        {/* Grid of employees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {teamList.map((emp) => (
            <div key={emp.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative group">
              <div className="space-y-3 text-center">
                <div className="relative inline-block mx-auto">
                  {emp.avatarUrl ? (
                    <img src={emp.avatarUrl} alt={emp.name} className="w-16 h-16 rounded-full mx-auto border-2 border-indigo-500/20 object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-indigo-500/10 flex items-center justify-center mx-auto shadow-xs">
                      <span className="text-indigo-700 font-bold text-xl">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : 'M'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-base text-slate-800">{emp.name}</h3>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 rounded-md px-2.5 py-0.5 inline-block uppercase tracking-wider">
                      {emp.role}
                    </span>
                    <button
                      onClick={() => handleOpenEditEmp(emp)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Rolle / Daten anpassen"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 border-t border-b border-slate-100 py-3 space-y-1.5 text-left bg-slate-50/50 rounded-lg px-3">
                  <p className="flex justify-between"><span className="text-slate-400">Typ:</span> <strong className="text-slate-700">{emp.employmentType}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-400">Stundensatz:</span> <strong className="text-slate-800">{emp.hourlyWage?.toFixed(2)} € / h</strong></p>
                  <p className="flex justify-between"><span className="text-slate-400">Sollstunden:</span> <strong className="text-slate-700">{emp.contractedHours} Std./Monat</strong></p>
                  <p className="flex justify-between"><span className="text-slate-400">Lizenzen:</span> <strong className="text-slate-700">{emp.licenses?.join(', ') || 'Auto'}</strong></p>
                </div>

                <div className="flex flex-wrap gap-1 justify-center">
                  {emp.skills?.map((s, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons on card */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEditEmp(emp)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Bearbeiten</span>
                </button>
                <button
                  onClick={() => setDeletingEmpId(emp.id)}
                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  title="Mitarbeiter löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: FUHRPARK & FAHRZEUGE */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            <div>
              <h2 className="font-bold text-lg text-slate-800">Fuhrpark & Fahrzeuge</h2>
              <p className="text-xs text-slate-500">Registrierte LKW, Transporter & Außenaufzüge für die Lieferschein-Auswahl</p>
            </div>
          </div>

          <button
            onClick={handleOpenAddVeh}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Fahrzeug eintragen</span>
          </button>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {vehicles.map((veh) => (
            <div key={veh.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 text-slate-800 px-2 py-1 rounded-md">
                    {veh.licensePlate}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-800">{veh.name}</h3>
                  <p className="text-xs font-semibold text-emerald-700">{veh.type}</p>
                </div>

                {veh.capacityM3 ? (
                  <p className="text-xs text-slate-600">
                    <span className="font-bold text-slate-700">Ladevolumen:</span> {veh.capacityM3} m³
                  </p>
                ) : null}

                {veh.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic">
                    {veh.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEditVeh(veh)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Bearbeiten</span>
                </button>
                <button
                  onClick={() => setDeletingVehId(veh.id)}
                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  title="Fahrzeug löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {(showAddEmp || editingEmp) && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">
                {editingEmp ? 'Mitarbeiter & Rolle bearbeiten' : 'Neuen Mitarbeiter eintragen'}
              </h3>
              <button onClick={() => { setShowAddEmp(false); setEditingEmp(null); }} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Vollständiger Name *</label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  required
                  placeholder="z.B. Dragan Dojkovic"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Rolle im Betrieb</label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-indigo-500 font-medium bg-white"
                >
                  {allRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="Sonstige">Eigene Rolle eingeben...</option>
                </select>
                {empRole === 'Sonstige' && (
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Neue Rolle z.B. Disponent / Möbelpacker"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1.5 focus:outline-indigo-500 font-medium"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Anstellungsverhältnis</label>
                  <select
                    value={empType}
                    onChange={(e) => setEmpType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-indigo-500 font-medium bg-white"
                  >
                    <option value="Vollzeit">Vollzeit</option>
                    <option value="Teilzeit">Teilzeit</option>
                    <option value="Geringfügig">Geringfügig</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Stundenlohn (€/h)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={empWage}
                    onChange={(e) => setEmpWage(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Monatssoll (Stunden)</label>
                <input
                  type="number"
                  value={empHours}
                  onChange={(e) => setEmpHours(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-indigo-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddEmp(false); setEditingEmp(null); }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
                >
                  Speichern
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: ADD / EDIT VEHICLE */}
      {(showAddVeh || editingVeh) && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">
                {editingVeh ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug eintragen'}
              </h3>
              <button onClick={() => { setShowAddVeh(false); setEditingVeh(null); }} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Fahrzeugbezeichnung *</label>
                <input
                  type="text"
                  value={vehName}
                  onChange={(e) => setVehName(e.target.value)}
                  required
                  placeholder="z.B. LKW 3,5t Koffer"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Kennzeichen / Nummernschild *</label>
                <input
                  type="text"
                  value={vehPlate}
                  onChange={(e) => setVehPlate(e.target.value)}
                  required
                  placeholder="z.B. W-74219 A"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-emerald-500 font-medium uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Fahrzeugtyp</label>
                  <select
                    value={vehType}
                    onChange={(e) => setVehType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-emerald-500 font-medium bg-white"
                  >
                    <option value="3,5t LKW">3,5t LKW</option>
                    <option value="7,5t LKW">7,5t LKW</option>
                    <option value="Transporter">Transporter / Sprinter</option>
                    <option value="Außenaufzug">Möbellift / Außenaufzug</option>
                    <option value="Anhänger">Anhänger</option>
                    <option value="PKW / Bussi">PKW / Bussi</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ladevolumen (m³)</label>
                  <input
                    type="number"
                    value={vehCap}
                    onChange={(e) => setVehCap(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ausrüstung / Notizen</label>
                <input
                  type="text"
                  value={vehNotes}
                  onChange={(e) => setVehNotes(e.target.value)}
                  placeholder="z.B. Inkl. Ladebordwand & 50 Möbeldecken"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-emerald-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddVeh(false); setEditingVeh(null); }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20"
                >
                  Fahrzeug Speichern
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: DELETE EMPLOYEE */}
      {deletingEmpId && (
        <GlobalDeleteDialog
          isOpen={!!deletingEmpId}
          title="Mitarbeiter löschen?"
          description="Möchtest du diesen Mitarbeiter wirklich aus der Belegschaft entfernen?"
          onConfirm={() => {
            deleteEmployee(deletingEmpId);
            setDeletingEmpId(null);
          }}
          onClose={() => setDeletingEmpId(null)}
        />
      )}

      {/* CONFIRMATION DIALOG: DELETE VEHICLE */}
      {deletingVehId && (
        <GlobalDeleteDialog
          isOpen={!!deletingVehId}
          title="Fahrzeug aus Fuhrpark löschen?"
          description="Möchtest du dieses Fahrzeug wirklich aus dem Fuhrpark entfernen?"
          onConfirm={() => {
            deleteVehicle(deletingVehId);
            setDeletingVehId(null);
          }}
          onClose={() => setDeletingVehId(null)}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// TAB 6: AI WORKSPACE & GOOGLE DRIVE
// -----------------------------------------------------------------
function WorkspaceTab({ onExitMobileAIMode }: { onExitMobileAIMode?: () => void }) {
  return <AIWorkspaceHub onExitMobileAIMode={onExitMobileAIMode} />;
}
