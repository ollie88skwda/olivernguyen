import React from 'react';
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RequireClerk from './RequireClerk';
import { useAuth } from '@clerk/react';

vi.mock('@clerk/react', () => ({ useAuth: vi.fn() }));

const renderGate = () =>
  render(
    <MemoryRouter initialEntries={['/studio']}>
      <RequireClerk>
        <p>vault</p>
      </RequireClerk>
    </MemoryRouter>
  );

describe('RequireClerk', () => {
  const original = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

  afterEach(() => {
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = original;
  });

  // The important one. Without this guard a missing key takes down /college,
  // /major and /apply too, because ClerkProvider throws on construction.
  it('explains itself instead of crashing when no publishable key is set', () => {
    delete process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });
    renderGate();
    expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    expect(screen.queryByText('vault')).not.toBeInTheDocument();
  });

  it('hides children while Clerk is still loading', () => {
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = 'pk_test_x';
    useAuth.mockReturnValue({ isLoaded: false, isSignedIn: false });
    renderGate();
    expect(screen.queryByText('vault')).not.toBeInTheDocument();
    expect(screen.queryByText(/not configured/i)).not.toBeInTheDocument();
  });

  it('does not render the vault when loaded and signed out', () => {
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = 'pk_test_x';
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });
    renderGate();
    expect(screen.queryByText('vault')).not.toBeInTheDocument();
  });

  it('renders children when signed in', () => {
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = 'pk_test_x';
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    renderGate();
    expect(screen.getByText('vault')).toBeInTheDocument();
  });
});
