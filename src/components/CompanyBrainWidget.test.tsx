import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { learningService } from '@/src/lib/learning-service';
import { CompanyBrainWidget } from './CompanyBrainWidget';

describe('CompanyBrainWidget', () => {
  beforeEach(() => {
    learningService.resetForTesting();
  });

  it('starts at Level 1 with the original HueberAI training copy', () => {
    render(<CompanyBrainWidget />);

    expect(screen.getByText('Unternehmens-Gehirn')).toBeInTheDocument();
    expect(screen.getByText('Die KI lernt mit jedem Ihrer Klicks. Level 1')).toBeInTheDocument();
    expect(screen.getByText('XP 0')).toBeInTheDocument();
    expect(screen.getByText('Zur nächsten Stufe 50')).toBeInTheDocument();
    expect(screen.getByText('KI-Training')).toBeInTheDocument();
    expect(screen.getByText(/Ihre KI braucht Input, um autonomer zu werden/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nutzen Sie den Assistenten, um XP zu sammeln/i })).toBeInTheDocument();
  });

  it('updates XP immediately from real learning records', () => {
    render(<CompanyBrainWidget />);

    act(() => {
      learningService.recordLearningRecord({
        actionType: 'email_categorize',
        contextType: 'training',
        finalDecision: 'accepted',
        result: 'accepted'
      });
    });

    expect(screen.getByText('XP 10')).toBeInTheDocument();
    expect(screen.getByText(/1 gespeichertes Lernsignal/i)).toBeInTheDocument();
  });

  it('opens the classic assistant from the training call to action', () => {
    const openAssistant = vi.fn();
    render(<CompanyBrainWidget onOpenAssistant={openAssistant} />);

    fireEvent.click(screen.getByRole('button', { name: /Nutzen Sie den Assistenten/i }));

    expect(openAssistant).toHaveBeenCalledOnce();
  });
});
