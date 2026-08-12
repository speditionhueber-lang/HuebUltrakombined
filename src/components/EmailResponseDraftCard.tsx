import React, { useState, useEffect } from 'react';
import { EmailResponseDraft, EmailRecipient, RequestedInformationField } from '../lib/types';
import { validateEmailResponseDraft } from '../lib/email-draft-validator';
import { documentService } from '../lib/document-service';
import { Mail, Send, X, AlertTriangle, Edit3, Plus, Trash2, RefreshCw, CheckCircle2, XCircle, Sparkles, FileText, Eye, Paperclip } from 'lucide-react';

export interface EmailResponseDraftCardProps {
  draft: EmailResponseDraft;
  onSaveDraft: (draft: EmailResponseDraft) => void;
  onConfirmSend: (draft: EmailResponseDraft) => Promise<void>;
  onRejectDraft: (draft: EmailResponseDraft) => void;
  isSending?: boolean;
}

export const EmailResponseDraftCard: React.FC<EmailResponseDraftCardProps> = ({
  draft,
  onSaveDraft,
  onConfirmSend,
  onRejectDraft,
  isSending = false
}) => {
  const [recipients, setRecipients] = useState<EmailRecipient[]>(draft.recipients || []);
  const [newRecipientInput, setNewRecipientInput] = useState('');
  const [subject, setSubject] = useState(draft.subject || '');
  const [bodyText, setBodyText] = useState(draft.bodyText || '');
  const [requestedFields, setRequestedFields] = useState<RequestedInformationField[]>(draft.requestedFields || []);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [sendError, setSendError] = useState<string | null>(draft.errorMessage || null);

  useEffect(() => {
    setRecipients(draft.recipients || []);
    setSubject(draft.subject || '');
    setBodyText(draft.bodyText || '');
    setRequestedFields(draft.requestedFields || []);
    setSendError(draft.errorMessage || null);
  }, [draft]);

  const validation = validateEmailResponseDraft({
    ...draft,
    recipients,
    subject,
    bodyText,
    requestedFields
  });

  const handleAddRecipient = () => {
    if (!newRecipientInput.trim() || !newRecipientInput.includes('@')) return;
    const updated = [...recipients, { email: newRecipientInput.trim() }];
    setRecipients(updated);
    setNewRecipientInput('');
    triggerAutoSave({ recipients: updated });
  };

  const handleRemoveRecipient = (email: string) => {
    const updated = recipients.filter(r => r.email !== email);
    setRecipients(updated);
    triggerAutoSave({ recipients: updated });
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const fieldName = newFieldLabel.toLowerCase().replace(/\s+/g, '_');
    const updated = [
      ...requestedFields,
      { field: fieldName, label: newFieldLabel.trim(), reason: 'Manuell hinzugefügt', required: true }
    ];
    setRequestedFields(updated);
    setNewFieldLabel('');
    triggerAutoSave({ requestedFields: updated });
  };

  const handleRemoveField = (fieldKey: string) => {
    const updated = requestedFields.filter(f => f.field !== fieldKey);
    setRequestedFields(updated);
    triggerAutoSave({ requestedFields: updated });
  };

  const triggerAutoSave = (overrides?: Partial<EmailResponseDraft>) => {
    const updatedDraft: EmailResponseDraft = {
      ...draft,
      recipients,
      subject,
      bodyText,
      requestedFields,
      status: draft.status === 'draft' ? 'edited' : draft.status,
      updatedAt: new Date().toISOString(),
      ...overrides
    };
    onSaveDraft(updatedDraft);
  };

  const handleSendClick = async () => {
    if (!validation.valid) return;
    setSendError(null);
    const currentDraft: EmailResponseDraft = {
      ...draft,
      recipients,
      subject,
      bodyText,
      requestedFields,
      updatedAt: new Date().toISOString()
    };
    try {
      await onConfirmSend(currentDraft);
    } catch (err: any) {
      setSendError(err.message || 'Fehler beim Versenden');
    }
  };

  const getPurposeLabel = (purpose: EmailResponseDraft['purpose']) => {
    switch (purpose) {
      case 'offer_delivery': return 'Angebotsversand';
      case 'invoice_delivery': return 'Rechnungsversand';
      case 'request_missing_information': return 'Fehlende Informationen anfordern';
      case 'schedule_viewing': return 'Besichtigungstermin vereinbaren';
      case 'callback_confirmation': return 'Rückrufwunsch bestätigen';
      case 'acknowledgement': return 'Eingangsbestätigung';
      case 'general_reply': default: return 'Antwortentwurf';
    }
  };

  const isSent = draft.status === 'sent';
  const isFailed = draft.status === 'failed';
  const isRejected = draft.status === 'rejected';

  return (
    <div className={`rounded-xl border p-5 transition-all shadow-sm ${
      isSent ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10' :
      isFailed ? 'border-amber-200 bg-amber-50/30 dark:bg-amber-950/10' :
      isRejected ? 'border-slate-200 bg-slate-50/50 opacity-60' :
      'border-blue-200 bg-gradient-to-b from-blue-50/40 to-white dark:from-slate-900/60 dark:to-slate-900 dark:border-slate-800'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${
            isSent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
            isFailed ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
            'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
          }`}>
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                KI-Antwortentwurf: {getPurposeLabel(draft.purpose)}
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                <Sparkles className="w-3 h-3" /> KI Vorbereitet
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Original-Absender: <span className="font-medium text-slate-700 dark:text-slate-300">{draft.originalSenderEmail || 'Keine E-Mail'}</span>
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isSent && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Versendet
            </span>
          )}
          {isFailed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" /> Versand fehlgeschlagen
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <XCircle className="w-3.5 h-3.5" /> Verworfen
            </span>
          )}
          {!isSent && !isFailed && !isRejected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
              Entwurf prüfbereit
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!isSent && !isRejected && (
        <div className="space-y-4">
          {/* Validation Banner if errors */}
          {!validation.valid && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Bitte korrigieren Sie folgende Punkte vor dem Senden:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                {validation.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Send error banner */}
          {sendError && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-3 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Versandfehler:</span> {sendError}
              </div>
            </div>
          )}

          {/* Recipients */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Empfänger:
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-[38px]">
              {recipients.map((rec, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700">
                  <span>{rec.name ? `${rec.name} <${rec.email}>` : rec.email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(rec.email)}
                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-800"
                    title="Empfänger entfernen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 flex-1 min-w-[180px]">
                <input
                  type="email"
                  value={newRecipientInput}
                  onChange={(e) => setNewRecipientInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRecipient(); } }}
                  placeholder="Weitere E-Mail hinzufügen..."
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  disabled={!newRecipientInput.trim()}
                  className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Betreff:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                triggerAutoSave({ subject: e.target.value });
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Attached Files Section */}
          {draft.attachments && draft.attachments.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                <span>Angehängtes PDF-Dokument (Document Service):</span>
              </label>
              <div className="space-y-2">
                {draft.attachments.map((att) => {
                  const doc = documentService.getDocument(att.documentId);
                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {att.fileName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            MIME: {att.mimeType} | Doc-ID: {att.documentId} {doc?.amount ? `| Betrag: ${doc.amount.toFixed(2)} €` : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (doc?.dataUrl) {
                            const win = window.open();
                            if (win) {
                              win.document.write(`<iframe src="${doc.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            }
                          } else {
                            setSendError('Das Dokument konnte im Document Service nicht geladen werden.');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>PDF öffnen</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Requested Fields Chips if missing info */}
          {draft.purpose === 'request_missing_information' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Angeforderte Angaben (Vom Kunden benötigt):
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                {requestedFields.map((f, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 text-xs border border-blue-200/60 dark:border-blue-800/60">
                    <span>{f.label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(f.field)}
                      className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-600 dark:text-blue-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1 min-w-[160px]">
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddField(); } }}
                    placeholder="Angabe hinzufügen..."
                    className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none px-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddField}
                    disabled={!newFieldLabel.trim()}
                    className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message Body Styled Preview */}
          <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                Nachrichtentext bearbeiten
              </span>
              <span className="text-[10px] text-slate-400">
                Die E-Mail wird genau wie unten dargestellt gesendet
              </span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900">
              <textarea
                value={bodyText}
                onChange={(e) => {
                  setBodyText(e.target.value);
                  triggerAutoSave({ bodyText: e.target.value });
                }}
                className="w-full bg-transparent text-slate-800 dark:text-slate-200 text-sm font-sans leading-relaxed focus:outline-none resize-none overflow-hidden"
                style={{
                  minHeight: '180px',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              {/* Fake Email Signature for Preview */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-sans">
                <div className="mb-3">
                  <img src="/LOgo2.png" alt="Spedition Hueber Logo" className="h-10 object-contain mix-blend-multiply dark:mix-blend-normal dark:invert" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Spedition Hueber GmbH</p>
                <p>Musterstraße 123, 1234 Musterstadt</p>
                <p>Tel: +43 123 456 789 | E-Mail: office@hueber.com</p>
                <p className="mt-2 text-[10px] opacity-75">Diese E-Mail wurde maschinell mit HueberAI erstellt und von einem Mitarbeiter freigegeben.</p>
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onRejectDraft(draft)}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              Entwurf verwerfen
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendClick}
                disabled={!validation.valid || isSending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Wird versendet...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Freigeben & Jetzt Senden</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sent Display */}
      {isSent && (
        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">
            Diese E-Mail wurde erfolgreich versendet.
          </p>
          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50 space-y-1 text-slate-600 dark:text-slate-300">
            <p><span className="font-medium text-slate-900 dark:text-slate-100">An:</span> {recipients.map(r => r.email).join(', ')}</p>
            <p><span className="font-medium text-slate-900 dark:text-slate-100">Betreff:</span> {subject}</p>
            <p><span className="font-medium text-slate-900 dark:text-slate-100">Zeitpunkt:</span> {draft.sentAt ? new Date(draft.sentAt).toLocaleString('de-AT') : 'Soeben'}</p>
          </div>
        </div>
      )}

      {/* Rejected Display */}
      {isRejected && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Dieser E-Mail-Entwurf wurde verworfen.
        </div>
      )}
    </div>
  );
};
