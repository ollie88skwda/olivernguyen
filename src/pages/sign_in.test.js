import React from 'react';
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SignInPage from './sign_in';

// Clerk's real <SignIn> throws outside a ClerkProvider. That throw is the bug
// this suite guards, so the mock stands in for "Clerk rendered something".
vi.mock('@clerk/react', () => ({
  SignIn: () => <div>clerk sign in card</div>,
  useAuth: vi.fn(),
}));

describe('SignInPage', () => {
  const original = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

  afterEach(() => {
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = original;
  });

  it('explains itself instead of white-screening when no publishable key is set', () => {
    delete process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
    render(<SignInPage />);
    expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    expect(screen.queryByText('clerk sign in card')).not.toBeInTheDocument();
  });

  it('renders the Clerk card once a key is set', () => {
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = 'pk_test_x';
    render(<SignInPage />);
    expect(screen.getByText('clerk sign in card')).toBeInTheDocument();
  });
});
