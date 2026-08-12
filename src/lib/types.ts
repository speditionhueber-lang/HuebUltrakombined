export interface RouteBreakdown {
  depotToPickup: number;
  pickupToDest: number;
  destToDepot: number;
  totalKm: number;
  googleMapsUrl: string;
  source: 'api' | 'fallback';
}

export type DraftField<T = string | number | boolean> = {
  value: T | null;
  recognized: boolean;
  confidence: 'low' | 'medium' | 'high';
  source: string;
  originalValue?: T | null;
  corrected?: boolean;
  validationError?: string;
};

export type DraftAddressField = {
  street?: DraftField<string>;
  zip?: DraftField<string>;
  city?: DraftField<string>;
  raw?: DraftField<string>;
};

export interface DraftCorrection {
  field: string;
  previousValue: any;
  newValue: any;
  timestamp: string;
  user: string;
}

export interface CustomerDraft {
  id: string;
  caseId: string;
  sourceEventId: string;
  source: 'Outlook' | 'Manual' | 'AI';
  status: 'draft' | 'edited' | 'approved' | 'rejected' | 'converted';
  createdAt: string;
  updatedAt: string;
  confidence: 'low' | 'medium' | 'high';
  fields: {
    name: DraftField<string>;
    email: DraftField<string>;
    phone: DraftField<string>;
    company?: DraftField<string>;
    pickupAddress: DraftAddressField;
    destinationAddress: DraftAddressField;
    moveDate?: DraftField<string>;
    apartmentSize?: DraftField<string>;
    notes?: DraftField<string>;
  };
  originalExtractedData?: unknown;
  corrections?: DraftCorrection[];
  convertedCustomerId?: string;
}

export type CustomerDraftStatus = CustomerDraft['status'];
export type CustomerDraftUpdate = Partial<CustomerDraft>;
export type CustomerDraftConversionResult = { success: boolean; customerId?: string; error?: string };

export interface CustomerMatchCandidate {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  score: number;
  matchedFields: string[];
  conflictingFields: string[];
}

export interface CustomerFieldComparison {
  field: string;
  label: string;
  currentValue: string | null;
  detectedValue: string | null;
  confidence: 'high' | 'medium' | 'low';
  matchStatus: 'equal' | 'missing_in_crm' | 'conflicting' | 'missing_in_email';
  selectedForUpdate: boolean;
  source: string;
}

export interface CustomerMatchReview {
  id: string;
  caseId: string;
  sourceEventId: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'update_pending' | 'updated';
  matchType: 'exact' | 'multiple';
  createdAt: string;
  updatedAt: string;
  selectedCustomerId?: string;
  candidates: CustomerMatchCandidate[];
  fieldComparisons: CustomerFieldComparison[];
}

export function compareCustomerWithExtractedData(customer: Customer, extractedData: any): CustomerFieldComparison[] {
  if (!customer || !extractedData) return [];

  const getExtractedField = (fieldNames: string[]) => {
    for (const name of fieldNames) {
      if (extractedData[name]) return extractedData[name];
    }
    return null;
  };

  const fieldsConfig: Array<{
    field: string;
    label: string;
    getCurrent: () => string | null;
    getExtracted: () => { value: string | null; confidence: 'high' | 'medium' | 'low' };
    isPhone?: boolean;
  }> = [
    {
      field: 'name',
      label: 'Name',
      getCurrent: () => customer.name || null,
      getExtracted: () => {
        const item = getExtractedField(['senderName', 'name']);
        return { value: item?.value || null, confidence: item?.confidence || 'high' };
      }
    },
    {
      field: 'email',
      label: 'E-Mail',
      getCurrent: () => customer.email || null,
      getExtracted: () => {
        const item = getExtractedField(['email']);
        return { value: item?.value || null, confidence: item?.confidence || 'high' };
      }
    },
    {
      field: 'phone',
      label: 'Telefonnummer',
      isPhone: true,
      getCurrent: () => customer.phone || null,
      getExtracted: () => {
        const item = getExtractedField(['phone']);
        return { value: item?.value || null, confidence: item?.confidence || 'high' };
      }
    },
    {
      field: 'firma',
      label: 'Firma',
      getCurrent: () => (customer as any).firma || null,
      getExtracted: () => {
        const item = getExtractedField(['company', 'firma']);
        return { value: item?.value || null, confidence: item?.confidence || 'low' };
      }
    },
    {
      field: 'pickupAddress',
      label: 'Abholadresse',
      getCurrent: () => {
        if (customer.abholadresse?.strasse) {
          const parts = [customer.abholadresse.strasse, customer.abholadresse.plz, customer.abholadresse.ort].filter(Boolean);
          return parts.join(', ');
        }
        if (customer.address?.street) {
          const parts = [customer.address.street, customer.address.zip, customer.address.city].filter(Boolean);
          return parts.join(', ');
        }
        return null;
      },
      getExtracted: () => {
        const item = getExtractedField(['pickupAddress', 'sourceAddress']);
        return { value: item?.value || null, confidence: item?.confidence || 'high' };
      }
    },
    {
      field: 'destinationAddress',
      label: 'Zieladresse',
      getCurrent: () => {
        if (customer.zieladresse?.strasse) {
          const parts = [customer.zieladresse.strasse, customer.zieladresse.plz, customer.zieladresse.ort].filter(Boolean);
          return parts.join(', ');
        }
        return null;
      },
      getExtracted: () => {
        const item = getExtractedField(['destinationAddress', 'targetAddress']);
        return { value: item?.value || null, confidence: item?.confidence || 'high' };
      }
    },
    {
      field: 'moveDate',
      label: 'Umzugstermin',
      getCurrent: () => customer.umzugsdetails?.gewuenschterUmzugstermin || (customer as any).moveDate || null,
      getExtracted: () => {
        const item = getExtractedField(['moveDate']);
        return { value: item?.value || null, confidence: item?.confidence || 'high' };
      }
    },
    {
      field: 'apartmentSize',
      label: 'Wohnungsgröße',
      getCurrent: () => customer.umzugsdetails?.umzugsgroesse || (customer as any).apartmentSize || null,
      getExtracted: () => {
        const item = getExtractedField(['volumeEstimate', 'apartmentSize']);
        return { value: item?.value || null, confidence: item?.confidence || 'medium' };
      }
    }
  ];

  const comparisons: CustomerFieldComparison[] = [];

  for (const cfg of fieldsConfig) {
    const currentVal = cfg.getCurrent();
    const extracted = cfg.getExtracted();
    const detectedVal = extracted.value;
    const confidence = extracted.confidence;

    let matchStatus: CustomerFieldComparison['matchStatus'] = 'equal';

    const strCurrent = currentVal != null ? String(currentVal) : '';
    const strDetected = detectedVal != null ? String(detectedVal) : '';

    const normCurrent = cfg.isPhone
      ? strCurrent.replace(/[^0-9+]/g, '').replace(/^00/, '+')
      : strCurrent.trim().toLowerCase().replace(/\s+/g, ' ');

    const normDetected = cfg.isPhone
      ? strDetected.replace(/[^0-9+]/g, '').replace(/^00/, '+')
      : strDetected.trim().toLowerCase().replace(/\s+/g, ' ');

    if (!normCurrent && !normDetected) {
      matchStatus = 'equal';
    } else if (normCurrent && normDetected && normCurrent === normDetected) {
      matchStatus = 'equal';
    } else if (!normCurrent && normDetected) {
      matchStatus = 'missing_in_crm';
    } else if (normCurrent && !normDetected) {
      matchStatus = 'missing_in_email';
    } else {
      matchStatus = 'conflicting';
    }

    // Rule:
    // Only pre-select if field is missing in CRM AND confidence is high.
    // Conflicting values are NEVER pre-selected!
    // Low/medium confidence values are NEVER pre-selected!
    const selectedForUpdate = matchStatus === 'missing_in_crm' && confidence === 'high';

    comparisons.push({
      field: cfg.field,
      label: cfg.label,
      currentValue: currentVal,
      detectedValue: detectedVal,
      confidence,
      matchStatus,
      selectedForUpdate,
      source: 'AI'
    });
  }

  return comparisons;
}

export function buildCustomerUpdateFromComparisons(comparisons: CustomerFieldComparison[], customer?: Customer): Partial<Customer> {
  if (!comparisons) return {};

  const updates: Partial<Customer> = {};
  const selectedList = comparisons.filter(c => c.selectedForUpdate && c.detectedValue !== null);

  for (const comp of selectedList) {
    const val = comp.detectedValue!;
    switch (comp.field) {
      case 'name':
        updates.name = val;
        updates.nameLower = val.toLowerCase();
        break;
      case 'email':
        updates.email = val;
        break;
      case 'phone':
        updates.phone = val;
        break;
      case 'firma':
        (updates as any).firma = val;
        break;
      case 'pickupAddress':
        updates.abholadresse = {
          ...(customer?.abholadresse || {}),
          strasse: val
        };
        break;
      case 'destinationAddress':
        updates.zieladresse = {
          ...(customer?.zieladresse || {}),
          strasse: val
        };
        break;
      case 'moveDate':
        updates.umzugsdetails = {
          ...(updates.umzugsdetails || customer?.umzugsdetails || {}),
          gewuenschterUmzugstermin: val
        };
        break;
      case 'apartmentSize':
        updates.umzugsdetails = {
          ...(updates.umzugsdetails || customer?.umzugsdetails || {}),
          umzugsgroesse: val
        };
        break;
    }
  }

  return updates;
}

export type Customer = {
  id: string;
  kundenNummer?: string;
  firma?: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  nameLower: string;
  createdAt: string;
  avatarUrl: string;
  driveFolderId?: string;
  isCancelled?: boolean;
  cancelledAt?: string;
  arPaid?: boolean;
  rechnungPaid?: boolean;
  isCompleted?: boolean;
  completedAt?: string;
  hasInvoiceCreated?: boolean;
  arCreated?: boolean;
  reCreated?: boolean;
  statusDots?: boolean[];
  transcript?: string;
  totalKm?: number;
  routeBreakdown?: RouteBreakdown;
  umzugsdetails?: {
    gewuenschterUmzugstermin?: string;
  umzugsgroesse?: string;
    voraussichtlicheStartzeit?: string;
  };
  abholadresse?: {
    strasse?: string;
    plz?: string;
    ort?: string;
    stockwerk?: string;
    aufzug?: string;
    aufzugsgroesse?: string;
    gebaeudetyp?: string;
    parkplatz?: string;
    alternativeParkmoeglichkeit?: string;
    adresseKoordinatenAlternativ?: string;
    entfernungLKW?: string;
    zeitlicheBeschraenkung?: string;
    besonderheiten?: string;
  };
  zieladresse?: {
    strasse?: string;
    plz?: string;
    ort?: string;
    stockwerk?: string;
    aufzug?: string;
    aufzugsgroesse?: string;
    gebaeudetyp?: string;
    parkplatz?: string;
    alternativeParkmoeglichkeit?: string;
    adresseKoordinatenAlternativ?: string;
    zufahrtsbeschraenkung?: string;
    besonderheiten?: string;
    entfernungLKW?: string;
  };
  rechnungsadresse?: {
    line1?: string;
    line2?: string;
    line3?: string;
    line4?: string;
  };
  zusatzoptionen?: {
    weitereAdressen?: string;
    adresseNr1?: string;
    adresseNr2?: string;
    adresseNr3?: string;
    adresseNr4?: string;
    angebotstyp?: string;
    helfer?: string;
    entfernungLKWZiel?: string;
  };
  gegenstaende?: {
    erfassen?: string;
    kleineUmzugskartons?: string;
    mittlereUmzugskartons?: string;
    grosseUmzugskartons?: string;
    wohnzimmer?: boolean;
    sitzlandschaft?: string;
    sesselMitArmlehnenWZ?: string;
    sesselOhneArmlehnenWZ?: string;
    stuhlWZ?: string;
    stuhlMitArmlehnenWZ?: string;
    tischBis0_6mWZ?: string;
    tischBis1_0mWZ?: string;
    tischBis1_2mWZ?: string;
    tischUeber1_2mWZ?: string;
    wohnzimmerschrank?: string;
    anbauwandBis38cm?: string;
    anbauwandUeber38cm?: string;
    buecherregal?: string;
    buffetMitAufsatz?: string;
    standuhr?: string;
    schreibtischBis1_6mWZ?: string;
    schreibtischUeber1_6mWZ?: string;
    sekretaer?: string;
    sideboardWZ?: string;
    musikschrank?: string;
    fernseher?: string;
    klavier?: string;
    fluegel?: string;
    phonoTVMoebel?: string;
    naehmaschine?: string;
    stehlampe?: string;
    bilderUeber0_8m?: string;
    deckenlampeWZ?: string;
    luester?: string;
    teppichWZ?: string;
    brueckeWZ?: string;
    computer?: string;
    blumenKlein?: string;
    blumenMittel?: string;
    blumenGross?: string;
    cdStaender?: string;
    schlafzimmer?: boolean;
    schrankBis2TuerenSZ?: string;
    schrankZerlegbarSZ?: string;
    doppelbett?: string;
    einzelbett?: string;
    franzBett?: string;
    bettzeug?: string;
    nachttischSZ?: string;
    bettumbau?: string;
    kommodeSZ?: string;
    frisierkommode?: string;
    waeschetruhe?: string;
    stuhlHockerSZ?: string;
    spiegelUeber0_8m?: string;
    deckenlampeSZ?: string;
    bilderUeber0_80mSZ?: string;
    blumenGroesseSZ?: string;
    kueche?: boolean;
    buffetMitAufsatzKueche?: string;
    unterteilKueche?: string;
    oberteilKueche?: string;
    tischBis0_6mK?: string;
    tischBis1_0mK?: string;
    tischBis1_2mK?: string;
    tischUeber1_2mK?: string;
    stuhlK?: string;
    eckbankK?: string;
    besenschrank?: string;
    herdMikrowelle?: string;
    geschirrspuelmaschine?: string;
    waschmaschineTrockner?: string;
    kuehlschrankBis120l?: string;
    kuehlschrankUeber120l?: string;
    arbeitsplatte?: string;
    deckenlampeK?: string;
    teppichK?: string;
    dieleBad?: boolean;
    truheKommodeDiele?: string;
    hutKleiderablage?: string;
    stuhlHockerDiele?: string;
    toilettenschrank?: string;
    waeschepuff?: string;
    teppichBZ?: string;
    deckenlampeBZ?: string;
    esszimmer?: boolean;
    stuhlEZ?: string;
    stuhlMitArmlehnenEZ?: string;
    eckbankEZ?: string;
    tischBis1_0mEZ?: string;
    tischBis1_2mEZ?: string;
    tischUeber1_2mEZ?: string;
    buffetOhneAufsatz?: string;
    vitrine?: string;
    sideboardEZ?: string;
    hausbar?: string;
    teewagen?: string;
    teppichEZ?: string;
    brueckeEZ?: string;
    deckenlampeEZ?: string;
    blumenGroesseEZ?: string;
    kinderzimmer?: boolean;
    schrankBis2TuerenKZ?: string;
    schrankZerlegbarKZ?: string;
    bettKomplettKZ?: string;
    kinderbett?: string;
    etagenbett?: string;
    bettzeugKZ?: string;
    nachttischKZ?: string;
    kommodeKZ?: string;
    schreibpult?: string;
    spielkiste?: string;
    regaleKZ?: string;
    tischBis1_0mKZ?: string;
    rutsche?: string;
    tischUeber1_2mKZ?: string;
    laufgitter?: string;
    kinderregalNieder?: string;
    teppichKZ?: string;
    brueckeKZ?: string;
    anbauwandBis38cmKZ?: string;
    anbauwandUeber38cmKZ?: string;
    deckenlampeKZ?: string;
    pcMonitorDruckerKZ?: string;
    schubladen?: string;
    kleiderbehaelter?: string;
    arbeitszimmer?: boolean;
    schreibtischBis1_6mAZ?: string;
    schreibtischUeber1_6mAZ?: string;
    schreibtischstuhl?: string;
    buecherregalAZ?: string;
    aktenschrank?: string;
    buecherregalNiederAZ?: string;
    sesselOhneArmlehnenAZ?: string;
    sesselMitArmlehnenAZ?: string;
    rollcontainer?: string;
    tischBis1_0mAZ?: string;
    tischBis1_2mAZ?: string;
    tischUeber1_2mAZ?: string;
    deckenlampeAZ?: string;
    teppichAZ?: string;
    brueckeAZ?: string;
    pcMonitorDruckerAZ?: string;
    sonstiges?: boolean;
    fahrrad?: string;
    dreirad?: string;
    buegelbrett?: string;
    staubsauger?: string;
    autoreifen?: string;
    koffer?: string;
    klapptischKlappstuhl?: string;
    kinderwagen?: string;
    leiter?: string;
    rasenmaeherMotor?: string;
    rasenmaeherHand?: string;
    moped?: string;
    schubkarre?: string;
    werkbank?: string;
    werkzeugschrank?: string;
    werkzeugkoffer?: string;
    ski?: string;
    schlitten?: string;
    blumenkuebel?: string;
    sonnenschirm?: string;
    tischtennisplatte?: string;
    muelltonne?: string;
    regalZerlegbarSonstige?: string;
    hometrainer?: string;
    sonstigeGegenstaende?: string;
  };
  nebenleistungen?: {
    einrichtenHVZ?: boolean;
    verpacken?: boolean;
    verpackenZerbrechlich?: boolean;
    moebelmontage?: boolean;
    kuechenmontage?: boolean;
    auspacken?: boolean;
    auspackenZerbrechlich?: boolean;
    lampenmontage?: boolean;
    montageVorhangstangen?: boolean;
    transportVersicherung?: boolean;
    beEntladeversicherung?: boolean;
    entfernenWaende?: boolean;
    reinigungsservice?: boolean;
    malerarbeiten?: boolean;
    transportKunst?: boolean;
    expressDirektfahrten?: boolean;
    zwischenlagerung?: boolean;
    einlagerung?: boolean;
    palettieren?: boolean;
    bereitstellungMaterial?: boolean;
    haushaltsaufloesung?: boolean;
  };
  anmerkungen?: string;
  kiAufgabenliste?: string;
  geminiVolumeEstimate?: {
    totalM3: number;
    totalKg: number;
    explanation: string;
    confidence: string;
    recommendedVehicle: string;
    updatedAt?: string;
  };
};

export type Allocation = {
  id: string;
  date: string;
  driver: string;
  workers: string[];
};

export type Job = {
  id: string;
  customerId: string;
  customerName: string;
  email?: string;
  phone?: string;
  status: 'draft' | 'scheduled' | 'done';
  scheduledAt: string;
  abholadresse?: Partial<Customer['abholadresse']>;
  zieladresse?: Partial<Customer['zieladresse']>;
  weitereAdressen?: { address: string }[];
  notes: string;
  createdAt: string;
  vehicles: string[];
  totalM3: number;
  calculatedHours: number;
  allocations?: Allocation[];
  isFinalized?: boolean;
  routeBreakdown?: {
    depotToPickup: number;
    pickupToDest: number;
    destToDepot: number;
    totalKm: number;
    googleMapsUrl: string;
    source: 'api' | 'fallback';
  };
};

export type Invoice = {
  id: string;
  jobId: string;
  customerName: string;
  netTotal: number;
  vatRate: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'storno';
  issuedAt: string;
  paidAt: string | null;
  items: import('@/contexts/offer-context').OfferItem[];
  customer: Customer;
  stornoFor?: string;
};

export type UserRole = 'admin' | 'staff' | 'Arbeiter' | 'Büro' | 'Geschäftsführer' | 'IT Admin' | 'Steuerberater';

export type AppDocument = {
    id: string;
    customerId: string;
    customerName: string;
    type: 'Orientierungsangebot' | 'Anzahlungsrechnung' | 'Rechnung' | 'Lieferschein' | 'Mahnung' | 'Stornorechnung' | 'Storno-Rechnung' | 'Storno-Anzahlungsrechnung' | 'Sonstiges';
    docNumber: string;
    date: string;
    amount?: number;
    dataUrl?: string;
    status?: 'pending' | 'paid' | 'overdue' | 'storno';
    mahnungLevel?: number;
    stornoFor?: string;
    metadata?: StoredDocumentMetadata;
  };

export interface StoredDocumentMetadata {
  storagePath?: string;
  downloadUrl?: string;
  mimeType: string;
  fileName: string;
  size: number;
  checksum?: string;
  storageProvider: 'firebase_storage' | 'local' | 'missing';
  uploadStatus: 'pending' | 'uploading' | 'available' | 'failed' | 'missing';
  uploadedAt?: string;
  updatedAt: string;
}

export interface DocumentUploadInput {
  documentId: string;
  companyId?: string;
  caseId?: string;
  fileName: string;
  mimeType: string;
  dataUrl?: string;
  blob?: Blob | ArrayBuffer | Uint8Array;
  metadata?: Record<string, unknown>;
  customerId?: string;
  customerName?: string;
  docNumber?: string;
  type?: 'Orientierungsangebot' | 'Anzahlungsrechnung' | 'Rechnung' | 'Lieferschein' | 'Mahnung' | 'Stornorechnung' | 'Storno-Rechnung' | 'Storno-Anzahlungsrechnung' | 'Sonstiges';
  amount?: number;
  date?: string;
}

export interface StoredDocument extends AppDocument {
  companyId?: string;
  caseId?: string;
  metadata: StoredDocumentMetadata;
}

export interface EmailRecipient {
  name?: string;
  email: string;
}

export interface RequestedInformationField {
  field: string;
  label: string;
  reason: string;
  required: boolean;
  sourceTaskId?: string;
}

export interface EmailDraftCorrection {
  field: string;
  previousValue: any;
  newValue: any;
  timestamp: string;
  user: string;
}

export interface EmailAttachmentReference {
  id: string;
  documentId: string;
  fileName: string;
  mimeType: 'application/pdf';
  size?: number;
  source: 'document_service';
}

export type EmailDraftStatus = 
  | 'draft'
  | 'edited'
  | 'approved'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'rejected'
  | 'reconciliation_required';

export interface EmailResponseDraft {
  id: string;
  caseId: string;
  sourceEventId: string;
  sourceMessageId?: string;
  internetMessageId?: string;
  conversationId?: string;

  status: EmailDraftStatus;

  purpose:
    | 'request_missing_information'
    | 'acknowledgement'
    | 'schedule_viewing'
    | 'callback_confirmation'
    | 'general_reply'
    | 'offer_delivery'
    | 'invoice_delivery'
    | 'payment_reminder';

  replyMode:
    | 'reply'
    | 'reply_all';

  recipients: EmailRecipient[];
  ccRecipients: EmailRecipient[];

  subject: string;
  bodyText: string;

  originalSubject: string;
  originalSenderEmail: string;

  requestedFields: RequestedInformationField[];

  attachments?: EmailAttachmentReference[];
  offerDraftId?: string;
  invoiceDraftId?: string;
  invoiceId?: string;
  receivableId?: string;
  docNumber?: string;
  grossTotal?: number;
  outstandingAmount?: number;
  dueDate?: string;

  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  sentAt?: string;

  createdBy: 'rule' | 'ai' | 'user';
  confidence: 'low' | 'medium' | 'high';

  corrections: EmailDraftCorrection[];

  outlookDraftMessageId?: string;
  errorMessage?: string;
}

export interface OfferAddressSnapshot {
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  floor?: number;
  elevator?: string;
  buildingType?: string;
  distanceTruck?: number;
}

export interface OfferDraftCorrection {
  field: string;
  previousValue: any;
  newValue: any;
  timestamp: string;
  user: string;
}

export interface OfferDraftItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category?: 'Fahrzeug' | 'Arbeitszeit' | 'Trageleistung' | 'Montage' | 'Verpackung' | 'Halteverbotszone' | 'Maut' | 'Übernachtung' | 'Zusatzleistung' | 'Sonstiges';
  source?: 'AI' | 'Calculation' | 'Manual';
  editable?: boolean;
  selected: boolean;
  confidence?: 'low' | 'medium' | 'high';
}

export type OfferDraftStatus =
  | 'draft'
  | 'edited'
  | 'approved'
  | 'pdf_created'
  | 'ready_to_send'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'failed';

export interface OfferDraft {
  id: string;
  caseId: string;
  customerId: string;
  sourceEventId?: string;

  status: OfferDraftStatus;

  offerType: 'orientation' | 'binding';

  documentNumber?: string;

  currency: 'EUR';

  items: OfferDraftItem[];

  subtotalNet: number;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
  surchargeType?: 'percent' | 'fixed';
  surchargeValue?: number;

  netTotal: number;
  vatRate: number;
  vatAmount: number;
  grossTotal: number;

  depositPercent?: number;
  depositAmount?: number;
  remainingAmount?: number;

  totalM3?: number;
  estimatedHours?: number;
  estimatedWorkers?: number;
  estimatedVehicles?: number;

  pickupAddress?: OfferAddressSnapshot;
  destinationAddress?: OfferAddressSnapshot;
  moveDate?: string;

  notes?: string;
  paymentTerms?: string;
  validityDays?: number;

  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  pdfCreatedAt?: string;
  sentAt?: string;

  corrections: OfferDraftCorrection[];

  documentId?: string;
  previousOfferDraftId?: string;
  pdfDataUrl?: string;
  errorMessage?: string;
}

export interface OfferReadiness {
  readyForOrientationOffer: boolean;
  readyForBindingOffer: boolean;
  missingFields: string[];
  warnings: string[];
}

export type OfferResponseIntent = 
  | 'accepted'
  | 'declined'
  | 'change_requested'
  | 'question'
  | 'callback_requested'
  | 'unclear';

export interface OfferResponseEvidence {
  textExcerpt: string;
  signal: string;
  strength: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface OfferRequestedChange {
  field: string;
  currentValue?: string;
  requestedValue?: string;
  description: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface OfferResponseReview {
  id: string;
  caseId: string;
  offerDraftId: string;
  sourceEventId: string;
  sourceMessageId: string;

  status:
    | 'pending'
    | 'confirmed'
    | 'corrected'
    | 'rejected'
    | 'resolved';

  detectedIntent: OfferResponseIntent;
  finalIntent?: OfferResponseIntent;

  confidence: 'low' | 'medium' | 'high';

  evidence: OfferResponseEvidence[];
  requestedChanges: OfferRequestedChange[];

  summary: string;

  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export type PlanningReadiness = 'ready' | 'missing_information' | 'conflicting_information';

export interface PlanningWarning {
  id: string;
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  field?: string;
}

export interface PlanningAddressData {
  street?: string;
  zip?: string;
  city?: string;
  floor?: string;
  elevator?: boolean;
  walkingDistanceMeters?: number;
  parkingPermitNeeded?: boolean;
}

export interface PlanningData {
  moveDate?: string;
  timeWindow?: string;
  pickupAddress?: PlanningAddressData;
  destinationAddress?: PlanningAddressData;
  estimatedVolumeM3?: number;
  assemblyService?: boolean;
  packingService?: boolean;
  heavyItems?: {
    piano?: boolean;
    safe?: boolean;
    otherHeavy?: string;
  };
  externalElevatorNeeded?: boolean;
  specialNotes?: string;
}

export type PlanningReviewStatus = 'pending' | 'confirmed' | 'edited' | 'completed';

export interface PlanningReview {
  id: string;
  caseId: string;
  customerId: string;
  offerDraftId: string;
  status: PlanningReviewStatus;
  planningData: PlanningData;
  warnings: PlanningWarning[];
  readiness: PlanningReadiness;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export type DispatchReadiness =
  | 'ready'
  | 'missing_resources'
  | 'missing_information'
  | 'conflicting_information'
  | 'blocked';

export type DispatchReviewStatus =
  | 'pending'
  | 'edited'
  | 'confirmed'
  | 'completed';

export interface VehicleSuggestion {
  id: string;
  vehicleType: string;
  count: number;
  reason: string;
  recommended: boolean;
}

export interface CrewSuggestion {
  id: string;
  role: string;
  count: number;
  reason: string;
  recommended: boolean;
}

export interface DurationSuggestion {
  estimatedHours: number;
  bufferHours: number;
  reason: string;
}

export interface DispatchRisk {
  id: string;
  code: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  reason: string;
  ignored?: boolean;
}

export interface DispatchReview {
  id: string;
  caseId: string;
  planningReviewId: string;
  status: DispatchReviewStatus;
  vehicleSuggestion: VehicleSuggestion[];
  crewSuggestion: CrewSuggestion[];
  durationSuggestion: DurationSuggestion;
  riskAnalysis: DispatchRisk[];
  readiness: DispatchReadiness;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface CalendarAddressSnapshot {
  street?: string;
  zip?: string;
  city?: string;
  floor?: string;
  elevator?: boolean;
}

export interface CalendarConflict {
  id: string;
  type:
    | 'vehicle_overlap'
    | 'employee_overlap'
    | 'parallel_case'
    | 'tight_schedule'
    | 'outside_working_hours'
    | 'invalid_time_range'
    | 'duplicate_case';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  conflictingCaseId?: string;
  conflictingEventId?: string;
}

export interface CalendarPlanningWarning {
  id: string;
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  field?: string;
}

export type CalendarPlanningReadiness =
  | 'ready'
  | 'missing_date'
  | 'missing_time'
  | 'missing_vehicle'
  | 'missing_employees'
  | 'conflict'
  | 'incomplete_information'
  | 'blocked';

export interface ProposedSchedule {
  date: string;
  preparationStartTime?: string;
  jobStartTime: string;
  estimatedEndTime: string;
  estimatedDurationMinutes: number;
  travelToPickupMinutes?: number;
  loadingMinutes?: number;
  travelToDestinationMinutes?: number;
  unloadingMinutes?: number;
  bufferMinutes: number;
  pickupAddress: CalendarAddressSnapshot;
  destinationAddress: CalendarAddressSnapshot;
  title: string;
  notes?: string;
}

export interface CalendarPlanningReview {
  id: string;
  caseId: string;
  planningReviewId: string;
  dispatchReviewId: string;
  status:
    | 'pending'
    | 'edited'
    | 'confirmed'
    | 'scheduled'
    | 'failed'
    | 'rejected';
  proposedSchedule: ProposedSchedule;
  selectedVehicleId?: string;
  selectedEmployeeIds: string[];
  conflicts: CalendarConflict[];
  warnings: CalendarPlanningWarning[];
  readiness: CalendarPlanningReadiness;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  scheduledAt?: string;
  calendarEventId?: string;
  errorMessage?: string;
}

export type TourPlanningStatus =
  | 'pending'
  | 'edited'
  | 'confirmed'
  | 'completed'
  | 'failed'
  | 'rejected';

export type TourPlanningReadiness =
  | 'ready'
  | 'missing_depot'
  | 'missing_pickup'
  | 'missing_destination'
  | 'invalid_address'
  | 'missing_route'
  | 'conflicting_schedule'
  | 'incomplete_information'
  | 'blocked';

export interface TourAddressSnapshot {
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  floor?: string;
  elevator?: boolean;
  notes?: string;
}

export interface TourStop {
  id: string;
  type:
    | 'depot_start'
    | 'pickup'
    | 'intermediate'
    | 'destination'
    | 'depot_return';
  order: number;
  label: string;
  address: TourAddressSnapshot;
  plannedArrivalTime?: string;
  plannedDepartureTime?: string;
  estimatedServiceMinutes: number;
  notes?: string;
  source:
    | 'company'
    | 'customer'
    | 'case'
    | 'manual';
}

export interface TourRoute {
  depotStart: TourStop;
  stops: TourStop[];
  depotReturn?: TourStop;
  totalDistanceKm: number;
  totalDrivingMinutes: number;
  estimatedJobMinutes: number;
  totalPlannedMinutes: number;
  bufferMinutes: number;
  tollEstimate?: number;
  routeSource:
    | 'existing_route_breakdown'
    | 'routing_api'
    | 'manual'
    | 'fallback';
  navigationUrl?: string;
  calculatedAt: string;
}

export interface TourPlanningWarning {
  id: string;
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  field?: string;
}

export interface TourRisk {
  id: string;
  type:
    | 'traffic'
    | 'parking'
    | 'border'
    | 'toll'
    | 'long_distance'
    | 'multiple_stops'
    | 'tight_schedule'
    | 'weather'
    | 'access'
    | 'other';
  severity:
    | 'low'
    | 'medium'
    | 'high';
  title: string;
  description: string;
  reason: string;
  acknowledged: boolean;
}

export interface TourPlanningReview {
  id: string;
  caseId: string;
  calendarPlanningReviewId: string;
  calendarEventId?: string;
  status: TourPlanningStatus;
  vehicleId: string;
  route: TourRoute;
  readiness: TourPlanningReadiness;
  warnings: TourPlanningWarning[];
  risks: TourRisk[];
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  errorMessage?: string;
}

export type OperationPreparationStatus =
  | 'pending'
  | 'edited'
  | 'confirmed'
  | 'ready'
  | 'blocked'
  | 'completed'
  | 'rejected';

export type OperationPreparationReadiness =
  | 'ready'
  | 'missing_customer_contact'
  | 'missing_vehicle'
  | 'missing_crew'
  | 'missing_route'
  | 'missing_documents'
  | 'missing_materials'
  | 'unresolved_risks'
  | 'conflicting_information'
  | 'blocked';

export interface OperationAddressSnapshot {
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  floor?: string;
  elevator?: boolean;
  notes?: string;
}

export interface OperationStopSnapshot {
  id: string;
  type: 'depot_start' | 'pickup' | 'intermediate' | 'destination' | 'depot_return';
  order: number;
  label: string;
  address: OperationAddressSnapshot;
  plannedArrivalTime?: string;
  plannedDepartureTime?: string;
  estimatedServiceMinutes: number;
  notes?: string;
}

export interface OperationMaterialRequirement {
  id: string;
  name: string;
  category: string;
  quantityNeeded: number;
  unit: string;
  status: 'needed' | 'confirmed_available' | 'missing' | 'not_required';
  notes?: string;
  source?: 'offer' | 'planning' | 'manual';
}

export interface OperationDocumentRequirement {
  id: string;
  title: string;
  type: 'offer' | 'order_summary' | 'delivery_note' | 'work_order' | 'inventory_list' | 'route_summary' | 'customer_contact' | 'special_notes';
  required: boolean;
  available: boolean;
  documentId?: string;
  fileUrl?: string;
  source: 'document_service' | 'case' | 'manual';
}

export interface OperationChecklistItem {
  id: string;
  category:
    | 'customer'
    | 'vehicle'
    | 'crew'
    | 'route'
    | 'material'
    | 'document'
    | 'parking'
    | 'safety'
    | 'communication'
    | 'other';
  label: string;
  required: boolean;
  completed: boolean;
  blockedReason?: string;
  source:
    | 'case'
    | 'planning'
    | 'dispatch'
    | 'calendar'
    | 'tour'
    | 'manual';
}

export interface OperationPreparationWarning {
  id: string;
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  field?: string;
}

export interface OperationPreparationData {
  jobDate: string;
  preparationTime?: string;
  jobStartTime: string;
  estimatedEndTime: string;
  vehicleId: string;
  employeeIds: string[];
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  pickupAddress: OperationAddressSnapshot;
  destinationAddress: OperationAddressSnapshot;
  intermediateStops: OperationStopSnapshot[];
  totalDistanceKm?: number;
  estimatedDrivingMinutes?: number;
  estimatedWorkingMinutes: number;
  bufferMinutes: number;
  services: string[];
  requiredMaterials: OperationMaterialRequirement[];
  requiredDocuments: OperationDocumentRequirement[];
  specialInstructions: string[];
  notes?: string;
}

export interface CaseReminder {
  id: string;
  caseId: string;
  referenceType:
    | 'operation_preparation'
    | 'customer_confirmation'
    | 'vehicle_check'
    | 'crew_check'
    | 'material_check'
    | 'document_check'
    | 'parking_check'
    | 'job_start'
    | 'other';
  referenceId: string;
  title: string;
  description?: string;
  dueAt: string;
  status:
    | 'scheduled'
    | 'due'
    | 'completed'
    | 'dismissed'
    | 'cancelled';
  priority:
    | 'low' | 'medium' | 'high';
  createdAt: string;
  completedAt?: string;
  notifiedAt?: string;
}

export interface OperationPreparationReview {
  id: string;
  caseId: string;
  planningReviewId: string;
  dispatchReviewId: string;
  calendarPlanningReviewId: string;
  tourPlanningReviewId: string;
  status: OperationPreparationStatus;
  operationData: OperationPreparationData;
  checklist: OperationChecklistItem[];
  reminders: CaseReminder[];
  warnings: OperationPreparationWarning[];
  readiness: OperationPreparationReadiness;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  errorMessage?: string;
}

export type OperationExecutionStatus =
  | 'pending'
  | 'in_progress'
  | 'edited'
  | 'completion_review'
  | 'completed'
  | 'blocked'
  | 'cancelled';

export interface PlannedOperationSnapshot {
  scheduledStart: string;
  scheduledEnd: string;
  plannedDurationMinutes: number;
  plannedDrivingMinutes?: number;
  plannedBufferMinutes: number;
  vehicleId: string;
  employeeIds: string[];
  services: string[];
  routeStopIds: string[];
  offerDraftId: string;
  documentIds: string[];
}

export type OperationServiceSource = 'offer' | 'planning' | 'operation' | 'manual';

export interface OperationServiceResult {
  id: string;
  label: string;
  planned: boolean;
  completed: boolean;
  partiallyCompleted: boolean;
  notes?: string;
  source: OperationServiceSource;
}

export interface OperationAdditionalService {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  suggestedUnitPrice?: number;
  billable: boolean;
  customerApproved?: boolean;
  notes?: string;
  createdAt: string;
}

export interface OperationMaterialUsage {
  id: string;
  name: string;
  plannedQuantity: number;
  actualQuantity: number;
  unit: string;
  notes?: string;
}

export type CustomerConfirmationStatus =
  | 'confirmed'
  | 'unconfirmed'
  | 'customer_absent'
  | 'confirmation_pending'
  | 'confirmation_refused';

export interface ActualOperationData {
  actualStart?: string;
  actualEnd?: string;
  actualWorkingMinutes?: number;
  actualDrivingMinutes?: number;
  actualBreakMinutes?: number;
  vehicleId?: string;
  employeeIds: string[];
  completedServices: OperationServiceResult[];
  additionalServices: OperationAdditionalService[];
  materialsUsed: OperationMaterialUsage[];
  customerPresent?: boolean;
  customerConfirmationStatus?: CustomerConfirmationStatus;
  customerConfirmedCompletion?: boolean;
  completionNotes?: string;
}

export type OperationDeviationType =
  | 'start_time'
  | 'end_time'
  | 'duration'
  | 'driving_time'
  | 'crew'
  | 'vehicle'
  | 'service'
  | 'route'
  | 'material'
  | 'other';

export interface OperationDeviation {
  id: string;
  type: OperationDeviationType;
  plannedValue?: string | number | string[];
  actualValue?: string | number | string[];
  severity: 'info' | 'warning' | 'critical';
  description: string;
  requiresReview: boolean;
  acknowledged: boolean;
}

export type OperationIncidentType =
  | 'damage'
  | 'customer_complaint'
  | 'access_problem'
  | 'vehicle_problem'
  | 'employee_issue'
  | 'delay'
  | 'missing_item'
  | 'other';

export interface OperationIncident {
  id: string;
  type: OperationIncidentType;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  occurredAt?: string;
  resolved: boolean;
  resolutionNotes?: string;
  documentIds: string[];
  createdAt: string;
}

export interface OperationCompletionChecklistItem {
  id: string;
  category:
    | 'time'
    | 'resources'
    | 'services'
    | 'materials'
    | 'incidents'
    | 'documents'
    | 'customer'
    | 'follow_up'
    | 'invoice_basis';
  label: string;
  required: boolean;
  completed: boolean;
  notes?: string;
}

export type OperationCompletionReadiness =
  | 'ready_to_complete'
  | 'not_started'
  | 'missing_start_time'
  | 'missing_end_time'
  | 'missing_service_confirmation'
  | 'unresolved_incidents'
  | 'missing_customer_confirmation'
  | 'missing_documents'
  | 'conflicting_information'
  | 'blocked';

export interface OperationExecutionReview {
  id: string;
  caseId: string;
  operationPreparationReviewId: string;
  calendarPlanningReviewId: string;
  tourPlanningReviewId: string;
  status: OperationExecutionStatus;
  plannedData: PlannedOperationSnapshot;
  actualData: ActualOperationData;
  deviations: OperationDeviation[];
  incidents: OperationIncident[];
  completionChecklist: OperationCompletionChecklistItem[];
  readiness: OperationCompletionReadiness;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  confirmedBy?: string;
  cancelReason?: string;
  followUpRequired?: boolean;
  followUpNotes?: string;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Controlled Invoice Draft Types
// ---------------------------------------------------------------------------

export type InvoiceDraftStatus =
  | 'draft'
  | 'edited'
  | 'approved'
  | 'pdf_created'
  | 'open'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'rejected'
  | 'cancelled'
  | 'storno'
  | 'failed';

export type InvoiceType = 'standard' | 'deposit' | 'cancellation' | 'final';

export type InvoiceDraftItemSource = 'offer' | 'execution' | 'additional_service' | 'manual';

export interface InvoiceDraftItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category?: string;
  source: InvoiceDraftItemSource;
  sourceReferenceId?: string;
  selected: boolean;
  editable: boolean;
  billable: boolean;
  customerApproved?: boolean;
  confidence?: 'high' | 'medium' | 'low';
}

export interface InvoiceDraftCorrection {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  user?: string;
  reason?: string;
}

export interface InvoiceDraftTotals {
  subtotalNet: number;
  discountValue: number;
  surchargeValue: number;
  netTotal: number;
  vatRate: number;
  vatAmount: number;
  grossTotal: number;
  depositPaid: number;
  otherPayments: number;
  outstandingAmount: number;
}

export type InvoiceDraftReadinessStatus =
  | 'ready'
  | 'missing_customer'
  | 'missing_billing_address'
  | 'missing_invoice_items'
  | 'unresolved_additional_services'
  | 'unresolved_incidents'
  | 'follow_up_required'
  | 'invalid_totals'
  | 'existing_invoice'
  | 'blocked';

export interface InvoiceDraftReadiness {
  status: InvoiceDraftReadinessStatus;
  ready: boolean;
  missingFields: string[];
  warnings: string[];
  blockers: string[];
}

export interface InvoiceDraft {
  id: string;
  caseId: string;
  customerId?: string;
  operationExecutionReviewId: string;
  offerDraftId?: string;
  status: InvoiceDraftStatus;
  invoiceType: InvoiceType;
  invoiceNumber?: string;
  invoiceDate: string; // YYYY-MM-DD
  serviceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  billingAddress: {
    name?: string;
    line1?: string;
    line2?: string;
    street?: string;
    zip?: string;
    city?: string;
    country?: string;
  };
  items: InvoiceDraftItem[];
  subtotalNet: number;
  discountValue: number;
  surchargeValue: number;
  netTotal: number;
  vatRate: number; // e.g. 0.20
  vatAmount: number;
  grossTotal: number;
  depositPaid: number;
  otherPayments: number;
  outstandingAmount: number;
  paymentTerms?: string;
  notes?: string;
  corrections?: InvoiceDraftCorrection[];
  documentId?: string;
  invoiceId?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  pdfCreatedAt?: string;
  approvedBy?: string;
  errorMessage?: string;
}

export type ReceivableStatus =
  | 'open'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'disputed'
  | 'cancelled'
  | 'written_off';

export type PaymentSource = 'manual' | 'bank_import' | 'deposit' | 'credit_note';

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  method?: 'bank_transfer' | 'cash' | 'card' | 'deposit' | 'other';
  source?: PaymentSource;
  reference?: string;
  notes?: string;
  confirmedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReceivableReminderHistory {
  id: string;
  emailDraftId: string;
  reminderLevel: string; // e.g. 'payment_reminder', 'overdue_1_7_days', 'overdue_8_14_days', 'overdue_over_14_days'
  createdAt: string;
  sentAt?: string;
  outstandingAmountAtSend: number;
  status: 'draft' | 'sending' | 'sent' | 'failed' | 'cancelled';
}

export interface Receivable {
  id: string;
  caseId: string;
  customerId: string;
  invoiceId?: string;
  invoiceDraftId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  originalAmount: number; // Gross amount
  paidAmount: number;
  outstandingAmount: number;
  status: ReceivableStatus;
  payments: PaymentRecord[];
  reminders?: ReceivableReminderHistory[];
  disputedAt?: string;
  disputeReason?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReceivableDueState =
  | 'not_due'
  | 'due_today'
  | 'overdue_1_7_days'
  | 'overdue_8_14_days'
  | 'overdue_over_14_days'
  | 'paid'
  | 'blocked';

export type PaymentReminderReadinessStatus =
  | 'ready'
  | 'not_due'
  | 'already_paid'
  | 'missing_recipient'
  | 'disputed'
  | 'already_reminded'
  | 'missing_invoice'
  | 'blocked';

export interface PaymentReminderReadiness {
  status: PaymentReminderReadinessStatus;
  ready: boolean;
  reasons: string[];
}

export type AutomationLevel =
  | 'manual'
  | 'suggest'
  | 'prepare'
  | 'auto_execute_reversible'
  | 'auto_execute';

export interface LearningRecord {
  id: string;
  caseId?: string;
  workflowEventId?: string;
  suggestionId?: string;
  actionType: string;
  contextType: string;
  detectedDecision?: string;
  finalDecision: string;
  result:
    | 'accepted'
    | 'corrected'
    | 'rejected'
    | 'executed'
    | 'failed'
    | 'reverted';
  confidence: 'low' | 'medium' | 'high';
  originalData?: Record<string, unknown>;
  correctedData?: Record<string, unknown>;
  contextSignature: string;
  createdAt: string;
  userId?: string;
}

export type EmailTriageCategory =
  | 'new_customer_inquiry'
  | 'existing_customer_update'
  | 'missing_information_response'
  | 'offer_response'
  | 'invoice_question'
  | 'payment_notification'
  | 'complaint'
  | 'appointment_request'
  | 'general_question'
  | 'spam_or_irrelevant'
  | 'unclear';

export interface EmailTriageAnalysis {
  category: EmailTriageCategory;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  recognizedReferences: {
    caseId?: string;
    offerNumber?: string;
    invoiceNumber?: string;
    customerId?: string;
    conversationId?: string;
    internetMessageId?: string;
  };
  recommendedAction: string;
  missingInformation: string[];
  potentialRisks: string[];
  assignedCaseId?: string;
  matchType?: 'exact' | 'multiple' | 'none';
  customerMatched?: boolean;
  preparedDraftId?: string;
  isHighRisk?: boolean;
}

export interface EmailTriageRecord {
  id: string;
  eventId: string;
  graphMessageId?: string;
  internetMessageId?: string;
  conversationId?: string;
  subject: string;
  senderEmail: string;
  senderName: string;
  receivedAt: string;
  analysis: EmailTriageAnalysis;
  status: 'analyzed' | 'confirmed' | 'corrected' | 'rejected' | 'reverted';
  mode: AutomationMode;
  assignedCaseId?: string;
  executedActions: string[];
  userFeedback?: {
    correctedCategory?: EmailTriageCategory;
    correctedCaseId?: string;
    timestamp: string;
    user: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type SafeAutomationActionType =
  | 'EMAIL_TRIAGE'
  | 'LINK_EMAIL_TO_CASE'
  | 'DEDUPLICATE_EMAIL_EVENT'
  | 'CREATE_INTERNAL_TASK'
  | 'MARK_REMINDER_DUE'
  | 'RECALCULATE_READINESS'
  | 'RECALCULATE_CASE_HEALTH'
  | 'CREATE_INTERNAL_TIMELINE_ENTRY'
  | 'PREPARE_EMAIL_DRAFT'
  | 'PREPARE_OFFER_DRAFT'
  | 'PREPARE_INVOICE_DRAFT'
  | 'PREPARE_PAYMENT_REMINDER_DRAFT';

export type AutomationMode = 'dry_run' | 'active';

export interface AutomationPolicy {
  id: string;
  actionType: string;
  contextSignature?: string;
  level: AutomationLevel;
  enabled: boolean;
  mode?: AutomationMode; // Default is 'dry_run'
  minimumConfidence: number;
  minimumSamples: number;
  requiredApprovalRate: number;
  failureRateLimit: number;
  reversibleOnly: boolean;
  lastEvaluatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationExecution {
  id: string;
  caseId?: string;
  actionType: string;
  policyId: string;
  mode?: AutomationMode;
  status:
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'reverted'
    | 'blocked'
    | 'dry_run';
  inputReference?: string;
  outputReference?: string;
  reversible: boolean;
  confidence?: string;
  contextSignature?: string;
  securityDecision?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  rollbackData?: Record<string, unknown>;
}

export interface LearningStatistics {
  actionType: string;
  contextSignature?: string;
  totalDecisions: number;
  acceptedCount: number;
  correctedCount: number;
  rejectedCount: number;
  executedCount: number;
  failedCount: number;
  revertedCount: number;
  approvalRate: number;
  correctionRate: number;
  rejectionRate: number;
  failureRate: number;
  reversionRate: number;
  averageConfidence: number;
  lastUsedAt?: string;
  recommendedLevel: AutomationLevel;
  eligibleForAutomation: boolean;
  eligibilityReasons: string[];
}

export type WorkflowExceptionSourceType =
  | 'workflow'
  | 'automation'
  | 'email_triage'
  | 'crm'
  | 'offer'
  | 'calendar'
  | 'tour'
  | 'operation'
  | 'invoice'
  | 'receivable'
  | 'outlook'
  | 'persistence'
  | 'storage';

export type WorkflowExceptionCategory =
  | 'missing_information'
  | 'ambiguous_match'
  | 'validation_error'
  | 'data_conflict'
  | 'external_service_error'
  | 'automation_blocked'
  | 'automation_failed'
  | 'reconciliation_required'
  | 'manual_approval_required'
  | 'overdue_action'
  | 'persistence_error'
  | 'persistence_conflict'
  | 'migration_failed'
  | 'permission_denied'
  | 'pending_sync'
  | 'invalid_remote_data'
  | 'missing_document_data'
  | 'document_upload_failed'
  | 'invalid_document'
  | 'storage_permission_denied'
  | 'document_reconciliation_required'
  | 'other';

export type WorkflowExceptionSeverity = 'info' | 'warning' | 'critical';

export type WorkflowExceptionStatus =
  | 'open'
  | 'in_review'
  | 'resolved'
  | 'dismissed'
  | 'cancelled';

export type WorkflowExceptionActionType =
  | 'open_case'
  | 'open_customer'
  | 'select_customer'
  | 'edit_data'
  | 'approve'
  | 'reject'
  | 'retry'
  | 'rollback'
  | 'disable_policy'
  | 'request_information'
  | 'prepare_email'
  | 'mark_resolved'
  | 'dismiss';

export interface WorkflowExceptionAction {
  id: string;
  type: WorkflowExceptionActionType;
  label: string;
  safe: boolean;
  requiresConfirmation: boolean;
  referenceId?: string;
}

export interface WorkflowException {
  id: string;
  caseId?: string;
  sourceType: WorkflowExceptionSourceType;
  sourceReferenceId: string;
  category: WorkflowExceptionCategory;
  severity: WorkflowExceptionSeverity;
  title: string;
  description: string;
  blockingReason: string;
  recommendedAction?: string;
  availableActions: WorkflowExceptionAction[];
  status: WorkflowExceptionStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
}

export type { Case } from './case-service';


