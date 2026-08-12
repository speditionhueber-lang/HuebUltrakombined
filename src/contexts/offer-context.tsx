'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Customer } from '@/src/lib/types';

export interface OfferItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OfferContextType {
  offerItems: OfferItem[];
  setOfferItems: React.Dispatch<React.SetStateAction<OfferItem[]>>;
  discount: number; // percentage (e.g. 0.05 for 5%)
  setDiscount: (discount: number) => void;
  additionalCosts: number;
  setAdditionalCosts: (costs: number) => void;
  resetOffer: () => void;
  loadItemsForCustomer: (customer: Customer) => void;
}

const OfferContext = createContext<OfferContextType | undefined>(undefined);

export function OfferProvider({ children }: { children: React.ReactNode }) {
  const [offerItems, setOfferItems] = useState<OfferItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [additionalCosts, setAdditionalCosts] = useState<number>(0);

  const resetOffer = () => {
    setOfferItems([]);
    setDiscount(0);
    setAdditionalCosts(0);
  };

  const loadItemsForCustomer = (customer: Customer) => {
    // Generate some automatic offer items based on customer data
    const items: OfferItem[] = [];
    
    // Add base volume-based moving item
    let volumeM3 = 0;
    if (customer.gegenstaende) {
      // Simple sum of count values
      Object.entries(customer.gegenstaende).forEach(([key, value]) => {
        const count = typeof value === 'number' ? value : parseInt(String(value), 10);
        if (!isNaN(count) && count > 0) {
          volumeM3 += count * 0.2; // default 0.2 m3 per item as fallback
        }
      });
    }

    if (volumeM3 === 0) volumeM3 = 10; // baseline fallback

    items.push({
      id: 'item_base_moving',
      description: `Umzugsservice Pauschale (basierend auf ca. ${volumeM3.toFixed(1)} m³)`,
      quantity: 1,
      unitPrice: Math.round(volumeM3 * 45 * 1.5), // simple formula
      total: Math.round(volumeM3 * 45 * 1.5),
    });

    // Check auxiliary services
    if (customer.nebenleistungen) {
      if (customer.nebenleistungen.einrichtenHVZ) {
        items.push({
          id: 'item_hvz',
          description: 'Halteverbotszone einrichten & einholen',
          quantity: 1,
          unitPrice: 120,
          total: 120,
        });
      }
      if (customer.nebenleistungen.moebelmontage) {
        items.push({
          id: 'item_montage',
          description: 'Professionelle Möbelmontage',
          quantity: 4,
          unitPrice: 55,
          total: 220,
        });
      }
      if (customer.nebenleistungen.transportVersicherung) {
        items.push({
          id: 'item_insurance',
          description: 'Spezielle Transport-Zusatzversicherung',
          quantity: 1,
          unitPrice: 85,
          total: 85,
        });
      }
    }

    setOfferItems(items);
  };

  return (
    <OfferContext.Provider value={{
      offerItems,
      setOfferItems,
      discount,
      setDiscount,
      additionalCosts,
      setAdditionalCosts,
      resetOffer,
      loadItemsForCustomer
    }}>
      {children}
    </OfferContext.Provider>
  );
}

export function useOffer() {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error('useOffer must be used within an OfferProvider');
  }
  return context;
}
