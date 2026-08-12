export interface ExtractedInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ExtractedInvoiceData {
  invoiceId?: string;
  issueDate?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items?: ExtractedInvoiceItem[];
  netTotal?: number;
  vatRate?: number;
  vatAmount?: number;
  total?: number;
}
