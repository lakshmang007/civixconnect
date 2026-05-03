import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartElectionBot } from '../components/SmartElectionBot';
import { LanguageProvider } from '../lib/LanguageContext';
import React from 'react';

// Mock user
const mockUser = {
  uid: 'test-user',
  displayName: 'Test User',
  email: 'test@example.com'
} as any;

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('SmartElectionBot Integration', () => {
  it('starts with language selection and proceeds to main menu', async () => {
    render(
      <LanguageProvider>
        <SmartElectionBot user={mockUser} zipCode="560001" />
      </LanguageProvider>
    );

    // Open the chatbot first
    const botBtn = screen.getByRole('button');
    fireEvent.click(botBtn);

    // Should see welcome message
    await waitFor(() => {
      expect(screen.getByText(/Hello/i)).toBeDefined();
    });
    
    // Choose English
    const englishBtn = screen.getByText('English');
    fireEvent.click(englishBtn);

    // Wait for response and check for menu options
    await waitFor(() => {
      expect(screen.getByText(/Election Process 101/i)).toBeDefined();
    });
  });

  it('navigates to election timeline', async () => {
    render(
      <LanguageProvider>
        <SmartElectionBot user={mockUser} zipCode="560001" />
      </LanguageProvider>
    );

    // Open the chatbot first
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('English'));
    });

    await waitFor(() => {
      const timelineBtn = screen.getByText('Election Timeline');
      fireEvent.click(timelineBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/7 phases/i)).toBeDefined();
    });
  });
});
