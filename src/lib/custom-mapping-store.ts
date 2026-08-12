import { ITEM_CBM_DEFAULTS } from './item-cbm-defaults';

export interface CustomMapping {
  key: string;
  name: string;
  cbm: number;
  savedAt: string;
}

const STORAGE_KEY = 'app_custom_item_mappings';

export function getCustomMappings(): CustomMapping[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error("Error reading custom item mappings from localStorage:", e);
  }
  return [];
}

export function saveCustomMapping(name: string, cbm: number): CustomMapping {
  const cleanName = name.trim();
  const cleanKey = `custom_mapped_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const newMapping: CustomMapping = {
    key: cleanKey,
    name: cleanName,
    cbm: Math.max(0.01, Math.round(cbm * 100) / 100),
    savedAt: new Date().toISOString()
  };

  try {
    const current = getCustomMappings();
    const existingIdx = current.findIndex(m => 
      m.name.toLowerCase() === cleanName.toLowerCase() || m.key === cleanKey
    );
    if (existingIdx >= 0) {
      current[existingIdx] = newMapping;
    } else {
      current.unshift(newMapping);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('custom_mappings_updated'));
  } catch (e) {
    console.error("Error saving custom item mapping:", e);
  }

  return newMapping;
}

export function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]/gi, '')
    .trim();
}

export function estimateCbmForUnknownItem(name: string): number {
  if (!name) return 0.4;
  const lower = name.toLowerCase().trim();

  if (lower.includes('schrank') || lower.includes('kast') || lower.includes('garderobe') || lower.includes('vitrine') || lower.includes('buffet') || lower.includes('anrichte') || lower.includes('sideboard') || lower.includes('kommode')) {
    if (lower.includes('groß') || lower.includes('3-türig') || lower.includes('4-türig') || lower.includes('schiebetür')) return 1.8;
    return 1.0;
  }
  if (lower.includes('bett') || lower.includes('matratze') || lower.includes('futon') || lower.includes('boxspring')) {
    if (lower.includes('doppel')) return 1.5;
    return 1.0;
  }
  if (lower.includes('couch') || lower.includes('sofa') || lower.includes('landschaft')) {
    if (lower.includes('eck') || lower.includes('3-sitzer') || lower.includes('big')) return 1.8;
    return 1.2;
  }
  if (lower.includes('sessel') || lower.includes('relax')) return 0.6;
  if (lower.includes('tisch') || lower.includes('pult')) {
    if (lower.includes('couch') || lower.includes('beistell')) return 0.3;
    return 0.7;
  }
  if (lower.includes('stuhl') || lower.includes('hocker') || lower.includes('bank') || lower.includes('sesseln')) return 0.25;
  if (lower.includes('karton') || lower.includes('kiste') || lower.includes('box') || lower.includes('paket') || lower.includes('tasche')) return 0.15;
  if (lower.includes('waschmaschine') || lower.includes('trockner') || lower.includes('geschirr') || lower.includes('kühlschrank') || lower.includes('herd') || lower.includes('tiefkühl')) return 0.6;
  if (lower.includes('klavier') || lower.includes('piano') || lower.includes('flügel') || lower.includes('tresor')) return 1.5;
  if (lower.includes('tv') || lower.includes('fernseher') || lower.includes('monitor') || lower.includes('bildschirm')) return 0.2;
  if (lower.includes('fahrrad') || lower.includes('bike') || lower.includes('roller') || lower.includes('rasenmäh')) return 0.5;
  if (lower.includes('spiegel') || lower.includes('bild') || lower.includes('lampe') || lower.includes('teppich')) return 0.15;
  if (lower.includes('regal') || lower.includes('board')) return 0.5;

  return 0.4;
}

/**
 * Checks if an item key or name is in standard ITEM_CBM_DEFAULTS or custom_mappings
 */
export function findItemInDefaultsOrCustom(keyOrName: string): { name: string; cbm: number; isMapped: boolean; source: 'default' | 'custom' | 'none' } {
  if (!keyOrName) return { name: 'Unbekannt', cbm: 0.4, isMapped: false, source: 'none' };

  // 1. Check custom saved mappings first
  const customList = getCustomMappings();
  const matchedCustom = customList.find(m => 
    m.key === keyOrName || 
    m.name.toLowerCase() === keyOrName.toLowerCase() ||
    normalizeName(m.name) === normalizeName(keyOrName)
  );
  if (matchedCustom) {
    return { name: matchedCustom.name, cbm: matchedCustom.cbm, isMapped: true, source: 'custom' };
  }

  // 2. Check standard ITEM_CBM_DEFAULTS
  const normKeyOrName = normalizeName(keyOrName);
  for (const roomItems of Object.values(ITEM_CBM_DEFAULTS)) {
    for (const item of roomItems) {
      if (
        item.key === keyOrName ||
        item.name.toLowerCase() === keyOrName.toLowerCase() ||
        normalizeName(item.key) === normKeyOrName ||
        normalizeName(item.name) === normKeyOrName
      ) {
        return { name: item.name, cbm: item.cbm, isMapped: true, source: 'default' };
      }
    }
  }

  // 3. Handle key format: custom_Name_Cbm
  if (keyOrName.startsWith('custom_')) {
    const parts = keyOrName.split('_');
    if (parts.length >= 3) {
      const parsedName = parts.slice(1, parts.length - 1).join(' ');
      const parsedCbm = parseFloat(parts[parts.length - 1]);
      if (!isNaN(parsedCbm) && parsedCbm > 0) {
        // Check if name is in custom store
        const found = customList.find(m => normalizeName(m.name) === normalizeName(parsedName));
        if (found) {
          return { name: found.name, cbm: found.cbm, isMapped: true, source: 'custom' };
        }
        return { name: parsedName, cbm: parsedCbm, isMapped: false, source: 'none' };
      }
    }
  }

  // Fallback prettified name and smart KI estimation
  const prettyName = keyOrName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim();

  const estimatedCbm = estimateCbmForUnknownItem(prettyName);

  return { name: prettyName, cbm: estimatedCbm, isMapped: false, source: 'none' };
}

export type ItemMappingStatus = 'green' | 'yellow' | 'red';

export interface ItemStatusInfo {
  status: ItemMappingStatus;
  name: string;
  cbm: number;
  source: 'default' | 'custom' | 'ai' | 'unmapped';
  label: string;
}

export function getItemMappingStatus(key: string, currentCbm?: number): ItemStatusInfo {
  const result = findItemInDefaultsOrCustom(key);

  if (result.isMapped) {
    return {
      status: 'green',
      name: result.name,
      cbm: result.cbm,
      source: result.source === 'custom' ? 'custom' : 'default',
      label: 'Gemappt (In Datenbank)'
    };
  }

  // Not directly mapped in default/custom list
  const effectiveCbm = typeof currentCbm === 'number' && currentCbm > 0 ? currentCbm : result.cbm;

  if (effectiveCbm > 0) {
    return {
      status: 'yellow',
      name: result.name,
      cbm: effectiveCbm,
      source: 'ai',
      label: 'KI-Geschätzt'
    };
  }

  return {
    status: 'red',
    name: result.name,
    cbm: effectiveCbm > 0 ? effectiveCbm : 0,
    source: 'unmapped',
    label: 'Nicht gemappt / m³ erforderlich'
  };
}
