import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Customer, AppDocument } from '@/src/lib/types';
import type { OfferItem } from '@/contexts/offer-context';
import { generateStornoInvoicePDF, generateStornoAnzahlungsrechnungPDF } from '@/src/lib/pdf-generator';
import { documentService } from '@/src/lib/document-service';
import { FileText, Search, Upload, HardDrive, LogOut, Loader2, ExternalLink, RefreshCw, Mail, Trash2, ChevronLeft, X, FileWarning, CheckCircle2, Ban, FilePlus2, ReceiptEuro, ScrollText, AlertTriangle, Copy, Check } from 'lucide-react';
import { GlobalDeleteDialog } from '@/src/components/GlobalDeleteDialog';
import { initAuth, googleSignIn, logout, getAccessToken } from '@/src/lib/auth';
import { getOrCreateCustomerFolder, uploadFileToDrive, listFilesInFolder, deleteDriveFile } from '@/src/lib/drive';
import type { User } from 'firebase/auth';

export function DokumenteTab({
  customers,
  activeCustomer,
  setActiveCustomer,
  documents,
  onDeleteDocument,
  onUpdateDocument,
  onAddDocument,
  onCreateOrientierungsangebot,
  onCreateAnzahlungsrechnung,
  onCreateRechnung,
  onCreateStornoRechnung,
  onCreateStornoAnzahlungsrechnung
}: {
  customers: Customer[],
  activeCustomer: Customer | null,
  setActiveCustomer: (c: Customer) => void,
  documents: AppDocument[],
  onDeleteDocument: (id: string) => void,
  onUpdateDocument?: (document: AppDocument) => void,
  onAddDocument?: (document: AppDocument) => void,
  onCreateOrientierungsangebot?: (customer: Customer) => void,
  onCreateAnzahlungsrechnung?: (customer: Customer) => void,
  onCreateRechnung?: (customer: Customer) => void,
  onCreateStornoRechnung?: (customer: Customer) => void,
  onCreateStornoAnzahlungsrechnung?: (customer: Customer) => void
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'local' | 'drive'>('local');
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncingAttachments, setIsSyncingAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteLocalDocId, setDeleteLocalDocId] = useState<string | null>(null);
  const [deleteDriveFileId, setDeleteDriveFileId] = useState<string | null>(null);
  const [reminderDocument, setReminderDocument] = useState<AppDocument | null>(null);
  const [reminderLevel, setReminderLevel] = useState(1);
  const [reminderDays, setReminderDays] = useState(7);
  const [reminderFeePercent, setReminderFeePercent] = useState(0);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.33);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setToken(token);
        setNeedsAuth(false);
        setAuthError(null);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setAuthError(err?.message || 'Google-Anmeldung fehlgeschlagen.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setDriveFiles([]);
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
  };

  useEffect(() => {
    if (activeCustomer && activeTab === 'drive' && token) {
      loadDriveFiles();
    }
  }, [activeCustomer, activeTab, token]);

  const loadDriveFiles = async () => {
    if (!activeCustomer) return;
    setIsDriveLoading(true);
    try {
      const activeToken = await getAccessToken();
      if (!activeToken) {
        setNeedsAuth(true);
        return;
      }
      if (activeToken !== token) setToken(activeToken);
      const folderId = await getOrCreateCustomerFolder(activeToken, activeCustomer.name);
      const files = await listFilesInFolder(activeToken, folderId);
      setDriveFiles(files);
      setNeedsAuth(false);
    } catch (error: any) {
      console.warn('Error loading drive files:', error);
      const errStr = String(error?.message || error);
      if (errStr.includes('401') || errStr.includes('403') || errStr.includes('Failed') || errStr.includes('invalid_grant')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeCustomer) return;

    setIsUploading(true);
    try {
      const activeToken = await getAccessToken();
      if (!activeToken) throw new Error('Google Drive ist nicht verbunden.');
      if (activeToken !== token) setToken(activeToken);
      const folderId = await getOrCreateCustomerFolder(activeToken, activeCustomer.name);
      
      for (let i = 0; i < files.length; i++) {
        await uploadFileToDrive(activeToken, files[i], folderId);
      }
      
      // Reload files after upload
      await loadDriveFiles();
    } catch (error) {
      console.error('Upload failed:', error);
      setNotification({ type: 'error', message: 'Fehler beim Hochladen der Datei(en).' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSyncAttachments = async () => {
    if (!activeCustomer || !activeCustomer.email) {
      if (!activeCustomer?.email) {
        setNotification({ type: 'warning', message: 'Dieser Kunde hat keine E-Mail-Adresse hinterlegt.' });
      }
      return;
    }

    const msToken = localStorage.getItem('ms_graph_access_token');
    if (!msToken) {
      setNotification({ type: 'warning', message: 'Bitte melden Sie sich zuerst im E-Mail-Tab bei Microsoft an, um Anhänge abzurufen.' });
      return;
    }

    setIsSyncingAttachments(true);
    try {
      const activeToken = await getAccessToken();
      if (!activeToken) throw new Error('Google Drive ist nicht verbunden.');
      if (activeToken !== token) setToken(activeToken);
      // 1. Fetch emails from this customer with attachments
      const mailRes = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$filter=from/emailAddress/address eq '${activeCustomer.email}' and hasAttachments eq true&$expand=attachments&$top=20`, {
        headers: { Authorization: `Bearer ${msToken}` }
      });
      
      if (!mailRes.ok) {
         throw new Error('Fehler beim Abrufen der E-Mails');
      }
      
      const mailData = await mailRes.json();
      let uploadedCount = 0;

      const folderId = await getOrCreateCustomerFolder(activeToken, activeCustomer.name);
      const existingFiles = await listFilesInFolder(activeToken, folderId);
      const existingFileNames = new Set(existingFiles.map(f => f.name));

      for (const msg of mailData.value || []) {
        for (const attachment of msg.attachments || []) {
           // Basic filter to ignore small inline signatures/images if needed
           if (attachment['@odata.type'] === '#microsoft.graph.fileAttachment' && attachment.contentBytes) {
              const fileName = attachment.name;
              // Skip if already in Drive to avoid duplicates
              if (existingFileNames.has(fileName)) continue;

              // Convert base64 to File object
              const byteCharacters = atob(attachment.contentBytes);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                 byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: attachment.contentType });
              const file = new File([blob], fileName, { type: attachment.contentType });

              await uploadFileToDrive(activeToken, file, folderId);
              existingFileNames.add(fileName);
              uploadedCount++;
           }
        }
      }

      if (uploadedCount > 0) {
        setNotification({ type: 'success', message: `Erfolgreich ${uploadedCount} E-Mail-Anhänge in Google Drive gespeichert.` });
        await loadDriveFiles();
      } else {
        setNotification({ type: 'info', message: 'Keine neuen E-Mail-Anhänge für diesen Kunden gefunden.' });
      }

    } catch (err) {
      console.error('Error syncing attachments:', err);
      setNotification({ type: 'error', message: 'Fehler beim Synchronisieren der E-Mail-Anhänge.' });
    } finally {
      setIsSyncingAttachments(false);
    }
  };

  const filteredCustomers = useMemo(() => customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.kundenNummer && c.kundenNummer.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [customers, searchQuery]);

  const documentsByCustomer = useMemo(() => {
    const map: Record<string, AppDocument[]> = {};
    documents.forEach(d => {
      map[d.customerId] = [...(map[d.customerId] || []), d];
    });
    return map;
  }, [documents]);

  const customerDocuments = useMemo(() => activeCustomer 
    ? documents.filter(d => d.customerId === activeCustomer.id) 
    : [], [activeCustomer, documents]);

  return (
    <>
    <div id="dokumente-tab-container" className="h-full flex flex-col md:flex-row space-y-4 md:space-y-0 overflow-hidden relative">
      {/* Customer List Panel (Left Side) */}
      <div 
        className={`w-full bg-white border border-slate-200 rounded-xl shadow-sm flex-col h-full overflow-hidden shrink-0 ${activeCustomer ? "hidden md:flex" : "flex"}`}
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${leftPanelWidth}%` : '100%' }}
      >
        {/* Search header */}
        <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input 
              type="text" 
              placeholder="Kunde suchen..." 
              value={searchQuery || ""}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredCustomers.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">Keine Kunden gefunden</div>
          ) : (
            filteredCustomers.map((customer: Customer) => {
              const isActive = activeCustomer?.id === customer.id;
              const customerDocumentsForRow = documentsByCustomer[customer.id] || [];
              const docCount = customerDocumentsForRow.length;
              return (
                <button
                  key={customer.id}
                  onClick={() => setActiveCustomer(customer)}
                  className={`w-full p-4 text-left flex items-start space-x-3 hover:bg-slate-50 transition-all ${
                    isActive ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-800 flex flex-wrap items-center gap-1.5">
                        <span className="truncate max-w-[120px]" title={customer.name}>{customer.name}</span>
                        {customerDocumentsForRow.map(document => {
                          const abbreviation = document.type === 'Anzahlungsrechnung' ? 'AZ'
                            : document.type === 'Rechnung' ? 'RE'
                              : document.type === 'Lieferschein' ? 'LS'
                                : document.type === 'Orientierungsangebot' || String(document.type) === 'Angebot' ? 'OA'
                                  : document.type === 'Mahnung' ? 'MA'
                                    : document.type === 'Stornorechnung' || document.type === 'Storno-Rechnung' ? 'ST'
                                      : document.type === 'Storno-Anzahlungsrechnung' ? 'SAR'
                                        : '';
                          if (!abbreviation) return null;
                          const statusClass = ['AZ', 'RE'].includes(abbreviation)
                            ? document.status === 'paid'
                              ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                              : document.status === 'overdue' || document.status === 'storno'
                                ? 'border-rose-200 bg-rose-100 text-rose-700'
                                : 'border-amber-200 bg-amber-100 text-amber-700'
                            : ['MA', 'ST'].includes(abbreviation)
                              ? 'border-rose-200 bg-rose-100 text-rose-700'
                              : 'border-blue-200 bg-blue-100 text-blue-700';
                          return <span key={document.id} className={`rounded border px-1 py-0.5 text-[9px] font-black ${statusClass}`}>{abbreviation}</span>;
                        })}
                        {customer.kundenNummer && <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{customer.kundenNummer}</span>}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 truncate block max-w-[150px]">{customer.address?.city || 'Keine Stadt'}</span>
                      {docCount > 0 && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">{docCount} Dok</span>}
                    </div>
                  </div>
                </button>
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
            const containerWidth = document.getElementById('dokumente-tab-container')?.clientWidth || 1000;
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

      {/* Main Panel - Documents (Right Side) */}
      <div className={`flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex-col h-full overflow-hidden ${!activeCustomer ? "hidden md:flex" : "flex"}`}>
        {notification && (
          <div 
            role={notification.type === 'error' ? 'alert' : 'status'}
            className={`m-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              notification.type === 'error' 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : notification.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Benachrichtigung schließen"
            >
              ✕
            </button>
          </div>
        )}
        {activeCustomer ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <button 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => setActiveCustomer(null as any), 150);
      }}
      className="md:hidden mr-2 p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
    <h2 className="font-bold text-lg text-slate-800">Dokumente: {activeCustomer.name}</h2>
                    {activeCustomer.kundenNummer && (
                      <span className="bg-slate-800 text-white text-xs px-2 py-0.5 rounded font-bold shadow-sm">
                        {activeCustomer.kundenNummer}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Kundenakten und Rechnungen verwalten</p>
                </div>
                {user && (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                       <span className="w-2 h-2 rounded-full bg-green-500"></span>
                       <span>Verbunden als {user.email}</span>
                    </div>
                    <button onClick={handleLogout} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[10px] font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600" title="Google Drive trennen / abmelden">
                      <LogOut className="w-4 h-4" />
                      <span>Drive trennen</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 bg-slate-200/50 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setActiveTab('local')}
                  className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors flex items-center ${activeTab === 'local' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <FileText className="w-4 h-4 mr-2" /> Generierte PDFs
                </button>
                <button
                  onClick={() => setActiveTab('drive')}
                  className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors flex items-center ${activeTab === 'drive' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <HardDrive className="w-4 h-4 mr-2" /> Google Drive
                </button>
              </div>

              <div className="flex flex-wrap gap-2" aria-label="Dokument erstellen">
                <button type="button" onClick={() => onCreateOrientierungsangebot?.(activeCustomer)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-bold text-blue-700 transition-colors hover:bg-blue-50">
                  <FilePlus2 className="h-4 w-4" /> Orientierungsangebot
                </button>
                <button type="button" onClick={() => onCreateAnzahlungsrechnung?.(activeCustomer)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-2 text-[11px] font-bold text-amber-700 transition-colors hover:bg-amber-50">
                  <ScrollText className="h-4 w-4" /> Anzahlungsrechnung
                </button>
                <button type="button" onClick={() => onCreateRechnung?.(activeCustomer)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-indigo-700">
                  <ReceiptEuro className="h-4 w-4" /> Rechnung
                </button>
                {activeCustomer && (customerDocuments.some(d => d.type === 'Anzahlungsrechnung') || activeCustomer.arCreated || activeCustomer.hasInvoiceCreated) && (
                  <button type="button" onClick={() => onCreateStornoAnzahlungsrechnung?.(activeCustomer)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 transition-colors hover:bg-rose-100">
                    <Ban className="h-4 w-4" /> Storno AR
                  </button>
                )}
                {activeCustomer && (customerDocuments.some(d => d.type === 'Rechnung') || activeCustomer.reCreated || activeCustomer.hasInvoiceCreated) && (
                  <button type="button" onClick={() => onCreateStornoRechnung?.(activeCustomer)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 transition-colors hover:bg-rose-100">
                    <Ban className="h-4 w-4" /> Storno RE
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30">
              {activeTab === 'local' && (
                <>
                  {customerDocuments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">Noch keine Dokumente für diesen Kunden erstellt.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customerDocuments.map((doc: AppDocument) => {
                        const storageStatus = doc.metadata?.uploadStatus || 'available';
                        const statusColor = storageStatus === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            storageStatus === 'uploading' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            storageStatus === 'failed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-slate-50 text-slate-600 border-slate-200';
                        const statusText = storageStatus === 'available' ? 'Verfügbar' :
                                           storageStatus === 'uploading' ? 'Hochladend...' :
                                           storageStatus === 'failed' ? 'Upload fehlgeschlagen' : 'Ausstehend';
                        const businessStatus = doc.status || ((doc.type === 'Rechnung' || doc.type === 'Anzahlungsrechnung') ? 'pending' : undefined);
                        const businessStatusLabel = businessStatus === 'paid' ? 'Bezahlt' : businessStatus === 'overdue' ? 'Überfällig' : businessStatus === 'storno' ? 'Storniert' : businessStatus === 'pending' ? 'Offen' : '';
                        const businessStatusColor = businessStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : businessStatus === 'overdue' ? 'bg-rose-100 text-rose-700' : businessStatus === 'storno' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-700';
                        const isInvoice = doc.type === 'Rechnung' || doc.type === 'Anzahlungsrechnung';

                        return (
                          <div key={doc.id} 
                            onClick={async () => {
                              try {
                                const url = await documentService.getDownloadUrl(doc.id).catch(() => doc.dataUrl || '');
                                if (url) {
                                  if (url.startsWith('data:')) {
                                    const res = await fetch(url);
                                    const blob = await res.blob();
                                    const blobUrl = URL.createObjectURL(blob);
                                    window.open(blobUrl, '_blank');
                                  } else {
                                    window.open(url, '_blank');
                                  }
                                } else {
                                  setNotification({ type: 'error', message: 'Dokument konnte nicht geladen werden.' });
                                }
                              } catch (err: any) {
                                setNotification({ type: 'error', message: `Fehler beim Öffnen des Dokuments: ${err.message || err}` });
                              }
                            }}
                            className="border border-slate-200 rounded-lg p-4 bg-white flex flex-col space-y-3 hover:border-indigo-400 transition-colors cursor-pointer shadow-sm hover:shadow-md">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                                    {doc.type}
                                  </span>
                                  {businessStatus ? <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black ${businessStatusColor}`}>{businessStatusLabel}</span> : null}
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${statusColor}`}>
                                    {statusText}
                                  </span>
                                </div>
                                <h4 className="truncate font-bold text-slate-800 text-sm">{doc.docNumber}</h4>
                              </div>
                              <div className="flex shrink-0 items-start gap-1">
                                <span className="pt-2 text-[10px] text-slate-400">{new Date(doc.date).toLocaleDateString('de-DE')}</span>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteLocalDocId(doc.id); }} className="flex min-h-9 min-w-9 items-center justify-center rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500" title="Dokument löschen">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {isInvoice && businessStatus !== 'storno' && onUpdateDocument ? (
                              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                                {onAddDocument ? (
                                  <button onClick={async (event) => {
                                    event.stopPropagation();
                                    onUpdateDocument({ ...doc, status: 'storno' });

                                    const isAnzahlung = doc.type === 'Anzahlungsrechnung';
                                    const stornoType = isAnzahlung ? 'Storno-Anzahlungsrechnung' : 'Stornorechnung';
                                    const docPrefix = isAnzahlung ? 'SAR-' : 'ST-';
                                    const stornoDocNumber = doc.docNumber.startsWith(docPrefix) || doc.docNumber.startsWith('ST-')
                                      ? doc.docNumber
                                      : `${docPrefix}${doc.docNumber}`;

                                    let generatedDataUrl: string | undefined = doc.dataUrl;

                                    if (activeCustomer) {
                                      try {
                                        const dummyItems: OfferItem[] = [
                                          {
                                            id: `storno_item_${Date.now()}`,
                                            description: `Storno zu ${doc.type} ${doc.docNumber}`,
                                            quantity: 1,
                                            unitPrice: -(doc.amount || 0),
                                            total: -(doc.amount || 0)
                                          }
                                        ];
                                        if (isAnzahlung) {
                                          const res = await generateStornoAnzahlungsrechnungPDF(
                                            activeCustomer,
                                            dummyItems,
                                            null,
                                            'save',
                                            stornoDocNumber,
                                            0,
                                            undefined,
                                            0,
                                            0
                                          );
                                          if (res?.dataUrl) generatedDataUrl = res.dataUrl;
                                        } else {
                                          const res = await generateStornoInvoicePDF(
                                            activeCustomer,
                                            dummyItems,
                                            null,
                                            'save',
                                            stornoDocNumber,
                                            0,
                                            undefined,
                                            0,
                                            0
                                          );
                                          if (res?.dataUrl) generatedDataUrl = res.dataUrl;
                                        }
                                      } catch (e) {
                                        console.warn('Storno PDF generation fallback used:', e);
                                      }
                                    }

                                    onAddDocument({
                                      id: `doc_${Date.now()}`,
                                      customerId: doc.customerId,
                                      customerName: doc.customerName,
                                      type: stornoType,
                                      docNumber: stornoDocNumber,
                                      date: new Date().toISOString(),
                                      amount: -(doc.amount || 0),
                                      status: 'pending',
                                      stornoFor: doc.docNumber,
                                      dataUrl: generatedDataUrl
                                    });
                                    setNotification({ type: 'success', message: `${stornoType} (${stornoDocNumber}) wurde angelegt.` });
                                  }} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100" title={doc.type === 'Anzahlungsrechnung' ? 'Storno-Anzahlungsrechnung erstellen' : 'Storno-Rechnung erstellen'}>
                                    <Ban className="h-3.5 w-3.5" /> {doc.type === 'Anzahlungsrechnung' ? 'Storno AR' : 'Storno RE'}
                                  </button>
                                ) : null}
                                {onAddDocument ? (
                                  <button onClick={(event) => { event.stopPropagation(); setReminderDocument(doc); }} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[10px] font-bold text-orange-700 hover:bg-orange-100">
                                    <FileWarning className="h-3.5 w-3.5" /> Mahnung
                                  </button>
                                ) : null}
                                <button onClick={(event) => {
                                  event.stopPropagation();
                                  onUpdateDocument({ ...doc, status: 'paid' });
                                  setNotification({ type: 'success', message: `${doc.docNumber} wurde als bezahlt markiert.` });
                                }} disabled={businessStatus === 'paid'} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-default disabled:opacity-50">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> {businessStatus === 'paid' ? 'Bezahlt' : 'Als bezahlt markieren'}
                                </button>
                              </div>
                            ) : null}
                            
                            {doc.amount !== undefined && (
                              <div className="pt-2 border-t border-slate-100">
                                <span className="text-xs text-slate-500">Betrag:</span>
                                <span className="float-right font-bold text-sm">€{doc.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'drive' && (
                <>
                  {needsAuth ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 max-w-md mx-auto text-center py-6">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2 shadow-sm">
                        <HardDrive className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-800">Mit Google Drive verbinden</h3>
                        <p className="text-sm text-slate-500">
                          Verbinden Sie Ihr Google Drive, um Kundenakten automatisch in separaten Ordnern zu speichern und direkt über die App auf Dateien zuzugreifen.
                        </p>
                      </div>

                      {authError && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-left text-xs text-rose-900 space-y-2.5 w-full shadow-sm">
                          <div className="flex items-center space-x-2 font-bold text-rose-800 text-sm">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Firebase Autorisierung erforderlich</span>
                          </div>
                          <p className="leading-relaxed text-slate-700">
                            {authError}
                          </p>
                          <div className="pt-2 border-t border-rose-200/80 space-y-2">
                            <span className="font-semibold text-slate-800 block">Aktuelle Domain der Anwendung:</span>
                            <div className="flex items-center space-x-2">
                              <code className="bg-white border border-rose-200 px-2 py-1.5 rounded text-[11px] font-mono text-slate-800 font-bold flex-1 truncate">
                                {typeof window !== 'undefined' ? window.location.hostname : ''}
                              </code>
                              <button
                                onClick={() => {
                                  if (navigator.clipboard && typeof window !== 'undefined') {
                                    navigator.clipboard.writeText(window.location.hostname);
                                    setCopiedDomain(true);
                                    setTimeout(() => setCopiedDomain(false), 2000);
                                  }
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center space-x-1"
                              >
                                {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedDomain ? 'Kopiert!' : 'Domain kopieren'}</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-normal">
                              👉 In der <strong>Firebase Console</strong> unter <i>Authentication &gt; Einstellungen &gt; Autorisierte Domains</i> tragen Sie diese Domain einmalig ein.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={handleLogin} 
                        disabled={isLoggingIn}
                        className="gsi-material-button w-full flex justify-center bg-white border border-[#dadce0] rounded hover:bg-[#f8fafc] hover:border-[#dadce0] transition-colors p-0 overflow-hidden shadow-sm h-10"
                      >
                        <div className="gsi-material-button-state"></div>
                        <div className="gsi-material-button-content-wrapper flex items-center justify-center w-full h-full px-3 space-x-3">
                          <div className="gsi-material-button-icon shrink-0">
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                              <path fill="none" d="M0 0h48v48H0z"></path>
                            </svg>
                          </div>
                          <span className="gsi-material-button-contents text-slate-600 font-medium text-sm font-roboto tracking-wide">Sign in with Google</span>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full space-y-4">
                      {/* Upload Area */}
                      <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group relative">
                        <input 
                          type="file" 
                          multiple 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          onChange={handleFileUpload}
                          disabled={isUploading || isDriveLoading}
                          ref={fileInputRef}
                        />
                        <div className="flex flex-col items-center justify-center space-y-3">
                          {isUploading ? (
                             <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                          ) : (
                             <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                               <Upload className="w-6 h-6" />
                             </div>
                          )}
                          <div>
                            <h3 className="font-bold text-slate-800">Dateien hochladen</h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Ziehen Sie Dateien hierher oder klicken Sie, um Dokumente für <strong>{activeCustomer.name}</strong> auf Google Drive zu speichern.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* File List */}
                      <div className="flex-1 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:justify-between sm:items-center shrink-0 space-y-3 sm:space-y-0">
                          <h3 className="font-bold text-sm text-slate-800">Drive-Ordner: {activeCustomer.name}</h3>
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={handleSyncAttachments}
                              disabled={isSyncingAttachments || isDriveLoading}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center space-x-1.5 px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                              title="Anhänge aus E-Mails dieses Kunden automatisch in Drive speichern"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>{isSyncingAttachments ? 'Importiere...' : 'Anhänge importieren'}</span>
                            </button>
                            <button onClick={loadDriveFiles} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50" disabled={isDriveLoading}>
                              {isDriveLoading ? 'Aktualisiere...' : 'Aktualisieren'}
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                          {isDriveLoading && driveFiles.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                            </div>
                          ) : driveFiles.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                              <HardDrive className="w-10 h-10 text-slate-200" />
                              <p className="text-sm">Keine Dateien im Google Drive Ordner gefunden.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {driveFiles.map(file => (
                                <a 
                                  key={file.id} 
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group"
                                >
                                  <div className="flex items-center space-x-3 overflow-hidden">
                                    <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                                    <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteDriveFileId(file.id); }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Datei löschen">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm">Bitte links einen Kunden auswählen, um Dokumente anzuzeigen.</p>
          </div>
        )}
      </div>
    </div>
      {reminderDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setReminderDocument(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 p-4">
              <h3 className="flex items-center gap-2 text-lg font-black text-rose-800"><FileWarning className="h-5 w-5" /> Mahnung vorbereiten</h3>
              <button onClick={() => setReminderDocument(null)} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-100 hover:text-rose-600" aria-label="Mahnung schließen"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm text-slate-600">Für <strong>{reminderDocument.docNumber}</strong> wird eine neue Mahnung in der Kundenakte angelegt.</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-500">Mahnstufe
                  <select value={reminderLevel} onChange={event => setReminderLevel(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700">
                    <option value={1}>1. Mahnung</option><option value={2}>2. Mahnung</option><option value={3}>3. Mahnung</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-500">Zahlungsfrist
                  <div className="relative mt-1"><input type="number" min={1} value={reminderDays} onChange={event => setReminderDays(Math.max(1, Number(event.target.value)))} className="w-full rounded-lg border border-slate-200 p-2.5 pr-12 text-sm text-slate-700" /><span className="absolute right-3 top-2.5 text-xs text-slate-400">Tage</span></div>
                </label>
              </div>
              <label className="block text-xs font-bold text-slate-500">Mahngebühr in Prozent
                <input type="number" min={0} value={reminderFeePercent} onChange={event => setReminderFeePercent(Math.max(0, Number(event.target.value)))} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700" />
              </label>
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                Neuer Betrag: <strong className="float-right text-slate-900">€{((reminderDocument.amount || 0) * (1 + reminderFeePercent / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4">
              <button onClick={() => setReminderDocument(null)} className="min-h-10 rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200">Abbrechen</button>
              <button onClick={() => {
                if (!onAddDocument || !onUpdateDocument) return;
                onUpdateDocument({ ...reminderDocument, status: 'overdue', mahnungLevel: reminderLevel });
                onAddDocument({
                  id: `doc_${Date.now()}`,
                  customerId: reminderDocument.customerId,
                  customerName: reminderDocument.customerName,
                  type: 'Mahnung',
                  docNumber: `MA-${reminderDocument.docNumber}-${reminderLevel}`,
                  date: new Date().toISOString(),
                  amount: (reminderDocument.amount || 0) * (1 + reminderFeePercent / 100),
                  status: 'pending',
                  mahnungLevel: reminderLevel,
                  stornoFor: reminderDocument.docNumber
                });
                setReminderDocument(null);
                setNotification({ type: 'success', message: `Mahnung mit ${reminderDays} Tagen Zahlungsfrist wurde angelegt.` });
              }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700">
                <FileWarning className="h-4 w-4" /> Mahnung anlegen
              </button>
            </div>
          </div>
        </div>
      )}
      <GlobalDeleteDialog
        isOpen={!!deleteLocalDocId}
        onClose={() => setDeleteLocalDocId(null)}
        onConfirm={async () => { 
          if(deleteLocalDocId) { 
            try {
              await documentService.deleteDocument(deleteLocalDocId);
              onDeleteDocument(deleteLocalDocId);
              setDeleteLocalDocId(null); 
              setNotification({ type: 'success', message: 'Dokument erfolgreich gelöscht.' });
            } catch (err: any) {
              setNotification({ type: 'error', message: err.message || 'Dokument konnte nicht gelöscht werden.' });
              setDeleteLocalDocId(null);
            }
          } 
        }}
        title="Dokument löschen"
        description="Möchten Sie dieses Dokument wirklich löschen?"
      />
      <GlobalDeleteDialog
        isOpen={!!deleteDriveFileId}
        onClose={() => setDeleteDriveFileId(null)}
        onConfirm={async () => {
          if (deleteDriveFileId) {
            try {
              const activeToken = await getAccessToken();
              if (!activeToken) throw new Error('Google Drive ist nicht verbunden.');
              await deleteDriveFile(activeToken, deleteDriveFileId);
              setDeleteDriveFileId(null);
              loadDriveFiles();
              setNotification({ type: 'success', message: 'Datei erfolgreich aus Google Drive gelöscht.' });
            } catch (err) {
              console.error('Failed to delete drive file', err);
              setNotification({ type: 'error', message: 'Fehler beim Löschen der Datei.' });
            }
          }
        }}
        title="Google Drive Datei löschen"
        description="Möchten Sie diese Datei wirklich endgültig aus Google Drive löschen?"
      />
    </>
  );
}
