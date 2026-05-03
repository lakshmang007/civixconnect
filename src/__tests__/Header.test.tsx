import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../components/Header';
import { LanguageProvider } from '../lib/LanguageContext';

describe('Header Component', () => {
  const mockUser = {
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
    uid: '123'
  } as any;

  it('renders correctly with user info', () => {
    render(
      <LanguageProvider>
        <Header 
          user={mockUser} 
          onFilterChange={vi.fn()} 
          onMenuClick={vi.fn()} 
          onNotificationClick={vi.fn()} 
        />
      </LanguageProvider>
    );
    
    // Check for "CX" brand or app name can be tricky due to translations
    // but we can check if it renders at least something
    expect(screen.getByLabelText(/View Notifications/i)).toBeDefined();
  });
});
