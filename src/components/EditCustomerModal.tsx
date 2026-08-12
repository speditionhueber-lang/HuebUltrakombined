import React, { useState } from 'react';
import { Customer } from '@/src/lib/types';
import { motion } from 'motion/react';
import { User, Mail, Phone, MapPin, Calendar, Clock, FileText, Check, X, ShieldAlert, Sparkles, Tag, Ban, CalendarPlus } from 'lucide-react';

interface EditCustomerModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCustomer: Customer) => Promise<void> | void;
  onCalendarCreate?: (customer: Customer) => Promise<void> | void;
}

export function EditCustomerModal({ customer, isOpen, onClose, onSave, onCalendarCreate }: EditCustomerModalProps) {
  const [formData, setFormData] = useState<Customer>({ ...customer });
  const [activeTab, setActiveTab] = useState<'stamm' | 'abhol' | 'ziel' | 'rechnung' | 'leistung'>('stamm');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isSaving) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setNotification(null);

    if (!formData.name || formData.name.trim() === '') {
      const errMsg = 'Bitte geben Sie einen Kundennamen ein.';
      setSaveError(errMsg);
      setNotification({ type: 'error', message: errMsg });
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        nameLower: (formData.name || '').toLowerCase(),
      });
      setSaveSuccess(true);
      setNotification({ type: 'success', message: 'Kundendaten erfolgreich gespeichert.' });
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Fehler beim Speichern der Kundendaten.';
      console.error("Error saving customer data:", err);
      setSaveError(errMsg);
      setNotification({ type: 'error', message: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const saveCancellationStatus = async () => {
    const nextCancelled = !formData.isCancelled;
    const updatedCustomer = {
      ...formData,
      isCancelled: nextCancelled,
      cancelledAt: nextCancelled ? new Date().toISOString() : undefined,
      nameLower: (formData.name || '').toLowerCase()
    };
    setIsSaving(true);
    try {
      await onSave(updatedCustomer);
      setFormData(updatedCustomer);
      setNotification({ type: 'success', message: nextCancelled ? 'Kunde wurde als Absage markiert.' : 'Kunde wurde wieder aktiviert.' });
    } catch (error) {
      setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Status konnte nicht gespeichert werden.' });
    } finally {
      setIsSaving(false);
    }
  };

  const createCalendarEntry = async () => {
    const updatedCustomer = { ...formData, nameLower: (formData.name || '').toLowerCase() };
    setIsSaving(true);
    try {
      await onSave(updatedCustomer);
      if (onCalendarCreate) {
        await onCalendarCreate(updatedCustomer);
      } else {
        const requestedDate = updatedCustomer.umzugsdetails?.gewuenschterUmzugstermin;
        const parsedDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
          ? requestedDate
          : new Date().toISOString().slice(0, 10);
        window.dispatchEvent(new CustomEvent('add_calendar_event', { detail: {
          id: `evt-${Date.now()}`,
          title: `KOMM: ${updatedCustomer.name}`,
          startDate: parsedDate,
          startTime: updatedCustomer.umzugsdetails?.voraussichtlicheStartzeit || '08:00',
          endTime: '12:00',
          location: updatedCustomer.abholadresse?.strasse || updatedCustomer.address?.street || '',
          description: `Termin für ${updatedCustomer.name}\nTel: ${updatedCustomer.phone || '—'}\nE-Mail: ${updatedCustomer.email || '—'}`,
          category: 'Umzug',
          customerId: updatedCustomer.id
        }}));
      }
      setNotification({ type: 'success', message: 'Kundendaten gespeichert und Kalendereintrag angelegt.' });
    } catch (error) {
      setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Kalendereintrag konnte nicht angelegt werden.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto" 
      onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose(); }}
      data-testid="edit-customer-backdrop"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Kundendaten bearbeiten</h3>
              <p className="text-xs text-slate-500">ID: {formData.id} • {formData.kundenNummer || 'Keine Kunden-Nr.'}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => { if (!isSaving) onClose(); }} 
            disabled={isSaving}
            aria-disabled={isSaving}
            className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {notification && (
          <div 
            role={notification.type === 'error' ? 'alert' : 'status'}
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              notification.type === 'error' 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <span>{notification.message}</span>
            <button 
              type="button" 
              onClick={() => setNotification(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Benachrichtigung schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 bg-white gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('stamm')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'stamm'
                ? 'border-indigo-500 text-indigo-800 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Stammdaten</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('abhol')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'abhol'
                ? 'border-indigo-500 text-indigo-800 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span>1. Abholadresse</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ziel')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'ziel'
                ? 'border-indigo-500 text-indigo-800 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-green-600" />
            <span>2. Zieladresse</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rechnung')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'rechnung'
                ? 'border-indigo-500 text-indigo-800 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>Rechnungsadresse</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leistung')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'leistung'
                ? 'border-indigo-500 text-indigo-800 bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Gebühren & Services</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: STAMMDATEN */}
          {activeTab === 'stamm' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Name / Firma *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Vor- und Nachname"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kundennummer</span>
                  </label>
                  <input
                    type="text"
                    value={formData.kundenNummer || ''}
                    onChange={(e) => setFormData({ ...formData, kundenNummer: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="z.B. HUBI0001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>E-Mail-Adresse</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="kunde@beispiel.at"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Telefonnummer</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="+43 660 ..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Gewünschter Umzugstermin</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formData.umzugsdetails?.gewuenschterUmzugstermin || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        umzugsdetails: { ...formData.umzugsdetails, gewuenschterUmzugstermin: e.target.value }
                      })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="TT.MM.JJJJ oder flexibel"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const dateStr = formData.umzugsdetails?.gewuenschterUmzugstermin;
                        if (!dateStr || dateStr.trim() === '' || dateStr === '—') {
                          setNotification({ type: 'error', message: 'Bitte geben Sie zuerst ein gültiges Datum ein (TT.MM.JJJJ oder YYYY-MM-DD)' });
                          return;
                        }
                        
                        let isoDate = dateStr;
                        const parts = dateStr.split('.');
                        if (parts.length === 3) {
                          isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        }
                        
                        const totalM3 = Object.entries(formData.gegenstaende || {}).reduce((sum, [_, v]) => sum + (Number(v) || 0) * 0.5, 0);
                        const desc = `Telefon: ${formData.phone || '-'}\nEmail: ${formData.email || '-'}\n\nStart: ${formData.abholadresse?.strasse || '-'}\nZiel: ${formData.zieladresse?.strasse || '-'}\n\nVolumen: ${totalM3} m³\nAnmerkung: ${formData.anmerkungen || '-'}`;
                        
                        const newEvt = {
                          id: 'evt-' + Date.now(),
                          title: `KOMM: ${formData.name}`,
                          startDate: isoDate,
                          startTime: '08:00',
                          endTime: '12:00',
                          location: formData.abholadresse?.strasse || '',
                          description: desc,
                          category: 'Umzug'
                        };
                        
                        window.dispatchEvent(new CustomEvent('add_calendar_event', { detail: newEvt }));
                        setNotification({ type: 'success', message: 'Termin in den Kalender eingetragen!' });
                      }}
                      title="Termin in den Kalender eintragen"
                      className="p-2.5 min-w-[44px] min-h-[44px] bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center"
                      aria-label="Termin in Kalender eintragen"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Voraussichtliche Startzeit</span>
                  </label>
                  <input
                    type="text"
                    value={formData.umzugsdetails?.voraussichtlicheStartzeit || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      umzugsdetails: { ...formData.umzugsdetails, voraussichtlicheStartzeit: e.target.value }
                    })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="z.B. 08:00 Uhr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ABHOLADRESSE */}
          {activeTab === 'abhol' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Strasse & Hausnummer / PLZ Ort</label>
                <input
                  type="text"
                  value={formData.abholadresse?.strasse || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    abholadresse: { ...formData.abholadresse, strasse: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="z.B. Linzer Strasse 12, 4020 Linz"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Gebäudetyp</label>
                  <input
                    type="text"
                    value={formData.abholadresse?.gebaeudetyp || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      abholadresse: { ...formData.abholadresse, gebaeudetyp: e.target.value }
                    })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Wohnung, Einfamilienhaus, Büro..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Stockwerk</label>
                  <input
                    type="text"
                    value={formData.abholadresse?.stockwerk || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      abholadresse: { ...formData.abholadresse, stockwerk: e.target.value }
                    })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="EG, 1. OG, Dachgeschoss..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Aufzug vorhanden?</label>
                  <select
                    value={formData.abholadresse?.aufzug || 'Nein'}
                    onChange={(e) => setFormData({
                      ...formData,
                      abholadresse: { ...formData.abholadresse, aufzug: e.target.value }
                    })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="Ja">Ja</option>
                    <option value="Nein">Nein</option>
                    <option value="Teilweise">Teilweise / Zwischenstock</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">LKW-Trageweg (Meter)</label>
                  <input
                    type="text"
                    value={formData.abholadresse?.entfernungLKW || '10'}
                    onChange={(e) => setFormData({
                      ...formData,
                      abholadresse: { ...formData.abholadresse, entfernungLKW: e.target.value }
                    })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="z.B. 10m"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Besonderheiten & Parkplatz</label>
                <textarea
                  rows={2}
                  value={formData.abholadresse?.besonderheiten || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    abholadresse: { ...formData.abholadresse, besonderheiten: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Enge Zufahrt, Halteverbotszone nötig, Schranke..."
                />
              </div>
            </div>
          )}

          {/* TAB 3: ZIELADRESSE */}
          {activeTab === 'ziel' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Strasse & Hausnummer / PLZ Ort</label>
                <input
                  type="text"
                  value={formData.zieladresse?.strasse || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    zieladresse: { ...formData.zieladresse, strasse: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="z.B. Landstrasse 50, 4020 Linz"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Gebäudetyp</label>
                  <input
                    type="text"
                    value={formData.zieladresse?.gebaeudetyp || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      zieladresse: { ...formData.zieladresse, gebaeudetyp: e.target.value }
                    })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Wohnung, Reihenhaus..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Stockwerk</label>
                  <input
                    type="text"
                    value={formData.zieladresse?.stockwerk || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      zieladresse: { ...formData.zieladresse, stockwerk: e.target.value }
                    })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="2. OG, Lift vorhanden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Aufzug vorhanden?</label>
                  <select
                    value={formData.zieladresse?.aufzug || 'Nein'}
                    onChange={(e) => setFormData({
                      ...formData,
                      zieladresse: { ...formData.zieladresse, aufzug: e.target.value }
                    })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="Ja">Ja</option>
                    <option value="Nein">Nein</option>
                    <option value="Teilweise">Teilweise / Zwischenstock</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">LKW-Trageweg (Meter)</label>
                  <input
                    type="text"
                    value={formData.zieladresse?.entfernungLKW || '10'}
                    onChange={(e) => setFormData({
                      ...formData,
                      zieladresse: { ...formData.zieladresse, entfernungLKW: e.target.value }
                    })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="z.B. 10m"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Besonderheiten Zieladresse</label>
                <textarea
                  rows={2}
                  value={formData.zieladresse?.besonderheiten || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    zieladresse: { ...formData.zieladresse, besonderheiten: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Innenhof, Fussgängerzone..."
                />
              </div>
            </div>
          )}

          {/* TAB 4: RECHNUNGSADRESSE */}
          {activeTab === 'rechnung' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/60 text-xs text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Abweichende Rechnungsadresse
                </p>
                <p className="text-[11px] text-indigo-800/80">
                  Wenn ausgefüllt, wird diese Adresse auf Rechnungen und Angeboten statt der Standardadresse verwendet.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Zeile 1 (Name / Firma)</label>
                <input
                  type="text"
                  value={formData.zusatzoptionen?.adresseNr1 || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    zusatzoptionen: { ...formData.zusatzoptionen, adresseNr1: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Max Mustermann GmbH"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Zeile 2 (Zusatz / c/o)</label>
                <input
                  type="text"
                  value={formData.zusatzoptionen?.adresseNr2 || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    zusatzoptionen: { ...formData.zusatzoptionen, adresseNr2: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="z.Hd. Buchhaltung"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Zeile 3 (Straße)</label>
                <input
                  type="text"
                  value={formData.zusatzoptionen?.adresseNr3 || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    zusatzoptionen: { ...formData.zusatzoptionen, adresseNr3: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Rechnungsgasse 1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Zeile 4 (PLZ Ort)</label>
                <input
                  type="text"
                  value={formData.zusatzoptionen?.adresseNr4 || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    zusatzoptionen: { ...formData.zusatzoptionen, adresseNr4: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="1010 Wien"
                />
              </div>
              
              <div className="pt-2">
                 <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      zusatzoptionen: {
                        ...formData.zusatzoptionen,
                        adresseNr1: formData.name || '',
                        adresseNr2: '',
                        adresseNr3: formData.zieladresse?.strasse || '',
                        adresseNr4: `${formData.zieladresse?.plz || ''} ${formData.zieladresse?.ort || ''}`.replace('undefined', '').trim() || ''
                      }
                    });
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline"
                 >
                   Zieladresse als Rechnungsadresse übernehmen
                 </button>
              </div>
            </div>
          )}

          {/* TAB 5: GEBÜHREN, SERVICES & ANMERKUNGEN */}
          {activeTab === 'leistung' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/60 text-xs text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Bearbeitungsgebühren, Sonderkonditionen & Zusatzleistungen
                </p>
                <p className="text-[11px] text-indigo-800/80">
                  Hier können Sie Bearbeitungsgebühren, Nebenleistungen und sonstige Kundenvereinbarungen verwalten.
                </p>
              </div>

              {/* Checkboxes for Nebenleistungen */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {[
                  { key: 'einrichtenHVZ', label: 'Halteverbotszone (HVZ) einrichten' },
                  { key: 'moebelmontage', label: 'Möbelmontage / Demontage' },
                  { key: 'kuechenmontage', label: 'Küchenmontage' },
                  { key: 'verpacken', label: 'Einpackservice' },
                  { key: 'auspacken', label: 'Auspackservice' },
                  { key: 'reinigungsservice', label: 'Endreinigung' },
                  { key: 'haushaltsaufloesung', label: 'Räumung / Entsorgung' },
                  { key: 'lampenmontage', label: 'Lampenmontage' },
                ].map(({ key, label }) => {
                  const isChecked = Boolean(formData.nebenleistungen?.[key as keyof typeof formData.nebenleistungen]);
                  return (
                    <label key={key} className="flex items-center space-x-2.5 p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setFormData({
                          ...formData,
                          nebenleistungen: {
                            ...formData.nebenleistungen,
                            [key]: e.target.checked,
                          }
                        })}
                        className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="font-medium text-slate-700">{label}</span>
                    </label>
                  );
                })}
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Anmerkungen & Sonderkonditionen / Bearbeitungshinweise</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.anmerkungen || ''}
                  onChange={(e) => setFormData({ ...formData, anmerkungen: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Sonderabsprachen, Rabatte, Bearbeitungsgebühren oder spezielle Vereinbarungen..."
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-t border-slate-100 bg-slate-50/70 p-4 pt-4">
            <button
              type="button"
              onClick={() => { if (!isSaving) onClose(); }}
              disabled={isSaving}
              aria-disabled={isSaving}
              className="px-4 py-2.5 min-h-[44px] min-w-[44px] text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Abbrechen
            </button>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button type="button" onClick={saveCancellationStatus} disabled={isSaving} className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all disabled:opacity-50 ${formData.isCancelled ? 'border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-700'}`} title={formData.isCancelled ? 'Absage aufheben und Kunde reaktivieren' : 'Kunde als Absage / kein Interesse markieren'}>
                <Ban className="h-4 w-4" /> {formData.isCancelled ? 'Absage aufheben' : 'Absage'}
              </button>
              <button type="button" onClick={createCalendarEntry} disabled={isSaving} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50" title="Kundendaten speichern und Kalendereintrag anlegen">
                <CalendarPlus className="h-4 w-4" /> Kalender
              </button>
              <button
                type="submit"
                disabled={isSaving}
                aria-disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 min-h-[44px] rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span>Speichert...</span>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Gespeichert!</span>
                  </>
                ) : (
                  <span>Änderungen speichern</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
