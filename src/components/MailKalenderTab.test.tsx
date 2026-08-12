import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { MailKalenderTab } from './MailKalenderTab';
import { CustomerProvider } from '../contexts/customer-context';
import { WorkflowProvider } from '../contexts/workflow-context';
import { OfferProvider } from '../contexts/offer-context';

const renderWithProviders = async (ui: React.ReactElement) => {
  let result: any;
  await act(async () => {
    result = render(
      <WorkflowProvider>
        <CustomerProvider>
          <OfferProvider>
            {ui}
          </OfferProvider>
        </CustomerProvider>
      </WorkflowProvider>
    );
  });
  return result;
};

describe('MailKalenderTab UI Component', () => {
  beforeEach(() => {
    localStorage.setItem('outlook_logged_in', 'true');
  });

  it('renders top navigation and default mail view', async () => {
    await renderWithProviders(<MailKalenderTab />);

    await waitFor(() => {
      expect(screen.getByText(/Mail & Outlook Kalender/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Postfach/i })[0]).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Kalender/i })[0]).toBeInTheDocument();
    });
  });

  it('switches view between Postfach and Kalender', async () => {
    await renderWithProviders(<MailKalenderTab />);

    const calBtn = screen.getAllByRole('button', { name: /Kalender/i })[0];
    await act(async () => {
      fireEvent.click(calBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Mo')).toBeInTheDocument();
      expect(screen.getByText('Di')).toBeInTheDocument();
    });
  });

  it('opens compose mail modal when Neue E-Mail is clicked', async () => {
    await renderWithProviders(<MailKalenderTab />);

    const composeBtn = screen.getAllByText('Neue E-Mail')[0].closest('button')!;
    await act(async () => {
      fireEvent.click(composeBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('An:')).toBeInTheDocument();
    });
  });

  it('marks Gebrüder Weiss visibly and learns a bulk sender category', async () => {
    localStorage.setItem('outlook_emails_list_v2', JSON.stringify([{
      id: 'mail-gw-1',
      folder: 'inbox',
      senderName: 'Gebrüder Weiss',
      senderEmail: 'semra.woldan@gw-world.com',
      recipientEmail: 'office@example.com',
      subject: 'Transportinformation',
      body: 'Status zum Transport',
      timestamp: new Date().toISOString(),
      isRead: false,
      category: 'Wichtig'
    }]));

    await renderWithProviders(<MailKalenderTab />);

    const gwBadge = await screen.findByTitle('Gebrüder Weiss – standardmäßig Sonstige');
    expect(gwBadge).toHaveTextContent('GW');

    fireEvent.click(screen.getByTitle('Mehrfachauswahl & Regeln bearbeiten'));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Wichtig' }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('email_sender_rules') || '{}')).toMatchObject({
        'semra.woldan@gw-world.com': 'Wichtig'
      });
    });
  });
});
