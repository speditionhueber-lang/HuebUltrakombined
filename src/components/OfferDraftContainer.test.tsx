import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { OfferDraftContainer } from './OfferDraftContainer';
import { CustomerProvider } from '../contexts/customer-context';
import { WorkflowProvider } from '../contexts/workflow-context';
import { OfferProvider } from '../contexts/offer-context';
import { caseService } from '../lib/case-service';
import { crmLookupService } from '../lib/crm-lookup-service';
import { LocalCaseRepository, FirestoreCaseRepository } from '../lib/case-repository';

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

describe('OfferDraftContainer React Component', () => {
  let mockCaseId: string;

  afterEach(() => {
    cleanup();
  });

  const mockCustomer = {
    id: 'cust_123',
    name: 'Max Mustermann',
    email: 'max@example.com',
    address: { street: 'Hauptstr 1' },
    abholadresse: { strasse: 'Hauptstr 1', ort: 'Wien' },
    zieladresse: { strasse: 'Nebenstr 2', ort: 'Wien' },
    umzugsdetails: { gewuenschterUmzugstermin: '2026-09-15', umzugsgroesse: '3 Zimmer' }
  } as any;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('app_custom_customers', JSON.stringify([mockCustomer]));
    caseService.reset();
    const localRepo = new LocalCaseRepository();
    await localRepo.initialize();
    caseService.setRepository(localRepo);

    // Set up a mock case in caseService with customer draft details
    const newCase = caseService.createCase({
      customerId: 'cust_123',
      title: 'Vorgang Max Mustermann',
      customerDraft: {
        id: 'cd_123',
        caseId: '',
        sourceEventId: 'evt_123',
        source: 'AI',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        confidence: 'high',
        fields: {
          name: { value: 'Max Mustermann', confidence: 'high', recognized: true, source: 'AI' },
          email: { value: 'max@example.com', confidence: 'high', recognized: true, source: 'AI' },
          phone: { value: '+43660123456', confidence: 'high', recognized: true, source: 'AI' },
          pickupAddress: { street: { value: 'Hauptstr 1', confidence: 'high', recognized: true, source: 'AI' } },
          destinationAddress: { street: { value: 'Nebenstr 2', confidence: 'high', recognized: true, source: 'AI' } },
          moveDate: { value: '2026-09-15', confidence: 'high', recognized: true, source: 'AI' },
          apartmentSize: { value: '3 Zimmer', confidence: 'high', recognized: true, source: 'AI' }
        },
        corrections: []
      }
    });
    crmLookupService.setCustomers([mockCustomer]);
    mockCaseId = newCase.id;
  });

  it('renders readiness banner when no active draft exists', () => {
    renderWithProviders(<OfferDraftContainer caseId={mockCaseId} customer={mockCustomer} />);
    crmLookupService.setCustomers([mockCustomer]);

    expect(screen.getByText(/Angebotsstatus & Freigabe/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Orientierungsangebot entwerfen/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Verbindliches Angebot entwerfen/i })[0]).toBeInTheDocument();
  });

  it('creates an orientation offer draft when button is clicked', async () => {
    const onRefresh = vi.fn();
    renderWithProviders(<OfferDraftContainer caseId={mockCaseId} customer={mockCustomer} onRefresh={onRefresh} />);
    crmLookupService.setCustomers([mockCustomer]);

    const draftBtn = screen.getAllByRole('button', { name: /Orientierungsangebot entwerfen/i })[0];
    fireEvent.click(draftBtn);

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalled();
    });
    expect(screen.getAllByText(/Orientierungsangebot \(Entwurf\)/i)[0]).toBeInTheDocument();
  });

  it('supports editing price and saving draft', async () => {
    renderWithProviders(<OfferDraftContainer caseId={mockCaseId} customer={mockCustomer} />);
    crmLookupService.setCustomers([mockCustomer]);

    // First create a draft
    const draftBtn = screen.getAllByRole('button', { name: /Orientierungsangebot entwerfen/i })[0];
    fireEvent.click(draftBtn);

    // Save button should be available
    const saveBtn = await screen.findByRole('button', { name: /Änderungen speichern/i });
    expect(saveBtn).toBeInTheDocument();

    fireEvent.click(saveBtn);
  });

  it('rejects/discards active draft when reject button is clicked', async () => {
    renderWithProviders(<OfferDraftContainer caseId={mockCaseId} customer={mockCustomer} />);
    crmLookupService.setCustomers([mockCustomer]);

    // Create draft first
    fireEvent.click(screen.getAllByRole('button', { name: /Orientierungsangebot entwerfen/i })[0]);
    expect(await screen.findByText(/Orientierungsangebot \(Entwurf\)/i)).toBeInTheDocument();

    // Discard draft
    const rejectBtn = screen.getAllByRole('button', { name: /Entwurf verworfen/i })[0];
    fireEvent.click(rejectBtn);

    // Should return to creation screen
    expect(await screen.findByText(/Angebotsstatus & Freigabe/i)).toBeInTheDocument();
  });
});
