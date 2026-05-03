import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VotingGuide } from '../components/VotingGuide';
import { LanguageProvider } from '../lib/LanguageContext';
import React from 'react';

describe('VotingGuide Component', () => {
  it('renders correctly in full view', () => {
    render(
      <LanguageProvider>
        <VotingGuide fullView={true} />
      </LanguageProvider>
    );

    expect(screen.getByText(/Election Center/i)).toBeDefined();
    expect(screen.getByText(/Election Process Timeline/i)).toBeDefined();
  });

  it('toggles registration steps', () => {
    render(
      <LanguageProvider>
        <VotingGuide fullView={true} />
      </LanguageProvider>
    );

    // Initial progress 0%
    expect(screen.getByText('0%')).toBeDefined();

    // Click a step
    const step = screen.getByText(/Check name in Electoral Roll/i);
    fireEvent.click(step);

    // Progress should update (not testing exact value here as it depends on total steps)
    expect(screen.queryByText('0%')).toBeNull();
  });

  it('renders FAQ section', () => {
    render(
      <LanguageProvider>
        <VotingGuide fullView={true} />
      </LanguageProvider>
    );

    expect(screen.getByText(/Expert AI Insights/i)).toBeDefined();
    expect(screen.getByText(/What if I don't have a Voter ID card?/i)).toBeDefined();
  });
});
