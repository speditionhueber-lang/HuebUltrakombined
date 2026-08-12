import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ActivityFeed } from './ActivityFeed';
import { WorkflowProvider } from '../contexts/workflow-context';

describe('ActivityFeed UI Component', () => {
  it('renders ActivityFeed header and search input', () => {
    render(
      <WorkflowProvider>
        <ActivityFeed />
      </WorkflowProvider>
    );

    expect(screen.getByLabelText(/Activity Center/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Aktivitäten, Kunde oder Case-ID suchen/i)).toBeInTheDocument();
  });

  it('filters events when searching', () => {
    render(
      <WorkflowProvider>
        <ActivityFeed />
      </WorkflowProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Aktivitäten, Kunde oder Case-ID suchen/i);
    fireEvent.change(searchInput, { target: { value: 'NichtExistierenderText123' } });

    expect(screen.getByText(/Keine passenden Aktivitäten/i)).toBeInTheDocument();
  });
});
