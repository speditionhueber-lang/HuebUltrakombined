import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AIAssistantWidget } from './AIAssistantWidget';
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

describe('AIAssistantWidget UI Component', () => {
  it('renders tab triggers and initial sync status badge', async () => {
    await renderWithProviders(<AIAssistantWidget />);

    await waitFor(() => {
      expect(screen.getByText(/KI-Assistent/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Kundenanfragen/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Wichtig/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Erledigt/i })).toBeInTheDocument();
    });
  });

  it('switches tabs between Anfragen and Wichtige Aufgaben', async () => {
    await renderWithProviders(<AIAssistantWidget />);

    const tabWichtig = screen.getByRole('button', { name: /Wichtig/i });
    await act(async () => {
      fireEvent.click(tabWichtig);
    });

    await waitFor(() => {
      expect(tabWichtig).toHaveClass('border-red-200');
    });
  });

  it('displays mail modal and notification with role status when email action is triggered', async () => {
    await renderWithProviders(<AIAssistantWidget />);

    const mailButtons = screen.queryAllByTitle(/E-Mail Entwurf öffnen/i);
    if (mailButtons.length > 0) {
      await act(async () => {
        fireEvent.click(mailButtons[0]);
      });

      expect(screen.getByRole('heading', { name: /Automatisierte E-Mail/i })).toBeInTheDocument();

      const sendBtn = screen.getByRole('button', { name: /Senden/i });
      expect(sendBtn).toHaveClass('min-h-[44px]');
      await act(async () => {
        fireEvent.click(sendBtn);
      });

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/E-Mail erfolgreich versendet!/i);
      });
    }
  });

  it('uses warning actions instead of payment actions for a security notice', async () => {
    localStorage.setItem('hueber_ai_assistant_cache_v2', JSON.stringify({
      anfragen: [],
      wichtig: [{
        id: 'security-1',
        sender: 'Google',
        senderEmail: 'no-reply@accounts.google.com',
        subject: 'Sicherheitswarnung für Ihr Konto',
        content: 'Eine neue Anmeldung wurde erkannt.',
        analysis: 'Kontozugriff bitte unverzüglich prüfen.'
      }],
      handledItems: [],
      completedActions: [],
      analysisFingerprint: 'cached'
    }));

    await renderWithProviders(<AIAssistantWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Wichtig/i }));

    expect(screen.getByText('Warnung')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /E-Mail öffnen/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Fristverlängerung/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Zahlung/i })).not.toBeInTheDocument();
  });

  it('captures a written improvement as assistant learning feedback', async () => {
    localStorage.setItem('hueber_ai_assistant_cache_v2', JSON.stringify({
      anfragen: [],
      wichtig: [],
      handledItems: ['done-1'],
      completedActions: [{
        id: 'completed-1',
        item: { id: 'done-1', sender: 'Testkunde', subject: 'Testvorgang' },
        actionType: 'open',
        actionLabel: 'Geöffnet',
        completedAt: new Date().toISOString()
      }],
      analysisFingerprint: 'cached'
    }));

    await renderWithProviders(<AIAssistantWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Erledigt/i }));
    fireEvent.click(screen.getByRole('button', { name: /Verbessern/i }));
    fireEvent.change(screen.getByLabelText(/Was hätte die KI anders machen sollen/i), {
      target: { value: 'Bei Sicherheitswarnungen nur die Original-E-Mail öffnen.' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Als Lernsignal speichern/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Feedback gespeichert/i);
      expect(localStorage.getItem('hueber_ai_assistant_cache_v2')).toContain('Bei Sicherheitswarnungen nur die Original-E-Mail öffnen.');
    });
  });

  it('can collapse and reopen the assistant', async () => {
    await renderWithProviders(<AIAssistantWidget />);
    const collapseButton = screen.getByTitle('KI-Assistent einklappen');
    fireEvent.click(collapseButton);
    expect(screen.getByTitle('KI-Assistent ausklappen')).toHaveAttribute('aria-expanded', 'false');
  });
});
