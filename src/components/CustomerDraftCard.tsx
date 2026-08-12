
import React, { useState, useEffect } from 'react';
import { CustomerDraft, DraftCorrection, DraftField, DraftAddressField } from '../lib/types';
import { CRMLookupResult } from '../lib/crm-lookup-service';
import { User, Mail, Phone, MapPin, Calendar, Check, X, Sparkles, AlertCircle } from 'lucide-react';

interface CustomerDraftCardProps {
  draft: CustomerDraft;
  onSave: (updatedDraft: CustomerDraft, corrections: DraftCorrection[]) => Promise<void>;
  onConvert: (draft: CustomerDraft) => Promise<void>;
  onReject: () => Promise<void>;
  isSaving: boolean;
  error: string | null;
  lookupResult: CRMLookupResult | null;
}

export function CustomerDraftCard({ draft, onSave, onConvert, onReject, isSaving, error, lookupResult }: CustomerDraftCardProps) {
  const [editingDraft, setEditingDraft] = useState<CustomerDraft>(draft);
  const [initialDraft, setInitialDraft] = useState<CustomerDraft>(draft);
  
  // Update local state if the prop changes (e.g. saved from server)
  useEffect(() => {
    setEditingDraft(draft);
    setInitialDraft(draft);
  }, [draft]);

  const handleChange = (field: keyof CustomerDraft['fields'], subfield: 'raw' | null, value: string) => {
    setEditingDraft(prev => {
      const updated = { ...prev };
      const fields = { ...prev.fields };
      
      if (subfield === 'raw') {
        const addressField = (fields[field as 'pickupAddress' | 'destinationAddress'] || {}) as DraftAddressField;
        const currentSub = addressField.raw || { value: '', recognized: false, confidence: 'low', source: 'Manual' };
        fields[field as 'pickupAddress' | 'destinationAddress'] = {
          ...addressField,
          raw: { ...currentSub, value }
        };
      } else {
        const currentField = (fields[field as 'name' | 'email' | 'phone' | 'moveDate'] || { value: '', recognized: false, confidence: 'low', source: 'Manual' }) as DraftField<string>;
        fields[field as 'name' | 'email' | 'phone' | 'moveDate'] = {
          ...currentField,
          value
        };
      }
      updated.fields = fields;
      return updated;
    });
  };

  const calculateCorrections = (): DraftCorrection[] => {
    const newCorrections: DraftCorrection[] = [];
    
    const checkField = (field: keyof CustomerDraft['fields'], subfield: 'raw' | null) => {
      let oldVal: string | null | undefined;
      let newVal: string | null | undefined;
      if (subfield === 'raw') {
        oldVal = initialDraft.fields[field as 'pickupAddress' | 'destinationAddress']?.raw?.value;
        newVal = editingDraft.fields[field as 'pickupAddress' | 'destinationAddress']?.raw?.value;
      } else {
        oldVal = initialDraft.fields[field as 'name' | 'email' | 'phone' | 'moveDate']?.value;
        newVal = editingDraft.fields[field as 'name' | 'email' | 'phone' | 'moveDate']?.value;
      }
      
      if (oldVal !== newVal) {
        newCorrections.push({
          field: subfield ? `${field}.${subfield}` : field,
          previousValue: oldVal ?? null,
          newValue: newVal ?? null,
          timestamp: new Date().toISOString(),
          user: 'current-user'
        });
      }
    };

    checkField('name', null);
    checkField('email', null);
    checkField('phone', null);
    checkField('moveDate', null);
    checkField('pickupAddress', 'raw');
    checkField('destinationAddress', 'raw');
    
    return newCorrections;
  };

  const handleSaveClick = async () => {
    const corrections = calculateCorrections();
    await onSave(editingDraft, corrections);
  };

  const handleConvertClick = async () => {
    // Optionally save before convert
    const corrections = calculateCorrections();
    if (corrections.length > 0) {
      await onSave(editingDraft, corrections);
    }
    await onConvert(editingDraft);
  };

  return (
    <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden mb-6 flex flex-col">
      <div className="bg-indigo-50/80 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Neuer Kundenentwurf (aus Outlook)
        </h3>
        <div className="text-[10px] font-medium uppercase tracking-wider text-indigo-500 bg-indigo-100/50 px-2 py-1 rounded-md">
          {editingDraft.status === 'edited' ? 'Bearbeitet' : 'Vorschlag'}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {lookupResult && lookupResult.status !== 'no_match' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <span>
                {lookupResult.status === 'exact_match' 
                  ? 'Kunde existiert bereits im CRM.' 
                  : 'Mögliche Dubletten gefunden.'}
              </span>
            </div>
            {lookupResult.customers && lookupResult.customers.length > 0 && (
              <ul className="list-disc pl-8 space-y-1 mt-1">
                {lookupResult.customers.map((c, idx) => (
                  <li key={idx}>Kunde {c.name} ({c.email || 'Keine E-Mail'})</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={editingDraft.fields.name?.value || ''}
                onChange={(e) => handleChange('name', null, e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Vor- und Nachname"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">E-Mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="email"
                value={editingDraft.fields.email?.value || ''}
                onChange={(e) => handleChange('email', null, e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="E-Mail-Adresse"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="tel"
                value={editingDraft.fields.phone?.value || ''}
                onChange={(e) => handleChange('phone', null, e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Telefonnummer"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Umzugstermin</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={editingDraft.fields.moveDate?.value || ''}
                onChange={(e) => handleChange('moveDate', null, e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="z.B. Mitte September"
              />
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Abholadresse (Erkannt)</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={editingDraft.fields.pickupAddress?.raw?.value || ''}
                  onChange={(e) => handleChange('pickupAddress', 'raw', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Abholadresse komplett"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Zieladresse (Erkannt)</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={editingDraft.fields.destinationAddress?.raw?.value || ''}
                  onChange={(e) => handleChange('destinationAddress', 'raw', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Zieladresse komplett"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onReject}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Entwurf ablehnen</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveClick}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-md transition-colors"
            >
              Änderungen speichern
            </button>
            <button
              onClick={handleConvertClick}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Wird angelegt...' : 'Kunde anlegen'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
