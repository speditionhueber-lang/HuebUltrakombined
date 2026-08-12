import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { EditCustomerModal } from './EditCustomerModal';
import { CustomerProvider } from '../contexts/customer-context';
import { WorkflowProvider } from '../contexts/workflow-context';
import { OfferProvider } from '../contexts/offer-context';
import type { Customer } from '../lib/types';

const mockCustomer: Customer = {
  id: 'cust-123',
  name: 'Max Mustermann',
  nameLower: 'max mustermann',
  email: 'max@example.com',
  phone: '0123456789',
  kundenNummer: 'KD-1001',
  createdAt: new Date().toISOString(),
  avatarUrl: '',
  address: {
    street: 'Hauptstraße 1',
    zip: '1010',
    city: 'Wien',
    country: 'Österreich'
  },
  zusatzoptionen: {}
};

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

describe('EditCustomerModal UI Component', () => {
  it('renders customer details correctly in edit modal', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    renderWithProviders(
      <EditCustomerModal
        isOpen={true}
        customer={mockCustomer}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    expect(screen.getByDisplayValue('Max Mustermann')).toBeInTheDocument();
    expect(screen.getByDisplayValue('max@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0123456789')).toBeInTheDocument();
  });

  it('triggers onClose when clicking close button when not saving', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    renderWithProviders(
      <EditCustomerModal
        isOpen={true}
        customer={mockCustomer}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    const closeBtn = screen.getByLabelText(/Schließen/i);
    expect(closeBtn).toHaveClass('min-h-[44px]');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('responds to Escape key press to close modal when not saving', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    renderWithProviders(
      <EditCustomerModal
        isOpen={true}
        customer={mockCustomer}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('disables saving controls and prevents Escape key closing while isSaving is true', async () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 500)));

    renderWithProviders(
      <EditCustomerModal
        isOpen={true}
        customer={mockCustomer}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Speichern/i });
    fireEvent.click(saveBtn);

    expect(saveBtn).toBeDisabled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).not.toHaveBeenCalled();
  });
});
