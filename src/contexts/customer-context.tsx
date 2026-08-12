'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Customer } from '@/src/lib/types';
import { initializeFirebase } from '@/src/firebase/init';
import { handleFirestoreError, OperationType } from '@/src/firebase/errors';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  updateDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)).filter(item => item !== undefined) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned;
  }
  return obj;
}
import { importedCustomers } from '@/src/lib/imported-data';
import { sanitizeFirestoreTimestamps, normalizeCustomerData } from '@/src/lib/customer-adapter';
import { crmLookupService } from '@/src/lib/crm-lookup-service';

export interface CalculationParams {
  pickupDistance: number;
  destinationDistance: number;
  pickupFloor: number;
  destinationFloor: number;
  pickupElevator: 'none' | 'small' | 'medium' | 'large';
  destinationElevator: 'none' | 'small' | 'medium' | 'large';
  selfProvidedPersonnel: number;
  hvzCount: number;
  buildingType: 'neubau' | 'altbau';
  distanceKm: number;
  priceMultiplier: number;
  hasKombiRabatt?: boolean;
  hasStandardRabatt?: boolean;
  hasSofortRabatt?: boolean;
  rentLKW?: boolean;
  rentLKWDays?: number;
  rentLKWType?: '7.5t' | '12t';
}

export interface CustomerWorkflowState {
  offerData?: {
    totalM3: number;
    estimatedHours: number;
    calculatedPrice: number;
  };
  highlightedNav: Record<string, 'pending' | 'completed'>;
  pendingApproval?: boolean;
  areInvoicesPaid?: boolean;
}

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  activeCustomer: Customer | null;
  setActiveCustomer: (customer: Customer | null) => void;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  calculationParams: CalculationParams;
  setCalculationParams: React.Dispatch<React.SetStateAction<CalculationParams>>;
  workflowState: CustomerWorkflowState;
  setWorkflowState: React.Dispatch<React.SetStateAction<CustomerWorkflowState>>;
  syncImportedData: () => Promise<void>;
  mergeDuplicateCustomers: () => Promise<{ mergedCount: number, removedCount: number }>;
}

const defaultParams: CalculationParams = {
  pickupDistance: 10,
  destinationDistance: 10,
  pickupFloor: 0,
  destinationFloor: 0,
  pickupElevator: 'none',
  destinationElevator: 'none',
  selfProvidedPersonnel: 0,
  hvzCount: 0,
  buildingType: 'neubau',
  distanceKm: 20,
  priceMultiplier: 1,
  hasKombiRabatt: false,
  hasStandardRabatt: false,
  hasSofortRabatt: false,
  rentLKW: false,
  rentLKWDays: 1,
  rentLKWType: '7.5t'
};

const defaultWorkflow: CustomerWorkflowState = {
  highlightedNav: {
    '/angebot': 'pending',
    '/rechnung-erstellen': 'pending',
  },
  pendingApproval: true,
  areInvoicesPaid: false,
};

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'app_custom_customers';

function getLocalCustomCustomers(): Customer[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error("Failed to read custom customers from localStorage:", e);
  }
  return [];
}

function saveLocalCustomCustomer(customer: Customer) {
  try {
    const current = getLocalCustomCustomers();
    const index = current.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      current[index] = { ...current[index], ...customer };
    } else {
      current.unshift(customer);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Failed to save custom customer to localStorage:", e);
  }
}

function updateLocalCustomCustomer(id: string, updates: Partial<Customer>) {
  try {
    const current = getLocalCustomCustomers();
    const index = current.findIndex(c => c.id === id);
    if (index >= 0) {
      current[index] = { ...current[index], ...updates };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.error("Failed to update custom customer in localStorage:", e);
  }
}

const getSafeTime = (dateVal: any): number => {
  if (!dateVal) return 0;
  if (typeof dateVal === 'number') return dateVal;
  if (typeof dateVal === 'object') {
    if (typeof dateVal.toDate === 'function') {
      return dateVal.toDate().getTime();
    }
    if (typeof dateVal.seconds === 'number') {
      return dateVal.seconds * 1000;
    }
    if (typeof dateVal._seconds === 'number') {
      return dateVal._seconds * 1000;
    }
  }
  if (typeof dateVal === 'string') {
    const deMatch = dateVal.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (deMatch) {
      const day = parseInt(deMatch[1], 10);
      const month = parseInt(deMatch[2], 10) - 1;
      const year = parseInt(deMatch[3], 10);
      return new Date(year, month, day).getTime();
    }
    const t = new Date(dateVal).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
};

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [calculationParams, setCalculationParams] = useState<CalculationParams>(defaultParams);
  const [workflowState, setWorkflowState] = useState<CustomerWorkflowState>(defaultWorkflow);

  // Undo stack
  const undoStackRef = React.useRef<{ id: string; previousState: Customer }[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          // Let default undo handle text input fields
          return;
        }
        e.preventDefault();
        const stack = undoStackRef.current;
        if (stack.length > 0) {
          const lastAction = stack.pop();
          if (lastAction) {
            updateCustomerWithoutUndo(lastAction.id, lastAction.previousState);
            window.dispatchEvent(new CustomEvent('toast_notification', {
              detail: { type: 'info', message: `Aktion rückgängig gemacht: Änderungen am Kunden ${lastAction.previousState.name || 'wurden'} zurückgesetzt.` }
            }));
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateCustomerWithoutUndo = async (id: string, updates: Partial<Customer>) => {
    try {
      let mergedCustomer: Customer | undefined;
      setCustomers(prev => {
        return prev.map(c => {
          if (c.id === id) {
            const merged = { ...c, ...updates };
            mergedCustomer = merged;
            return merged;
          }
          return c;
        });
      });

      if (mergedCustomer) {
        updateLocalCustomCustomer(id, mergedCustomer);
        setActiveCustomer(prev => prev && prev.id === id ? mergedCustomer! : prev);
        
        const { firestore } = initializeFirebase();
        if (firestore) {
          await setDoc(doc(firestore, 'customers', id), cleanFirestoreData(mergedCustomer), { merge: true });
        }
      }
    } catch (error) {
      console.error("Error updating customer without undo:", error);
    }
  };

  // Firestore synchronization & Local Storage fallback
  useEffect(() => {
    try {
      const { firestore } = initializeFirebase();
      const localCustom = getLocalCustomCustomers();

      if (!firestore) {
        const mergedMap = new Map<string, Customer>();
        importedCustomers.forEach(c => mergedMap.set(c.id, c));
        localCustom.forEach(c => mergedMap.set(c.id, c));
        const mergedList = Array.from(mergedMap.values());
        mergedList.sort((a, b) => getSafeTime(b.createdAt) - getSafeTime(a.createdAt));
        setCustomers(mergedList);
        setLoading(false);
        return;
      }

      // Listen to Firestore without strict orderBy to avoid query index failures
      const q = collection(firestore, 'customers');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Customer[] = [];
        snapshot.forEach((docSnap) => {
          const raw = sanitizeFirestoreTimestamps({ id: docSnap.id, ...docSnap.data() });
          const normalized = normalizeCustomerData(raw);
          list.push(normalized);
        });
        
        const mergedMap = new Map<string, Customer>();
        importedCustomers.forEach(c => {
          mergedMap.set(c.id, c);
        });
        localCustom.forEach(c => {
          mergedMap.set(c.id, c);
        });
        list.forEach(c => {
          mergedMap.set(c.id, c);
        });
        
        const mergedList = Array.from(mergedMap.values());

        // Sort by createdAt desc so new customers appear at the top
        mergedList.sort((a, b) => {
          const dateA = getSafeTime(a.createdAt);
          const dateB = getSafeTime(b.createdAt);
          return dateB - dateA;
        });

        setCustomers(mergedList);
        setLoading(false);
      }, (error) => {
        console.warn("Firestore Listen failed or unavailable, falling back to local data:", error);
        const mergedMap = new Map<string, Customer>();
        importedCustomers.forEach(c => mergedMap.set(c.id, c));
        localCustom.forEach(c => mergedMap.set(c.id, c));
        const mergedList = Array.from(mergedMap.values());
        mergedList.sort((a, b) => getSafeTime(b.createdAt) - getSafeTime(a.createdAt));
        setCustomers(mergedList);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase context init failed, falling back to local data:", e);
      const localCustom = getLocalCustomCustomers();
      const mergedMap = new Map<string, Customer>();
      importedCustomers.forEach(c => mergedMap.set(c.id, c));
      localCustom.forEach(c => mergedMap.set(c.id, c));
      const mergedList = Array.from(mergedMap.values());
      mergedList.sort((a, b) => getSafeTime(b.createdAt) - getSafeTime(a.createdAt));
      setCustomers(mergedList);
      setLoading(false);
    }
  }, []);

  const addCustomer = async (newCustomer: Customer) => {
    try {
      if (!newCustomer.kundenNummer) {
        let maxNumber = 0;
        customers.forEach(c => {
          if (c.kundenNummer && c.kundenNummer.startsWith('HUBI')) {
            const numPart = parseInt(c.kundenNummer.replace('HUBI', ''), 10);
            if (!isNaN(numPart) && numPart > maxNumber) {
              maxNumber = numPart;
            }
          }
        });
        const nextNumber = maxNumber + 1;
        newCustomer.kundenNummer = `HUBI${nextNumber.toString().padStart(4, '0')}`;
      }

      if (!newCustomer.createdAt) {
        newCustomer.createdAt = new Date().toISOString();
      }

      // Save to localStorage immediately
      saveLocalCustomCustomer(newCustomer);

      // Optimistic state update so customer is immediately displayed at top
      setCustomers(prev => {
        const filtered = prev.filter(c => c.id !== newCustomer.id);
        return [newCustomer, ...filtered];
      });

      const { firestore } = initializeFirebase();
      if (firestore) {
        await setDoc(doc(firestore, 'customers', newCustomer.id), cleanFirestoreData(newCustomer));
      }
    } catch (error) {
      console.error("Error adding customer to Firestore:", error);
      saveLocalCustomCustomer(newCustomer);
      setCustomers(prev => {
        const filtered = prev.filter(c => c.id !== newCustomer.id);
        return [newCustomer, ...filtered];
      });
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { firestore } = initializeFirebase();
      if (firestore) {
        const docRef = doc(firestore, 'customers', id);
        await deleteDoc(docRef);
      }
      setCustomers(prev => prev.filter(c => c.id !== id));
      if (activeCustomer?.id === id) {
        setActiveCustomer(null);
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      throw err;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      let mergedCustomer: Customer | undefined;
      let previousCustomer: Customer | undefined;
      setCustomers(prev => {
        return prev.map(c => {
          if (c.id === id) {
            previousCustomer = { ...c };
            // Deep merge zusatzoptionen, abholadresse, zieladresse, gegenstaende, umzugsdetails
            const merged = {
              ...c,
              ...updates,
              abholadresse: updates.abholadresse ? updates.abholadresse : c.abholadresse,
              zieladresse: updates.zieladresse ? updates.zieladresse : c.zieladresse,
              zusatzoptionen: updates.zusatzoptionen ? updates.zusatzoptionen : c.zusatzoptionen,
              gegenstaende: updates.gegenstaende ? updates.gegenstaende : c.gegenstaende,
              umzugsdetails: updates.umzugsdetails ? updates.umzugsdetails : c.umzugsdetails,
            };
            mergedCustomer = merged;
            return merged;
          }
          return c;
        });
      });

      if (mergedCustomer && previousCustomer) {
        undoStackRef.current.push({ id, previousState: previousCustomer });
        // Keep stack size reasonable
        if (undoStackRef.current.length > 50) {
          undoStackRef.current.shift();
        }

        updateLocalCustomCustomer(id, mergedCustomer);
        setActiveCustomer(prev => prev && prev.id === id ? mergedCustomer! : prev);
        
        const { firestore } = initializeFirebase();
        if (firestore) {
          // Use setDoc with the fully merged customer to prevent accidental nested field deletion
          await setDoc(doc(firestore, 'customers', id), cleanFirestoreData(mergedCustomer), { merge: true });
        }
      }
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  const syncImportedData = async () => {
    try {
      const { firestore } = initializeFirebase();
      if (!firestore) return;
      for (const c of importedCustomers) {
        await setDoc(doc(firestore, 'customers', c.id), cleanFirestoreData(c));
      }
    } catch (error) {
      console.error("Error syncing imported data to Firestore:", error);
    }
  };

  const mergeDuplicateCustomers = async () => {
    try {
      const { firestore } = initializeFirebase();
      if (!firestore) return { mergedCount: 0, removedCount: 0 };

      const groups = new Map<string, Customer[]>();
      
      customers.forEach(cust => {
        const email = cust.email?.trim().toLowerCase();
        const name = cust.name?.trim().toLowerCase() || cust.nameLower || '';
        
        let key = '';
        if (email && email.length > 3) {
          key = `email:${email}`;
        } else if (name && name.length > 2) {
          key = `name:${name}`;
        } else {
          key = `id:${cust.id}`;
        }
        
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(cust);
      });

      let totalMergedGroups = 0;
      let totalRemovedDuplicates = 0;

      for (const [key, group] of groups.entries()) {
        if (key.startsWith('id:')) continue;
        if (group.length > 1) {
          totalMergedGroups++;
          
          group.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateA - dateB;
          });

          const primary = group[0];
          const duplicates = group.slice(1);
          
          const updates: Partial<Customer> = {};
          let needsUpdate = false;

          duplicates.forEach(dup => {
            const fieldsToMerge: (keyof Customer)[] = [
              'kundenNummer', 'firma', 'name', 'email', 'phone', 'avatarUrl', 'driveFolderId', 'transcript', 'anmerkungen', 'kiAufgabenliste', 'routeBreakdown'
            ];
            fieldsToMerge.forEach(field => {
              if (!primary[field] && dup[field]) {
                (updates as any)[field] = dup[field];
                (primary as any)[field] = dup[field];
                needsUpdate = true;
              }
            });

            if (dup.address) {
              updates.address = updates.address || { ...primary.address };
              let addressChanged = false;
              ['street', 'city', 'zip', 'country'].forEach(k => {
                const k2 = k as keyof typeof primary.address;
                if (!primary.address?.[k2] && dup.address?.[k2]) {
                  updates.address![k2] = dup.address[k2];
                  addressChanged = true;
                }
              });
              if (addressChanged) needsUpdate = true;
            }

            const nestedObjects = ['abholadresse', 'lieferadresse', 'umzugsdetails', 'zieladresse', 'zusatzoptionen', 'gegenstaende'];
            nestedObjects.forEach(nestedKey => {
              const objKey = nestedKey as keyof Customer;
              if (dup[objKey]) {
                if (!primary[objKey]) {
                  (updates as any)[objKey] = dup[objKey];
                  (primary as any)[objKey] = dup[objKey];
                  needsUpdate = true;
                } else {
                  updates[objKey] = { ...(primary[objKey] as any) };
                  let objChanged = false;
                  for (const subKey in (dup[objKey] as any)) {
                    if (!(primary[objKey] as any)[subKey] && (dup[objKey] as any)[subKey]) {
                      (updates as any)[objKey][subKey] = (dup[objKey] as any)[subKey];
                      (primary as any)[objKey][subKey] = (dup[objKey] as any)[subKey];
                      objChanged = true;
                    }
                  }
                  if (objChanged) needsUpdate = true;
                }
              }
            });
            
            if (dup.inventar && dup.inventar.length > 0 && (!primary.inventar || primary.inventar.length === 0)) {
               updates.inventar = dup.inventar;
               primary.inventar = dup.inventar;
               needsUpdate = true;
            }
            if (dup.additionalServices && dup.additionalServices.length > 0 && (!primary.additionalServices || primary.additionalServices.length === 0)) {
               updates.additionalServices = dup.additionalServices;
               primary.additionalServices = dup.additionalServices;
               needsUpdate = true;
            }
            
            const booleanFlags: (keyof Customer)[] = [
              'isCancelled', 'arPaid', 'rechnungPaid', 'isCompleted', 'hasInvoiceCreated', 'arCreated', 'reCreated'
            ];
            booleanFlags.forEach(flag => {
              if (dup[flag] && !primary[flag]) {
                (updates as any)[flag] = true;
                (primary as any)[flag] = true;
                needsUpdate = true;
              }
            });
          });

          if (needsUpdate) {
             const cleanUpdates = cleanFirestoreData(updates);
             await updateDoc(doc(firestore, 'customers', primary.id), cleanUpdates);
          }
          
          for (const dup of duplicates) {
            await deleteDoc(doc(firestore, 'customers', dup.id));
            totalRemovedDuplicates++;
          }
        }
      }

      return { mergedCount: totalMergedGroups, removedCount: totalRemovedDuplicates };
    } catch (err) {
      console.error('Error merging duplicates:', err);
      throw err;
    }
  };

  useEffect(() => {
    crmLookupService.setCustomers(customers);
  }, [customers]);

  return (
    <CustomerContext.Provider value={{
      customers,
      loading,
      activeCustomer,
      setActiveCustomer,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      calculationParams,
      setCalculationParams,
      workflowState,
      setWorkflowState,
      syncImportedData,
      mergeDuplicateCustomers
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
