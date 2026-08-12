import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { CustomerProvider } from '@/src/contexts/customer-context';
import { OfferProvider } from '@/src/contexts/offer-context';
import { WorkflowProvider } from '@/src/contexts/workflow-context';
import { learningService } from '@/src/lib/learning-service';
import { AIWorkspaceHub } from './AIWorkspaceHub';

function renderHub() {
  return render(
    <WorkflowProvider>
      <CustomerProvider>
        <OfferProvider>
          <AIWorkspaceHub />
        </OfferProvider>
      </CustomerProvider>
    </WorkflowProvider>
  );
}

describe('AIWorkspaceHub', () => {
  beforeEach(() => {
    localStorage.clear();
    learningService.resetForTesting();
  });

  it('offers three separate AI workspaces and opens the control center by default', () => {
    renderHub();

    expect(screen.getByRole('button', { name: /KI-Assistent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /KI Workspace Chat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /KI-Steuerzentrale/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByLabelText('Unternehmens-Gehirn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aktivitäten' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Automatisierung/i })).toBeInTheDocument();
  });

  it('keeps the classic HueberAI workspace chat as its own view', () => {
    renderHub();

    fireEvent.click(screen.getByRole('button', { name: /KI Workspace Chat/i }));

    expect(screen.getByText('Verbunden mit CRM & Kalender')).toBeInTheDocument();
    expect(screen.queryByLabelText('Unternehmens-Gehirn')).not.toBeInTheDocument();
  });
});
