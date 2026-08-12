import type { Customer, OfferDraft, OfferDraftItem } from './types';
import type { OfferItem } from '@/src/contexts/offer-context';
import { ITEM_CBM_DEFAULTS } from './item-cbm-defaults';

export function parseDistanceHelper(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 10;
  const str = String(val).toLowerCase();
  if (str.includes('0–5') || str.includes('0-5')) return 3;
  if (str.includes('5–10') || str.includes('5-10')) return 8;
  if (str.includes('10–15') || str.includes('10-15')) return 13;
  if (str.includes('15–20') || str.includes('15-20')) return 18;
  const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 10 : num;
}

export function parseFloorHelper(val: any): number {
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
}

export function parseElevatorHelper(val: any): 'none' | 'small' | 'medium' | 'large' {
  if (!val) return 'none';
  const str = String(val).toLowerCase();
  if (str === 'none' || str === 'nein' || str.includes('kein')) return 'none';
  if (str === 'ja' || str.includes('klein') || str === 'small') return 'small';
  if (str.includes('mittel') || str === 'medium') return 'medium';
  if (str.includes('groß') || str.includes('gross') || str === 'large' || str.includes('lasten')) return 'large';
  return 'small';
}

export function parseHelpersHelper(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : Math.min(4, Math.max(0, num));
}

export function buildCalculationCostItems(
  customer: Customer,
  customParams?: any
): { items: OfferItem[]; totalM3: number; subtotal: number } {
  let totalM3 = customer.geminiVolumeEstimate?.totalM3 || 0;
  if (totalM3 === 0 && customer.gegenstaende) {
    Object.entries(customer.gegenstaende).forEach(([key, val]) => {
      const count = Number(val) || 0;
      if (count > 0) {
        let m3Size = 0.2;
        Object.values(ITEM_CBM_DEFAULTS).forEach(roomItems => {
          const item = roomItems.find(i => i.key === key);
          if (item) m3Size = item.cbm;
        });
        totalM3 += count * m3Size;
      }
    });
  }
  if (totalM3 === 0) totalM3 = 12.5;

  const pickupDistance = customParams?.pickupDistance ?? parseDistanceHelper(customer.abholadresse?.entfernungLKW);
  const destinationDistance = customParams?.destinationDistance ?? parseDistanceHelper(customer.zieladresse?.entfernungLKW);
  const pickupFloor = customParams?.pickupFloor ?? parseFloorHelper(customer.abholadresse?.stockwerk);
  const destinationFloor = customParams?.destinationFloor ?? parseFloorHelper(customer.zieladresse?.stockwerk);
  const pickupElevator = customParams?.pickupElevator ?? parseElevatorHelper(customer.abholadresse?.aufzugsgroesse || customer.abholadresse?.aufzug);
  const destinationElevator = customParams?.destinationElevator ?? parseElevatorHelper(customer.zieladresse?.aufzugsgroesse || customer.zieladresse?.aufzug);
  const selfProvidedPersonnel = customParams?.selfProvidedPersonnel ?? parseHelpersHelper(customer.zusatzoptionen?.helfer);
  const buildingType = customParams?.buildingType ?? ((customer.abholadresse?.gebaeudetyp?.toLowerCase().includes('altbau') || customer.zieladresse?.gebaeudetyp?.toLowerCase().includes('altbau')) ? 'altbau' : 'neubau');
  const hvzCount = customParams?.hvzCount ?? (customer.nebenleistungen?.einrichtenHVZ ? (customer.abholadresse?.strasse && customer.zieladresse?.strasse ? 2 : 1) : 0);
  const distanceKm = customParams?.distanceKm ?? (customer.totalKm ?? 20);

  const elevatorFactorPickup = pickupElevator === 'small' ? 0.7 : pickupElevator === 'medium' ? 0.5 : pickupElevator === 'large' ? 0.3 : 1;
  const elevatorFactorDest = destinationElevator === 'small' ? 0.7 : destinationElevator === 'medium' ? 0.5 : destinationElevator === 'large' ? 0.3 : 1;

  const manHoursBase = totalM3 * 0.8;
  const floorFactor = (pickupFloor * 0.1 * elevatorFactorPickup) + (destinationFloor * 0.1 * elevatorFactorDest);
  const carryFactor = (pickupDistance * 0.006) + (destinationDistance * 0.006);
  const helpersDeduction = selfProvidedPersonnel * 0.25;
  const buildingFactor = buildingType === 'altbau' ? 1.15 : 1.0;
  const estimatedHours = Math.max(3, Math.round(manHoursBase * (1 + floorFactor + carryFactor) * buildingFactor * (1 - Math.min(0.5, helpersDeduction))));

  const requiredWorkers = totalM3 < 15 ? 2 : totalM3 < 30 ? 3 : totalM3 < 45 ? 4 : 5;
  const workerRate = 45;

  const isLKW12 = totalM3 > 35;
  const isLKW7 = totalM3 > 18 && totalM3 <= 35;
  const vehicleRate = isLKW12 ? 85 : isLKW7 ? 65 : 45;
  const vehicleLabel = isLKW12 ? 'LKW 12t' : isLKW7 ? 'LKW 7.5t' : 'Sprinter 3.5t';
  const speed = isLKW12 ? 65 : isLKW7 ? 70 : 80;
  const drivingTime = distanceKm / speed;
  const totalHours = estimatedHours + drivingTime;

  const travelPrice = Math.round(totalHours * vehicleRate);
  const carryingPrice = Math.round(totalHours * requiredWorkers * workerRate);
  const assemblyPrice = customer.nebenleistungen?.moebelmontage ? 220 : 0;
  const hvzPrice = hvzCount * 120;

  const country = customer.address?.country?.toLowerCase() || '';
  let tollRate = 0.18;
  if (country.includes('de') || country.includes('deutschland')) tollRate = 0.15;
  let tollPrice = Math.round(distanceKm * tollRate);
  if (country.includes('ch') || country.includes('schweiz') || country.includes('switzerland')) tollPrice = 40;

  const isOvernight = distanceKm > 400;
  const overnightPrice = isOvernight ? requiredWorkers * 90 : 0;

  const items: OfferItem[] = [
    {
      id: 'cost_travel',
      description: `Fahrzeugbereitstellung & Fahrtzeit (${vehicleLabel} - ${vehicleRate}€/h)`,
      quantity: 1,
      unitPrice: travelPrice,
      total: travelPrice
    },
    {
      id: 'cost_labor',
      description: `Trägerleistung & Umzugsservice (${requiredWorkers} Mann x ${workerRate}€/h)`,
      quantity: 1,
      unitPrice: carryingPrice,
      total: carryingPrice
    }
  ];

  if (assemblyPrice > 0) {
    items.push({
      id: 'cost_assembly',
      description: 'Möbelmontage & Demontage Pauschale',
      quantity: 1,
      unitPrice: assemblyPrice,
      total: assemblyPrice
    });
  }

  if (hvzPrice > 0) {
    items.push({
      id: 'cost_hvz',
      description: `Behördliche Halteverbotszone (${hvzCount}x)`,
      quantity: hvzCount,
      unitPrice: 120,
      total: hvzPrice
    });
  }

  if (tollPrice > 0) {
    items.push({
      id: 'cost_toll',
      description: `Mautgebühren & Straßenbenutzungsabgaben (${distanceKm} km)`,
      quantity: 1,
      unitPrice: tollPrice,
      total: tollPrice
    });
  }

  if (overnightPrice > 0) {
    items.push({
      id: 'cost_overnight',
      description: `Auslöse & Übernachtungskosten (${requiredWorkers} Personen)`,
      quantity: 1,
      unitPrice: overnightPrice,
      total: overnightPrice
    });
  }

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  return { items, totalM3, subtotal };
}

export function calculateOfferTotals(draft: OfferDraft): OfferDraft {
  // Ensure items totals are individually computed
  const updatedItems: OfferDraftItem[] = (draft.items || []).map(item => ({
    ...item,
    total: Math.round((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) * 100) / 100
  }));

  const selectedItems = updatedItems.filter(item => item.selected !== false);
  const subtotalNet = selectedItems.reduce((acc, item) => acc + item.total, 0);

  let discountAmount = 0;
  if (draft.discountType === 'percent') {
    const val = Number(draft.discountValue) || 0;
    discountAmount = Math.round(subtotalNet * (val / 100) * 100) / 100;
  } else if (draft.discountType === 'fixed') {
    discountAmount = Math.min(subtotalNet, Math.max(0, Number(draft.discountValue) || 0));
  }
  discountAmount = Math.max(0, Math.min(subtotalNet, discountAmount));

  let surchargeAmount = 0;
  if (draft.surchargeType === 'percent') {
    const val = Number(draft.surchargeValue) || 0;
    surchargeAmount = Math.round(subtotalNet * (val / 100) * 100) / 100;
  } else if (draft.surchargeType === 'fixed') {
    surchargeAmount = Math.max(0, Number(draft.surchargeValue) || 0);
  }

  const netTotal = Math.max(0, Math.round((subtotalNet - discountAmount + surchargeAmount) * 100) / 100);
  const vatRate = typeof draft.vatRate === 'number' ? draft.vatRate : 20;
  const vatAmount = Math.round(netTotal * (vatRate / 100) * 100) / 100;
  const grossTotal = Math.round((netTotal + vatAmount) * 100) / 100;

  const depositPercent = typeof draft.depositPercent === 'number' ? Math.max(0, Math.min(100, draft.depositPercent)) : 0;
  const depositAmount = depositPercent > 0 ? Math.round(grossTotal * (depositPercent / 100) * 100) / 100 : (draft.depositAmount || 0);
  const remainingAmount = Math.max(0, Math.round((grossTotal - depositAmount) * 100) / 100);

  return {
    ...draft,
    items: updatedItems,
    subtotalNet: Math.round(subtotalNet * 100) / 100,
    netTotal,
    vatRate,
    vatAmount,
    grossTotal,
    depositPercent,
    depositAmount,
    remainingAmount,
    updatedAt: new Date().toISOString()
  };
}
