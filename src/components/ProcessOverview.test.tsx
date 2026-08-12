import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ProcessOverview } from './ProcessOverview';

describe('ProcessOverview', () => {
  it('renders the live process pipeline and automation indicators', () => {
    render(<ProcessOverview onOpenActivity={vi.fn()} onOpenAutomation={vi.fn()} />);

    expect(screen.getByText('Prozess-Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Aktuelle Vorgänge')).toBeInTheDocument();
    expect(screen.getByText('Automatisierungsstatus')).toBeInTheDocument();
  });

  it('opens detailed activities and automation from the overview', () => {
    const openActivity = vi.fn();
    const openAutomation = vi.fn();
    render(<ProcessOverview onOpenActivity={openActivity} onOpenAutomation={openAutomation} />);

    fireEvent.click(screen.getByRole('button', { name: /Alle Vorgänge/i }));
    fireEvent.click(screen.getByRole('button', { name: /Automatisierung öffnen/i }));

    expect(openActivity).toHaveBeenCalledOnce();
    expect(openAutomation).toHaveBeenCalledOnce();
  });
});
