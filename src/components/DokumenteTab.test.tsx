import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { DokumenteTab } from './DokumenteTab';
import { CustomerProvider } from '../contexts/customer-context';
import { WorkflowProvider } from '../contexts/workflow-context';
import { OfferProvider } from '../contexts/offer-context';
import type { Customer, AppDocument } from '../lib/types';

const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Anna Schmidt',
    nameLower: 'anna schmidt',
    email: 'anna@example.com',
    phone: '0660123456',
    kundenNummer: 'KD-2001',
    createdAt: new Date().toISOString(),
    avatarUrl: '',
    address: { street: 'Ring 1', zip: '1010', city: 'Wien', country: 'Österreich' }
  }
];

const mockDocuments: AppDocument[] = [
  {
    id: 'doc-1',
    customerId: 'cust-1',
    customerName: 'Anna Schmidt',
    type: 'Orientierungsangebot',
    docNumber: 'ANG-2026-001',
    date: '2026-08-01',
    amount: 1200,
    dataUrl: 'data:application/pdf;base64,mock'
  }
];

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <WorkflowProvider>
      <CustomerProvider>
        <OfferProvider>
          {ui}
        </OfferProvider>
      </CustomerProvider>
    </WorkflowProvider>
  );
};

describe('DokumenteTab UI Component', () => {
  it('renders customer list and empty state before selecting a customer', () => {
    const handleSetActiveCustomer = vi.fn();
    const handleDeleteDocument = vi.fn();

    renderWithProviders(
      <DokumenteTab
        customers={mockCustomers}
        activeCustomer={null}
        setActiveCustomer={handleSetActiveCustomer}
        documents={mockDocuments}
        onDeleteDocument={handleDeleteDocument}
      />
    );

    expect(screen.getByText('Anna Schmidt')).toBeInTheDocument();
    expect(screen.getByText(/Bitte links einen Kunden auswählen, um Dokumente anzuzeigen/i)).toBeInTheDocument();
  });

  it('renders documents list when customer is selected', () => {
    const handleSetActiveCustomer = vi.fn();
    const handleDeleteDocument = vi.fn();

    renderWithProviders(
      <DokumenteTab
        customers={mockCustomers}
        activeCustomer={mockCustomers[0]}
        setActiveCustomer={handleSetActiveCustomer}
        documents={mockDocuments}
        onDeleteDocument={handleDeleteDocument}
      />
    );

    expect(screen.getByText(/Dokumente: Anna Schmidt/i)).toBeInTheDocument();
    expect(screen.getByText('ANG-2026-001')).toBeInTheDocument();
  });

  it('opens delete confirmation modal when trash icon is clicked', async () => {
    const handleSetActiveCustomer = vi.fn();
    const handleDeleteDocument = vi.fn();

    renderWithProviders(
      <DokumenteTab
        customers={mockCustomers}
        activeCustomer={mockCustomers[0]}
        setActiveCustomer={handleSetActiveCustomer}
        documents={mockDocuments}
        onDeleteDocument={handleDeleteDocument}
      />
    );

    const deleteBtn = screen.getByTitle('Dokument löschen');
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('heading', { name: 'Dokument löschen' })).toBeInTheDocument();
  });

  it('prepares a payment reminder from an invoice card', () => {
    const updateDocument = vi.fn();
    const addDocument = vi.fn();
    const invoice: AppDocument = {
      ...mockDocuments[0],
      id: 'invoice-1',
      type: 'Rechnung',
      docNumber: 'RE-2026-001',
      status: 'pending'
    };

    renderWithProviders(
      <DokumenteTab
        customers={mockCustomers}
        activeCustomer={mockCustomers[0]}
        setActiveCustomer={vi.fn()}
        documents={[invoice]}
        onDeleteDocument={vi.fn()}
        onUpdateDocument={updateDocument}
        onAddDocument={addDocument}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Mahnung/i }));
    expect(screen.getByRole('heading', { name: /Mahnung vorbereiten/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Mahnung anlegen/i }));

    expect(updateDocument).toHaveBeenCalledWith(expect.objectContaining({ id: 'invoice-1', status: 'overdue' }));
    expect(addDocument).toHaveBeenCalledWith(expect.objectContaining({ type: 'Mahnung', stornoFor: 'RE-2026-001' }));
  });

  it('creates offers and invoices directly inside the customer document area', () => {
    const createOffer = vi.fn();
    const createDepositInvoice = vi.fn();
    const createInvoice = vi.fn();

    renderWithProviders(
      <DokumenteTab
        customers={mockCustomers}
        activeCustomer={mockCustomers[0]}
        setActiveCustomer={vi.fn()}
        documents={mockDocuments}
        onDeleteDocument={vi.fn()}
        onCreateOrientierungsangebot={createOffer}
        onCreateAnzahlungsrechnung={createDepositInvoice}
        onCreateRechnung={createInvoice}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Orientierungsangebot/i }));
    fireEvent.click(screen.getByRole('button', { name: /Anzahlungsrechnung/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Rechnung$/i }));

    expect(createOffer).toHaveBeenCalledWith(mockCustomers[0]);
    expect(createDepositInvoice).toHaveBeenCalledWith(mockCustomers[0]);
    expect(createInvoice).toHaveBeenCalledWith(mockCustomers[0]);
  });

  it('shows compact document-type badges in the customer list', () => {
    const documents: AppDocument[] = [
      mockDocuments[0],
      { ...mockDocuments[0], id: 'doc-az', type: 'Anzahlungsrechnung', docNumber: 'AZ-1', status: 'pending' },
      { ...mockDocuments[0], id: 'doc-re', type: 'Rechnung', docNumber: 'RE-1', status: 'paid' },
      { ...mockDocuments[0], id: 'doc-ls', type: 'Lieferschein', docNumber: 'LS-1' }
    ];

    renderWithProviders(
      <DokumenteTab
        customers={mockCustomers}
        activeCustomer={null}
        setActiveCustomer={vi.fn()}
        documents={documents}
        onDeleteDocument={vi.fn()}
      />
    );

    expect(screen.getByText('OA')).toBeInTheDocument();
    expect(screen.getByText('AZ')).toBeInTheDocument();
    expect(screen.getByText('RE')).toBeInTheDocument();
    expect(screen.getByText('LS')).toBeInTheDocument();
  });
});
